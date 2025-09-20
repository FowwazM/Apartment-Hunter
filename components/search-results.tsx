"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ResearchProgress } from "@/components/research-progress"
import { InteractiveMap } from "@/components/interactive-map"
import { VoiceAgent } from "@/components/voice-agent"
import { CallResults } from "@/components/call-results"
import { MapPin, Phone, Calendar, Star, DollarSign, Home, Wifi, List, Map } from "lucide-react"

interface SearchResultsProps {
  sessionId: string
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

export function SearchResults({ sessionId }: SearchResultsProps) {
  const [results, setResults] = useState<PropertyResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<string>("")
  const [activeView, setActiveView] = useState<"list" | "map">("map")
  const [voiceAgentOpen, setVoiceAgentOpen] = useState(false)
  const [callResults, setCallResults] = useState<any>(null)
  const [activePropertyForCall, setActivePropertyForCall] = useState<PropertyResult | null>(null)

  const handleResearchComplete = (researchData: any) => {
    setResults(researchData.results || [])
    setIsLoading(false)
    if (researchData.results && researchData.results.length > 0) {
      setSelectedProperty(researchData.results[0].id)
    }
  }

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

  if (isLoading) {
    return <ResearchProgress sessionId={sessionId} onComplete={handleResearchComplete} />
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
          {results.length > 0 && (
            <InteractiveMap
              properties={results}
              selectedProperty={selectedProperty}
              onPropertySelect={handlePropertySelect}
            />
          )}
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
                      src={property.photos[0] || "/placeholder.svg"}
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
                            <DialogDescription>
                              Let our AI agent call the property and handle the conversation for you
                            </DialogDescription>
                          </DialogHeader>
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
                      Source: {property.source} • Contact: {property.contact.phone}
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
