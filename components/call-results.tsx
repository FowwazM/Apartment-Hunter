"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Calendar, Phone, MessageSquare, Star } from "lucide-react"

interface CallResult {
  success: boolean
  duration: number
  transcript: string
  summary: string
  tourScheduled: boolean
  tourDetails?: {
    date: string
    time: string
    contact: string
    confirmationCode: string
  }
  questionsAsked: string[]
  answersReceived: string[]
}

interface CallResultsProps {
  result: CallResult
  propertyName: string
  onScheduleAnother: () => void
  onViewTour: () => void
}

export function CallResults({ result, propertyName, onScheduleAnother, onViewTour }: CallResultsProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }
  
  // Calls backend API to create a calendar event automatically
  const handleAddToCalendar = async () => {
    if (!result.tourScheduled || !result.tourDetails) return;
    // Load Google Identity Services script if needed
    const loadGsi = () => new Promise<void>((resolve, reject) => {
      if ((window as any).google?.accounts?.oauth2) return resolve();
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('GSI load failed')); 
      document.head.appendChild(s);
    });
    try {
      await loadGsi();
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        scope: 'https://www.googleapis.com/auth/calendar.events',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            alert('Calendar auth error: ' + tokenResponse.error);
            return;
          }
          const token = tokenResponse.access_token;
          // Safe non-null assertion after guard
          const details = result.tourDetails!;
          const start = new Date(`${details.date}T${details.time}`);
          const end = new Date(start.getTime() + 60 * 60 * 1000);
          const eventBody = {
            summary: `Tour at ${propertyName}`,
            location: propertyName,
            description: result.summary,
            start: { dateTime: start.toISOString() },
            end: { dateTime: end.toISOString() }
          };
          const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(eventBody)
          });
          const data = await res.json();
          if (data.htmlLink) window.open(data.htmlLink, '_blank');
          else alert('Failed to create event');
        }
      });
      client.requestAccessToken();
    } catch (e: any) {
      console.error('Add to calendar error:', e);
      alert('Add to calendar failed: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Call Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Call Completed Successfully
          </CardTitle>
          <CardDescription>AI agent successfully contacted {propertyName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                <CheckCircle className="w-6 h-6 mx-auto mb-1" />
              </div>
              <div className="text-sm text-muted-foreground">Success</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                <Clock className="w-5 h-5" />
                {formatDuration(result.duration)}
              </div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{result.questionsAsked.length}</div>
              <div className="text-sm text-muted-foreground">Questions Asked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {result.tourScheduled ? (
                  <Calendar className="w-6 h-6 mx-auto text-green-600" />
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">Tour Scheduled</div>
            </div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Call Summary</h4>
            <p className="text-sm text-green-800 dark:text-green-200">{result.summary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tour Details */}
      {result.tourScheduled && result.tourDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Tour Scheduled
            </CardTitle>
            <CardDescription>Your tour has been automatically booked</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                <p className="font-medium">
                  {new Date(result.tourDetails.date).toLocaleDateString()} at {result.tourDetails.time}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                <p className="font-medium">{result.tourDetails.contact}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Confirmation Code</label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="font-mono">
                  {result.tourDetails.confirmationCode}
                </Badge>
                <span className="text-sm text-muted-foreground">Save this for your records</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAddToCalendar} className="flex-1">
                <Calendar className="w-4 h-4 mr-2" />
                Add to Calendar
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                <Phone className="w-4 h-4 mr-2" />
                Call to Confirm
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Q&A Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Questions & Answers
          </CardTitle>
          <CardDescription>Information gathered during the call</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.questionsAsked.map((question, index) => (
              <div key={index} className="border-l-2 border-primary/20 pl-4">
                <p className="font-medium text-sm">{question}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.answersReceived[index] || "No specific answer recorded"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Full Transcript */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Full Transcript
          </CardTitle>
          <CardDescription>Complete conversation record</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-60 overflow-y-auto p-4 bg-muted/30 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap">{result.transcript}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onScheduleAnother} variant="outline" className="flex-1 bg-transparent">
          <Phone className="w-4 h-4 mr-2" />
          Call Another Property
        </Button>
        <Button className="flex-1">
          <Star className="w-4 h-4 mr-2" />
          Rate This Property
        </Button>
      </div>
    </div>
  )
}
