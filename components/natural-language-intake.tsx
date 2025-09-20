"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Search, Sparkles, MapPin, DollarSign, Home } from "lucide-react"

interface ParsedCriteria {
  bedrooms?: number
  bathrooms?: number
  maxRent?: number
  neighborhoods?: string[]
  amenities?: string[]
  petFriendly?: boolean
  moveInDate?: string
  commute?: string
}

export function NaturalLanguageIntake() {
  const [query, setQuery] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedCriteria, setParsedCriteria] = useState<ParsedCriteria>({})
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (query.length > 10) {
      const criteria = parseQuery(query)
      setParsedCriteria(criteria)
      generateSuggestions(query)
    } else {
      setParsedCriteria({})
      setSuggestions([])
    }
  }, [query])

  const parseQuery = (text: string): ParsedCriteria => {
    const criteria: ParsedCriteria = {}

    // Extract bedrooms
    const bedroomMatch = text.match(/(\d+)[\s-]*(bedroom|br|bed)/i)
    if (bedroomMatch) criteria.bedrooms = Number.parseInt(bedroomMatch[1])

    // Extract bathrooms
    const bathroomMatch = text.match(/(\d+(?:\.\d+)?)[\s-]*(bathroom|bath|ba)/i)
    if (bathroomMatch) criteria.bathrooms = Number.parseFloat(bathroomMatch[1])

    // Extract rent budget
    const rentMatch = text.match(/under\s*\$?(\d+(?:,\d+)?)|below\s*\$?(\d+(?:,\d+)?)|max\s*\$?(\d+(?:,\d+)?)/i)
    if (rentMatch) {
      const amount = rentMatch[1] || rentMatch[2] || rentMatch[3]
      criteria.maxRent = Number.parseInt(amount.replace(",", ""))
    }

    // Extract neighborhoods
    const neighborhoods = []
    const brooklynMatch = text.match(/brooklyn/i)
    const manhattanMatch = text.match(/manhattan/i)
    const queensMatch = text.match(/queens/i)
    if (brooklynMatch) neighborhoods.push("Brooklyn")
    if (manhattanMatch) neighborhoods.push("Manhattan")
    if (queensMatch) neighborhoods.push("Queens")
    if (neighborhoods.length > 0) criteria.neighborhoods = neighborhoods

    // Extract amenities
    const amenities = []
    if (text.match(/gym|fitness/i)) amenities.push("Gym")
    if (text.match(/parking/i)) amenities.push("Parking")
    if (text.match(/laundry/i)) amenities.push("Laundry")
    if (text.match(/pool/i)) amenities.push("Pool")
    if (text.match(/doorman|concierge/i)) amenities.push("Doorman")
    if (text.match(/roof|rooftop/i)) amenities.push("Rooftop")
    if (amenities.length > 0) criteria.amenities = amenities

    // Pet friendly
    if (text.match(/pet[\s-]friendly|pets?\s+allowed/i)) {
      criteria.petFriendly = true
    }

    // Commute preferences
    const commuteMatch = text.match(/near\s+(subway|train|metro)/i)
    if (commuteMatch) criteria.commute = "Public Transit"

    return criteria
  }

  const generateSuggestions = (text: string) => {
    const suggestions = []

    if (!text.match(/\$\d+/)) {
      suggestions.push("Consider adding your budget (e.g., 'under $3000')")
    }
    if (!text.match(/\d+[\s-]*(bedroom|br)/i)) {
      suggestions.push("Specify number of bedrooms (e.g., '2-bedroom')")
    }
    if (!text.match(/brooklyn|manhattan|queens|bronx/i)) {
      suggestions.push("Add preferred neighborhoods (e.g., 'in Brooklyn')")
    }
    if (!text.match(/gym|parking|laundry|pool/i)) {
      suggestions.push("Mention important amenities (e.g., 'with gym')")
    }

    setSuggestions(suggestions.slice(0, 2))
  }

  const handleVoiceToggle = () => {
    setIsListening(!isListening)

    if (!isListening) {
      // Start voice recognition
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
        const recognition = new SpeechRecognition()

        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "en-US"

        recognition.onresult = (event) => {
          let transcript = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript
          }
          setQuery(transcript)
        }

        recognition.onerror = () => {
          setIsListening(false)
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognition.start()
      }
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsProcessing(true)

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          criteria: parsedCriteria,
          timestamp: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        // Navigate to results page with session ID
        window.location.href = `/results/${result.sessionId}`
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const exampleQueries = [
    "2-bedroom apartment in Brooklyn under $3000 with a gym and pet-friendly",
    "Modern studio in Manhattan near subway, good natural light, under $2500",
    "Family-friendly 3BR in Queens with parking and good schools nearby",
  ]

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Describe Your Dream Apartment
        </CardTitle>
        <CardDescription>
          Tell us what you're looking for in natural language. Our AI will extract the key details automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          <Textarea
            placeholder="I'm looking for a 2-bedroom apartment in Brooklyn with good natural light, near the subway, pet-friendly, with a gym or fitness center nearby, under $3000/month..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[120px] pr-12 resize-none"
          />
          <Button variant="ghost" size="sm" className="absolute top-3 right-3" onClick={handleVoiceToggle}>
            {isListening ? (
              <MicOff className="w-4 h-4 text-destructive" />
            ) : (
              <Mic className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {isListening && (
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <span>Listening...</span>
          </div>
        )}

        {Object.keys(parsedCriteria).length > 0 && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Detected Criteria
            </h4>
            <div className="flex flex-wrap gap-2">
              {parsedCriteria.bedrooms && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  {parsedCriteria.bedrooms} bedroom{parsedCriteria.bedrooms > 1 ? "s" : ""}
                </Badge>
              )}
              {parsedCriteria.bathrooms && (
                <Badge variant="secondary">
                  {parsedCriteria.bathrooms} bath{parsedCriteria.bathrooms > 1 ? "s" : ""}
                </Badge>
              )}
              {parsedCriteria.maxRent && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Under ${parsedCriteria.maxRent.toLocaleString()}
                </Badge>
              )}
              {parsedCriteria.neighborhoods?.map((neighborhood) => (
                <Badge key={neighborhood} variant="secondary" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {neighborhood}
                </Badge>
              ))}
              {parsedCriteria.amenities?.map((amenity) => (
                <Badge key={amenity} variant="outline">
                  {amenity}
                </Badge>
              ))}
              {parsedCriteria.petFriendly && <Badge variant="outline">Pet Friendly</Badge>}
              {parsedCriteria.commute && <Badge variant="outline">{parsedCriteria.commute}</Badge>}
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-2 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <p className="text-sm font-medium text-accent-foreground">💡 Suggestions to improve your search:</p>
            {suggestions.map((suggestion, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                • {suggestion}
              </p>
            ))}
          </div>
        )}

        <Button onClick={handleSearch} disabled={!query.trim() || isProcessing} className="w-full" size="lg">
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
              AI is researching apartments...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Find My Perfect Apartment
            </>
          )}
        </Button>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Try these examples:</p>
          <div className="space-y-2">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                onClick={() => setQuery(example)}
                className="text-left text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted/50 w-full"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
