"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InteractiveMap } from "@/components/interactive-map";
import { Phone } from "lucide-react";

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
  score: number;
  ranking: number;
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
    score: 95,
    ranking: 1,
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
    score: 85,
    ranking: 2,
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
    score: 90,
    ranking: 3,
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
    score: 87,
    ranking: 4,
  },
];

export function SearchResults({ sessionId }: SearchResultsProps) {
  const [results, setResults] = useState<PropertyResult[]>(dummyProperties);
  const [selectedProperty, setSelectedProperty] = useState<string>("");

  const handlePropertySelect = (propertyId: string) => {
    setSelectedProperty(propertyId);
  };

  const handleCall = (property: PropertyResult) => {
    console.log(
      `Initiating call to ${property.name} at ${property.address}...`
    );
    // TODO: Integrate with voice agent API or component
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Your Top Apartment Matches</h1>
        <p className="text-muted-foreground">
          Found {results.length} apartments that match your criteria
        </p>
      </div>

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
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card's onClick from firing again
                          handleCall(property);
                        }}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call Now
                      </Button>
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
    </div>
  );
}
