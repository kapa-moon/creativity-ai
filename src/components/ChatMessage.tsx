import { Message } from '@/app/chat/page'

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const isUser = message.type === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isUser 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-100 text-gray-900'
      }`}>
        <div className="flex flex-col">
          <div className="mb-1">
            {message.content}
          </div>
          <div className={`text-xs ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {isUser ? 'You' : 'Bot'} • {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  )
} 