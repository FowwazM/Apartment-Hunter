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
    // For now, we'll simulate different states

    const mockStatuses = [
      { status: "processing", progress: 25, message: "Searching Zillow..." },
      { status: "processing", progress: 50, message: "Analyzing StreetEasy listings..." },
      { status: "processing", progress: 75, message: "Scoring and ranking properties..." },
      { status: "completed", progress: 100, message: "Research completed" },
    ]

    // Simulate progression based on time
    const now = Date.now()
    const sessionStart = now - (now % 10000) // Rough session start time
    const elapsed = now - sessionStart
    const progressIndex = Math.min(Math.floor(elapsed / 2000), mockStatuses.length - 1)

    const currentStatus = mockStatuses[progressIndex]

    return NextResponse.json({
      sessionId,
      ...currentStatus,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Status API error:", error)
    return NextResponse.json({ error: "Failed to get research status" }, { status: 500 })
  }
}
