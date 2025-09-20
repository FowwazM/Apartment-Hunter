import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import Link from "next/link"

export function Header() {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ApartmentAI</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Search
            </Link>
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/itinerary" className="text-muted-foreground hover:text-foreground transition-colors">
              Itinerary
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
            <Button size="sm">Get Started</Button>
          </div>
        </div>
      </div>
    </header>
  )
}
