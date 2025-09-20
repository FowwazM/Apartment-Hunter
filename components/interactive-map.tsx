"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  GoogleMap,
  Marker,
  useLoadScript,
  InfoWindow,
} from "@react-google-maps/api";

interface PropertyMarker {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  bedrooms?: number;
  bathrooms?: number;
  rent?: number;
  squareFeet?: number;
}

interface InteractiveMapProps {
  properties: PropertyMarker[];
  selectedProperty?: string;
  onPropertySelect: (propertyId: string) => void;
  className?: string;
}

export function InteractiveMap({
  properties,
  selectedProperty,
  onPropertySelect,
  className,
}: InteractiveMapProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GM_API_KEY || "",
    libraries: ["places"],
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  const center = useMemo(() => {
    if (properties.length > 0) {
      const lats = properties.map((p) => p.coordinates.lat);
      const lngs = properties.map((p) => p.coordinates.lng);
      return {
        lat: (Math.min(...lats) + Math.max(...lats)) / 2,
        lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      };
    }
    return { lat: 40.7128, lng: -74.006 }; // Default to NYC
  }, [properties]);

  useEffect(() => {
    if (selectedProperty) {
      const property = properties.find((p) => p.id === selectedProperty);
      if (property && mapRef.current) {
        mapRef.current.panTo(property.coordinates);
        mapRef.current.setZoom(15);
        setActiveMarker(property.id);
      }
    }
  }, [selectedProperty, properties]);

  const handleMarkerClick = (propertyId: string) => {
    setActiveMarker(propertyId);
    onPropertySelect(propertyId);
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    styles: [
      {
        featureType: "poi.business",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "transit",
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }],
      },
    ],
  };

  if (!isLoaded) {
    return <div>Loading map...</div>;
  }

  return (
    <div className={`h-full w-full ${className}`}>
      <GoogleMap
        zoom={12}
        center={center}
        mapContainerStyle={{ width: "100%", height: "100%" }}
        onLoad={onLoad}
        options={mapOptions}
      >
        {properties.map((property) => (
          <Marker
            key={property.id}
            position={property.coordinates}
            onClick={() => handleMarkerClick(property.id)}
            icon={{
              url:
                selectedProperty === property.id
                  ? "/selected-marker.svg"
                  : "/default-marker.svg",
              scaledSize:
                selectedProperty === property.id
                  ? new google.maps.Size(40, 40)
                  : new google.maps.Size(30, 30),
            }}
            zIndex={selectedProperty === property.id ? 1000 : 1}
          >
            {activeMarker === property.id && (
              <InfoWindow
                position={property.coordinates}
                onCloseClick={() => setActiveMarker(null)}
              >
                <div className="p-1">
                  <h4 className="font-semibold">{property.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {property.address}
                  </p>
                  <div className="text-sm mt-2">
                    {property.bedrooms} Beds • {property.bathrooms} Baths •{" "}
                    {property.squareFeet
                      ? `${property.squareFeet} sq ft`
                      : "N/A"}
                  </div>
                  <div className="text-lg font-bold mt-1">
                    ${property.rent?.toLocaleString() ?? "N/A"}/mo
                  </div>
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}
      </GoogleMap>
    </div>
  );
}
