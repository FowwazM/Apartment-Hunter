/**
 * Test script for the real estate research engine
 * Run with: npx tsx scripts/test-research.ts
 * 
 * Make sure to set up your .env.local file first with:
 * EXA_API_KEY=your_key_here
 * GEMINI_API_KEY=your_key_here
 */

import * as fs from 'fs'
import * as path from 'path'
import { PropertyResearchEngine } from '../lib/property-research'

// Function to load environment variables from .env.local manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local')
  
  try {
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8')
      const lines = envFile.split('\n')
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=')
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '') // Remove quotes
            process.env[key.trim()] = value.trim()
          }
        }
      }
      console.log('✅ Loaded environment variables from .env.local')
    } else {
      console.log('⚠️  .env.local file not found')
    }
  } catch (error) {
    console.error('❌ Error loading .env.local:', error)
  }
}

// Load environment variables
loadEnvFile()

// Alternative: Try to load dotenv if available
try {
  const dotenv = require('dotenv')
  dotenv.config({ path: path.join(__dirname, '..', '.env.local') })
} catch (e) {
  // dotenv not available, that's fine - we loaded manually above
}

async function testResearch() {
  console.log('🏠 Testing Real Estate Research Engine...\n')

  // Debug environment variables
  console.log('🔍 Environment Check:')
  console.log(`EXA_API_KEY: ${process.env.EXA_API_KEY ? '✅ Found' : '❌ Missing'}`)
  console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Found' : '❌ Missing'}`)
  console.log('')

  if (!process.env.EXA_API_KEY || !process.env.GEMINI_API_KEY) {
    console.log('💡 Troubleshooting:')
    console.log('   1. Make sure .env.local exists in the project root')
    console.log('   2. Check that the file contains:')
    console.log('      EXA_API_KEY=your_actual_key_here')
    console.log('      GEMINI_API_KEY=your_actual_key_here')
    console.log('   3. Make sure there are no extra spaces or quotes')
    console.log('   4. Try running: cat .env.local (to verify file contents)')
    console.log('')
  }

  try {
    const engine = new PropertyResearchEngine()
    
    const testCriteria = {
      bedrooms: 2,
      maxRent: 3000,
      neighborhoods: ["Brooklyn", "Manhattan"],
      amenities: ["gym", "parking"],
      petFriendly: true,
      moveInDate: "2025-01-01"
    }

    console.log('Search Criteria:', JSON.stringify(testCriteria, null, 2))
    console.log('\n🔍 Starting property search...\n')

    const results = await engine.researchProperties(testCriteria, 'test-session-123')

    console.log(`\n✅ Search completed! Found ${results.length} properties`)
    
    if (results.length > 0) {
      console.log('\n📋 Results:')
      results.forEach((property, index) => {
        console.log(`\n${index + 1}. ${property.name}`)
        console.log(`   📍 ${property.address}`)
        console.log(`   💰 $${property.rent}/month`)
        console.log(`   🛏️ ${property.bedrooms}BR/${property.bathrooms}BA`)
        console.log(`   📐 ${property.squareFeet} sqft`)
        console.log(`   📊 Score: ${property.score}/100`)
        console.log(`   🏢 Source: ${property.source.name}`)
        console.log(`   Lat/Lng: (${property.latitude}, ${property.longitude})`)
        if (property.amenities.length > 0) {
          console.log(`   🎯 Amenities: ${property.amenities.slice(0, 3).join(', ')}`)
        }
      })
    } else {
      console.log('\n⚠️  No properties found. This could mean:')
      console.log('   - API keys not configured')
      console.log('   - Search criteria too restrictive')
      console.log('   - No matching listings available')
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    
    if (error instanceof Error && error.message.includes('API_KEY')) {
      console.log('\n💡 Setup required:')
      console.log('   1. Copy .env.example to .env.local')
      console.log('   2. Add your EXA_API_KEY from https://exa.ai')
      console.log('   3. Add your GEMINI_API_KEY from https://aistudio.google.com')
    }
  }
}

// Run the test
testResearch().then(() => {
  console.log('\n🎉 Test completed!')
  process.exit(0)
}).catch((error) => {
  console.error('\n💥 Unexpected error:', error)
  process.exit(1)
})