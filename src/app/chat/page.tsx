'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChatMessage } from '@/components/ChatMessage'
import { ChatInput } from '@/components/ChatInput'
import { ChatLogger } from '@/lib/chatLogger'

export interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInQualtrics, setIsInQualtrics] = useState(false)
  const [dataSubmitted, setDataSubmitted] = useState(false)
  const [autoSubmitStatus, setAutoSubmitStatus] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatLogger = useRef(new ChatLogger())
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null)
  const lastActivityTime = useRef<number>(Date.now())

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const submitToQualtrics = useCallback(async (isAutoSubmit: boolean = false) => {
    if (dataSubmitted) return // Prevent duplicate submissions
    
    setIsSubmitting(true)
    if (isAutoSubmit) {
      setAutoSubmitStatus('Auto-submitting data...')
    }
    
    try {
      const chatData = chatLogger.current.prepareQualtricData()
      
      // Send to your API
      const response = await fetch('/api/qualtrics-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: chatLogger.current.getSessionId(),
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
        
        console.log('Chat data auto-submitted:', chatData)
      } else {
        if (!isAutoSubmit) {
          alert('❌ Error submitting data: ' + (result.error || 'Unknown error'))
        }
      }
    } catch (error) {
      console.error('Error submitting to Qualtrics:', error)
      if (!isAutoSubmit) {
        alert('❌ Network error submitting data')
      }
    } finally {
      setIsSubmitting(false)
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
    if (isInQualtrics && messages.length > 0) {
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
    await chatLogger.current.logMessage(userMessage)

    // Simulate typing delay
    setTimeout(async () => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `You said: ${content.trim()}`,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
      setIsLoading(false)

      // Log bot response
      await chatLogger.current.logMessage(botMessage)
    }, 1000)
  }

  const clearChat = async () => {
    setMessages([])
    setDataSubmitted(false)
    setAutoSubmitStatus('')
    await chatLogger.current.clearLogs()
  }

  const exportLogs = async () => {
    const logs = await chatLogger.current.exportLogs()
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isInQualtrics ? '🔗 Qualtrics Survey Chat' : '🗨️ Qualtrics Integration Test Chat'}
          </h1>
          <p className="text-gray-600 mb-4">
            {isInQualtrics 
              ? 'Chat naturally - your conversation will be automatically saved to the survey!'
              : 'Simple chat interface with automatic data logging for Qualtrics surveys.'
            }
          </p>
          
          {/* Auto-submit status */}
          {autoSubmitStatus && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 text-sm">
                🤖 {autoSubmitStatus}
              </p>
            </div>
          )}

          {/* Data submitted confirmation */}
          {dataSubmitted && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm font-medium">
                ✅ Data automatically saved to survey! {isInQualtrics && 'You can continue to the next question.'}
              </p>
            </div>
          )}
          
          <div className="flex gap-2 flex-wrap">
            {!isInQualtrics && (
              <button
                onClick={clearChat}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Clear Chat
              </button>
            )}
            {!isInQualtrics && (
              <button
                onClick={exportLogs}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Export Logs
              </button>
            )}
            <button
              onClick={() => submitToQualtrics(false)}
              disabled={isSubmitting || messages.length === 0 || dataSubmitted}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
            >
              {isSubmitting 
                ? 'Submitting...' 
                : dataSubmitted 
                  ? '✅ Data Submitted'
                  : isInQualtrics 
                    ? '📊 Submit Now (Optional)' 
                    : 'Submit to Qualtrics'
              }
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>Start a conversation...</p>
                {isInQualtrics && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-700">
                      💡 <strong>Auto-Save Enabled:</strong> Your conversation will be automatically saved to the survey after:
                    </p>
                    <ul className="text-xs text-blue-600 mt-2 space-y-1">
                      <li>• 6 messages exchanged</li>
                      <li>• 30 seconds of inactivity (after 2+ messages)</li>
                      <li>• When you leave this page</li>
                    </ul>
                  </div>
                )}
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
            <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
          <h3 className="font-semibold text-gray-900 mb-2">Session Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Total Messages:</span> {messages.length}
            </div>
            <div>
              <span className="font-medium">User Messages:</span> {messages.filter(m => m.type === 'user').length}
            </div>
            <div>
              <span className="font-medium">Session ID:</span> {chatLogger.current.getSessionId().slice(-8)}...
            </div>
          </div>
          {isInQualtrics && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                📊 <strong>Auto-Save:</strong> {dataSubmitted ? 'Data saved ✅' : 'Will save automatically based on activity'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 