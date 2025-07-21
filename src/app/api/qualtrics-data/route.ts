import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, action, data } = body

    switch (action) {
      case 'submitChatData':
        // This would typically save to your database
        // For now, we'll just log and return success
        console.log('Chat data received for Qualtrics:', {
          sessionId,
          data,
          timestamp: new Date().toISOString()
        })

        // In a real app, you'd save to database here
        // await saveChatDataToDatabase(sessionId, data)

        return NextResponse.json({
          success: true,
          message: 'Chat data received successfully',
          sessionId
        })

      case 'getChatSummary':
        // Return a summary of the chat session
        // This could be retrieved from your database
        const mockSummary = {
          sessionId,
          messageCount: data?.messageCount || 0,
          userMessageCount: data?.userMessageCount || 0,
          duration: data?.sessionDurationMs || 0,
          summary: data?.conversationSummary || 'No conversation data'
        }

        return NextResponse.json({
          success: true,
          data: mockSummary
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Qualtrics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    // Mock response for chat data retrieval
    // In a real app, this would fetch from your database
    const mockChatData = {
      sessionId,
      messages: [],
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      metadata: {
        userAgent: request.headers.get('user-agent') || '',
        referrer: request.headers.get('referer') || '',
        url: request.url
      }
    }

    return NextResponse.json({
      success: true,
      data: mockChatData
    })
  } catch (error) {
    console.error('Qualtrics GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 