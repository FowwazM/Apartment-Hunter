/**
 * Test script for real-time progress tracking
 * This script tests both the research API and status polling
 */

import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
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
            const value = valueParts.join('=').replace(/^["']|["']$/g, '')
            process.env[key.trim()] = value.trim()
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading .env.local:', error)
  }
}

loadEnvFile()

async function testProgressTracking() {
  console.log('🔍 Testing Real-Time Progress Tracking...\n')

  const sessionId = `test-progress-${Date.now()}`
  const baseUrl = 'http://localhost:3000'

  // Test data
  const testCriteria = {
    bedrooms: 2,
    maxRent: 3000,
    neighborhoods: ["Brooklyn", "Manhattan"],
    amenities: ["gym", "parking"],
    petFriendly: true
  }

  try {
    console.log(`📊 Starting research with session ID: ${sessionId}`)
    console.log('Criteria:', JSON.stringify(testCriteria, null, 2))
    console.log('')

    // Start the research (don't await - we want to poll status while it runs)
    const researchPromise = fetch(`${baseUrl}/api/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        criteria: testCriteria
      })
    })

    // Poll status every 2 seconds
    let completed = false
    let pollCount = 0
    const maxPolls = 60 // Max 5 minutes of polling

    while (!completed && pollCount < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      
      try {
        const statusResponse = await fetch(`${baseUrl}/api/research/status/${sessionId}`)
        const statusData = await statusResponse.json()

        console.log(`📈 Poll ${pollCount + 1}: ${statusData.progress}% - ${statusData.message}`)
        
        if (statusData.estimatedTimeRemaining) {
          console.log(`   ⏱️  ETA: ${statusData.estimatedTimeRemaining}`)
        }

        if (statusData.status === 'completed' || statusData.status === 'error') {
          completed = true
          console.log(`\n✅ Research ${statusData.status}!`)
          
          if (statusData.error) {
            console.log(`❌ Error: ${statusData.error}`)
          }
        }

      } catch (statusError) {
        console.error('Status poll error:', statusError)
      }

      pollCount++
    }

    // Get final research results
    try {
      const researchResult = await researchPromise
      const resultData = await researchResult.json()

      if (resultData.results) {
        console.log(`\n🏠 Found ${resultData.results.length} properties:`)
        resultData.results.slice(0, 3).forEach((prop: any, i: number) => {
          console.log(`   ${i + 1}. ${prop.name} - $${prop.rent}/month (Score: ${prop.score})`)
        })
      }

      if (resultData.sessionInfo) {
        console.log(`\n📊 Session Stats:`)
        console.log(`   Total Steps: ${resultData.sessionInfo.totalSteps}`)
        console.log(`   Started: ${resultData.sessionInfo.startedAt}`)
        console.log(`   Completed: ${resultData.sessionInfo.completedAt}`)
      }

    } catch (researchError) {
      console.error('Research completion error:', researchError)
    }

  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Check if development server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/research/status/test', {
      method: 'GET'
    })
    return response.status !== 0
  } catch {
    return false
  }
}

async function main() {
  const serverRunning = await checkServer()
  
  if (!serverRunning) {
    console.log('❌ Development server not running!')
    console.log('Please start the server first: npm run dev')
    console.log('Then run this test: npx tsx scripts/test-progress.ts')
    process.exit(1)
  }

  await testProgressTracking()
  console.log('\n🎉 Progress tracking test completed!')
}

main().catch(console.error)