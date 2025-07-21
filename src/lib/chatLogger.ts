import { Message } from '@/app/chat/page'

export interface ChatLog {
  sessionId: string
  messages: Message[]
  startTime: Date
  lastActivity: Date
  metadata: {
    userAgent: string
    referrer: string
    url: string
  }
}

interface StoredChatLog {
  sessionId: string
  messages: Array<{
    id: string
    type: 'user' | 'bot'
    content: string
    timestamp: string
  }>
  startTime: string
  lastActivity: string
  metadata: {
    userAgent: string
    referrer: string
    url: string
  }
}

interface StoredMessage {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: string
}

export class ChatLogger {
  private sessionId: string
  private logs: ChatLog
  private readonly STORAGE_KEY = 'chat-logs'

  constructor() {
    this.sessionId = this.generateSessionId()
    this.logs = this.initializeLog()
    this.loadFromStorage()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeLog(): ChatLog {
    return {
      sessionId: this.sessionId,
      messages: [],
      startTime: new Date(),
      lastActivity: new Date(),
      metadata: {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        referrer: typeof window !== 'undefined' ? document.referrer : '',
        url: typeof window !== 'undefined' ? window.location.href : ''
      }
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsedLogs: StoredChatLog = JSON.parse(stored)
        // Convert date strings back to Date objects
        this.logs = {
          ...parsedLogs,
          startTime: new Date(parsedLogs.startTime),
          lastActivity: new Date(parsedLogs.lastActivity),
          messages: parsedLogs.messages.map((msg: StoredMessage) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }
      }
    } catch (error) {
      console.error('Error loading chat logs from storage:', error)
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs))
    } catch (error) {
      console.error('Error saving chat logs to storage:', error)
    }
  }

  async logMessage(message: Message): Promise<void> {
    this.logs.messages.push(message)
    this.logs.lastActivity = new Date()
    this.saveToStorage()

    // In a real application, you would also send this to your backend
    console.log('Message logged:', {
      sessionId: this.sessionId,
      messageId: message.id,
      type: message.type,
      timestamp: message.timestamp,
      contentLength: message.content.length
    })
  }

  async exportLogs(): Promise<ChatLog> {
    return { ...this.logs }
  }

  async clearLogs(): Promise<void> {
    this.logs = this.initializeLog()
    this.saveToStorage()
  }

  getSessionId(): string {
    return this.sessionId
  }

  getMessageCount(): number {
    return this.logs.messages.length
  }

  getUserMessageCount(): number {
    return this.logs.messages.filter(msg => msg.type === 'user').length
  }

  getBotMessageCount(): number {
    return this.logs.messages.filter(msg => msg.type === 'bot').length
  }

  getSessionDuration(): number {
    return Date.now() - this.logs.startTime.getTime()
  }

  // Method to prepare data for Qualtrics integration
  prepareQualtricData(): Record<string, string | number | null> {
    return {
      sessionId: this.sessionId,
      messageCount: this.getMessageCount(),
      userMessageCount: this.getUserMessageCount(),
      botMessageCount: this.getBotMessageCount(),
      sessionDurationMs: this.getSessionDuration(),
      firstMessage: this.logs.messages[0]?.content || null,
      lastMessage: this.logs.messages[this.logs.messages.length - 1]?.content || null,
      conversationSummary: this.logs.messages.map(msg => `${msg.type}: ${msg.content}`).join(' | '),
      userAgent: this.logs.metadata.userAgent,
      referrer: this.logs.metadata.referrer,
      url: this.logs.metadata.url
    }
  }
} 