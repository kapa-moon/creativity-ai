import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, action, data } = body

    switch (action) {
      case 'submitChatData':
        // Log detailed data for analysis
        console.log('Detailed chat data received for Qualtrics:', {
          sessionId,
          summary: {
            totalEvents: data.totalEvents,
            userMessages: data.userMessages,
            aiResponses: data.aiResponses,
            quickPromptUsage: data.quickPromptUsage,
            nudgeInteractions: data.nudgeInteractions,
            sessionDuration: data.sessionDuration
          },
          timestamp: new Date().toISOString()
        })

        // Parse and log individual events for detailed analysis
        if (data.detailedEvents) {
          try {
            const events = JSON.parse(data.detailedEvents)
            console.log('Individual events:', events.slice(0, 5)) // Log first 5 events
          } catch (e) {
            console.error('Error parsing detailed events:', e)
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Detailed chat data received successfully',
          sessionId,
          eventsLogged: data.totalEvents || 0
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