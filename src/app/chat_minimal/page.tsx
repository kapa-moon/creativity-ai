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
      // Initialize session logging after component mounts
      chatLogger.current.initializeSession()
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const submitToQualtrics = useCallback(async (isAutoSubmit: boolean = false) => {
    if (dataSubmitted) return // Prevent duplicate submissions
    
    if (isAutoSubmit) {
      setAutoSubmitStatus('Auto-submitting data...')
    }
    
    try {
      if (!chatLogger.current) {
        console.error('Chat logger not initialized')
        return
      }
      const chatData = chatLogger.current.prepareQualtricData()
      
      // Send to your API
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
        
        // Notify parent window (Qualtrics) with the data
        if (isInQualtrics) {
          window.parent.postMessage({
            type: 'chatDataSubmitted',
            data: chatData,
            sessionId: result.sessionId
          }, '*')
          
          if (!isAutoSubmit) {
            alert(`✅ Data submitted to survey successfully!\nSession ID: ${result.sessionId}`)
          }
        } else {
          if (!isAutoSubmit) {
            alert(`✅ Data submitted successfully!\nSession ID: ${result.sessionId}`)
          }
        }
        
        console.log('Minimal chat data submitted:', chatData)
      } else {
        if (!isAutoSubmit) {
          alert('❌ Error submitting data: ' + (result.error || 'Unknown error'))
        }
      }
    } catch (error: unknown) {
      console.error('Error submitting to Qualtrics:', error)
      if (!isAutoSubmit) {
        alert('❌ Network error submitting data')
      }
    }
  }, [dataSubmitted, isInQualtrics])

  // Check if running inside Qualtrics iframe
  useEffect(() => {
    const inIframe = window !== window.parent
    setIsInQualtrics(inIframe)
    
    // Listen for messages from parent (Qualtrics)
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'forceSubmitData') {
        submitToQualtrics(true)
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

  // Auto-submit logic based on activity
  useEffect(() => {
    if (messages.length === 0 || dataSubmitted) return

    // Reset inactivity timer
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
    }

    lastActivityTime.current = Date.now()

    // Auto-submit after 6+ messages (good conversation)
    if (messages.length >= 6 && !dataSubmitted) {
      setAutoSubmitStatus('Auto-submitting after reaching 6 messages...')
      setTimeout(() => submitToQualtrics(true), 2000)
      return
    }

    // Auto-submit after 30 seconds of inactivity (if 2+ messages)
    if (messages.length >= 2) {
      setAutoSubmitStatus('Will auto-submit after 30 seconds of inactivity...')
      inactivityTimer.current = setTimeout(() => {
        if (!dataSubmitted) {
          setAutoSubmitStatus('Auto-submitting due to inactivity...')
          submitToQualtrics(true)
        }
      }, 30000) // 30 seconds
    }

  }, [messages.length, dataSubmitted, submitToQualtrics])

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

    // Clear auto-submit status when user is actively chatting
    if (autoSubmitStatus.includes('inactivity')) {
      setAutoSubmitStatus('')
    }

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
