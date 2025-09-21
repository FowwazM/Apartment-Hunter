import Exa from "exa-js"
import { GoogleGenerativeAI } from "@google/generative-ai"
import sessionManager from "./session-manager"

interface PropertySource {
  id: string
  name: string
  url?: string
  lastUpdated: Date
}

interface RawProperty {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  bedrooms: number
  bathrooms: number
  rent: number
  squareFeet?: number
  availableDate: string
  amenities: string[]
  photos: string[]
  contact: {
    phone?: string
    email?: string
    website?: string
  }
  source: PropertySource
}

interface ScoredProperty extends RawProperty {
  score: number
  scoreBreakdown: {
    budget: number
    location: number
    amenities: number
    size: number
    availability: number
    overall: number
  }
  ranking: number
}

interface SearchCriteria {
  bedrooms?: number
  bathrooms?: number
  maxRent?: number
  neighborhoods?: string[]
  amenities?: string[]
  petFriendly?: boolean
  moveInDate?: string
  commute?: string
}

export class PropertyResearchEngine {
  private exa: Exa
  private gemini: GoogleGenerativeAI
  private sources: PropertySource[] = [
    { id: "apartments", name: "Apartments.com", url: "https://apartments.com", lastUpdated: new Date() },
  ]

  // private sources: PropertySource[] = [
  //   { id: "zillow", name: "Zillow", url: "https://zillow.com", lastUpdated: new Date() },
  //   { id: "apartments", name: "Apartments.com", url: "https://apartments.com", lastUpdated: new Date() },
  //   { id: "streeteasy", name: "StreetEasy", url: "https://streeteasy.com", lastUpdated: new Date() },
  //   { id: "google", name: "Google", url: "https://google.com", lastUpdated: new Date() },
  // ]

  constructor() {
    if (!process.env.EXA_API_KEY) {
      throw new Error("EXA_API_KEY environment variable is required")
    }
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required")
    }

    this.exa = new Exa(process.env.EXA_API_KEY)
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }

  async researchProperties(criteria: SearchCriteria, sessionId: string): Promise<ScoredProperty[]> {
    console.log(`[PropertyResearch] Starting property research for session ${sessionId}`)

    // Initialize session
    sessionManager.createSession(sessionId)
    
    try {
      // Step 1: Build search queries
      sessionManager.updateProgress(sessionId, {
        status: 'processing',
        progress: 10,
        message: 'Building search queries...',
        currentStep: 'building_queries',
        currentStepIndex: 1
      })

      const searchQueries = this.buildSearchQueries(criteria)
      const allProperties: RawProperty[] = []

      // Step 2-5: Search each source
      let currentProgress = 20
      const progressPerSource = 45 / searchQueries.length // 45% progress across all sources

      for (let i = 0; i < searchQueries.length; i++) {
        const query = searchQueries[i]
        
        sessionManager.updateProgress(sessionId, {
          progress: Math.round(currentProgress),
          message: `Searching ${query.source.name} with Exa API...`,
          currentStep: `searching_${query.source.id}`,
          currentStepIndex: i + 2
        })

        console.log(`[PropertyResearch] Searching with query: ${query.text}`)
        
        try {
          const searchResults = await this.searchWithExa(query.text, query.domain)
          const properties = await this.parseResultsWithGemini(searchResults, criteria, query.source)
          allProperties.push(...properties)

          // Add delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`[PropertyResearch] Error searching ${query.source.name}:`, error)
          // Continue with other sources even if one fails
        }

        currentProgress += progressPerSource
      }

      console.log(`[PropertyResearch] Found ${allProperties.length} raw properties`)

      // Step 6: Parse with AI
      sessionManager.updateProgress(sessionId, {
        progress: 75,
        message: 'Processing listings with Gemini AI...',
        currentStep: 'ai_processing',
        currentStepIndex: 6
      })

      // Step 7: Remove duplicates
      sessionManager.updateProgress(sessionId, {
        progress: 85,
        message: 'Removing duplicates...',
        currentStep: 'deduplication',
        currentStepIndex: 7
      })

      const uniqueProperties = this.deduplicateProperties(allProperties)
      console.log(`[PropertyResearch] After deduplication: ${uniqueProperties.length} properties`)

      // Step 8: Score and rank
      sessionManager.updateProgress(sessionId, {
        progress: 95,
        message: 'Scoring and ranking properties...',
        currentStep: 'scoring',
        currentStepIndex: 8
      })

      const scoredProperties = this.scoreProperties(uniqueProperties, criteria)
      const finalResults = scoredProperties.slice(0, 10)

      // Complete session
      sessionManager.completeSession(sessionId, finalResults)

      return finalResults

    } catch (error) {
      console.error(`[PropertyResearch] Research failed for session ${sessionId}:`, error)
      sessionManager.failSession(sessionId, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  private buildSearchQueries(criteria: SearchCriteria): Array<{text: string, domain?: string, source: PropertySource}> {
    const queries = []
    const location = criteria.neighborhoods?.join(" OR ") || ""
    const bedrooms = criteria.bedrooms ? `${criteria.bedrooms} bedroom` : ""
    const maxRent = criteria.maxRent ? `under $${criteria.maxRent}` : ""
    const amenities = criteria.amenities?.join(" ") || ""
    const petFriendly = criteria.petFriendly ? "pet friendly" : ""

    // Build base search query
    const baseQuery = [
      "apartment for rent",
      bedrooms,
      location,
      maxRent,
      amenities,
      petFriendly
    ].filter(Boolean).join(" ")

    // Create domain-specific queries
    // queries.push({
    //   text: `${baseQuery} site:zillow.com`,
    //   domain: "zillow.com",
    //   source: this.sources.find(s => s.id === "zillow")!
    // })

    queries.push({
      text: `${baseQuery} site:apartments.com`,
      domain: "apartments.com", 
      source: this.sources.find(s => s.id === "apartments")!
    })

    // queries.push({
    //   text: `${baseQuery} site:streeteasy.com`,
    //   domain: "streeteasy.com",
    //   source: this.sources.find(s => s.id === "streeteasy")!
    // })

    // queries.push({
    //   text: `${baseQuery} site:google.com`,
    //   domain: "google.com",
    //   source: this.sources.find(s => s.id === "google")!
    // })

    return queries
  }

  private async searchWithExa(query: string, domain?: string): Promise<any[]> {
    try {
      const searchResponse = await this.exa.searchAndContents(query, {
        type: "keyword",
        useAutoprompt: true,
        numResults: 10,
        includeDomains: domain ? [domain] : undefined,
        text: true,
        highlights: {
          query: "apartment rental details: rent, bedrooms, bathrooms, amenities, address, contact",
          numSentences: 10
        }
      })

      return searchResponse.results || []
    } catch (error) {
      console.error(`[PropertyResearch] Exa search error:`, error)
      return []
    }
  }

  private async parseResultsWithGemini(searchResults: any[], criteria: SearchCriteria, source: PropertySource): Promise<RawProperty[]> {
    if (!searchResults.length) { return [] }

    const model = this.gemini.getGenerativeModel({ model: "gemini-2.5-pro" })
    
    const prompt = `
    You are a real estate data extraction expert. Parse the following apartment listing content and extract structured data. 

    For each listing, extract:
    - name: Property or building name
    - address: Full street address
    - bedrooms: Number of bedrooms (integer)
    - bathrooms: Number of bathrooms (number, can be decimal like 1.5)
    - rent: Monthly rent amount (integer, just the number)
    - squareFeet: Square footage if available
    - availableDate: When available (YYYY-MM-DD format, use today's date if "available now")
    - amenities: Array of amenities mentioned
    - photos: Array of photo URLs if any
    - contact: Object with phone, email, website if available
    - latitude/longitude: Approximate coordinates for the address (use NYC coordinates if unsure)

    Search Criteria Context:
    - Looking for: ${criteria.bedrooms || 'any'} bedrooms, max rent $${criteria.maxRent || 'any'}
    - Neighborhoods: ${criteria.neighborhoods?.join(', ') || 'any NYC area'}
    - Required amenities: ${criteria.amenities?.join(', ') || 'none specified'}

    Content to parse:
    ${searchResults.map((result, i) => `
    === LISTING ${i + 1} ===
    URL: ${result.url}
    Title: ${result.title}
    Content: ${result.text}
    Highlights: ${result.highlights?.join(' ') || ''}
    ---
    `).join('\n')}

    Return a valid JSON array of property objects. If no valid listings found, return empty array [].
    Only include listings that appear to be legitimate apartment rentals with actual pricing information.
    `;

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Clean up the response to extract JSON
      let jsonText = text.trim()
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7)
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3)
      }
      
      const parsedProperties = JSON.parse(jsonText)
      
      // Convert to our RawProperty format and add source
      return parsedProperties.map((prop: any, index: number) => ({
        id: `${source.id}-${Date.now()}-${index}`,
        name: prop.name || 'Unnamed Property',
        address: prop.address || 'Address not provided',
        latitude: prop.latitude || '',
        longitude: prop.longitude || '',
        bedrooms: parseInt(prop.bedrooms) || 1,
        bathrooms: parseFloat(prop.bathrooms) || 1,
        rent: parseInt(prop.rent) || 0,
        squareFeet: prop.squareFeet || null,
        availableDate: prop.availableDate || new Date().toISOString().split('T')[0],
        amenities: Array.isArray(prop.amenities) ? prop.amenities : [],
        photos: Array.isArray(prop.photos) ? prop.photos : ['/placeholder.svg?height=400&width=600&query=apartment'],
        contact: {
          phone: prop.contact?.phone || null,
          email: prop.contact?.email || null,
          website: prop.contact?.website || null,
        },
        source
      })).filter((prop: RawProperty) => prop.rent > 0) // Only include listings with valid rent
      
    } catch (error) {
      console.error(`[PropertyResearch] Gemini parsing error:`, error)
      return []
    }
  }

  private scoreProperties(properties: RawProperty[], criteria: SearchCriteria): ScoredProperty[] {
    return properties
      .map((property, index) => {
        const scoreBreakdown = this.calculateScoreBreakdown(property, criteria)
        const overallScore = this.calculateOverallScore(scoreBreakdown)

        return {
          ...property,
          score: overallScore,
          scoreBreakdown: {
            ...scoreBreakdown,
            overall: overallScore,
          },
          ranking: 0, // Will be set after sorting
        }
      })
      .sort((a, b) => b.score - a.score)
      .map((property, index) => ({
        ...property,
        ranking: index + 1,
      }))
  }

  private calculateScoreBreakdown(property: RawProperty, criteria: SearchCriteria) {
    const scores = {
      budget: 0,
      location: 0,
      amenities: 0,
      size: 0,
      availability: 0,
    }

    // Budget score (30% weight)
    if (criteria.maxRent) {
      if (property.rent <= criteria.maxRent) {
        scores.budget = Math.max(0, 100 - ((property.rent / criteria.maxRent) * 100 - 70))
      } else {
        scores.budget = Math.max(0, 50 - ((property.rent - criteria.maxRent) / criteria.maxRent) * 100)
      }
    } else {
      scores.budget = 75 // Default score if no budget specified
    }

    // Location score (25% weight)
    if (criteria.neighborhoods && criteria.neighborhoods.length > 0) {
      const propertyNeighborhood = this.extractNeighborhood(property.address)
      scores.location = criteria.neighborhoods.includes(propertyNeighborhood) ? 100 : 60
    } else {
      scores.location = 80 // Default score
    }

    // Amenities score (20% weight)
    if (criteria.amenities && criteria.amenities.length > 0) {
      const matchedAmenities = criteria.amenities.filter((amenity) =>
        property.amenities.some((propAmenity) => propAmenity.toLowerCase().includes(amenity.toLowerCase())),
      )
      scores.amenities = (matchedAmenities.length / criteria.amenities.length) * 100
    } else {
      scores.amenities = 70 // Default score
    }

    // Size score (15% weight)
    if (criteria.bedrooms) {
      if (property.bedrooms === criteria.bedrooms) {
        scores.size = 100
      } else if (Math.abs(property.bedrooms - criteria.bedrooms) === 1) {
        scores.size = 75
      } else {
        scores.size = 50
      }
    } else {
      scores.size = 80 // Default score
    }

    // Availability score (10% weight)
    const availableDate = new Date(property.availableDate)
    const now = new Date()
    const daysUntilAvailable = Math.ceil((availableDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilAvailable <= 0) {
      scores.availability = 100 // Available now
    } else if (daysUntilAvailable <= 30) {
      scores.availability = 90 // Available within a month
    } else if (daysUntilAvailable <= 60) {
      scores.availability = 70 // Available within 2 months
    } else {
      scores.availability = 50 // Available later
    }

    return scores
  }

  private calculateOverallScore(scoreBreakdown: any): number {
    const weights = {
      budget: 0.3,
      location: 0.25,
      amenities: 0.2,
      size: 0.15,
      availability: 0.1,
    }

    return Math.round(
      scoreBreakdown.budget * weights.budget +
        scoreBreakdown.location * weights.location +
        scoreBreakdown.amenities * weights.amenities +
        scoreBreakdown.size * weights.size +
        scoreBreakdown.availability * weights.availability,
    )
  }

  private deduplicateProperties(properties: RawProperty[]): RawProperty[] {
    const seen = new Set<string>()
    return properties.filter((property) => {
      const key = `${property.address.toLowerCase()}-${property.bedrooms}-${property.rent}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  private extractNeighborhood(address: string): string {
    const parts = address.split(", ")
    return parts[1] || "Unknown"
  }
}
