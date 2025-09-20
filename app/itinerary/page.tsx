import { TourItinerary } from "@/components/tour-itinerary"
import { Header } from "@/components/header"

export default function ItineraryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <TourItinerary />
      </main>
    </div>
  )
}
