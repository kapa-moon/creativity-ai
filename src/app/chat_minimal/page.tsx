'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChatMessage } from '@/components/ChatMessage'
import { MinimalChatInput } from '@/components/MinimalChatInput'
import { MinimalChatLogger } from '@/lib/minimalChatLogger'
import { Message } from '@/types/chat'

export default function MinimalChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInQualtrics, setIsInQualtrics] = useState(false)
  const [dataSubmitted, setDataSubmitted] = useState(false)
  const [autoSubmitStatus, setAutoSubmitStatus] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatLogger = useRef<MinimalChatLogger | null>(null)
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null)
  const lastActivityTime = useRef<number>(Date.now())

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Initialize chat logger on client side only
  useEffect(() => {
    if (!chatLogger.current) {
      chatLogger.current = new MinimalChatLogger()
      // Don't initialize session yet - wait for parent's response
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const submitToQualtrics = useCallback(async (isAutoSubmit: boolean = false, allowUpdate: boolean = false) => {
    // Allow updates anytime, but prevent initial submission duplicates
    if (dataSubmitted && !allowUpdate && !isAutoSubmit) return
    
    if (isAutoSubmit && !allowUpdate) {
      setAutoSubmitStatus('Submitting data...')
    }
    
    try {
      if (!chatLogger.current) {
        console.error('Chat logger not initialized')
        return
      }
      const chatData = chatLogger.current.prepareQualtricData()
      
      // Always notify parent window (Qualtrics) with the data, even if API fails
      if (isInQualtrics) {
        console.log('Sending chat data to parent window:', chatData)
        window.parent.postMessage({
          type: 'chatDataSubmitted',
          data: chatData,
          sessionId: chatLogger.current.getSessionId()
        }, '*')
        
        if (!allowUpdate) {
          setDataSubmitted(true)
          setAutoSubmitStatus('')
        }
        
        if (!isAutoSubmit) {
          console.log(`✅ Data ${allowUpdate ? 'updated' : 'submitted'} to survey successfully! Session ID: ${chatLogger.current.getSessionId()}`)
        }
        
        console.log('Minimal chat data submitted:', chatData)
        return // Exit early for Qualtrics, don't need API call
      }
      
      // For non-Qualtrics usage, still try API call
      try {
        const response = await fetch('/api/minimal-chat-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: chatLogger.current!.getSessionId(),
            action: 'submitChatData',
            data: chatData
          })
        })

        const result = await response.json()
        
        if (result.success) {
          setDataSubmitted(true)
          setAutoSubmitStatus('')
          
          if (!isAutoSubmit) {
            alert(`✅ Data submitted successfully!\nSession ID: ${result.sessionId}`)
          }
          
          console.log('Minimal chat data submitted:', chatData)
        } else {
          console.error('API error:', result.error)
          if (!isAutoSubmit) {
            alert('❌ Error submitting data: ' + (result.error || 'Unknown error'))
          }
        }
      } catch (apiError) {
        console.error('API call failed:', apiError)
        // For non-Qualtrics usage, still mark as submitted if we have data
        setDataSubmitted(true)
        setAutoSubmitStatus('')
        if (!isAutoSubmit) {
          console.log('API call failed, but data is available for export')
        }
      }
      
    } catch (error: unknown) {
      console.error('Error submitting to Qualtrics:', error)
      
      // Even if there's an error, try to send data to parent window
      if (isInQualtrics && chatLogger.current) {
        const chatData = chatLogger.current.prepareQualtricData()
        console.log('Sending chat data to parent window despite error:', chatData)
        window.parent.postMessage({
          type: 'chatDataSubmitted',
          data: chatData,
          sessionId: chatLogger.current.getSessionId()
        }, '*')
        setDataSubmitted(true)
      }
      
      if (!isAutoSubmit) {
        console.error('Error during submission:', error)
      }
    }
  }, [dataSubmitted, isInQualtrics])

  // Check if running inside Qualtrics iframe
  useEffect(() => {
    const inIframe = window !== window.parent
    setIsInQualtrics(inIframe)
    
    // If in iframe, ask parent if we should restore state
    if (inIframe) {
      console.log('Iframe loaded, asking parent for initialization state')
      window.parent.postMessage({ type: 'requestInitialState' }, '*')
    }
    
    // Listen for messages from parent (Qualtrics)
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'forceSubmitData') {
        console.log('Received forceSubmitData message from parent')
        if (!dataSubmitted && messages.length > 0) {
          submitToQualtrics(true)
        } else if (messages.length > 0) {
          // Even if already submitted, send data again to ensure parent gets it
          if (chatLogger.current && isInQualtrics) {
            const chatData = chatLogger.current.prepareQualtricData()
            console.log('Re-sending chat data to parent window:', chatData)
            window.parent.postMessage({
              type: 'chatDataSubmitted',
              data: chatData,
              sessionId: chatLogger.current.getSessionId()
            }, '*')
          }
        }
      } else if (event.data.type === 'restoreChatState') {
        console.log('Received restoreChatState message from parent', event.data.data)
        const restoredData = event.data.data
        
        if (restoredData && restoredData.conversationLog) {
          // Force clear any stale localStorage before restoring
          try {
            localStorage.removeItem('minimal-chat-logs')
            console.log('Cleared stale localStorage before restoration')
          } catch (e) {
            console.error('Error clearing localStorage:', e)
          }
          
          // Convert conversationLog events to Message format with proper Date objects
          const restoredMessages = restoredData.conversationLog
            .filter((event: { type: string }) => event.type === 'user_message' || event.type === 'ai_response')
            .map((event: { id: string; timestamp: string; type: string; content: string }) => ({
              id: event.id,
              timestamp: new Date(event.timestamp), // Convert string to Date object
              type: event.type === 'user_message' ? 'user' as const : 'bot' as const,
              content: event.content
            }))
          
          // Restore messages
          setMessages(restoredMessages)
          
          // Restore chat logger state
          if (chatLogger.current) {
            chatLogger.current.restoreFromQualtricData(restoredData)
          }
          
          // Mark as already submitted (since we're restoring)
          setDataSubmitted(true)
          
          console.log('Chat state restored successfully', {
            messageCount: restoredMessages.length,
            sessionId: restoredData.sessionId
          })
        }
      } else if (event.data.type === 'startFresh') {
        console.log('Received startFresh message - starting with clean state')
        // Force clear localStorage to ensure no stale data
        try {
          localStorage.removeItem('minimal-chat-logs')
          console.log('Cleared localStorage for fresh start')
        } catch (e) {
          console.error('Error clearing localStorage:', e)
        }
        
        // Ensure we start completely fresh
        setMessages([])
        setDataSubmitted(false)
        
        if (chatLogger.current) {
          // Reinitialize the logger with fresh state
          chatLogger.current.clearLogs()
          chatLogger.current.initializeSession()
        }
        
        console.log('Started with fresh state')
      } else if (event.data.type === 'clearChatStorage') {
        console.log('Received clearChatStorage message - clearing for next question')
        // Clear all state for the next question
        setMessages([])
        setDataSubmitted(false)
        if (chatLogger.current) {
          chatLogger.current.clearLogs()
        }
        console.log('Chat storage cleared successfully')
      }
    }

    window.addEventListener('message', handleMessage)
    
    // Auto-submit when user tries to leave the page
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dataSubmitted && messages.length > 0) {
        submitToQualtrics(true)
        event.preventDefault()
        event.returnValue = ''
      }
    }

    // Auto-submit when page becomes hidden (user switches tabs, etc.)
    const handleVisibilityChange = () => {
      if (document.hidden && !dataSubmitted && messages.length > 0) {
        submitToQualtrics(true)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current)
      }
    }
  }, [messages.length, dataSubmitted, submitToQualtrics])

  // Continuous chat data updates - send to Qualtrics after every message
  useEffect(() => {
    if (messages.length === 0) return
    
    // Always update chat data when in Qualtrics iframe
    if (isInQualtrics && chatLogger.current) {
      console.log('Continuously updating chat data, messages:', messages.length)
      
      // Small delay to ensure message is logged
      setTimeout(() => {
        submitToQualtrics(true, true) // Always allow updates
      }, 100)
    }

  }, [messages.length, isInQualtrics, submitToQualtrics])

  // Send updates to parent window (Qualtrics)
  useEffect(() => {
    if (isInQualtrics && messages.length > 0 && chatLogger.current) {
      window.parent.postMessage({
        type: 'chatUpdate',
        messageCount: messages.length,
        sessionId: chatLogger.current.getSessionId()
      }, '*')
    }
  }, [messages.length, isInQualtrics])

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    // Clear any existing auto-submit status
    setAutoSubmitStatus('')

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    // Log user message
    if (chatLogger.current) {
      await chatLogger.current.logMessage(userMessage)
    }

    try {
      // Prepare conversation history for API (last 10 messages for context)
      const recentMessages = messages.slice(-10)
      
      // Call OpenAI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          conversationHistory: recentMessages
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response')
      }

      if (!data.success) {
        throw new Error(data.error || 'AI response was not successful')
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
      setIsLoading(false)

      // Log bot response
      if (chatLogger.current) {
        await chatLogger.current.logMessage(botMessage)
      }

    } catch (error: unknown) {
      console.error('Error getting AI response:', error)
      
      const errorObj = error as { message?: string }
      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `⚠️ Sorry, I'm having trouble responding right now. ${errorObj.message || 'Unknown error'}`,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
      setIsLoading(false)

      // Log error message
      if (chatLogger.current) {
        await chatLogger.current.logMessage(errorMessage)
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const clearChat = async () => {
    setMessages([])
    setDataSubmitted(false)
    setAutoSubmitStatus('')
    if (chatLogger.current) {
      await chatLogger.current.clearLogs()
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4">
        {/* Header - Commented out for cleaner iframe display
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🗨️ Minimal Chat Interface
          </h1>
          <p className="text-gray-600 mb-4">
            {isInQualtrics 
              ? 'Chat naturally - your conversation will be automatically saved to the survey!'
              : 'Simple chat interface for research purposes.'
            }
          </p>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-2 flex-wrap">
              {!isInQualtrics && (
                <button
                  onClick={clearChat}
                  className="px-4 py-2 bg-white text-black border border-black hover:bg-gray-100 transition-colors"
                  style={{ borderRadius: '0px' }}
                >
                  Clear Chat
                </button>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              Session ID: {chatLogger.current?.getSessionId()?.slice(-8) || 'Loading...'}
              <br />
              Participant ID: {chatLogger.current?.getParticipantId()?.slice(-8) || 'Loading...'}
            </div>
          </div>
        </div>
        */}

        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col flex-1">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>Start a conversation...</p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <MinimalChatInput 
              onSendMessage={handleSendMessage} 
              disabled={isLoading}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
