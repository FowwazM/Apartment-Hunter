import { SchedulingDashboard } from "@/components/scheduling-dashboard"
import { Header } from "@/components/header"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <SchedulingDashboard />
      </main>
    </div>
  )
}
