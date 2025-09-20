import { type NextRequest, NextResponse } from "next/server"

interface StatusParams {
  params: {
    sessionId: string
  }
}

export async function GET(request: NextRequest, { params }: StatusParams) {
  try {
    const { sessionId } = params

    // In a real implementation, this would check database for session status
    // For now, we'll simulate the actual research process stages

    const mockStatuses = [
      { status: "processing", progress: 10, message: "Building search queries..." },
      { status: "processing", progress: 20, message: "Searching Zillow with Exa API..." },
      { status: "processing", progress: 35, message: "Searching Apartments.com..." },
      { status: "processing", progress: 50, message: "Searching StreetEasy..." },
      { status: "processing", progress: 65, message: "Searching Craigslist..." },
      { status: "processing", progress: 80, message: "Parsing listings with Gemini AI..." },
      { status: "processing", progress: 90, message: "Scoring and ranking properties..." },
      { status: "processing", progress: 95, message: "Removing duplicates..." },
      { status: "completed", progress: 100, message: "Research completed - found apartments!" },
    ]

    // Simulate progression based on time (longer for real API calls)
    const now = Date.now()
    const sessionStart = now - (now % 20000) // Rough session start time (20 second cycle)
    const elapsed = now - sessionStart
    const progressIndex = Math.min(Math.floor(elapsed / 2500), mockStatuses.length - 1) // 2.5 seconds per stage

    const currentStatus = mockStatuses[progressIndex]

    return NextResponse.json({
      sessionId,
      ...currentStatus,
      lastUpdated: new Date().toISOString(),
      estimatedTimeRemaining: progressIndex < mockStatuses.length - 1 ? 
        `${Math.ceil((mockStatuses.length - 1 - progressIndex) * 2.5)} seconds` : 
        null,
    })
  } catch (error) {
    console.error("[PropertyResearch] Status API error:", error)
    return NextResponse.json({ error: "Failed to get research status" }, { status: 500 })
  }
}
