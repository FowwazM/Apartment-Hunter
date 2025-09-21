// MongoDB Collection Setup Script
// Run this script to initialize the database with sample data

// Load environment variables
require('dotenv').config({ path: '../.env.local' })

const { MongoClient, ServerApiVersion } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI
const DATABASE_NAME = "apartment-tours"

async function setupCollections() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect()
    const db = client.db(DATABASE_NAME)

    await db.command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // Create tours collection with sample data
    const toursCollection = db.collection("tours")

    // Clear existing data
    await toursCollection.deleteMany({})

    // Insert sample tours
    const sampleTours = [
      {
        propertyName: "Modern Heights",
        address: "123 Oak St, Brooklyn, NY",
        date: "2024-01-20",
        time: "2:00 PM",
        status: "scheduled",
        contact: {
          name: "Sarah Johnson",
          phone: "(555) 123-4567",
          email: "sarah@modernheights.com",
        },
        notes: "Ask about parking availability",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        propertyName: "Urban Plaza",
        address: "456 Main Ave, Manhattan, NY",
        date: "2024-01-21",
        time: "11:00 AM",
        status: "confirmed",
        contact: {
          name: "Mike Chen",
          phone: "(555) 987-6543",
          email: "mike@urbanplaza.com",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        propertyName: "Garden Court",
        address: "789 Park Rd, Queens, NY",
        date: "2024-01-18",
        time: "3:30 PM",
        status: "completed",
        contact: {
          name: "Lisa Wong",
          phone: "(555) 456-7890",
          email: "lisa@gardencourt.com",
        },
        rating: 4,
        notes: "Great property with excellent amenities",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const result = await toursCollection.insertMany(sampleTours)
    console.log(`Inserted ${result.insertedCount} sample tours`)

    // Create indexes for better performance
    await toursCollection.createIndex({ status: 1 })
    await toursCollection.createIndex({ date: 1 })
    await toursCollection.createIndex({ createdAt: -1 })

    console.log("Created database indexes")
    console.log("MongoDB setup completed successfully!")
  } catch (error) {
    console.error("Error setting up MongoDB:", error)
  } finally {
    await client.close()
  }
}

setupCollections()