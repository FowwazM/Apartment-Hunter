"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, DollarSign, Home, Maximize2, Minimize2 } from "lucide-react"

interface PropertyMarker {
  id: string
  name: string
  address: string
  coordinates: { lat: number; lng: number }
  bedrooms: number
  bathrooms: number
  rent: number
  score: number
  ranking: number
  amenities: string[]
  photos: string[]
  availableDate: string
}

interface InteractiveMapProps {
  properties: PropertyMarker[]
  selectedProperty?: string
  onPropertySelect: (propertyId: string) => void
  className?: string
}

export function InteractiveMap({ properties, selectedProperty, onPropertySelect, className }: InteractiveMapProps) {
  const [mapBounds, setMapBounds] = useState({ minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null)

  useEffect(() => {
    if (properties.length > 0) {
      const lats = properties.map((p) => p.coordinates.lat)
      const lngs = properties.map((p) => p.coordinates.lng)
      setMapBounds({
        minLat: Math.min(...lats) - 0.01,
        maxLat: Math.max(...lats) + 0.01,
        minLng: Math.min(...lngs) - 0.01,
        maxLng: Math.max(...lngs) + 0.01,
      })
    }
  }, [properties])

  const normalizeCoordinate = (value: number, min: number, max: number, dimension: number) => {
    return ((value - min) / (max - min)) * dimension
  }

  const getMarkerPosition = (property: PropertyMarker) => {
    const mapWidth = 800
    const mapHeight = 600

    const x = normalizeCoordinate(property.coordinates.lng, mapBounds.minLng, mapBounds.maxLng, mapWidth)
    const y = mapHeight - normalizeCoordinate(property.coordinates.lat, mapBounds.minLat, mapBounds.maxLat, mapHeight)

    return { x, y }
  }

  const getMarkerColor = (ranking: number) => {
    if (ranking <= 3) return "bg-green-500"
    if (ranking <= 6) return "bg-yellow-500"
    return "bg-orange-500"
  }

  const selectedProp = properties.find((p) => p.id === selectedProperty)

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Interactive Map View</h3>
        <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-background p-4" : ""}`}>
        {isFullscreen && (
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 z-10 bg-transparent"
            onClick={() => setIsFullscreen(false)}
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
        )}

        <Card className={`overflow-hidden ${isFullscreen ? "h-full" : "h-96"}`}>
          <CardContent className="p-0 relative h-full">
            {/* Map Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
              {/* Grid lines to simulate map */}
              <svg className="absolute inset-0 w-full h-full opacity-20">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Neighborhood labels */}
              <div className="absolute top-4 left-4 text-sm font-medium text-muted-foreground">Brooklyn</div>
              <div className="absolute top-4 right-4 text-sm font-medium text-muted-foreground">Manhattan</div>
              <div className="absolute bottom-4 left-4 text-sm font-medium text-muted-foreground">Queens</div>

              {/* Property markers */}
              {properties.map((property) => {
                const position = getMarkerPosition(property)
                const isSelected = selectedProperty === property.id
                const isHovered = hoveredProperty === property.id

                return (
                  <div
                    key={property.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200"
                    style={{
                      left: `${(position.x / 800) * 100}%`,
                      top: `${(position.y / 600) * 100}%`,
                      zIndex: isSelected || isHovered ? 20 : 10,
                    }}
                    onClick={() => onPropertySelect(property.id)}
                    onMouseEnter={() => setHoveredProperty(property.id)}
                    onMouseLeave={() => setHoveredProperty(null)}
                  >
                    {/* Marker */}
                    <div
                      className={`
                        w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold
                        ${getMarkerColor(property.ranking)}
                        ${isSelected ? "scale-125 ring-4 ring-primary/50" : ""}
                        ${isHovered ? "scale-110" : ""}
                        hover:scale-110 transition-transform
                      `}
                    >
                      {property.ranking}
                    </div>

                    {/* Hover tooltip */}
                    {(isHovered || isSelected) && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64">
                        <Card className="shadow-lg">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-sm">{property.name}</h4>
                                <p className="text-xs text-muted-foreground">{property.address}</p>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                #{property.ranking}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div className="flex items-center gap-1">
                                <Home className="w-3 h-3" />
                                {property.bedrooms}bd/{property.bathrooms}ba
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />${property.rent.toLocaleString()}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                <span className="text-xs font-medium">{property.score}/100</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Available: {new Date(property.availableDate).toLocaleDateString()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Map controls */}
            <div className="absolute top-4 left-4 space-y-2">
              <Button variant="outline" size="sm" className="bg-white/90">
                <MapPin className="w-4 h-4" />
              </Button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-white/90 rounded-lg p-3 space-y-2">
              <h4 className="text-xs font-semibold">Ranking</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span>Top 3</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span>4-6</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                  <span>7-10</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected property details */}
        {selectedProp && !isFullscreen && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{selectedProp.name}</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedProp.address}
                  </p>
                </div>
                <Badge variant="secondary">Rank #{selectedProp.ranking}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {selectedProp.bedrooms}/{selectedProp.bathrooms}
                  </div>
                  <div className="text-xs text-muted-foreground">Bed/Bath</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">${selectedProp.rent.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Monthly Rent</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    {selectedProp.score}
                  </div>
                  <div className="text-xs text-muted-foreground">AI Score</div>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Top Amenities:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedProp.amenities.slice(0, 4).map((amenity) => (
                    <Badge key={amenity} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  Schedule Tour
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  Call Property
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
