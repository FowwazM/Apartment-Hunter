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
          "content": "You are an AI agent designed to take a request to find an apartment and create suggestions to make that request more specific. You will output your criteria as a JSON list. These should each be bullet point suggestions. Focus on the key details that are absolutely necessary to find a good apartment for the user, rather than extraneous information. Each element in the list should include only one suggestion. Do not include any bullet points or other formatting. Include no other text. Limit yourself to a maximum of 2 suggestions. Do not ask for clarification on what self-explanatory terms, like \"studio\", \"natural light\", \"good schools\" or \"modern\" mean to the user, and do not ask for any amenities that the user has not listed. Do not ask about implied meanings (for example, do NOT ask for what subway line they prefer, if they indicate they need a subway station). You must use a draft space to think through your suggestions before finalizing them in the final list. In this draft space, leave behind a trail of thought, explaining your reasoning, including why each suggestion is important. Example output format: \n {\"drafts\": \"...\", \"final\": [\"suggestion 1\", \"suggestion 2\", \"suggestion 3\"]}\n\nDo not include any other text, and do not make ANY assumptions about the user's intent. Make sure that this is valid JSON."
        },
        {
          "role": "user",
          "content": String(text)
        }
      ],
      model: 'llama-4-maverick-17b-128e-instruct',
      stream: false,
      max_completion_tokens: 2048,
      temperature: 0,
      top_p: 1
    })

    const responseText = completionCreateResponse.choices[0]?.message?.content || '[]'
    
    try {
      const suggestions = JSON.parse(responseText)
      console.log("Suggestions:", suggestions)
      return NextResponse.json({ suggestions: suggestions.final })
    } catch (parseError) {
      console.error('Failed to parse Cerebras response:', responseText)
      return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 })
    }

  } catch (error) {
    console.error('Error calling Cerebras API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
