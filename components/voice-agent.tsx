"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Phone, PhoneCall, PhoneOff, CheckCircle, XCircle, Calendar, MessageSquare, Volume2 } from "lucide-react"

interface VoiceAgentProps {
  property: {
    id: string
    name: string
    address: string
    contact: {
      phone?: string
      email?: string
    }
  }
  onCallComplete: (result: CallResult) => void
}

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

type CallStatus = "idle" | "dialing" | "connected" | "speaking" | "completed" | "failed"

export function VoiceAgent({ property, onCallComplete }: VoiceAgentProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle")
  const [callDuration, setCallDuration] = useState(0)
  const [currentMessage, setCurrentMessage] = useState("")
  const [transcript, setTranscript] = useState<string[]>([])
  const [customQuestions, setCustomQuestions] = useState("")
  const [callProgress, setCallProgress] = useState(0)

  const defaultQuestions = [
    "Is the unit still available?",
    "What is the exact move-in date?",
    "Are pets allowed?",
    "What utilities are included?",
    "Is there parking available?",
    "Can we schedule a tour?",
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (callStatus === "connected" || callStatus === "speaking") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [callStatus])

  const startCall = async () => {
    setCallStatus("dialing")
    setCallDuration(0)
    setTranscript([])
    setCallProgress(0)
    setCurrentMessage("Dialing property...")

    // Simulate call progression
    const callFlow = [
      { status: "dialing" as CallStatus, message: "Dialing property...", progress: 10, duration: 2000 },
      { status: "connected" as CallStatus, message: "Connected! Introducing myself...", progress: 25, duration: 3000 },
      { status: "speaking" as CallStatus, message: "Asking about availability...", progress: 40, duration: 4000 },
      { status: "speaking" as CallStatus, message: "Inquiring about amenities...", progress: 60, duration: 3000 },
      { status: "speaking" as CallStatus, message: "Scheduling tour...", progress: 80, duration: 3000 },
      { status: "completed" as CallStatus, message: "Call completed successfully!", progress: 100, duration: 1000 },
    ]

    for (const step of callFlow) {
      await new Promise((resolve) => setTimeout(resolve, step.duration))
      setCallStatus(step.status)
      setCurrentMessage(step.message)
      setCallProgress(step.progress)

      // Add transcript entries
      if (step.status === "connected") {
        setTranscript((prev) => [
          ...prev,
          "Agent: Hello, this is an AI assistant calling on behalf of a prospective tenant. Is this the leasing office?",
          "Property: Yes, this is the leasing office. How can I help you?",
        ])
      } else if (step.status === "speaking" && step.message.includes("availability")) {
        setTranscript((prev) => [
          ...prev,
          "Agent: I'm calling about a 2-bedroom unit. Is it still available?",
          "Property: Yes, we have a 2-bedroom available on the 5th floor.",
        ])
      } else if (step.message.includes("amenities")) {
        setTranscript((prev) => [
          ...prev,
          "Agent: Great! Can you tell me about the amenities and if pets are allowed?",
          "Property: We have a gym, laundry, and yes, we're pet-friendly with a $200 deposit.",
        ])
      } else if (step.message.includes("tour")) {
        setTranscript((prev) => [
          ...prev,
          "Agent: Perfect! Can we schedule a tour for this weekend?",
          "Property: How about Saturday at 2 PM?",
          "Agent: That works perfectly. I'll send the details to the client.",
        ])
      }
    }

    // Complete the call
    const result: CallResult = {
      success: true,
      duration: callDuration,
      transcript: transcript.join("\n"),
      summary:
        "Successfully contacted property. Unit is available, pets allowed with deposit, tour scheduled for Saturday 2 PM.",
      tourScheduled: true,
      tourDetails: {
        date: "2024-01-20",
        time: "2:00 PM",
        contact: "Sarah Johnson",
        confirmationCode: "APT-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
      },
      questionsAsked: defaultQuestions.slice(0, 4),
      answersReceived: [
        "Yes, 2-bedroom unit available on 5th floor",
        "Available immediately",
        "Yes, pets allowed with $200 deposit",
        "Heat and water included",
      ],
    }

    onCallComplete(result)
  }

  const endCall = () => {
    setCallStatus("idle")
    setCallDuration(0)
    setCurrentMessage("")
    setCallProgress(0)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusColor = () => {
    switch (callStatus) {
      case "dialing":
        return "text-yellow-600"
      case "connected":
      case "speaking":
        return "text-green-600"
      case "completed":
        return "text-blue-600"
      case "failed":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusIcon = () => {
    switch (callStatus) {
      case "dialing":
        return <Phone className="w-4 h-4 animate-pulse" />
      case "connected":
      case "speaking":
        return <PhoneCall className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "failed":
        return <XCircle className="w-4 h-4" />
      default:
        return <Phone className="w-4 h-4" />
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-primary" />
          AI Voice Agent
        </CardTitle>
        <CardDescription>
          Let our AI agent call {property.name} to ask questions and schedule a tour for you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Info */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">{property.name}</h4>
          <p className="text-sm text-muted-foreground mb-2">{property.address}</p>
          <p className="text-sm">
            <Phone className="w-3 h-3 inline mr-1" />
            {property.contact.phone || "Phone number will be looked up"}
          </p>
        </div>

        {/* Call Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="font-medium capitalize">{callStatus}</span>
              {callDuration > 0 && <span className="text-sm">({formatDuration(callDuration)})</span>}
            </div>
            {callStatus !== "idle" && callStatus !== "completed" && (
              <Button variant="destructive" size="sm" onClick={endCall}>
                <PhoneOff className="w-4 h-4 mr-2" />
                End Call
              </Button>
            )}
          </div>

          {callProgress > 0 && (
            <div className="space-y-2">
              <Progress value={callProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">{currentMessage}</p>
            </div>
          )}
        </div>

        {/* Questions to Ask */}
        <div className="space-y-3">
          <h4 className="font-medium">Questions to Ask:</h4>
          <div className="space-y-2">
            {defaultQuestions.map((question, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-3 h-3 text-green-600" />
                {question}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Questions:</label>
            <Textarea
              placeholder="Add any specific questions you'd like the agent to ask..."
              value={customQuestions}
              onChange={(e) => setCustomQuestions(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        {/* Live Transcript */}
        {transcript.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Live Transcript
            </h4>
            <div className="max-h-40 overflow-y-auto p-3 bg-muted/30 rounded-lg space-y-2">
              {transcript.map((line, index) => (
                <p key={index} className="text-sm">
                  <span className={line.startsWith("Agent:") ? "font-medium text-primary" : "text-muted-foreground"}>
                    {line}
                  </span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Call Actions */}
        <div className="flex gap-3">
          {callStatus === "idle" && (
            <Button onClick={startCall} className="flex-1">
              <PhoneCall className="w-4 h-4 mr-2" />
              Start Voice Agent Call
            </Button>
          )}
          {callStatus === "completed" && (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => setCallStatus("idle")} className="flex-1">
                Call Another Property
              </Button>
              <Button className="flex-1">
                <Calendar className="w-4 h-4 mr-2" />
                View Scheduled Tour
              </Button>
            </div>
          )}
        </div>

        {/* Call Instructions */}
        {callStatus === "idle" && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">How it works:</h5>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• AI agent calls the property on your behalf</li>
              <li>• Asks your questions and gathers information</li>
              <li>• Attempts to schedule a tour automatically</li>
              <li>• Provides you with a complete transcript and summary</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
