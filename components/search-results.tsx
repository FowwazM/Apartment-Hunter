"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InteractiveMap } from "@/components/interactive-map";
import { VoiceAgent } from "@/components/voice-agent";
import { CallResults } from "@/components/call-results";
import { Phone, Calendar, Star, DollarSign, Home, Wifi, List, Map, MapPin } from "lucide-react";

interface SearchResultsProps {
  sessionId: string;
}

interface PropertyResult {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  bedrooms: number;
  bathrooms: number;
  rent: number;
  squareFeet?: number;
  availableDate: string;
  amenities: string[];
  photos: string[];
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  score: number;
  scoreBreakdown: {
    budget: number;
    location: number;
    amenities: number;
    size: number;
    availability: number;
    overall: number;
  };
  ranking: number;
  source: string;
}

// Dummy data for testing
const dummyProperties: PropertyResult[] = [
  {
    id: "1",
    name: "The Murray Hill",
    address: "150 E 34th St, New York, NY 10016",
    coordinates: { lat: 40.7459, lng: -73.9795 },
    bedrooms: 2,
    bathrooms: 2,
    rent: 3500,
    squareFeet: 1200,
    availableDate: "2025-09-30",
    amenities: ["Gym", "Pool", "Parking"],
    photos: ["/placeholder.svg"],
    contact: {
      phone: "(212) 555-0123",
      email: "info@murrayhill.com",
      website: "https://murrayhill.com"
    },
    score: 95,
    scoreBreakdown: {
      budget: 85,
      location: 95,
      amenities: 90,
      size: 88,
      availability: 100,
      overall: 95
    },
    ranking: 1,
    source: "StreetEasy"
  },
  {
    id: "2",
    name: "The Parker",
    address: "104-20 Queens Blvd, Forest Hills, NY 11375",
    coordinates: { lat: 40.7213, lng: -73.8443 },
    bedrooms: 1,
    bathrooms: 1,
    rent: 2000,
    squareFeet: 600,
    availableDate: "2025-10-15",
    amenities: ["Laundry", "Pet Friendly"],
    photos: ["/placeholder.svg"],
    contact: {
      phone: "(718) 555-0456",
      email: "leasing@parker.com"
    },
    score: 85,
    scoreBreakdown: {
      budget: 95,
      location: 80,
      amenities: 75,
      size: 70,
      availability: 90,
      overall: 85
    },
    ranking: 2,
    source: "Zillow"
  },
  {
    id: "3",
    name: "Atlantic Terminal",
    address: "789 Atlantic Ave, Brooklyn, NY 11238",
    coordinates: { lat: 40.682, lng: -73.972 },
    bedrooms: 3,
    bathrooms: 2,
    rent: 4000,
    squareFeet: 1500,
    availableDate: "2025-11-01",
    amenities: ["Rooftop Access", "Doorman"],
    photos: ["/placeholder.svg"],
    contact: {
      phone: "(718) 555-0789",
      email: "info@atlanticterminal.com",
      website: "https://atlanticterminal.com"
    },
    score: 90,
    scoreBreakdown: {
      budget: 80,
      location: 92,
      amenities: 95,
      size: 90,
      availability: 85,
      overall: 90
    },
    ranking: 3,
    source: "Apartments.com"
  },
  {
    id: "4",
    name: "Bronx Heights",
    address: "445 Gerard Ave, Bronx, NY 10451",
    coordinates: { lat: 40.8175706, lng: -74.0062755 },
    bedrooms: 4,
    bathrooms: 2.5,
    rent: 6000,
    squareFeet: 2000,
    availableDate: "2025-11-18",
    amenities: ["Rooftop Access", "Doorman"],
    photos: ["/placeholder.svg"],
    contact: {
      phone: "(718) 555-0999",
      email: "leasing@bronxheights.com"
    },
    score: 87,
    scoreBreakdown: {
      budget: 70,
      location: 85,
      amenities: 92,
      size: 95,
      availability: 88,
      overall: 87
    },
    ranking: 4,
    source: "RentHop"
  },
];

export function SearchResults({ sessionId }: SearchResultsProps) {
  const [results, setResults] = useState<PropertyResult[]>(dummyProperties);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [activeView, setActiveView] = useState<"list" | "map">("map");
  const [voiceAgentOpen, setVoiceAgentOpen] = useState(false);
  const [callResults, setCallResults] = useState<any>(null);
  const [activePropertyForCall, setActivePropertyForCall] = useState<PropertyResult | null>(null);
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);

  const loadGoogleScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if ((window as any).google?.accounts?.oauth2) {
        console.log("Google services already loaded");
        resolve();
        return;
      }

      // Check if script tag already exists
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        console.log("Google script already exists, waiting for it to load...");
        // Wait for existing script to load
        const checkLoaded = () => {
          if ((window as any).google?.accounts?.oauth2) {
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        setTimeout(checkLoaded, 100);
        return;
      }

      console.log("Loading Google Identity Services script...");
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log("Google script loaded, waiting for services to initialize...");
        // Google services need time to initialize after script load
        const checkServices = () => {
          if ((window as any).google?.accounts?.oauth2) {
            console.log("Google services ready!");
            resolve();
          } else {
            console.log("Still waiting for Google services...");
            setTimeout(checkServices, 200);
          }
        };
        // Start checking after a short delay
        setTimeout(checkServices, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if (!(window as any).google?.accounts?.oauth2) {
            reject(new Error('Google services failed to initialize within timeout period'));
          }
        }, 10000);
      };
      
      script.onerror = (error) => {
        console.error("Failed to load Google script:", error);
        reject(new Error('Failed to load Google Identity Services script'));
      };
      
      document.head.appendChild(script);
    });
  };

  // Preload Google script when component mounts
  useEffect(() => {
    const preloadGoogleScript = async () => {
      try {
        console.log("Preloading Google Identity Services...");
        await loadGoogleScript();
        setGoogleScriptLoaded(true);
        console.log("Google script preloaded successfully");
      } catch (error) {
        console.log("Failed to preload Google script:", error);
        setGoogleScriptLoaded(false);
      }
    };

    preloadGoogleScript();
  }, []);

  const handlePropertySelect = (propertyId: string) => {
    setSelectedProperty(propertyId);
  };

  const handleStartVoiceAgent = (property: PropertyResult) => {
    // Ensure the selected property matches before opening the dialog
    setSelectedProperty(property.id);
    setActivePropertyForCall(property);
    setCallResults(null);
    setVoiceAgentOpen(true);
  };

  const handleCallComplete = async (result: any) => {
    setCallResults(result);

    // If a tour was scheduled, save it to Supabase
    if (result.tourScheduled && result.tourDetails && activePropertyForCall) {
      try {
        const tourData = {
          property_name: activePropertyForCall.name,
          address: activePropertyForCall.address,
          date: result.tourDetails.date,
          time: result.tourDetails.time,
          status: 'scheduled',
          contact_name: result.tourDetails.contact || activePropertyForCall.name || 'Property Contact',
          contact_phone: activePropertyForCall.contact?.phone || 'Unknown',
          contact_email: activePropertyForCall.contact?.email || 'Unknown',
          confirmation_code: result.tourDetails.confirmationCode || `TOUR-${Date.now()}`,
          notes: `Voice agent call summary: ${result.summary}`,
          call_id: result.callId || null,
        }

        const response = await fetch("/api/tours", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tourData),
        })
        
        if (!response.ok) {
          console.error("Failed to save tour to database")
        } else {
          console.log("Tour successfully saved to database")
        }
      } catch (error) {
        console.error("Error saving tour to database:", error)
      }
    }
  };

  const handleScheduleAnother = () => {
    setCallResults(null);
  };

  const handleViewTour = () => {
    setVoiceAgentOpen(false);
    // Navigate to tour dashboard
  };

  const handleGoogleCalendarIntegration = async () => {
    try {
      setIsLoadingCalendar(true);
      console.log("Initiating Google Calendar integration...");
     
      // Check if we have a valid client ID
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        throw new Error('Google Client ID not found in environment variables');
      }

      console.log("Client ID found:", clientId.substring(0, 10) + '...');

      // Load Google Identity Services if not already loaded
      console.log("Checking if Google services are available...");
      if (!(window as any).google?.accounts?.oauth2) {
        console.log("Loading Google Identity Services...");
        await loadGoogleScript();
      } else {
        console.log("Google services already available");
      }

      // Double check services are ready
      if (!(window as any).google?.accounts?.oauth2) {
        throw new Error('Google Identity Services are not available after loading');
      }

      console.log("Creating OAuth2 token client...");
      
      // Use Google's new Identity Services
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        callback: async (response: any) => {
          console.log("OAuth callback received:", response);
          
          if (response.error) {
            console.error('OAuth error:', response.error);
            alert('Failed to authenticate: ' + response.error);
            setIsLoadingCalendar(false);
            return;
          }

          if (response.access_token) {
            console.log('Got access token, fetching calendar events...');
            try {
              await fetchCalendarEvents(response.access_token);
              setIsGoogleCalendarConnected(true);
              console.log("Google Calendar connected successfully!");
            } catch (error: any) {
              console.error('Failed to fetch calendar events:', error);
              alert('Failed to fetch calendar events: ' + error.message);
            }
          } else {
            console.error('No access token received from Google');
            alert('No access token received from Google');
          }
          setIsLoadingCalendar(false);
        },
      });

      console.log("OAuth client created, requesting access token...");
      // Request access token
      client.requestAccessToken();

    } catch (error: any) {
      console.error("Failed to connect Google Calendar:", error);
      alert('Failed to connect to Google Calendar: ' + (error?.message || 'Unknown error'));
      setIsLoadingCalendar(false);
    }
  };

  const fetchCalendarEvents = async (accessToken: string) => {
    try {
      console.log("Starting to fetch calendar events...");
      
      // Get date range for next week
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
     
      console.log("Fetching calendar list...");
      // First, get list of calendars
      const calendarsResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
     
      if (!calendarsResponse.ok) {
        const errorText = await calendarsResponse.text();
        console.error('Calendar list fetch failed:', calendarsResponse.status, errorText);
        throw new Error(`Failed to fetch calendars: ${calendarsResponse.status} ${errorText}`);
      }
     
      const calendarsData = await calendarsResponse.json();
      console.log(`Found ${calendarsData.items?.length || 0} calendars`);
      
      if (!calendarsData.items || calendarsData.items.length === 0) {
        console.log("No calendars found");
        setCalendarEvents([]);
        return;
      }
      
      const allEvents: any[] = [];
     
      // Fetch events from all calendars (limit to first 3 to avoid rate limits)
      const calendarsToCheck = calendarsData.items.slice(0, 3);
      
      for (const calendar of calendarsToCheck) {
        try {
          console.log(`Fetching events from calendar: ${calendar.summary}`);
          
          const eventsResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?` +
            `timeMin=${now.toISOString()}&` +
            `timeMax=${nextWeek.toISOString()}&` +
            `singleEvents=true&` +
            `orderBy=startTime&` +
            `maxResults=10`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
         
          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            console.log(`Found ${eventsData.items?.length || 0} events in ${calendar.summary}`);
            
            if (eventsData.items && eventsData.items.length > 0) {
              const calendarEvents = eventsData.items.map((event: any) => ({
                ...event,
                calendarName: calendar.summary,
                calendarColor: calendar.backgroundColor || '#4285f4'
              }));
              allEvents.push(...calendarEvents);
            }
          } else {
            const errorText = await eventsResponse.text();
            console.warn(`Failed to fetch events from calendar ${calendar.summary}:`, eventsResponse.status, errorText);
          }
        } catch (error) {
          console.error(`Failed to fetch events from calendar ${calendar.summary}:`, error);
        }
      }
     
      // Sort events by start time
      allEvents.sort((a, b) => {
        const aStart = new Date(a.start?.dateTime || a.start?.date);
        const bStart = new Date(b.start?.dateTime || b.start?.date);
        return aStart.getTime() - bStart.getTime();
      });
     
      setCalendarEvents(allEvents);
      console.log(`Successfully fetched ${allEvents.length} total events from ${calendarsToCheck.length} calendars`);
     
    } catch (error: any) {
      console.error('Failed to fetch calendar events:', error);
      throw new Error(`Calendar fetch error: ${error.message}`);
    }
  };

  const handleCall = async (property: PropertyResult) => {
    console.log(`Initiating call to ${property.name} at ${property.address}...`);

    try {
      const res = await fetch("/api/make-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingName: property.name,
          listingAddress: property.address,
          userQuestions: [
            "Is parking included?",
            "Any pet fees?",
          ],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Call failed:", data);
        alert("Call failed. Check console for details.");
        return;
      }

      if (data.timedOut) {
        // Long calls might hit the 5m timeout; decide how to handle
        alert(`Still ${data.status}. Timed out waiting — try again or poll a status route.`);
        return;
      }

      // Success: call ended — you have summary + transcript
      console.log("Call complete:", data);
      alert("Call ended — summary and transcript received. Check console.");
      // e.g., setState(data.summary, data.transcript) to show in UI
    } catch (err) {
      console.error("Error starting/waiting for call:", err);
      alert("Something went wrong.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Your Top Apartment Matches</h1>
        <p className="text-muted-foreground">
          Found {results.length} apartments that match your criteria • Session: {sessionId.slice(0, 8)}
        </p>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "list" | "map")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="w-4 h-4" />
            Map View
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-3">
                {results.map((property) => (
                  <Card
                    key={property.id}
                    className={`cursor-pointer transition-all ${
                      selectedProperty === property.id
                        ? "border-primary shadow-lg"
                        : "hover:shadow-md"
                    }`}
                    onClick={() => handlePropertySelect(property.id)}
                  >
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold">{property.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {property.address}
                          </p>
                        </div>
                        <div className="text-right pl-2">
                          <p className="font-semibold">
                            ${property.rent?.toLocaleString() ?? "N/A"}/mo
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-x-4 text-sm text-muted-foreground mb-3">
                        <span>{property.bedrooms} beds</span>
                        <span>{property.bathrooms} baths</span>
                        <span>
                          {property.squareFeet
                            ? `${property.squareFeet.toLocaleString()} sqft`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-end h-9">
                        {selectedProperty === property.id && (
                          <Dialog open={voiceAgentOpen} onOpenChange={setVoiceAgentOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartVoiceAgent(property);
                                }}
                              >
                                <Phone className="w-4 h-4 mr-2" />
                                Call Now
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>AI Voice Agent</DialogTitle>
                                <DialogDescription>
                                  Let our AI agent call the property and handle the conversation for you
                                </DialogDescription>
                              </DialogHeader>

                              {!isGoogleCalendarConnected && (
                                <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-dashed">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium mb-1">Connect Google Calendar</h4>
                                      <p className="text-sm text-muted-foreground">
                                        Sync tour schedules directly to your calendar for easy management
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Client ID: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✓ Configured' : '✗ Missing'}
                                        <br />
                                        Google Services: {googleScriptLoaded ? '✓ Loaded' : '⏳ Loading...'}
                                      </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleGoogleCalendarIntegration()}
                                        disabled={isLoadingCalendar || !googleScriptLoaded}
                                      >
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {isLoadingCalendar ? "Connecting..." : !googleScriptLoaded ? "Loading..." : "Connect"}
                                      </Button>
                                      {isLoadingCalendar && (
                                        <p className="text-xs text-muted-foreground text-center">
                                          Loading Google services...
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {isGoogleCalendarConnected && calendarEvents.length > 0 && (
                                <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Calendar className="w-4 h-4 text-green-600" />
                                    <h4 className="font-medium text-green-800">
                                      Calendar Connected - Next Week's Schedule
                                    </h4>
                                  </div>
                                  <div className="max-h-32 overflow-y-auto space-y-2">
                                    {calendarEvents.slice(0, 5).map((event, index) => (
                                      <div key={index} className="flex items-center gap-2 text-sm">
                                        <div
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: event.calendarColor }}
                                        />
                                        <span className="font-medium">
                                          {new Date(event.start?.dateTime || event.start?.date).toLocaleDateString()}
                                        </span>
                                        <span className="text-muted-foreground">
                                          {event.summary || 'No title'}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-auto">
                                          {event.calendarName}
                                        </span>
                                      </div>
                                    ))}
                                    {calendarEvents.length > 5 && (
                                      <p className="text-xs text-muted-foreground text-center pt-1">
                                        +{calendarEvents.length - 5} more events
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {activePropertyForCall && !callResults && (
                                <VoiceAgent
                                  property={{
                                    id: activePropertyForCall.id,
                                    name: activePropertyForCall.name,
                                    address: activePropertyForCall.address,
                                    contact: activePropertyForCall.contact,
                                  }}
                                  onCallComplete={handleCallComplete}
                                />
                              )}
                              {callResults && activePropertyForCall && (
                                <CallResults
                                  result={callResults}
                                  propertyName={activePropertyForCall.name}
                                  onScheduleAnother={handleScheduleAnother}
                                  onViewTour={handleViewTour}
                                />
                              )}
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            <div className="h-[70vh] rounded-lg overflow-hidden">
              <InteractiveMap
                properties={results}
                selectedProperty={selectedProperty}
                onPropertySelect={handlePropertySelect}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <div className="grid gap-6">
            {results.map((property) => (
              <Card
                key={property.id}
                className={`overflow-hidden cursor-pointer transition-all ${
                  selectedProperty === property.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handlePropertySelect(property.id)}
              >
                <div className="flex">
                  {/* Property Image */}
                  <div className="w-64 h-48 bg-muted flex-shrink-0">
                    <img
                      src={property.photos[0] || "/placeholder.svg"}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Property Details */}
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{property.name}</h3>
                          <Badge variant="secondary">#{property.ranking}</Badge>
                        </div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {property.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-semibold">{property.score}/100</span>
                        </div>
                        <p className="text-sm text-muted-foreground">AI Score</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {property.bedrooms} bed, {property.bathrooms} bath
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">${property.rent.toLocaleString()}/mo</span>
                      </div>
                      {property.squareFeet && (
                        <div className="flex items-center gap-2">
                          <Wifi className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{property.squareFeet} sq ft</span>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        Available: {new Date(property.availableDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Amenities:</p>
                      <div className="flex flex-wrap gap-1">
                        {property.amenities.slice(0, 6).map((amenity) => (
                          <Badge key={amenity} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {property.amenities.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{property.amenities.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Score Breakdown:</p>
                      <div className="grid grid-cols-5 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium">{property.scoreBreakdown.budget}</div>
                          <div className="text-muted-foreground">Budget</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{property.scoreBreakdown.location}</div>
                          <div className="text-muted-foreground">Location</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{property.scoreBreakdown.amenities}</div>
                          <div className="text-muted-foreground">Amenities</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{property.scoreBreakdown.size}</div>
                          <div className="text-muted-foreground">Size</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{property.scoreBreakdown.availability}</div>
                          <div className="text-muted-foreground">Available</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Dialog open={voiceAgentOpen} onOpenChange={setVoiceAgentOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleStartVoiceAgent(property)}>
                            <Phone className="w-4 h-4 mr-2" />
                            Call Property
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>AI Voice Agent</DialogTitle>
                            <DialogDescription>
                              Let our AI agent call the property and handle the conversation for you
                            </DialogDescription>
                          </DialogHeader>

                          {!isGoogleCalendarConnected && (
                            <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-dashed">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium mb-1">Connect Google Calendar</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Sync tour schedules directly to your calendar for easy management
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Client ID: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✓ Configured' : '✗ Missing'}
                                    <br />
                                    Google Services: {googleScriptLoaded ? '✓ Loaded' : '⏳ Loading...'}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleGoogleCalendarIntegration()}
                                    disabled={isLoadingCalendar || !googleScriptLoaded}
                                  >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {isLoadingCalendar ? "Connecting..." : !googleScriptLoaded ? "Loading..." : "Connect"}
                                  </Button>
                                  {isLoadingCalendar && (
                                    <p className="text-xs text-muted-foreground text-center">
                                      Loading Google services...
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {isGoogleCalendarConnected && calendarEvents.length > 0 && (
                            <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center gap-2 mb-3">
                                <Calendar className="w-4 h-4 text-green-600" />
                                <h4 className="font-medium text-green-800">
                                  Calendar Connected - Next Week's Schedule
                                </h4>
                              </div>
                              <div className="max-h-32 overflow-y-auto space-y-2">
                                {calendarEvents.slice(0, 5).map((event, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: event.calendarColor }}
                                    />
                                    <span className="font-medium">
                                      {new Date(event.start?.dateTime || event.start?.date).toLocaleDateString()}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {event.summary || 'No title'}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                      {event.calendarName}
                                    </span>
                                  </div>
                                ))}
                                {calendarEvents.length > 5 && (
                                  <p className="text-xs text-muted-foreground text-center pt-1">
                                    +{calendarEvents.length - 5} more events
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {activePropertyForCall && !callResults && (
                            <VoiceAgent
                              property={{
                                id: activePropertyForCall.id,
                                name: activePropertyForCall.name,
                                address: activePropertyForCall.address,
                                contact: activePropertyForCall.contact,
                              }}
                              onCallComplete={handleCallComplete}
                            />
                          )}
                          {callResults && activePropertyForCall && (
                            <CallResults
                              result={callResults}
                              propertyName={activePropertyForCall.name}
                              onScheduleAnother={handleScheduleAnother}
                              onViewTour={handleViewTour}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button size="sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Tour
                      </Button>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      Source: {property.source} • Contact: {property.contact.phone}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {results.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No matches found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or expanding your budget/location preferences.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
