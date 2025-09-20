import { type NextRequest, NextResponse } from "next/server"
import { PropertyResearchEngine } from "@/lib/property-research"

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

    console.log(`[v0] Starting research for session ${sessionId}`)

    const researchEngine = new PropertyResearchEngine()
    const results = await researchEngine.researchProperties(criteria, sessionId)

    console.log(`[v0] Research completed. Found ${results.length} top matches`)

    // In a real implementation, this would save to database
    // For now, we'll store in memory or return directly

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
      researchCompletedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Research API error:", error)
    return NextResponse.json({ error: "Failed to complete property research" }, { status: 500 })
  }
}
