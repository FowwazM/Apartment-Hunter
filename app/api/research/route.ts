import { type NextRequest, NextResponse } from "next/server"
import { PropertyResearchEngine } from "@/lib/property-research"
import sessionManager from "@/lib/session-manager"

interface ResearchRequest {
  sessionId: string
  criteria: {
    bedrooms?: number
    bathrooms?: number
    maxRent?: number
    neighborhoods?: string[]
    amenities?: string[]
    petFriendly?: boolean
    moveInDate?: string
    commute?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ResearchRequest = await request.json()
    const { sessionId, criteria } = body

    console.log(`[PropertyResearch] Starting research for session ${sessionId}`)
    console.log(`[PropertyResearch] Criteria:`, JSON.stringify(criteria, null, 2))

    // Initialize session in session manager
    sessionManager.createSession(sessionId)

    const researchEngine = new PropertyResearchEngine()
    
    // Add error handling for missing API keys
    try {
      const results = await researchEngine.researchProperties(criteria, sessionId)

      console.log(`[PropertyResearch] Research completed. Found ${results.length} top matches`)

      // Get final session state
      const finalSession = sessionManager.getSession(sessionId)

      return NextResponse.json({
        sessionId,
        status: "completed",
        results: results.map((property) => ({
          id: property.id,
          name: property.name,
          address: property.address,
          coordinates: { lat: property.latitude, lng: property.longitude },
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          rent: property.rent,
          squareFeet: property.squareFeet,
          availableDate: property.availableDate,
          amenities: property.amenities,
          photos: property.photos,
          contact: property.contact,
          score: property.score,
          scoreBreakdown: property.scoreBreakdown,
          ranking: property.ranking,
          source: property.source.name,
        })),
        totalFound: results.length,
        researchCompletedAt: finalSession?.completedAt?.toISOString() || new Date().toISOString(),
        note: results.length > 0 ? 
          "Results from real apartment listings via Exa API + Gemini AI" : 
          "No results found - check search criteria or API configuration",
        sessionInfo: {
          progress: finalSession?.progress || 100,
          totalSteps: finalSession?.totalSteps || 8,
          startedAt: finalSession?.startedAt?.toISOString(),
          completedAt: finalSession?.completedAt?.toISOString()
        }
      })
    } catch (engineError) {
      console.error("[PropertyResearch] Engine error:", engineError)
      
      // Mark session as failed
      sessionManager.failSession(sessionId, engineError instanceof Error ? engineError.message : 'Unknown error')
      
      // If initialization fails due to missing API keys, return helpful error
      if (engineError instanceof Error && engineError.message.includes('API_KEY')) {
        return NextResponse.json({
          error: "API configuration missing",
          message: "Please configure EXA_API_KEY and GEMINI_API_KEY environment variables",
          details: engineError.message,
          sessionId
        }, { status: 500 })
      }
      
      throw engineError
    }
  } catch (error) {
    console.error("[PropertyResearch] Research API error:", error)
    return NextResponse.json({ 
      error: "Failed to complete property research",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 })
  }
}
