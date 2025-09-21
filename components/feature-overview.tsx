import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, MapPin, Phone, Calendar, Star, Shield } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Research",
    description:
      "Our AI analyzes thousands of listings, reviews, and neighborhood data to find apartments that match your exact preferences.",
  },
  {
    icon: MapPin,
    title: "Interactive Map Results",
    description:
      "See your top 10 matches on an interactive map with detailed scoring, photos, and neighborhood insights.",
  },
  {
    icon: Phone,
    title: "Voice Agent Calls",
    description:
      "Our AI voice agent calls properties for you, asks your specific questions, and books tours automatically.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Intelligent scheduling system that helps you organize and manage your apartment viewing appointments efficiently.",
  },
  {
    icon: Star,
    title: "Personalized Scoring",
    description:
      "Each property gets a custom score based on your priorities, commute, budget, and lifestyle preferences.",
  },
  {
    icon: Shield,
    title: "Verified Information",
    description: "All property details are verified through multiple sources and real-time calls to ensure accuracy.",
  },
]

export function FeatureOverview() {
  return (
    <section className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">How It Works</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Our AI-powered platform handles the entire apartment hunting process, from research to booking tours.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="h-full">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
