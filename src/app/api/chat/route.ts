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
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.',
          details: 'Check your .env.local file or Vercel environment variables.'
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { message, conversationHistory = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      )
    }

    // Prepare conversation history for OpenAI
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a helpful AI assistant in a chat interface. Be conversational, friendly, and helpful. Keep responses concise but informative.'
      },
      // Add conversation history
      ...conversationHistory.map((msg: { type: 'user' | 'bot'; content: string }) => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })),
      // Add current message
      {
        role: 'user' as const,
        content: message
      }
    ]

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      return NextResponse.json(
        { error: 'No response generated from OpenAI' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: response,
      usage: {
        prompt_tokens: completion.usage?.prompt_tokens || 0,
        completion_tokens: completion.usage?.completion_tokens || 0,
        total_tokens: completion.usage?.total_tokens || 0
      }
    })

  } catch (error: unknown) {
    console.error('OpenAI API error:', error)

    // Handle specific OpenAI errors
    const errorObj = error as { error?: { type?: string }; message?: string }
    
    if (errorObj?.error?.type === 'insufficient_quota') {
      return NextResponse.json(
        { 
          error: 'OpenAI API quota exceeded. Please check your OpenAI billing and usage.',
          details: errorObj.message || 'Quota exceeded'
        },
        { status: 429 }
      )
    }

    if (errorObj?.error?.type === 'invalid_api_key') {
      return NextResponse.json(
        { 
          error: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.',
          details: 'Make sure your API key is correct and has sufficient permissions.'
        },
        { status: 401 }
      )
    }

    if (errorObj?.error?.type === 'rate_limit_exceeded') {
      return NextResponse.json(
        { 
          error: 'OpenAI API rate limit exceeded. Please try again in a moment.',
          details: errorObj.message || 'Rate limit exceeded'
        },
        { status: 429 }
      )
    }

    // Generic error handling
    return NextResponse.json(
      { 
        error: 'Failed to get response from AI',
        details: errorObj.message || 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
} 