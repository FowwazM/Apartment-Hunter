"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Car, Train, MapPin, Clock, Navigation, Zap, Route } from "lucide-react"

interface Tour {
  id: string
  propertyName: string
  address: string
  coordinates: { lat: number; lng: number }
  date: string
  time: string
  duration: number
}

interface ItineraryOptimizerProps {
  tours: Tour[]
}

export function ItineraryOptimizer({ tours }: ItineraryOptimizerProps) {
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [transportMode, setTransportMode] = useState<"driving" | "transit" | "walking">("driving")
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null)

  const uniqueDates = [...new Set(tours.map((tour) => tour.date))].sort()
  const toursForDate = selectedDate ? tours.filter((tour) => tour.date === selectedDate) : []

  const optimizeRoute = async () => {
    if (toursForDate.length < 2) return

    setIsOptimizing(true)

    // Simulate route optimization
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const optimized = {
      originalOrder: toursForDate,
      optimizedOrder: [...toursForDate].sort((a, b) => {
        // Simple optimization: sort by coordinates to minimize travel
        return a.coordinates.lat - b.coordinates.lat
      }),
      savings: {
        time: 45, // minutes saved
        distance: 12.3, // miles saved
        cost: 8.5, // dollars saved
      },
      route: {
        totalTime: 180,
        totalDistance: 25.7,
        segments: toursForDate.map((tour, index) => ({
          from: index === 0 ? "Starting Location" : toursForDate[index - 1].propertyName,
          to: tour.propertyName,
          duration: 15 + Math.random() * 20,
          distance: 3 + Math.random() * 8,
          mode: transportMode,
        })),
      },
    }

    setOptimizedRoute(optimized)
    setIsOptimizing(false)
  }

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case "driving":
        return <Car className="w-4 h-4" />
      case "transit":
        return <Train className="w-4 h-4" />
      default:
        return <Navigation className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            Route Optimizer
          </CardTitle>
          <CardDescription>Optimize your tour schedule to minimize travel time and maximize efficiency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Date</label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a date with tours" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueDates.map((date) => (
                    <SelectItem key={date} value={date}>
                      {new Date(date).toLocaleDateString()} ({tours.filter((t) => t.date === date).length} tours)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Transport Mode</label>
              <Select value={transportMode} onValueChange={(value: any) => setTransportMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="driving">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Driving
                    </div>
                  </SelectItem>
                  <SelectItem value="transit">
                    <div className="flex items-center gap-2">
                      <Train className="w-4 h-4" />
                      Public Transit
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={optimizeRoute}
            disabled={toursForDate.length < 2 || isOptimizing}
            className="w-full"
            size="lg"
          >
            {isOptimizing ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                Optimizing Route...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Optimize Route
              </>
            )}
          </Button>

          {toursForDate.length < 2 && selectedDate && (
            <p className="text-sm text-muted-foreground text-center">
              Need at least 2 tours on the same day to optimize the route
            </p>
          )}
        </CardContent>
      </Card>

      {optimizedRoute && (
        <div className="grid gap-6">
          {/* Savings Summary */}
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <Zap className="w-5 h-5" />
                Optimization Results
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                Your optimized route saves time, distance, and money
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {optimizedRoute.savings.time} min
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Time Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {optimizedRoute.savings.distance} mi
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Distance Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                    ${optimizedRoute.savings.cost}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Cost Saved</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Original Route */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Original Route</CardTitle>
                <CardDescription>Your current tour schedule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {optimizedRoute.originalOrder.map((tour: any, index: number) => (
                  <div key={tour.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{tour.propertyName}</p>
                      <p className="text-sm text-muted-foreground">{tour.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Optimized Route */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Optimized Route
                </CardTitle>
                <CardDescription>Recommended efficient order</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {optimizedRoute.optimizedOrder.map((tour: any, index: number) => (
                  <div key={tour.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-medium text-primary-foreground">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{tour.propertyName}</p>
                      <p className="text-sm text-muted-foreground">{tour.time}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Optimized
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Route Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Route Details
              </CardTitle>
              <CardDescription>Step-by-step directions for your optimized route</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizedRoute.route.segments.map((segment: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-shrink-0">{getTransportIcon(segment.mode)}</div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {segment.from} → {segment.to}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.round(segment.duration)} min
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {segment.distance.toFixed(1)} mi
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Time: </span>
                    {optimizedRoute.route.totalTime} minutes
                  </div>
                  <div>
                    <span className="font-medium">Total Distance: </span>
                    {optimizedRoute.route.totalDistance} miles
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <Button className="flex-1">
                  <Navigation className="w-4 h-4 mr-2" />
                  Start Navigation
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent">
                  Apply Optimization
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
