'use client'

import { useState, KeyboardEvent } from 'react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message)
      setMessage('')
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex gap-2">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
        disabled={disabled}
        className="flex-1 resize-none border border-gray-300 rounded-md px-3 py-2 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
        rows={2}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !message.trim()}
        className="px-4 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        Send
      </button>
    </div>
  )
} 