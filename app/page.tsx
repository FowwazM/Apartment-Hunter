import { NaturalLanguageIntake } from "@/components/natural-language-intake"
import { Header } from "@/components/header"
import { FeatureOverview } from "@/components/feature-overview"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-balance">
              Find Your Perfect Apartment with <span className="text-primary">AI-Powered</span> Search
            </h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Describe your ideal home in natural language. Our AI will research the market, find the best matches, and
              even call properties to book tours for you.
            </p>
          </section>

          {/* Natural Language Intake */}
          <NaturalLanguageIntake />

          {/* Feature Overview */}
          <FeatureOverview />
        </div>
      </main>
    </div>
  )
}