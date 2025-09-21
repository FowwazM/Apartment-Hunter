import { type NextRequest, NextResponse } from "next/server"
import { getSession } from '@auth0/nextjs-auth0'
import { tourModel, TourModel } from "@/lib/models/tour"

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.sub
    console.log("Fetching tours for userId:", userId) // Debug log
    const tours = await tourModel.getAllTours(userId)
    console.log("Tours returned from model:", tours) // Debug log
    return NextResponse.json(tours)
  } catch (error) {
    console.error("Error fetching tours:", error)
    return NextResponse.json({ error: "Failed to fetch tours" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.sub
    const tourData = await request.json()
    
    console.log("POST /api/tours - userId:", userId) // Debug log
    console.log("POST /api/tours - tourData:", tourData) // Debug log
    
    // Transform the data if needed and add user_id
    const tourInsert = TourModel.transformFromTourWithContact({
      ...tourData,
      user_id: userId
    })
    
    console.log("POST /api/tours - tourInsert after transform:", tourInsert) // Debug log
    
    const tour = await tourModel.createTour(tourInsert)
    return NextResponse.json(tour, { status: 201 })
  } catch (error) {
    console.error("Error creating tour:", error)
    return NextResponse.json({ error: "Failed to create tour" }, { status: 500 })
  }
}