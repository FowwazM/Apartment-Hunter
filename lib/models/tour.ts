import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export interface Tour {
  _id?: ObjectId
  id?: string
  propertyName: string
  address: string
  date: string
  time: string
  status: "scheduled" | "confirmed" | "completed" | "cancelled"
  contact: {
    name: string
    phone: string
    email: string
  }
  confirmationCode: string
  notes?: string
  rating?: number
  callId?: string
  createdAt?: Date
  updatedAt?: Date
}

export class TourModel {
  private static collectionName = "tours"

  static async getAllTours(): Promise<Tour[]> {
    const db = await getDatabase()
    const tours = await db.collection<Tour>(this.collectionName).find({}).sort({ createdAt: -1 }).toArray()

    return tours.map((tour) => ({
      ...tour,
      id: tour._id?.toString(),
    }))
  }

  static async getTourById(id: string): Promise<Tour | null> {
    const db = await getDatabase()
    const tour = await db.collection<Tour>(this.collectionName).findOne({ _id: new ObjectId(id) })

    if (!tour) return null

    return {
      ...tour,
      id: tour._id?.toString(),
    }
  }

  static async createTour(tourData: Omit<Tour, "_id" | "id" | "createdAt" | "updatedAt">): Promise<Tour> {
    const db = await getDatabase()
    const now = new Date()

    const result = await db.collection<Tour>(this.collectionName).insertOne({
      ...tourData,
      createdAt: now,
      updatedAt: now,
    })

    const tour = await this.getTourById(result.insertedId.toString())
    if (!tour) throw new Error("Failed to create tour")

    return tour
  }

  static async updateTour(id: string, updates: Partial<Tour>): Promise<Tour | null> {
    const db = await getDatabase()

    const result = await db.collection<Tour>(this.collectionName).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) return null

    return await this.getTourById(id)
  }

  static async deleteTour(id: string): Promise<boolean> {
    const db = await getDatabase()
    const result = await db.collection<Tour>(this.collectionName).deleteOne({ _id: new ObjectId(id) })

    return result.deletedCount > 0
  }

  static async completeTour(id: string, rating: number, notes?: string): Promise<Tour | null> {
    return await this.updateTour(id, {
      status: "completed",
      rating,
      notes,
    })
  }
}
