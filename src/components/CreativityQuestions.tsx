'use client'

import { useState, useEffect, useCallback } from 'react'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

interface CreativityQuestionsProps {
  messages: Message[]
  onQuestionSelect: (question: string) => void
  isLoading?: boolean
}

export function CreativityQuestions({ messages, onQuestionSelect, isLoading = false }: CreativityQuestionsProps) {
  const [questions, setQuestions] = useState<string[]>([
    "What if this could____?",
    "How might a child____?"
  ])
  const [isGenerating, setIsGenerating] = useState(false)

  const generateQuestions = useCallback(async () => {
    if (isGenerating) return
    
    setIsGenerating(true)
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
    } finally {
      setIsGenerating(false)
    }
  }, [messages, isGenerating])

  // Generate new questions when messages change (but not too frequently)
  useEffect(() => {
    if (messages.length > 0 && messages.length % 4 === 0) {
      // Regenerate every 4 messages to keep questions relevant
      generateQuestions()
    }
  }, [messages.length, generateQuestions])

  // Generate initial questions on mount
  useEffect(() => {
    generateQuestions()
  }, [generateQuestions])

  const handleQuestionClick = (question: string) => {
    // Pass the complete question WITH the blank for user to complete
    onQuestionSelect(question)
  }

  if (isLoading) {
    return null // Hide questions while chat is loading
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 border-t border-gray-200">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          💡 Creative thinking prompts:
        </h3>
        <div className="space-y-2">
          {questions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleQuestionClick(question)}
              disabled={isGenerating}
              className="block w-full text-left p-3 rounded-md border border-gray-200 bg-white text-gray-500 hover:text-black hover:border-gray-300 hover:shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm">
                {question}
              </span>
            </button>
          ))}
        </div>
        {isGenerating && (
          <div className="mt-2 text-xs text-gray-500 flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-2"></div>
            Generating new prompts...
          </div>
        )}
        <p className="text-xs text-gray-400 mt-2">
          Click a prompt to start your creative thinking process
        </p>
      </div>
    </div>
  )
} 