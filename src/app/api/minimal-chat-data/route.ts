import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, action, data } = body

    switch (action) {
      case 'submitChatData':
        // Log minimal chat data for analysis
        console.log('Minimal chat data received for Qualtrics:', {
          sessionId,
          participantId: data.participantId,
          summary: {
            messageCount: data.messageCount,
            userMessageCount: data.userMessageCount,
            aiMessageCount: data.aiMessageCount,
            sessionDuration: data.sessionDurationMs
          },
          timestamp: new Date().toISOString()
        })

        // Parse and log conversation details
        if (data.conversationLog) {
          try {
            const conversation = JSON.parse(data.conversationLog)
            console.log('Conversation log:', conversation)
          } catch (e) {
            console.error('Error parsing conversation log:', e)
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Minimal chat data received successfully',
          sessionId,
          participantId: data.participantId,
          eventsLogged: data.messageCount || 0
        })

      case 'getChatSummary':
        // Return a summary of the chat session
        const mockSummary = {
          sessionId,
          participantId: data?.participantId || 'unknown',
          messageCount: data?.messageCount || 0,
          userMessageCount: data?.userMessageCount || 0,
          aiMessageCount: data?.aiMessageCount || 0,
          duration: data?.sessionDurationMs || 0,
          startTime: data?.startTime || new Date().toISOString(),
          endTime: data?.endTime || new Date().toISOString()
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
    console.error('Minimal chat API error:', error)
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
    const participantId = searchParams.get('participantId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    // Mock response for chat data retrieval
    const mockChatData = {
      sessionId,
      participantId: participantId || 'unknown',
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
    console.error('Minimal chat GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
