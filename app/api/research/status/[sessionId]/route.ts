import { type NextRequest, NextResponse } from "next/server"
import sessionManager from "@/lib/session-manager"

interface StatusParams {
  params: {
    sessionId: string
  }
}

export async function GET(request: NextRequest, { params }: StatusParams) {
  try {
    const { sessionId } = params

    // Get real session data from session manager
    const session = sessionManager.getSession(sessionId)

    if (!session) {
      // Session not found - it might be a new session or expired
      return NextResponse.json({
        sessionId,
        status: "not_found",
        progress: 0,
        message: "Session not found or expired",
        lastUpdated: new Date().toISOString(),
      }, { status: 404 })
    }

    // Return real session progress
    return NextResponse.json({
      sessionId: session.sessionId,
      status: session.status,
      progress: session.progress,
      message: session.message,
      currentStep: session.currentStep,
      currentStepIndex: session.currentStepIndex,
      totalSteps: session.totalSteps,
      lastUpdated: session.lastUpdatedAt.toISOString(),
      estimatedTimeRemaining: session.estimatedTimeRemaining || null,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() || null,
      error: session.error || null,
    })
  } catch (error) {
    console.error("[PropertyResearch] Status API error:", error)
    return NextResponse.json({ 
      error: "Failed to get research status",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
