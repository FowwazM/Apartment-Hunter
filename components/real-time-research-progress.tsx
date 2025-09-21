/**
 * Example React component showing how to use real-time progress tracking
 * This can be integrated into your existing research flow
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

interface ResearchProgress {
  sessionId: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
  currentStep: string
  currentStepIndex: number
  totalSteps: number
  estimatedTimeRemaining?: string
  error?: string
}

interface SearchCriteria {
  bedrooms?: number
  maxRent?: number
  neighborhoods?: string[]
  amenities?: string[]
  petFriendly?: boolean
}

export function RealTimeResearchProgress() {
  const [progress, setProgress] = useState<ResearchProgress | null>(null)
  const [isResearching, setIsResearching] = useState(false)
  const [results, setResults] = useState<any[]>([])

  // Example search criteria
  const sampleCriteria: SearchCriteria = {
    bedrooms: 2,
    maxRent: 3000,
    neighborhoods: ['Brooklyn', 'Manhattan'],
    amenities: ['gym', 'parking'],
    petFriendly: true
  }

  const startResearch = async () => {
    const sessionId = `research-${Date.now()}`
    setIsResearching(true)
    setProgress(null)
    setResults([])

    try {
      // Start the research
      const researchPromise = fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          criteria: sampleCriteria
        })
      })

      // Start polling for progress
      pollProgress(sessionId)

      // Wait for research to complete
      const response = await researchPromise
      const data = await response.json()

      if (data.results) {
        setResults(data.results)
      }

    } catch (error) {
      console.error('Research failed:', error)
      setProgress(prev => prev ? {
        ...prev,
        status: 'error',
        message: 'Research failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      } : null)
    } finally {
      setIsResearching(false)
    }
  }

  const pollProgress = async (sessionId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/research/status/${sessionId}`)
        const data = await response.json()

        setProgress(data)

        // Continue polling if not completed
        if (data.status === 'processing') {
          setTimeout(poll, 2000) // Poll every 2 seconds
        }
      } catch (error) {
        console.error('Failed to get progress:', error)
      }
    }

    poll()
  }

  const getProgressColor = () => {
    if (!progress) return 'bg-gray-200'
    if (progress.status === 'error') return 'bg-red-500'
    if (progress.status === 'completed') return 'bg-green-500'
    return 'bg-blue-500'
  }

  const getStatusIcon = () => {
    if (!progress) return '🔍'
    if (progress.status === 'error') return '❌'
    if (progress.status === 'completed') return '✅'
    return '🔄'
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Real-Time Apartment Research</CardTitle>
          <CardDescription>
            Track research progress as it happens across multiple listing sites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Start Research Button */}
          <Button 
            onClick={startResearch} 
            disabled={isResearching}
            className="w-full"
          >
            {isResearching ? 'Researching...' : 'Start Apartment Research'}
          </Button>

          {/* Progress Display */}
          {progress && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  {getStatusIcon()} {progress.message}
                </span>
                <span className="text-sm text-muted-foreground">
                  {progress.progress}%
                </span>
              </div>

              <Progress 
                value={progress.progress} 
                className="h-2"
              />

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  Step {progress.currentStepIndex} of {progress.totalSteps}
                </div>
                {progress.estimatedTimeRemaining && (
                  <div className="text-right">
                    ETA: {progress.estimatedTimeRemaining}
                  </div>
                )}
              </div>

              {progress.error && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                  Error: {progress.error}
                </div>
              )}
            </div>
          )}

          {/* Results Summary */}
          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Research Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Found {results.length} apartments matching your criteria
              </p>
              
              {/* Show top 3 results */}
              <div className="space-y-2">
                {results.slice(0, 3).map((property, index) => (
                  <div key={property.id} className="p-3 border rounded-lg">
                    <div className="font-medium">{property.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {property.address} • ${property.rent}/month • {property.bedrooms}BR/{property.bathrooms}BA
                    </div>
                    <div className="text-sm">
                      Score: {property.score}/100 • Source: {property.source}
                    </div>
                  </div>
                ))}
                
                {results.length > 3 && (
                  <div className="text-sm text-muted-foreground text-center">
                    ... and {results.length - 3} more properties
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search Criteria Display */}
          <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded">
            <strong>Search Criteria:</strong> {sampleCriteria.bedrooms}BR, 
            up to ${sampleCriteria.maxRent?.toLocaleString()}, 
            in {sampleCriteria.neighborhoods?.join(' & ')}, 
            with {sampleCriteria.amenities?.join(' + ')}
            {sampleCriteria.petFriendly && ', pet-friendly'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RealTimeResearchProgress