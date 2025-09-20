"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, FileText, Bell, Camera, MapPin, Clock } from "lucide-react"

interface Itinerary {
  id: string
  name: string
  date: string
  preparation: {
    checklist: string[]
    reminders: string[]
    documents: string[]
  }
}

interface TourPreparationProps {
  itineraries: Itinerary[]
  selectedDate: Date
}

export function TourPreparation({ itineraries, selectedDate }: TourPreparationProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})

  const selectedItinerary = itineraries.find((itinerary) => itinerary.date === selectedDate.toISOString().split("T")[0])

  const handleCheckboxChange = (item: string, checked: boolean) => {
    setCheckedItems((prev) => ({ ...prev, [item]: checked }))
  }

  const getCompletionPercentage = (items: string[]) => {
    const completed = items.filter((item) => checkedItems[item]).length
    return items.length > 0 ? Math.round((completed / items.length) * 100) : 0
  }

  if (!selectedItinerary) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Tours Scheduled</h3>
          <p className="text-muted-foreground">Select a date with scheduled tours to see preparation checklist</p>
        </CardContent>
      </Card>
    )
  }

  const checklistCompletion = getCompletionPercentage(selectedItinerary.preparation.checklist)
  const documentsCompletion = getCompletionPercentage(selectedItinerary.preparation.documents)

  return (
    <div className="space-y-6">
      {/* Preparation Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Tour Preparation for {selectedDate.toLocaleDateString()}
          </CardTitle>
          <CardDescription>Get ready for your apartment viewings with this comprehensive checklist</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{checklistCompletion}%</div>
              <div className="text-sm text-muted-foreground">Checklist Complete</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{documentsCompletion}%</div>
              <div className="text-sm text-muted-foreground">Documents Ready</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{selectedItinerary.preparation.reminders.length}</div>
              <div className="text-sm text-muted-foreground">Reminders Set</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {/* Pre-Tour Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Pre-Tour Checklist
              <Badge variant="secondary">{checklistCompletion}% Complete</Badge>
            </CardTitle>
            <CardDescription>Essential tasks to complete before your tours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedItinerary.preparation.checklist.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={`checklist-${index}`}
                  checked={checkedItems[item] || false}
                  onCheckedChange={(checked) => handleCheckboxChange(item, checked as boolean)}
                />
                <label
                  htmlFor={`checklist-${index}`}
                  className={`flex-1 text-sm ${checkedItems[item] ? "line-through text-muted-foreground" : ""}`}
                >
                  {item}
                </label>
                {checkedItems[item] && <CheckCircle className="w-4 h-4 text-green-600" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Required Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Required Documents
              <Badge variant="secondary">{documentsCompletion}% Ready</Badge>
            </CardTitle>
            <CardDescription>Bring these documents to show you're a qualified tenant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedItinerary.preparation.documents.map((document, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={`document-${index}`}
                  checked={checkedItems[document] || false}
                  onCheckedChange={(checked) => handleCheckboxChange(document, checked as boolean)}
                />
                <label
                  htmlFor={`document-${index}`}
                  className={`flex-1 text-sm ${checkedItems[document] ? "line-through text-muted-foreground" : ""}`}
                >
                  {document}
                </label>
                {checkedItems[document] && <CheckCircle className="w-4 h-4 text-green-600" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Important Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Important Reminders
            </CardTitle>
            <CardDescription>Don't forget these key points for a successful tour day</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedItinerary.preparation.reminders.map((reminder, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <Bell className="w-4 h-4 text-yellow-600 mt-0.5" />
                <p className="text-sm">{reminder}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tour Day Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Tour Day Tips
            </CardTitle>
            <CardDescription>Make the most of your apartment viewings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Camera className="w-4 h-4 text-primary mt-1" />
                <div>
                  <p className="font-medium text-sm">Take Photos & Videos</p>
                  <p className="text-xs text-muted-foreground">
                    Document each property to help with decision-making later
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <MapPin className="w-4 h-4 text-primary mt-1" />
                <div>
                  <p className="font-medium text-sm">Check the Neighborhood</p>
                  <p className="text-xs text-muted-foreground">
                    Walk around to get a feel for the area, nearby amenities, and safety
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Clock className="w-4 h-4 text-primary mt-1" />
                <div>
                  <p className="font-medium text-sm">Test Everything</p>
                  <p className="text-xs text-muted-foreground">
                    Check water pressure, outlets, cell service, and natural light
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-medium mb-2">Questions to Ask During Tours:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• What utilities are included in rent?</li>
                <li>• What is the lease term and move-in costs?</li>
                <li>• Are there any upcoming rent increases?</li>
                <li>• What is the pet policy and associated fees?</li>
                <li>• How is maintenance handled?</li>
                <li>• What parking options are available?</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
