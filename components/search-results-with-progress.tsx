"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InteractiveMap } from "@/components/interactive-map"
import { VoiceAgent } from "@/components/voice-agent"
import { CallResults } from "@/components/call-results"
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, Phone, Map, List } from "lucide-react"
import Link from "next/link"

interface SearchResultsWithProgressProps {
  sessionId: string
  query?: string
  criteria?: string
}

interface ResearchProgress {
  sessionId: string
  status: 'pending' | 'processing' | 'completed' | 'error' | 'not_found'
  progress: number
  message: string
  currentStep?: string
  currentStepIndex?: number
  totalSteps?: number
  estimatedTimeRemaining?: string
  error?: string
}

interface PropertyResult {
  id: string
  name: string
  address: string
  coordinates: { lat: number; lng: number }
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
  source: string
}

export function SearchResultsWithProgress({ sessionId, query, criteria }: SearchResultsWithProgressProps) {
  const [progress, setProgress] = useState<ResearchProgress | null>(null)
  const [results, setResults] = useState<any>(null)
  const [hasStartedResearch, setHasStartedResearch] = useState(false)
  const [researchCompleted, setResearchCompleted] = useState(false)

  useEffect(() => {
    startResearchAndPoll()
  }, [sessionId])

  const startResearchAndPoll = async () => {
    try {
      // Parse criteria if it's a string
      let parsedCriteria = {}
      if (criteria) {
        try {
          parsedCriteria = JSON.parse(criteria)
        } catch (e) {
          console.warn('Failed to parse criteria:', e)
        }
      }

      // Start the research if not already started
      if (!hasStartedResearch) {
        setHasStartedResearch(true)
        
        console.log('Starting research with criteria:', parsedCriteria)
        
        // Start research in the background
        fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            criteria: parsedCriteria,
            originalQuery: query,
            timestamp: new Date().toISOString(),
          }),
        }).then(async (response) => {
          if (response.ok) {
            const data = await response.json()
            console.log('Research completed with data:', data)
            setResults(data)
            setResearchCompleted(true)
          }
        }).catch((error) => {
          console.error('Research failed:', error)
        })
      }

      // Start polling for progress
      pollProgress()

    } catch (error) {
      console.error('Failed to start research:', error)
    }
  }

  const pollProgress = async () => {
    try {
      const response = await fetch(`/api/research/status/${sessionId}`)
      const data = await response.json()

      setProgress(data)

      // Continue polling if still processing
      if (data.status === 'processing') {
        setTimeout(pollProgress, 2000) // Poll every 2 seconds
      } else if (data.status === 'completed' && !researchCompleted) {
        // If status shows completed but we haven't marked it complete, stop polling
        console.log('Research status shows completed')
      }
    } catch (error) {
      console.error('Failed to get progress:', error)
      // Retry after a delay
      setTimeout(pollProgress, 5000)
    }
  }

  const getProgressIcon = () => {
    if (!progress) return <Loader2 className="w-5 h-5 animate-spin text-primary" />
    
    switch (progress.status) {
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />
      default:
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />
    }
  }

  const getProgressTitle = () => {
    if (!progress) return "Starting Research..."
    
    switch (progress.status) {
      case 'processing':
        return "AI Research in Progress"
      case 'completed':
        return "Research Completed!"
      case 'error':
        return "Research Failed"
      case 'not_found':
        return "Session Not Found"
      default:
        return "Preparing Search..."
    }
  }

  const getProgressDescription = () => {
    if (!progress) return "Initializing apartment search..."
    
    switch (progress.status) {
      case 'processing':
        return "Our AI is analyzing thousands of listings across multiple platforms"
      case 'completed':
        return "Found your top apartment matches with detailed scoring"
      case 'error':
        return "Something went wrong during the research process"
      case 'not_found':
        return "This search session could not be found"
      default:
        return "Getting ready to search for apartments..."
    }
  }

  // Show results if research is completed and we have results
  if (researchCompleted && results && results.results) {
    console.log('Showing results, research completed with data')
    return <CompletedResults results={results.results} sessionId={sessionId} />
  }

  // Show error state
  if (progress?.status === 'error' || progress?.status === 'not_found') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Research Failed</h1>
            <p className="text-muted-foreground">Let's try searching again</p>
          </div>
        </div>

        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              {getProgressTitle()}
            </CardTitle>
            <CardDescription>{getProgressDescription()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {progress?.error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                Error: {progress.error}
              </div>
            )}
            
            <div className="flex justify-center">
              <Link href="/">
                <Button>Start New Search</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show progress tracking
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Finding Your Perfect Apartment</h1>
          <p className="text-muted-foreground">AI is searching across multiple listing platforms</p>
        </div>
      </div>

      {query && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="text-sm">
              <span className="font-medium">Your search:</span> "{query}"
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {getProgressIcon()}
            {getProgressTitle()}
          </CardTitle>
          <CardDescription>{getProgressDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress?.progress || 0} className="w-full" />
          
          <div className="text-center text-sm text-muted-foreground">
            {progress?.message || "Initializing research..."}
          </div>

          {progress && progress.currentStepIndex && progress.totalSteps && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {progress.currentStepIndex} of {progress.totalSteps}</span>
              {progress.estimatedTimeRemaining && (
                <span>ETA: {progress.estimatedTimeRemaining}</span>
              )}
            </div>
          )}

          {progress?.status === 'processing' && (
            <div className="text-xs text-muted-foreground text-center space-y-1 bg-muted/30 p-3 rounded-lg">
              <p>🔍 Searching Zillow, Apartments.com, StreetEasy, and Craigslist</p>
              <p>🤖 Using AI to parse and score property listings</p>
              <p>📊 Ranking results based on your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Component to display completed research results
function CompletedResults({ results, sessionId }: { results: PropertyResult[], sessionId: string }) {
  const [selectedProperty, setSelectedProperty] = useState<string>("")
  const [activeView, setActiveView] = useState<"list" | "map">("map")
  const [voiceAgentOpen, setVoiceAgentOpen] = useState(false)
  const [callResults, setCallResults] = useState<any>(null)
  const [activePropertyForCall, setActivePropertyForCall] = useState<PropertyResult | null>(null)

  useEffect(() => {
    if (results.length > 0) {
      setSelectedProperty(results[0].id)
    }
  }, [results])

  const handlePropertySelect = (propertyId: string) => {
    setSelectedProperty(propertyId)
  }

  const handleStartVoiceAgent = (property: PropertyResult) => {
    setActivePropertyForCall(property)
    setCallResults(null)
    setVoiceAgentOpen(true)
  }

  const handleCallComplete = (result: any) => {
    setCallResults(result)
  }

  const handleScheduleAnother = () => {
    setCallResults(null)
  }

  const handleViewTour = () => {
    setVoiceAgentOpen(false)
    // Navigate to tour dashboard
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            New Search
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Your Top Apartment Matches</h1>
          <p className="text-muted-foreground">
            Found {results.length} apartments that match your criteria • Session: {sessionId.slice(0, 8)}
          </p>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "list" | "map")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="w-4 h-4" />
            Map View
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-3">
                {results.map((property) => (
                  <Card
                    key={property.id}
                    className={`cursor-pointer transition-all ${
                      selectedProperty === property.id
                        ? "border-primary shadow-lg"
                        : "hover:shadow-md"
                    }`}
                    onClick={() => handlePropertySelect(property.id)}
                  >
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold">{property.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {property.address}
                          </p>
                        </div>
                        <div className="text-right pl-2">
                          <p className="font-semibold">
                            ${property.rent?.toLocaleString() ?? "N/A"}/mo
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-x-4 text-sm text-muted-foreground mb-3">
                        <span>{property.bedrooms} beds</span>
                        <span>{property.bathrooms} baths</span>
                        <span>
                          {property.squareFeet
                            ? `${property.squareFeet.toLocaleString()} sqft`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-end h-9">
                        {selectedProperty === property.id && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartVoiceAgent(property)
                            }}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Call Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            <div className="h-[70vh] rounded-lg overflow-hidden">
              <InteractiveMap
                properties={results}
                selectedProperty={selectedProperty}
                onPropertySelect={handlePropertySelect}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {results.map((property) => (
            <Card key={property.id} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">{property.name}</h3>
                    <p className="text-muted-foreground mb-2">{property.address}</p>
                    <div className="flex items-center gap-x-6 text-sm text-muted-foreground">
                      <span>{property.bedrooms} beds</span>
                      <span>{property.bathrooms} baths</span>
                      <span>
                        {property.squareFeet
                          ? `${property.squareFeet.toLocaleString()} sqft`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold mb-1">
                      ${property.rent?.toLocaleString() ?? "N/A"}/mo
                    </p>
                    <p className="text-sm text-muted-foreground">Score: {property.score}/100</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.slice(0, 3).map((amenity) => (
                      <span
                        key={amenity}
                        className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                    {property.amenities.length > 3 && (
                      <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                        +{property.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                  <Button onClick={() => handleStartVoiceAgent(property)}>
                    <Phone className="w-4 h-4 mr-2" />
                    Call Property
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Voice Agent Modal */}
      {voiceAgentOpen && activePropertyForCall && !callResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-2xl w-full mx-4">
            <VoiceAgent
              property={{
                id: activePropertyForCall.id,
                name: activePropertyForCall.name,
                address: activePropertyForCall.address,
                contact: {
                  phone: activePropertyForCall.contact?.phone,
                  email: activePropertyForCall.contact?.email,
                }
              }}
              onCallComplete={handleCallComplete}
            />
          </div>
        </div>
      )}

      {/* Call Results Modal */}
      {callResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CallResults
              result={callResults}
              propertyName={activePropertyForCall?.name || "Property"}
              onScheduleAnother={handleScheduleAnother}
              onViewTour={handleViewTour}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchResultsWithProgress