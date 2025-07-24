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

// Nudge messages for divergent thinking - moved outside component for stability
const nudgeMessages = [
  "💡 Try a different angle",
  "🌿 What about nature uses?", 
  "🎨 Consider artistic purposes",
  "👶 Think like a child would",
  "🏠 How about home solutions?",
  "🚀 What if it was tiny?",
  "⚡ What if it was magical?",
  "🌍 Environmental angle?",
  "🎯 Opposite direction?",
  "🔄 Combine two ideas"
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInQualtrics, setIsInQualtrics] = useState(false)
  const [dataSubmitted, setDataSubmitted] = useState(false)
  const [autoSubmitStatus, setAutoSubmitStatus] = useState<string>('')
  const [pendingMessage, setPendingMessage] = useState<string>('')
  const [questions, setQuestions] = useState<string[]>([
    "What if this could____?",
    "How might a child____?"
  ])
  const [showNudge, setShowNudge] = useState(false)
  const [currentNudge, setCurrentNudge] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatLogger = useRef(new ChatLogger())
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null)
  const nudgeTimer = useRef<NodeJS.Timeout | null>(null)
  const lastActivityTime = useRef<number>(Date.now())

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const submitToQualtrics = useCallback(async (isAutoSubmit: boolean = false) => {
    if (dataSubmitted) return // Prevent duplicate submissions
    
    if (isAutoSubmit) {
      setAutoSubmitStatus('Auto-submitting data...')
    }
    
    try {
      const chatData = chatLogger.current.prepareDetailedQualtricData()
      
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
      if (nudgeTimer.current) {
        clearInterval(nudgeTimer.current)
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

  const handleQuestionSelect = (question: string) => {
    // Log quick prompt selection
    const questionStem = question.replace(/____\??/g, '').trim()
    chatLogger.current.logQuickPromptSelection(question, questionStem)
    setPendingMessage(questionStem)
  }

  // Generate creativity questions
  const generateQuestions = useCallback(async () => {
    try {
      const response = await fetch('/api/creativity-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatHistory: messages.slice(-6), // Send recent messages for context
        })
      })

      const data = await response.json()
      
      if (data.success && data.questions && data.questions.length >= 2) {
        setQuestions(data.questions.slice(0, 2))
      }
    } catch (error) {
      console.error('Error generating creativity questions:', error)
      // Keep existing questions on error
    }
  }, [messages])

  // Generate new questions periodically
  useEffect(() => {
    if (messages.length > 0 && messages.length % 4 === 0) {
      generateQuestions()
    }
  }, [messages.length, generateQuestions])

  // Generate initial questions
  useEffect(() => {
    generateQuestions()
  }, [generateQuestions])

  const showRandomNudge = useCallback(() => {
    if (messages.length > 2) { // Only show after some conversation
      const randomNudge = nudgeMessages[Math.floor(Math.random() * nudgeMessages.length)]
      setCurrentNudge(randomNudge)
      setShowNudge(true)
      
      // Log nudge shown
      chatLogger.current.logNudgeShown(randomNudge)
      
      // Auto-hide after 8 seconds
      setTimeout(() => {
        setShowNudge(false)
      }, 8000)
    }
  }, [messages.length])

  // Nudge timer - every 10 seconds
  useEffect(() => {
    if (nudgeTimer.current) {
      clearInterval(nudgeTimer.current)
    }
    
    nudgeTimer.current = setInterval(() => {
      showRandomNudge()
    }, 10000) // 10 seconds

    return () => {
      if (nudgeTimer.current) {
        clearInterval(nudgeTimer.current)
      }
    }
  }, [showRandomNudge])

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
      await chatLogger.current.logMessage(botMessage)

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
      await chatLogger.current.logMessage(errorMessage)
    }
  }

  const clearChat = async () => {
    setMessages([])
    setDataSubmitted(false)
    setAutoSubmitStatus('')
    await chatLogger.current.clearLogs()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {/* {isInQualtrics ? '🔗 Qualtrics Survey Chat' : '🗨️ Creativity Support Tool'} */}
            🗨️ Co-Pilot AI
          </h1>
          <p className="text-gray-600 mb-4">
            {isInQualtrics 
              ? 'Chat naturally - your conversation will be automatically saved to the survey!'
              : ''
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
          
          <div className="flex justify-between items-center">
            <div className="flex gap-2 flex-wrap">
              {!isInQualtrics && (
                <button
                  onClick={clearChat}
                  className="px-4 py-2 bg-white text-black border border-black hover:bg-pink-200 transition-colors"
                  style={{ borderRadius: '0px' }}
                >
                  Clear Chat
                </button>
              )}
            </div>
            
            {/* Nudge Box */}
            {showNudge && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-sm text-gray-700 shadow-sm animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">💡</span>
                  <span>{currentNudge}</span>
                  <button 
                    onClick={() => {
                      chatLogger.current.logNudgeDismissed(currentNudge)
                      setShowNudge(false)
                    }}
                    className="text-gray-400 hover:text-gray-600 ml-1"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>Start a conversation...</p>
                {/* {isInQualtrics && (
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
                )} */}
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
            <ChatInput 
              onSendMessage={handleSendMessage} 
              disabled={isLoading}
              pendingMessage={pendingMessage}
              onMessageChange={setPendingMessage}
              creativityQuestions={questions}
              onQuestionSelect={handleQuestionSelect}
            />
          </div>
        </div>

      </div>
    </div>
  )
} 