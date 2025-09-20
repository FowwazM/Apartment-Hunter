import { SearchResults } from "@/components/search-results"
import { Header } from "@/components/header"

interface ResultsPageProps {
  params: {
    sessionId: string
  }
}

export default function ResultsPage({ params }: ResultsPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <SearchResults sessionId={params.sessionId} />
      </main>
    </div>
  )
}
