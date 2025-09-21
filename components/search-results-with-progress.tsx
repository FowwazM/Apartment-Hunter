"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { InteractiveMap } from "@/components/interactive-map"
import { VoiceAgent } from "@/components/voice-agent"
import { CallResults } from "@/components/call-results"
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, Phone, Map, List, MapPin, Star, Home, DollarSign, Wifi, Calendar } from "lucide-react"
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
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false)
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false)
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false)

  const loadGoogleScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if ((window as any).google?.accounts?.oauth2) {
        console.log("Google services already loaded")
        resolve()
        return
      }

      // Check if script tag already exists
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      if (existingScript) {
        console.log("Google script already exists, waiting for it to load...")
        // Wait for existing script to load
        const checkLoaded = () => {
          if ((window as any).google?.accounts?.oauth2) {
            resolve()
          } else {
            setTimeout(checkLoaded, 100)
          }
        }
        setTimeout(checkLoaded, 100)
        return
      }

      console.log("Loading Google Identity Services script...")
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      
      script.onload = () => {
        console.log("Google script loaded, waiting for services to initialize...")
        // Google services need time to initialize after script load
        const checkServices = () => {
          if ((window as any).google?.accounts?.oauth2) {
            console.log("Google services ready!")
            resolve()
          } else {
            console.log("Still waiting for Google services...")
            setTimeout(checkServices, 200)
          }
        }
        // Start checking after a short delay
        setTimeout(checkServices, 100)
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if (!(window as any).google?.accounts?.oauth2) {
            reject(new Error('Google services failed to initialize within timeout period'))
          }
        }, 10000)
      }
      
      script.onerror = (error) => {
        console.error("Failed to load Google script:", error)
        reject(new Error('Failed to load Google Identity Services script'))
      }
      
      document.head.appendChild(script)
    })
  }

  // Preload Google script when component mounts
  useEffect(() => {
    const preloadGoogleScript = async () => {
      try {
        console.log("Preloading Google Identity Services...")
        await loadGoogleScript()
        setGoogleScriptLoaded(true)
        console.log("Google script preloaded successfully")
      } catch (error) {
        console.log("Failed to preload Google script:", error)
        setGoogleScriptLoaded(false)
      }
    }

    preloadGoogleScript()
  }, [])

  useEffect(() => {
    if (results.length > 0) {
      setSelectedProperty(results[0].id)
    }
  }, [results])

  const handlePropertySelect = (propertyId: string) => {
    setSelectedProperty(propertyId)
  }

  const handleStartVoiceAgent = (property: PropertyResult) => {
    // Ensure the selected property matches before opening the dialog
    setSelectedProperty(property.id)
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

  const handleGoogleCalendarIntegration = async () => {
    try {
      setIsLoadingCalendar(true)
      console.log("Initiating Google Calendar integration...")
     
      // Check if we have a valid client ID
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      
      if (!clientId) {
        throw new Error('Google Client ID not found in environment variables')
      }

      console.log("Client ID found:", clientId.substring(0, 10) + '...')

      // Load Google Identity Services if not already loaded
      console.log("Checking if Google services are available...")
      if (!(window as any).google?.accounts?.oauth2) {
        console.log("Loading Google Identity Services...")
        await loadGoogleScript()
      } else {
        console.log("Google services already available")
      }

      // Double check services are ready
      if (!(window as any).google?.accounts?.oauth2) {
        throw new Error('Google Identity Services are not available after loading')
      }

      console.log("Creating OAuth2 token client...")
      
      // Use Google's new Identity Services
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        callback: async (response: any) => {
          console.log("OAuth callback received:", response)
          
          if (response.error) {
            console.error('OAuth error:', response.error)
            alert('Failed to authenticate: ' + response.error)
            setIsLoadingCalendar(false)
            return
          }

          if (response.access_token) {
            console.log('Got access token, fetching calendar events...')
            try {
              await fetchCalendarEvents(response.access_token)
              setIsGoogleCalendarConnected(true)
              console.log("Google Calendar connected successfully!")
            } catch (error: any) {
              console.error('Failed to fetch calendar events:', error)
              alert('Failed to fetch calendar events: ' + error.message)
            }
          } else {
            console.error('No access token received from Google')
            alert('No access token received from Google')
          }
          setIsLoadingCalendar(false)
        },
      })

      console.log("OAuth client created, requesting access token...")
      // Request access token
      client.requestAccessToken()

    } catch (error: any) {
      console.error("Failed to connect Google Calendar:", error)
      alert('Failed to connect to Google Calendar: ' + (error?.message || 'Unknown error'))
      setIsLoadingCalendar(false)
    }
  }

  const fetchCalendarEvents = async (accessToken: string) => {
    try {
      console.log("Starting to fetch calendar events...")
      
      // Get date range for next week
      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
     
      console.log("Fetching calendar list...")
      // First, get list of calendars
      const calendarsResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )
     
      if (!calendarsResponse.ok) {
        const errorText = await calendarsResponse.text()
        console.error('Calendar list fetch failed:', calendarsResponse.status, errorText)
        throw new Error(`Failed to fetch calendars: ${calendarsResponse.status} ${errorText}`)
      }
     
      const calendarsData = await calendarsResponse.json()
      console.log(`Found ${calendarsData.items?.length || 0} calendars`)
      
      if (!calendarsData.items || calendarsData.items.length === 0) {
        console.log("No calendars found")
        setCalendarEvents([])
        return
      }
      
      const allEvents: any[] = []
     
      // Fetch events from all calendars (limit to first 3 to avoid rate limits)
      const calendarsToCheck = calendarsData.items.slice(0, 3)
      
      for (const calendar of calendarsToCheck) {
        try {
          console.log(`Fetching events from calendar: ${calendar.summary}`)
          
          const eventsResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?` +
            `timeMin=${now.toISOString()}&` +
            `timeMax=${nextWeek.toISOString()}&` +
            `singleEvents=true&` +
            `orderBy=startTime&` +
            `maxResults=10`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          )
         
          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json()
            console.log(`Found ${eventsData.items?.length || 0} events in ${calendar.summary}`)
            
            if (eventsData.items && eventsData.items.length > 0) {
              const calendarEvents = eventsData.items.map((event: any) => ({
                ...event,
                calendarName: calendar.summary,
                calendarColor: calendar.backgroundColor || '#4285f4'
              }))
              allEvents.push(...calendarEvents)
            }
          } else {
            const errorText = await eventsResponse.text()
            console.warn(`Failed to fetch events from calendar ${calendar.summary}:`, eventsResponse.status, errorText)
          }
        } catch (error) {
          console.error(`Failed to fetch events from calendar ${calendar.summary}:`, error)
        }
      }
     
      // Sort events by start time
      allEvents.sort((a, b) => {
        const aStart = new Date(a.start?.dateTime || a.start?.date)
        const bStart = new Date(b.start?.dateTime || b.start?.date)
        return aStart.getTime() - bStart.getTime()
      })
     
      setCalendarEvents(allEvents)
      console.log(`Successfully fetched ${allEvents.length} total events from ${calendarsToCheck.length} calendars`)
     
    } catch (error: any) {
      console.error('Failed to fetch calendar events:', error)
      throw new Error(`Calendar fetch error: ${error.message}`)
    }
  }

  const handleCall = async (property: PropertyResult) => {
    console.log(`Initiating call to ${property.name} at ${property.address}...`)

    try {
      const res = await fetch("/api/make-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingName: property.name,
          listingAddress: property.address,
          userQuestions: [
            "Is parking included?",
            "Any pet fees?",
          ],
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error("Call failed:", data)
        alert("Call failed. Check console for details.")
        return
      }

      if (data.timedOut) {
        // Long calls might hit the 5m timeout; decide how to handle
        alert(`Still ${data.status}. Timed out waiting — try again or poll a status route.`)
        return
      }

      // Success: call ended — you have summary + transcript
      console.log("Call complete:", data)
      alert("Call ended — summary and transcript received. Check console.")
      // e.g., setState(data.summary, data.transcript) to show in UI
    } catch (err) {
      console.error("Error starting/waiting for call:", err)
      alert("Something went wrong.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Your Top Apartment Matches</h1>
        <p className="text-muted-foreground">
          Found {results.length} apartments that match your criteria • Session: {sessionId.slice(0, 8)}
        </p>
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
                          <Dialog open={voiceAgentOpen} onOpenChange={setVoiceAgentOpen}>
                            <DialogTrigger asChild>
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
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>AI Voice Agent</DialogTitle>
                                <p className="text-sm text-muted-foreground">
                                  Our AI will call {activePropertyForCall?.name} to get information and schedule a tour for you.
                                </p>
                              </DialogHeader>

                              {!isGoogleCalendarConnected && (
                                <Card className="mb-4">
                                  <CardHeader>
                                    <CardTitle className="text-base">📅 Connect Your Calendar</CardTitle>
                                    <CardDescription>
                                      Connect your Google Calendar to check availability and automatically schedule apartment tours.
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <Button 
                                      onClick={handleGoogleCalendarIntegration}
                                      disabled={isLoadingCalendar}
                                      className="w-full"
                                    >
                                      {isLoadingCalendar ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Connecting...
                                        </>
                                      ) : (
                                        <>
                                          <Calendar className="mr-2 h-4 w-4" />
                                          Connect Google Calendar
                                        </>
                                      )}
                                    </Button>
                                  </CardContent>
                                </Card>
                              )}

                              {isGoogleCalendarConnected && calendarEvents.length > 0 && (
                                <Card className="mb-4">
                                  <CardHeader>
                                    <CardTitle className="text-base">📅 Your Calendar</CardTitle>
                                    <CardDescription>
                                      Upcoming events for the next week. The AI will avoid these times when scheduling.
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <ScrollArea className="h-32">
                                      <div className="space-y-2">
                                        {calendarEvents.slice(0, 5).map((event: any, index: number) => (
                                          <div key={index} className="text-xs p-2 bg-muted rounded flex justify-between">
                                            <span className="font-medium">{event.summary || 'Busy'}</span>
                                            <span className="text-muted-foreground">
                                              {event.start?.dateTime 
                                                ? new Date(event.start.dateTime).toLocaleDateString() + ' ' + 
                                                  new Date(event.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                                : new Date(event.start?.date).toLocaleDateString()
                                              }
                                            </span>
                                          </div>
                                        ))}
                                        {calendarEvents.length > 5 && (
                                          <div className="text-xs text-muted-foreground text-center pt-2">
                                            +{calendarEvents.length - 5} more events
                                          </div>
                                        )}
                                      </div>
                                    </ScrollArea>
                                  </CardContent>
                                </Card>
                              )}

                              {activePropertyForCall && !callResults && (
                                <VoiceAgent
                                  property={{
                                    id: activePropertyForCall.id,
                                    name: activePropertyForCall.name,
                                    address: activePropertyForCall.address,
                                    contact: activePropertyForCall.contact,
                                  }}
                                  onCallComplete={handleCallComplete}
                                />
                              )}
                              {callResults && activePropertyForCall && (
                                <CallResults
                                  result={callResults}
                                  propertyName={activePropertyForCall.name}
                                  onScheduleAnother={handleScheduleAnother}
                                  onViewTour={handleViewTour}
                                />
                              )}
                            </DialogContent>
                          </Dialog>
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

        <TabsContent value="list" className="space-y-6">
          <div className="grid gap-6">
            {results.map((property) => (
              <Card
                key={property.id}
                className={`overflow-hidden cursor-pointer transition-all ${
                  selectedProperty === property.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handlePropertySelect(property.id)}
              >
                <div className="flex">
                  {/* Property Image */}
                  <div className="w-64 h-48 bg-muted flex-shrink-0">
                    <img
                      src={property.photos?.[0] || "/placeholder.svg"}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Property Details */}
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{property.name}</h3>
                          <Badge variant="secondary">#{property.ranking}</Badge>
                        </div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {property.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-semibold">{property.score}/100</span>
                        </div>
                        <p className="text-sm text-muted-foreground">AI Score</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {property.bedrooms} bed, {property.bathrooms} bath
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">${property.rent.toLocaleString()}/mo</span>
                      </div>
                      {property.squareFeet && (
                        <div className="flex items-center gap-2">
                          <Wifi className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{property.squareFeet} sq ft</span>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        Available: {new Date(property.availableDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Amenities:</p>
                      <div className="flex flex-wrap gap-1">
                        {property.amenities.slice(0, 6).map((amenity) => (
                          <Badge key={amenity} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {property.amenities.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{property.amenities.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Score Breakdown:</p>
                      <div className="grid grid-cols-5 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium">{property.scoreBreakdown.budget}</div>
                          <div className="text-muted-foreground">Budget</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{property.scoreBreakdown.location}</div>
                          <div className="text-muted-foreground">Location</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{property.scoreBreakdown.amenities}</div>
                          <div className="text-muted-foreground">Amenities</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{property.scoreBreakdown.size}</div>
                          <div className="text-muted-foreground">Size</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{property.scoreBreakdown.availability}</div>
                          <div className="text-muted-foreground">Available</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Dialog open={voiceAgentOpen} onOpenChange={setVoiceAgentOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleStartVoiceAgent(property)}>
                            <Phone className="w-4 h-4 mr-2" />
                            Call Property
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>AI Voice Agent</DialogTitle>
                            <p className="text-sm text-muted-foreground">
                              Our AI will call {activePropertyForCall?.name} to get information and schedule a tour for you.
                            </p>
                          </DialogHeader>

                          {!isGoogleCalendarConnected && (
                            <Card className="mb-4">
                              <CardHeader>
                                <CardTitle className="text-base">📅 Connect Your Calendar</CardTitle>
                                <CardDescription>
                                  Connect your Google Calendar to check availability and automatically schedule apartment tours.
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <Button 
                                  onClick={handleGoogleCalendarIntegration}
                                  disabled={isLoadingCalendar}
                                  className="w-full"
                                >
                                  {isLoadingCalendar ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Connecting...
                                    </>
                                  ) : (
                                    <>
                                      <Calendar className="mr-2 h-4 w-4" />
                                      Connect Google Calendar
                                    </>
                                  )}
                                </Button>
                              </CardContent>
                            </Card>
                          )}

                          {isGoogleCalendarConnected && calendarEvents.length > 0 && (
                            <Card className="mb-4">
                              <CardHeader>
                                <CardTitle className="text-base">📅 Your Calendar</CardTitle>
                                <CardDescription>
                                  Upcoming events for the next week. The AI will avoid these times when scheduling.
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <ScrollArea className="h-32">
                                  <div className="space-y-2">
                                    {calendarEvents.slice(0, 5).map((event: any, index: number) => (
                                      <div key={index} className="text-xs p-2 bg-muted rounded flex justify-between">
                                        <span className="font-medium">{event.summary || 'Busy'}</span>
                                        <span className="text-muted-foreground">
                                          {event.start?.dateTime 
                                            ? new Date(event.start.dateTime).toLocaleDateString() + ' ' + 
                                              new Date(event.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                            : new Date(event.start?.date).toLocaleDateString()
                                          }
                                        </span>
                                      </div>
                                    ))}
                                    {calendarEvents.length > 5 && (
                                      <div className="text-xs text-muted-foreground text-center pt-2">
                                        +{calendarEvents.length - 5} more events
                                      </div>
                                    )}
                                  </div>
                                </ScrollArea>
                              </CardContent>
                            </Card>
                          )}

                          {activePropertyForCall && !callResults && (
                            <VoiceAgent
                              property={{
                                id: activePropertyForCall.id,
                                name: activePropertyForCall.name,
                                address: activePropertyForCall.address,
                                contact: activePropertyForCall.contact,
                              }}
                              onCallComplete={handleCallComplete}
                            />
                          )}
                          {callResults && activePropertyForCall && (
                            <CallResults
                              result={callResults}
                              propertyName={activePropertyForCall.name}
                              onScheduleAnother={handleScheduleAnother}
                              onViewTour={handleViewTour}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button size="sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Tour
                      </Button>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      Source: {property.source} • Contact: {property.contact?.phone}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {results.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No matches found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or expanding your budget/location preferences.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SearchResultsWithProgress