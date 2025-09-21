import { type NextRequest, NextResponse } from "next/server"
import { TourModel } from "@/lib/models/tour"

export async function GET() {
  try {
    const tours = await TourModel.getAllTours()
    return NextResponse.json(tours)
  } catch (error) {
    console.error("Error fetching tours:", error)
    return NextResponse.json({ error: "Failed to fetch tours" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tourData = await request.json()
    const tour = await TourModel.createTour(tourData)
    return NextResponse.json(tour, { status: 201 })
  } catch (error) {
    console.error("Error creating tour:", error)
    return NextResponse.json({ error: "Failed to create tour" }, { status: 500 })
  }
}