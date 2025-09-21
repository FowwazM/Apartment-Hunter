// Test MongoDB Atlas Connection with Multiple Approaches
require('dotenv').config({ path: '../.env.local' })

const { MongoClient } = require('mongodb')
const dns = require('dns')
const util = require('util')

const MONGODB_URI = process.env.MONGODB_URI

async function testConnection() {
  console.log('=== MongoDB Atlas Connection Test ===\n')
  
  if (!MONGODB_URI) {
    console.log('❌ No MONGODB_URI environment variable found')
    return
  }

  console.log('1. Testing DNS resolution...')
  try {
    const hostname = MONGODB_URI.match(/mongodb\+srv:\/\/[^:]+:[^@]+@([^\/\?]+)/)?.[1]
    console.log(`   Hostname: ${hostname}`)
    
    if (hostname) {
      const addresses = await util.promisify(dns.resolve4)(hostname)
      console.log('✅ DNS resolved successfully to:', addresses)
    }
  } catch (error) {
    console.log('❌ DNS resolution failed:', error.message)
    console.log('\n🔍 Possible solutions:')
    console.log('   - Check if the MongoDB Atlas cluster exists')
    console.log('   - Verify the connection string is correct')
    console.log('   - Check if the cluster is paused/deleted')
    console.log('   - Try generating a new connection string from Atlas')
    return
  }

  console.log('\n2. Testing MongoDB connection...')
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Shorter timeout for testing
    connectTimeoutMS: 5000,
  })

  try {
    await client.connect()
    console.log('✅ Successfully connected to MongoDB Atlas!')
    
    // Test database access
    const admin = client.db().admin()
    const databases = await admin.listDatabases()
    console.log('✅ Database access confirmed')
    console.log('   Available databases:', databases.databases.map(db => db.name).join(', '))
    
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message)
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔍 Authentication issue:')
      console.log('   - Check username/password in connection string')
      console.log('   - Verify database user exists in Atlas')
    } else if (error.message.includes('Server selection timed out')) {
      console.log('\n🔍 Network/Access issue:')
      console.log('   - Add your IP address to Atlas Network Access whitelist')
      console.log('   - Check if cluster is paused')
      console.log('   - Verify network connectivity')
    }
  } finally {
    await client.close()
  }
}

testConnection().catch(console.error)