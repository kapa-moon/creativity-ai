import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured',
          questions: [
            "What if this could____?",
            "How might a child____?"
          ]
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { chatHistory = [] } = body

    // Prepare context from chat history
    const recentMessages = chatHistory.slice(-6) // Last 6 messages for context
    const conversationContext = recentMessages
      .map((msg: { type: string; content: string }) => `${msg.type}: ${msg.content}`)
      .join('\n')

    // System prompt for generating creativity questions
    const systemPrompt = `You are a creativity coach specializing in quick, divergent thinking prompts.

Generate exactly 2 SHORT creativity questions that end with "____" for users to complete. Each question should be:

1. VERY SHORT (under 8 words including the blank)
2. Quick to spark diverse thinking
3. Based on creativity theories (AUT, SCAMPER, analogical thinking)
4. Ending with "____" for completion

Good examples:
- "What if this could____?"
- "How might a child____?"
- "What if it was tiny and____?"
- "If it was magical, it would____?"
- "A farmer might use it to____?"

BAD examples (too long):
- "How might this solve a problem that doesn't exist yet by____?"
- "What would happen if you combined this with something completely unrelated to____?"

Keep it SHORT and SNAPPY. Generate 2 quick prompts that end with "____"`

    const prompt = conversationContext 
      ? `Based on this conversation:\n${conversationContext}\n\nGenerate 2 SHORT creativity prompts (under 8 words each) that end with "____". Make them relevant when possible.`
      : `Generate 2 SHORT creativity prompts (under 8 words each) that end with "____" for quick divergent thinking.`

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.8, // Higher creativity
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      // Fallback questions if API fails
      return NextResponse.json({
        success: true,
        questions: [
          "What if this could____?",
          "How might a child____?"
        ]
      })
    }

    // Parse the response to extract questions
    const lines = response.split('\n').filter(line => line.trim().length > 0)
    const questions = lines
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
      .filter(line => line.includes('____'))
      .slice(0, 2) // Ensure exactly 2 questions

    // Fallback if parsing fails
    if (questions.length < 2) {
      return NextResponse.json({
        success: true,
        questions: [
          "What if this could____?",
          "How might it____?"
        ]
      })
    }

    return NextResponse.json({
      success: true,
      questions: questions,
      usage: {
        prompt_tokens: completion.usage?.prompt_tokens || 0,
        completion_tokens: completion.usage?.completion_tokens || 0,
        total_tokens: completion.usage?.total_tokens || 0
      }
    })

  } catch (error: unknown) {
    console.error('Creativity questions API error:', error)

    // Return fallback questions on any error
    return NextResponse.json({
      success: true,
      questions: [
        "What if this could____?",
        "How might it____?"
      ],
      error: 'Used fallback questions due to API error'
    })
  }
} 