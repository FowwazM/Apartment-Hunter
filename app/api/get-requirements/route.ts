import { NextRequest, NextResponse } from 'next/server'
import Cerebras from '@cerebras/cerebras_cloud_sdk'

const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const completionCreateResponse = await cerebras.chat.completions.create({
      messages: [
        {
          "role": "system",
          "content": "You are an AI agent designed to take a request to find an apartment and condense it into key criteria the user is searching for. You will output your criteria as a JSON dictionary. Each dictionary would have a key, which is the type of requirement, and a value, whose datatype depends on the key. Do not include null or none values values. The possible keys are:\n1. bedrooms (number)\n2. bathrooms (number)\n3. maxRent (number)\n4. neighborhoods (String[])\n5. amenities (String[])\n6. petFriendly (boolean)\n7. moveInDate (String)\n8. commute (String)\n9. otherPreferences (String[])\n\nDo not include any other text, and do not make ANY assumptions about the user's intent."
        },
        {
          "role": "user",
          "content": String(text)
        }
      ],
      model: process.env.CEREBRAS_MODEL,
      stream: false,
      max_completion_tokens: 2048,
      temperature: 0,
      top_p: 1
    })

    const responseText = completionCreateResponse.choices[0]?.message?.content || '{}'
    
    try {
      const parsedCriteria = JSON.parse(responseText)
      return NextResponse.json({ criteria: parsedCriteria })
    } catch (parseError) {
      console.error('Failed to parse Cerebras response:', responseText)
      return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 })
    }

  } catch (error) {
    console.error('Error calling Cerebras API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
