import { Header } from "@/components/header"
import { SearchResults } from "@/components/search-results"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Directly render dummy-data-driven search results */}
        <SearchResults sessionId="dummy-session" />
      </main>
    </div>
  )
}
