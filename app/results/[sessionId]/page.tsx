import { SearchResultsWithProgress } from "@/components/search-results-with-progress"
import { Header } from "@/components/header"

interface ResultsPageProps {
  params: {
    sessionId: string
  }
  searchParams: {
    query?: string
    criteria?: string
  }
}

export default function ResultsPage({ params, searchParams }: ResultsPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <SearchResultsWithProgress 
          sessionId={params.sessionId} 
          query={searchParams.query}
          criteria={searchParams.criteria}
        />
      </main>
    </div>
  )
}
