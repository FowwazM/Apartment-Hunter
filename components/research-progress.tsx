"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface ResearchProgressProps {
  sessionId: string
  onComplete: (results: any) => void
}

export function ResearchProgress({ sessionId, onComplete }: ResearchProgressProps) {
  const [status, setStatus] = useState<"processing" | "completed" | "error">("processing")
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("Initializing research...")

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/research/status/${sessionId}`)
        const data = await response.json()

        setStatus(data.status)
        setProgress(data.progress)
        setMessage(data.message)

        if (data.status === "completed") {
          // Trigger the actual research to get results
          const researchResponse = await fetch("/api/research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              criteria: {}, // Would come from session data in real implementation
            }),
          })

          if (researchResponse.ok) {
            const results = await researchResponse.json()
            onComplete(results)
          }
        }
      } catch (error) {
        console.error("[v0] Failed to check research status:", error)
        setStatus("error")
        setMessage("Research failed. Please try again.")
      }
    }

    const interval = setInterval(checkStatus, 1000)
    checkStatus() // Initial check

    return () => clearInterval(interval)
  }, [sessionId, onComplete])

  const getIcon = () => {
    switch (status) {
      case "processing":
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-destructive" />
    }
  }

  const getTitle = () => {
    switch (status) {
      case "processing":
        return "AI Research in Progress"
      case "completed":
        return "Research Completed"
      case "error":
        return "Research Failed"
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          {getIcon()}
          {getTitle()}
        </CardTitle>
        <CardDescription>
          {status === "processing" && "Our AI is analyzing thousands of listings to find your perfect matches"}
          {status === "completed" && "Found your top apartment matches with detailed scoring"}
          {status === "error" && "Something went wrong during the research process"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="w-full" />
        <div className="text-center text-sm text-muted-foreground">{message}</div>
        {status === "processing" && (
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>• Searching multiple property databases</p>
            <p>• Analyzing neighborhood data and amenities</p>
            <p>• Scoring properties based on your criteria</p>
            <p>• Ranking top matches for your review</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
