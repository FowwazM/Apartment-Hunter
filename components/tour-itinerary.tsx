"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { ItineraryOptimizer } from "@/components/itinerary-optimizer"
import { TourPreparation } from "@/components/tour-preparation"
import { CalendarIcon, Clock, MapPin, Navigation, Car, CheckCircle, AlertTriangle, Download, Share } from "lucide-react"

interface Tour {
  id: string
  propertyName: string
  address: string
  coordinates: { lat: number; lng: number }
  date: string
  time: string
  duration: number // minutes
  contact: {
    name: string
    phone: string
  }
  confirmationCode: string
  status: "scheduled" | "confirmed"
  notes?: string
}

interface Itinerary {
  id: string
  name: string
  date: string
  tours: Tour[]
  optimizedRoute: {
    totalDuration: number
    totalDistance: number
    transportMode: "driving" | "transit" | "walking"
    segments: {
      from: string
      to: string
      duration: number
      distance: number
      mode: string
    }[]
  }
  preparation: {
    checklist: string[]
    reminders: string[]
    documents: string[]
  }
}

export function TourItinerary() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [tours, setTours] = useState<Tour[]>([])
  const [activeTab, setActiveTab] = useState("calendar")

  useEffect(() => {
    // Mock data - in real app would come from API
    const mockTours: Tour[] = [
      {
        id: "1",
        propertyName: "Modern Heights",
        address: "123 Oak St, Brooklyn, NY",
        coordinates: { lat: 40.6782, lng: -73.9442 },
        date: "2024-01-20",
        time: "2:00 PM",
        duration: 30,
        contact: { name: "Sarah Johnson", phone: "(555) 123-4567" },
        confirmationCode: "APT-MH2024",
        status: "confirmed",
        notes: "Ask about parking",
      },
      {
        id: "2",
        propertyName: "Urban Plaza",
        address: "456 Main Ave, Manhattan, NY",
        coordinates: { lat: 40.7831, lng: -73.9712 },
        date: "2024-01-20",
        time: "4:00 PM",
        duration: 45,
        contact: { name: "Mike Chen", phone: "(555) 987-6543" },
        confirmationCode: "APT-UP2024",
        status: "scheduled",
      },
      {
        id: "3",
        propertyName: "Garden Court",
        address: "789 Park Rd, Queens, NY",
        coordinates: { lat: 40.7282, lng: -73.7949 },
        date: "2024-01-21",
        time: "11:00 AM",
        duration: 30,
        contact: { name: "Lisa Wong", phone: "(555) 456-7890" },
        confirmationCode: "APT-GC2024",
        status: "confirmed",
      },
    ]

    setTours(mockTours)

    // Group tours by date and create itineraries
    const groupedTours = mockTours.reduce(
      (acc, tour) => {
        if (!acc[tour.date]) acc[tour.date] = []
        acc[tour.date].push(tour)
        return acc
      },
      {} as Record<string, Tour[]>,
    )

    const mockItineraries: Itinerary[] = Object.entries(groupedTours).map(([date, dateTours]) => ({
      id: `itinerary-${date}`,
      name: `Tour Day - ${new Date(date).toLocaleDateString()}`,
      date,
      tours: dateTours.sort((a, b) => a.time.localeCompare(b.time)),
      optimizedRoute: {
        totalDuration: 180, // 3 hours
        totalDistance: 25.5, // miles
        transportMode: "driving" as const,
        segments: [
          {
            from: "Starting Location",
            to: dateTours[0]?.propertyName || "",
            duration: 25,
            distance: 8.2,
            mode: "driving",
          },
          {
            from: dateTours[0]?.propertyName || "",
            to: dateTours[1]?.propertyName || "",
            duration: 35,
            distance: 12.1,
            mode: "driving",
          },
        ],
      },
      preparation: {
        checklist: [
          "Bring ID and proof of income",
          "Prepare list of questions",
          "Check traffic conditions",
          "Confirm all appointments",
        ],
        reminders: ["Leave 15 minutes early for each tour", "Bring phone charger", "Take photos of each property"],
        documents: ["Driver's License", "Pay Stubs", "Bank Statements", "References"],
      },
    }))

    setItineraries(mockItineraries)
  }, [])

  const getToursForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return tours.filter((tour) => tour.date === dateStr)
  }

  const getItineraryForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return itineraries.find((itinerary) => itinerary.date === dateStr)
  }

  const hasToursOnDate = (date: Date) => {
    return getToursForDate(date).length > 0
  }

  const exportToCalendar = () => {
    // In real app, would generate .ics file or integrate with calendar APIs
    alert("Calendar export functionality would be implemented here")
  }

  const shareItinerary = () => {
    // In real app, would generate shareable link or send via email
    alert("Share functionality would be implemented here")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tour Itinerary & Calendar</h1>
          <p className="text-muted-foreground">Plan and optimize your apartment viewing schedule</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={exportToCalendar}>
            <Download className="w-4 h-4 mr-2" />
            Export Calendar
          </Button>
          <Button variant="outline" size="sm" onClick={shareItinerary}>
            <Share className="w-4 h-4 mr-2" />
            Share Itinerary
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="optimizer">Route Optimizer</TabsTrigger>
          <TabsTrigger value="preparation">Tour Prep</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Select Date
                </CardTitle>
                <CardDescription>Click on a date to view your scheduled tours</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  modifiers={{
                    hasTours: (date) => hasToursOnDate(date),
                  }}
                  modifiersStyles={{
                    hasTours: {
                      backgroundColor: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                      fontWeight: "bold",
                    },
                  }}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Daily Itinerary */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  Tours for {selectedDate.toLocaleDateString()}
                  {hasToursOnDate(selectedDate) && (
                    <Badge variant="secondary" className="ml-2">
                      {getToursForDate(selectedDate).length} tours
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Your scheduled apartment viewings for this day</CardDescription>
              </CardHeader>
              <CardContent>
                {hasToursOnDate(selectedDate) ? (
                  <div className="space-y-4">
                    {getToursForDate(selectedDate).map((tour, index) => (
                      <div key={tour.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{tour.propertyName}</h4>
                            <Badge variant={tour.status === "confirmed" ? "default" : "secondary"}>
                              {tour.status === "confirmed" ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 mr-1" />
                              )}
                              {tour.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                            <MapPin className="w-3 h-3" />
                            {tour.address}
                          </p>
                          <div className="flex items-center gap-4 text-sm mb-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {tour.time} ({tour.duration} min)
                            </div>
                            <div>Contact: {tour.contact.name}</div>
                            <div>Code: {tour.confirmationCode}</div>
                          </div>
                          {tour.notes && (
                            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">Note: {tour.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline" className="bg-transparent">
                            <Navigation className="w-3 h-3 mr-1" />
                            Directions
                          </Button>
                          <Button size="sm" variant="ghost">
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Route Summary */}
                    {(() => {
                      const itinerary = getItineraryForDate(selectedDate)
                      return (
                        itinerary && (
                          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Car className="w-4 h-4" />
                              Optimized Route Summary
                            </h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="text-center">
                                <div className="font-semibold">{itinerary.optimizedRoute.totalDuration} min</div>
                                <div className="text-muted-foreground">Total Time</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold">{itinerary.optimizedRoute.totalDistance} mi</div>
                                <div className="text-muted-foreground">Total Distance</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold capitalize">{itinerary.optimizedRoute.transportMode}</div>
                                <div className="text-muted-foreground">Transport</div>
                              </div>
                            </div>
                          </div>
                        )
                      )
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Tours Scheduled</h3>
                    <p className="text-muted-foreground">
                      No apartment tours are scheduled for {selectedDate.toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="optimizer" className="space-y-6">
          <ItineraryOptimizer tours={tours} />
        </TabsContent>

        <TabsContent value="preparation" className="space-y-6">
          <TourPreparation itineraries={itineraries} selectedDate={selectedDate} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
