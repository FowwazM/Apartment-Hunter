"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Phone, PhoneCall, PhoneOff, CheckCircle, XCircle, Calendar, MessageSquare, Volume2, HelpCircle, CornerDownRight } from "lucide-react"

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
  const [meetupTimes, setMeetupTimes] = useState<string>("")
  const [callProgress, setCallProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [parsedDateTime, setParsedDateTime] = useState<string | null>(null)
  const [parsedQA, setParsedQA] = useState<Array<{ q: string; a: string }>>([])

  const defaultQuestions = [
    "Is the unit still available?",
    "What is the exact move-in date?",
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

  function buildUserQuestions(): string[] {
    // Split by newline, comma, or semicolon; trim; drop empties; dedupe
    const extra = Array.from(
      new Set(
        customQuestions
          .split(/[\n,;]+/g)
          .map((s) => s.trim())
          .filter(Boolean)
      )
    )
    // Merge with defaults, deduped
    return Array.from(new Set([...extra, ...defaultQuestions]))
  }

  // Parse "YYYY-MM-DD HH:MM:SS; q1; a1; q2; a2; ..."
  function parseSummary(summary: string) {
    const parts = summary.split(";").map((s) => s.trim()).filter(Boolean)
    if (parts.length === 0) return { dt: null as string | null, qa: [] as Array<{ q: string; a: string }> }

    const first = parts[0]
    const dtRegex = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/
    const hasDate = dtRegex.test(first)
    const dt = hasDate ? first : null
    const startIdx = hasDate ? 1 : 0

    const qa: Array<{ q: string; a: string }> = []
    for (let i = startIdx; i < parts.length; i += 2) {
      const q = parts[i]
      const a = parts[i + 1] ?? ""
      if (q) qa.push({ q, a })
    }
    return { dt, qa }
  }

  const startCall = async () => {
    try {
      setErrorMsg(null)
      setTranscript([])
      setParsedQA([])
      setParsedDateTime(null)
      setCallProgress(0)
      setCallDuration(0)

      const userQuestions = buildUserQuestions()

      // 1) Begin: set UI state
      setCallStatus("dialing")
      setCurrentMessage("Contacting the property via voice agent…")

      const payload = {
        listingName: property.name,
        listingAddress: property.address,
        userQuestions,
      }
      console.log("[VoiceAgent] POST /api/make-call payload:", payload)

      // 2) Call your make-call route — server creates Vapi call, polls to 'ended', returns { summary, transcript }
      const res = await fetch("/api/make-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

      // Live transcript box
      if (data.transcript) {
        setTranscript(String(data.transcript).split("\n").filter(Boolean))
      }

      const summary: string = String(data.summary || "")
      const { dt, qa } = parseSummary(summary)
      setParsedDateTime(dt)
      setParsedQA(qa)

      // Prepare CallResult for parent
      let dateStr = ""
      let timeStr = ""
      if (dt) {
        // split "YYYY-MM-DD HH:MM:SS"
        const [d, t] = dt.split(/\s+/)
        dateStr = d
        timeStr = t
      }

      const result: CallResult = {
        success: true,
        duration: callDuration,
        transcript: data.transcript || "",
        summary,
        tourScheduled: /schedule|tour|viewing/i.test(summary),
        tourDetails: dt
          ? {
              date: dateStr,
              time: timeStr,
              contact: property.name,
              confirmationCode: "",
            }
          : undefined,
        questionsAsked: qa.map((x) => x.q),
        answersReceived: qa.map((x) => x.a),
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
    setParsedQA([])
    setParsedDateTime(null)
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
              placeholder="Add any specific questions you'd like the agent to ask (separate by new lines, commas, or semicolons)…"
              value={customQuestions}
              onChange={(e) => setCustomQuestions(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Available Meetup Times:</label>
            <Input
              placeholder="e.g., Weekdays between 9am–5pm"
              value={meetupTimes}
              onChange={(e) => setMeetupTimes(e.target.value)}
              className="w-full"
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

        {/* Parsed Results (Date/Time + Q&A) */}
        {callStatus === "completed" && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Parsed Appointment & Answers
            </h4>

            {parsedDateTime ? (
              <p className="text-sm">
                <span className="font-medium">Proposed time:</span> {parsedDateTime}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No date/time detected in summary.</p>
            )}

            {parsedQA.length > 0 ? (
              <div className="space-y-2">
                {parsedQA.map(({ q, a }, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <span className="font-medium">{q}</span>
                    </div>
                    <div className="flex items-start gap-2 ml-6 mt-1">
                      <CornerDownRight className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <span>{a || <span className="text-muted-foreground">No answer provided</span>}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No Q/A pairs found in summary.</p>
            )}
          </div>
        )}

        {/* Call Actions */}
        <div className="flex gap-3">
          {(callStatus === "idle" || callStatus === "failed") && (
            <Button onClick={startCall} className="flex-1">
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
