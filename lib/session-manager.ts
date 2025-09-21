/**
 * Session Manager for tracking real-time research progress
 * In production, this would use a database like Redis or PostgreSQL
 * For now, we'll use in-memory storage with the option to extend
 */

export interface ResearchProgress {
  sessionId: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number // 0-100
  message: string
  currentStep: string
  totalSteps: number
  currentStepIndex: number
  startedAt: Date
  lastUpdatedAt: Date
  completedAt?: Date
  error?: string
  results?: any[]
  estimatedTimeRemaining?: string
}

class SessionManager {
  private sessions: Map<string, ResearchProgress> = new Map()

  // Create a new research session
  createSession(sessionId: string): ResearchProgress {
    const session: ResearchProgress = {
      sessionId,
      status: 'pending',
      progress: 0,
      message: 'Initializing research...',
      currentStep: 'initialization',
      totalSteps: 8, // Based on our research process
      currentStepIndex: 0,
      startedAt: new Date(),
      lastUpdatedAt: new Date()
    }

    this.sessions.set(sessionId, session)
    return session
  }

  // Update session progress
  updateProgress(
    sessionId: string, 
    updates: Partial<Pick<ResearchProgress, 'progress' | 'message' | 'currentStep' | 'currentStepIndex' | 'status' | 'error' | 'estimatedTimeRemaining'>>
  ): ResearchProgress | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    // Calculate estimated time remaining based on progress
    if (updates.progress && updates.progress > 0 && session.progress > 0) {
      const elapsed = Date.now() - session.startedAt.getTime()
      const progressRate = updates.progress / elapsed
      const remainingProgress = 100 - updates.progress
      const estimatedMs = remainingProgress / progressRate
      
      if (estimatedMs > 0 && estimatedMs < 300000) { // Cap at 5 minutes
        const seconds = Math.ceil(estimatedMs / 1000)
        updates.estimatedTimeRemaining = seconds < 60 ? 
          `${seconds} seconds` : 
          `${Math.ceil(seconds / 60)} minutes`
      }
    }

    Object.assign(session, updates, { lastUpdatedAt: new Date() })
    
    if (updates.status === 'completed') {
      session.completedAt = new Date()
      session.estimatedTimeRemaining = undefined
    }

    this.sessions.set(sessionId, session)
    return session
  }

  // Get session status
  getSession(sessionId: string): ResearchProgress | null {
    return this.sessions.get(sessionId) || null
  }

  // Complete session with results
  completeSession(sessionId: string, results: any[]): ResearchProgress | null {
    return this.updateProgress(sessionId, {
      status: 'completed',
      progress: 100,
      message: `Research completed - found ${results.length} apartments!`,
      currentStep: 'completed'
    })
  }

  // Mark session as failed
  failSession(sessionId: string, error: string): ResearchProgress | null {
    return this.updateProgress(sessionId, {
      status: 'error',
      message: 'Research failed',
      error
    })
  }

  // Clean up old sessions (optional, for memory management)
  cleanupOldSessions(maxAgeMs: number = 24 * 60 * 60 * 1000) { // 24 hours default
    const cutoff = Date.now() - maxAgeMs
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.startedAt.getTime() < cutoff) {
        this.sessions.delete(sessionId)
      }
    }
  }

  // Get all active sessions (for debugging)
  getAllSessions(): ResearchProgress[] {
    return Array.from(this.sessions.values())
  }
}

// Singleton instance
const sessionManager = new SessionManager()

// Clean up old sessions every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    sessionManager.cleanupOldSessions()
  }, 60 * 60 * 1000) // 1 hour
}

export default sessionManager