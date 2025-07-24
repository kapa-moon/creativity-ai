'use client'

import { useState, KeyboardEvent } from 'react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  pendingMessage?: string
  onMessageChange?: (message: string) => void
  creativityQuestions?: string[]
  onQuestionSelect?: (question: string) => void
}

export function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  pendingMessage = '', 
  onMessageChange,
  creativityQuestions = [],
  onQuestionSelect 
}: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message)
      setMessage('')
      onMessageChange?.('') // Clear pending message
    }
  }

  const handleChange = (value: string) => {
    setMessage(value)
    onMessageChange?.(value)
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleQuestionClick = (question: string) => {
    // Remove the "____?" part and pass clean question stem
    const questionStem = question.replace(/____\??/g, '').trim()
    onQuestionSelect?.(questionStem)
  }

  return (
    <div className="flex gap-2">
      <div className="flex-1 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        <textarea
          value={pendingMessage || message}
          onChange={(e) => handleChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
          disabled={disabled}
          className="w-full resize-none border-0 px-3 py-2 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={2}
        />
        
        {/* Creativity Questions within the textarea visual boundary */}
        {creativityQuestions.length > 0 && (
          <div className="px-3 pb-2 border-t border-gray-100">
            <div className="text-xs text-gray-400 mb-1">💡 Quick prompts:</div>
            <div className="space-y-1">
              {creativityQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionClick(question)}
                  disabled={disabled}
                  className="block text-left text-sm text-gray-400 hover:text-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={handleSubmit}
        disabled={disabled || !(pendingMessage || message).trim()}
        className="px-2 py-1 m-1 h-8 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors self-end"
      >
        Send
      </button>
    </div>
  )
} 