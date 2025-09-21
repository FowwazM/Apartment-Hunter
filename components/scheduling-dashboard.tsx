"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, Phone, MapPin, CheckCircle, AlertCircle, Star, Navigation } from "lucide-react"

interface Tour {
  id: string
  propertyName: string
  address: string
  date: string
  time: string
  status: "scheduled" | "confirmed" | "completed" | "cancelled"
  contact: {
    name: string
    phone: string
    email: string
  }
  confirmationCode: string
  notes?: string
  rating?: number
  callId?: string
}

export function SchedulingDashboard() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [completionModal, setCompletionModal] = useState<{ isOpen: boolean; tourId: string | null }>({
    isOpen: false,
    tourId: null,
  })
  const [completionRating, setCompletionRating] = useState(0)
  const [completionNotes, setCompletionNotes] = useState("")
  const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean; tour: Tour | null }>({
    isOpen: false,
    tour: null,
  })

  useEffect(() => {
    fetchTours()
  }, [])

  const fetchTours = async () => {
    try {
      const response = await fetch("/api/tours")
      if (response.ok) {
        const toursData = await response.json()
        setTours(toursData)
      } else {
        console.error("Failed to fetch tours")
        // Fallback to mock data if API fails
        setTours([
          {
            id: "1",
            propertyName: "Modern Heights",
            address: "123 Oak St, Brooklyn, NY",
            date: "2024-01-20",
            time: "2:00 PM",
            status: "scheduled",
            contact: {
              name: "Sarah Johnson",
              phone: "(555) 123-4567",
              email: "sarah@modernheights.com",
            },
            confirmationCode: "APT-MH2024",
            notes: "Ask about parking availability",
          },
          {
            id: "2",
            propertyName: "Urban Plaza",
            address: "456 Main Ave, Manhattan, NY",
            date: "2024-01-21",
            time: "11:00 AM",
            status: "confirmed",
            contact: {
              name: "Mike Chen",
              phone: "(555) 987-6543",
              email: "mike@urbanplaza.com",
            },
            confirmationCode: "APT-UP2024",
          },
          {
            id: "3",
            propertyName: "Garden Court",
            address: "789 Park Rd, Queens, NY",
            date: "2024-01-18",
            time: "3:30 PM",
            status: "completed",
            contact: {
              name: "Lisa Wong",
              phone: "(555) 456-7890",
              email: "lisa@gardencourt.com",
            },
            confirmationCode: "APT-GC2024",
            rating: 4,
          },
        ])
      }
    } catch (error) {
      console.error("Error fetching tours:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="w-4 h-4" />
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />
      case "completed":
        return <Star className="w-4 h-4" />
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const upcomingTours = tours.filter((tour) => tour.status === "scheduled" || tour.status === "confirmed")
  const completedTours = tours.filter((tour) => tour.status === "completed")

  const handleCompleteTour = (tourId: string) => {
    setCompletionModal({ isOpen: true, tourId })
    setCompletionRating(0)
    setCompletionNotes("")
  }

  const submitTourCompletion = async () => {
    if (completionModal.tourId && completionRating > 0) {
      try {
        const response = await fetch(`/api/tours/${completionModal.tourId}/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating: completionRating,
            notes: completionNotes,
          }),
        })

        if (response.ok) {
          const updatedTour = await response.json()
          setTours((prevTours) => prevTours.map((tour) => (tour.id === completionModal.tourId ? updatedTour : tour)))
        } else {
          console.error("Failed to complete tour")
        }
      } catch (error) {
        console.error("Error completing tour:", error)
      }

      setCompletionModal({ isOpen: false, tourId: null })
      setCompletionRating(0)
      setCompletionNotes("")
    }
  }

  const viewTourDetails = (tour: Tour) => {
    setDetailsModal({ isOpen: true, tour })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Scheduling Dashboard</h1>
            <p className="text-muted-foreground">Loading your apartment tours...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduling Dashboard</h1>
          <p className="text-muted-foreground">Manage your apartment tours and voice agent calls</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Tours</p>
                <p className="text-2xl font-bold">{upcomingTours.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Tours</p>
                <p className="text-2xl font-bold">{completedTours.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">
                  {completedTours.filter((t) => t.rating).length > 0
                    ? (
                        completedTours.reduce((sum, t) => sum + (t.rating || 0), 0) /
                        completedTours.filter((t) => t.rating).length
                      ).toFixed(1)
                    : "N/A"}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming Tours</TabsTrigger>
          <TabsTrigger value="completed">Completed Tours</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingTours.length > 0 ? (
            upcomingTours.map((tour) => (
              <Card key={tour.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{tour.propertyName}</h3>
                        <Badge className={getStatusColor(tour.status)}>
                          {getStatusIcon(tour.status)}
                          <span className="ml-1 capitalize">{tour.status}</span>
                        </Badge>
                      </div>
                      <p className="text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="w-4 h-4" />
                        {tour.address}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(tour.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {tour.time}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Contact Person</p>
                      <p className="text-sm text-muted-foreground">{tour.contact.name}</p>
                      <p className="text-sm text-muted-foreground">{tour.contact.phone}</p>
                    </div>
                    {tour.notes && (
                      <div>
                        <p className="text-sm font-medium mb-1">Notes</p>
                        <p className="text-sm text-muted-foreground">{tour.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button size="sm">
                      <Navigation className="w-4 h-4 mr-2" />
                      Get Directions
                    </Button>
                    <Button variant="outline" size="sm" className="bg-transparent">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Property
                    </Button>
                    <Button variant="outline" size="sm" className="bg-transparent">
                      <Calendar className="w-4 h-4 mr-2" />
                      Reschedule
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      onClick={() => handleCompleteTour(tour.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Tour
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Upcoming Tours</h3>
                <p className="text-muted-foreground mb-4">
                  Use the voice agent to call properties and schedule tours automatically.
                </p>
                <Button>Start New Search</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedTours.length > 0 ? (
            completedTours.map((tour) => (
              <Card key={tour.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{tour.propertyName}</h3>
                        <Badge className={getStatusColor(tour.status)}>
                          {getStatusIcon(tour.status)}
                          <span className="ml-1 capitalize">{tour.status}</span>
                        </Badge>
                        {tour.rating && (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < tour.rating! ? "text-yellow-500 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="w-4 h-4" />
                        {tour.address}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(tour.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {tour.time}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                      onClick={() => viewTourDetails(tour)}
                    >
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="bg-transparent">
                      <Phone className="w-4 h-4 mr-2" />
                      Follow Up
                    </Button>
                    {!tour.rating && (
                      <Button size="sm">
                        <Star className="w-4 h-4 mr-2" />
                        Rate Property
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Completed Tours</h3>
                <p className="text-muted-foreground">Your completed tours will appear here.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Tour Completion Modal */}
      <Dialog open={completionModal.isOpen} onOpenChange={(open) => setCompletionModal({ isOpen: open, tourId: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Tour</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rate your experience (1-5 stars)</label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} onClick={() => setCompletionRating(i + 1)} className="p-1">
                    <Star
                      className={`w-6 h-6 ${i < completionRating ? "text-yellow-500 fill-current" : "text-gray-300"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
              <Textarea
                placeholder="Add any notes about the tour..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCompletionModal({ isOpen: false, tourId: null })}>
                Cancel
              </Button>
              <Button onClick={submitTourCompletion} disabled={completionRating === 0}>
                Complete Tour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tour Details Modal */}
      <Dialog open={detailsModal.isOpen} onOpenChange={(open) => setDetailsModal({ isOpen: open, tour: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tour Details</DialogTitle>
          </DialogHeader>
          {detailsModal.tour && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{detailsModal.tour.propertyName}</h3>
                <p className="text-muted-foreground">{detailsModal.tour.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Date:</span>
                  <p>{new Date(detailsModal.tour.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium">Time:</span>
                  <p>{detailsModal.tour.time}</p>
                </div>
              </div>
              {detailsModal.tour.rating && (
                <div>
                  <span className="font-medium">Rating:</span>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < detailsModal.tour.rating! ? "text-yellow-500 fill-current" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {detailsModal.tour.notes && (
                <div>
                  <span className="font-medium">Notes:</span>
                  <p className="text-sm text-muted-foreground mt-1">{detailsModal.tour.notes}</p>
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setDetailsModal({ isOpen: false, tour: null })}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}