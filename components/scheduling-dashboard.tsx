"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  Clock,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  PhoneCall,
  Star,
  Navigation,
  Bell,
  Settings,
} from "lucide-react"

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

interface ActiveCall {
  id: string
  propertyName: string
  status: "dialing" | "connected" | "speaking" | "completed" | "failed"
  duration: number
  progress: number
  currentAction: string
}

export function SchedulingDashboard() {
  const [tours, setTours] = useState<Tour[]>([])
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([])
  const [notifications, setNotifications] = useState<string[]>([])

  useEffect(() => {
    // Mock data - in real app would come from API
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

    setActiveCalls([
      {
        id: "call-1",
        propertyName: "Riverside Apartments",
        status: "speaking",
        duration: 145,
        progress: 65,
        currentAction: "Asking about amenities and scheduling tour...",
      },
    ])

    setNotifications([
      "Tour confirmed for Modern Heights tomorrow at 2:00 PM",
      "New property match found: Sunset Towers",
      "Voice agent successfully booked tour at Urban Plaza",
    ])
  }, [])

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduling Dashboard</h1>
          <p className="text-muted-foreground">Manage your apartment tours and voice agent calls</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Notifications ({notifications.length})
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Live Activity */}
      {activeCalls.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-primary animate-pulse" />
              Live Voice Agent Activity
            </CardTitle>
            <CardDescription>AI agents are currently calling properties for you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeCalls.map((call) => (
              <div key={call.id} className="p-4 bg-background rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{call.propertyName}</h4>
                    <p className="text-sm text-muted-foreground capitalize">
                      {call.status} • {formatDuration(call.duration)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="animate-pulse">
                    Live
                  </Badge>
                </div>
                <Progress value={call.progress} className="mb-2" />
                <p className="text-sm text-muted-foreground">{call.currentAction}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm font-medium text-muted-foreground">Active Calls</p>
                <p className="text-2xl font-bold">{activeCalls.length}</p>
              </div>
              <Phone className="w-8 h-8 text-green-600" />
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming Tours</TabsTrigger>
          <TabsTrigger value="completed">Completed Tours</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
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
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Confirmation</p>
                      <Badge variant="outline" className="font-mono">
                        {tour.confirmationCode}
                      </Badge>
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
                    {tour.status === "scheduled" && (
                      <Button variant="outline" size="sm" className="bg-transparent">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Tour
                      </Button>
                    )}
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
                    <Button variant="outline" size="sm" className="bg-transparent">
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

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>Stay updated on your apartment hunting progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.map((notification, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Bell className="w-4 h-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm">{notification}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {index === 0 ? "2 hours ago" : index === 1 ? "1 day ago" : "2 days ago"}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
