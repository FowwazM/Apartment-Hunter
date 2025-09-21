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

type CallStatus = "idle" | "dialing" | "waiting" | "completed" | "failed"

export function VoiceAgent({ property, onCallComplete }: VoiceAgentProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle")
  const [callDuration, setCallDuration] = useState(0)
  const [currentMessage, setCurrentMessage] = useState("")
  const [transcript, setTranscript] = useState<string[]>([])
  const [customQuestions, setCustomQuestions] = useState("")
  const [callProgress, setCallProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const defaultQuestions = [
    "Is the unit still available?",
    "What is the exact move-in date?",
    "Are pets allowed?",
    "What utilities are included?",
    "Is there parking available?",
    "Can we schedule a tour?",
  ]

  // progress indicator while waiting
  useEffect(() => {
    let progressTimer: NodeJS.Timeout | null = null
    if (callStatus === "dialing" || callStatus === "waiting") {
      progressTimer = setInterval(() => {
        setCallProgress((p) => (p >= 95 ? 95 : p + 2))
      }, 500)
    }
    return () => {
      if (progressTimer) clearInterval(progressTimer)
    }
  }, [callStatus])

  // tick duration while active
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (callStatus !== "idle" && callStatus !== "completed" && callStatus !== "failed") {
      timer = setInterval(() => setCallDuration((d) => d + 1), 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [callStatus])

  const startCall = async () => {
    try {
      setErrorMsg(null)
      setTranscript([])
      setCallProgress(0)
      setCallDuration(0)

      // Build questions array from defaults + custom (one per line)
      const extraQs = customQuestions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
      const questions = [...defaultQuestions, ...extraQs]

      // 1) Begin: set UI state
      setCallStatus("dialing")
      setCurrentMessage("Contacting the property via voice agent…")

      // 2) Call your make-call route — this route should (server-side) resolve the phone,
      // create the Vapi call, poll until status === "ended", and return { summary, transcript }.
      const res = await fetch("/api/make-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingName: property.name,
          listingAddress: property.address,
          userQuestions: questions,
        }),
      })

      setCallStatus("waiting")
      setCurrentMessage("Connected. Waiting for the agent to finish the conversation…")

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(typeof data?.error === "string" ? data.error : "Call failed.")
        setCallStatus("failed")
        return
      }

      if (data.timedOut) {
        setErrorMsg(`The call is still ${data.status}. Timed out waiting for completion.`)
        setCallStatus("failed")
        return
      }

      // 3) Done — show results
      setCallProgress(100)
      setCurrentMessage("Call completed successfully.")
      setCallStatus("completed")

      // display transcript text in the Live Transcript box
      if (data.transcript) {
        setTranscript(String(data.transcript).split("\n").filter(Boolean))
      }

      // shape into your CallResult interface
      const result: CallResult = {
        success: true,
        duration: callDuration,
        transcript: data.transcript || "",
        summary: data.summary || "",
        tourScheduled: /schedule|tour|viewing/i.test(String(data.summary || "")),
        // optional — parse date/time from summary later if needed
        questionsAsked: questions,
        answersReceived: [], // optional: parse structured answers from transcript later
      }

      onCallComplete(result)
    } catch (err: any) {
      setErrorMsg(err?.message || "Unknown error.")
      setCallStatus("failed")
    }
  }

  const endCall = () => {
    setCallStatus("idle")
    setCallDuration(0)
    setCurrentMessage("")
    setCallProgress(0)
    setTranscript([])
    setErrorMsg(null)
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
      case "waiting":
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
      case "waiting":
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
            {callStatus !== "idle" && callStatus !== "completed" && callStatus !== "failed" && (
              <Button variant="destructive" size="sm" onClick={endCall}>
                <PhoneOff className="w-4 h-4 mr-2" />
                End Call
              </Button>
            )}
          </div>

          {(callProgress > 0 || callStatus === "waiting" || callStatus === "dialing") && (
            <div className="space-y-2">
              <Progress value={callProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">{currentMessage}</p>
            </div>
          )}

          {errorMsg && (
            <p className="text-sm text-red-600">
              {errorMsg}
            </p>
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
              placeholder="Add any specific questions you'd like the agent to ask (one per line)…"
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
              Transcript
            </h4>
            <div className="max-h-40 overflow-y-auto p-3 bg-muted/30 rounded-lg space-y-2">
              {transcript.map((line, index) => (
                <p key={index} className="text-sm">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Call Actions */}
        <div className="flex gap-3">
          {(callStatus === "idle" || callStatus === "failed") && (
            <Button onClick={startCall} className="flex-1" disabled={callStatus === "dialing" || callStatus === "waiting"}>
              <PhoneCall className="w-4 h-4 mr-2" />
              Start Voice Agent Call
            </Button>
          )}
          {callStatus === "completed" && (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={endCall} className="flex-1">
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
