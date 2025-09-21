import { type NextRequest, NextResponse } from "next/server"
import { TourModel } from "@/lib/models/tour"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { rating, notes } = await request.json()

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const tour = await TourModel.completeTour(params.id, rating, notes)
    if (!tour) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 })
    }

    return NextResponse.json(tour)
  } catch (error) {
    console.error("Error completing tour:", error)
    return NextResponse.json({ error: "Failed to complete tour" }, { status: 500 })
  }
}