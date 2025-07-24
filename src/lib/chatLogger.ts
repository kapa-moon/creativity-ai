import { Message } from '@/app/chat/page'

export interface ChatEvent {
  id: string
  timestamp: Date
  type: 'user_message' | 'ai_response' | 'quick_prompt_selection' | 'nudge_shown' | 'nudge_dismissed' | 'session_start' | 'session_end'
  content: string
  metadata?: {
    promptText?: string
    nudgeMessage?: string
    responseTime?: number
    messageLength?: number
    [key: string]: any
  }
}

export interface ChatLog {
  sessionId: string
  events: ChatEvent[]
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
  events: Array<{
    id: string
    timestamp: string
    type: string
    content: string
    metadata?: any
  }>
  startTime: string
  lastActivity: string
  metadata: {
    userAgent: string
    referrer: string
    url: string
  }
}

export class ChatLogger {
  private sessionId: string
  private logs: ChatLog
  private readonly STORAGE_KEY = 'chat-logs'

  constructor() {
    this.sessionId = this.generateSessionId()
    this.logs = this.initializeLog()
    this.loadFromStorage()
    
    // Log session start
    this.logEvent('session_start', 'Chat session started', {})
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeLog(): ChatLog {
    return {
      sessionId: this.sessionId,
      events: [],
      startTime: new Date(),
      lastActivity: new Date(),
      metadata: {
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
        referrer: typeof window !== 'undefined' ? document.referrer : '',
        url: typeof window !== 'undefined' ? window.location.href : ''
      }
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return

    try {
      const storableLog: StoredChatLog = {
        ...this.logs,
        startTime: this.logs.startTime.toISOString(),
        lastActivity: this.logs.lastActivity.toISOString(),
        events: this.logs.events.map(event => ({
          ...event,
          timestamp: event.timestamp.toISOString()
        }))
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storableLog))
    } catch (error) {
      console.error('Error saving chat logs to storage:', error)
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsedLogs: StoredChatLog = JSON.parse(stored)
        this.logs = {
          ...parsedLogs,
          startTime: new Date(parsedLogs.startTime),
          lastActivity: new Date(parsedLogs.lastActivity),
          events: parsedLogs.events.map(event => ({
            ...event,
            timestamp: new Date(event.timestamp)
          }))
        }
      }
    } catch (error) {
      console.error('Error loading chat logs from storage:', error)
    }
  }

  async logEvent(
    type: ChatEvent['type'], 
    content: string, 
    metadata: ChatEvent['metadata'] = {}
  ): Promise<void> {
    const event: ChatEvent = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date(),
      type,
      content,
      metadata
    }

    this.logs.events.push(event)
    this.logs.lastActivity = new Date()
    this.saveToStorage()

    console.log('Event logged:', {
      sessionId: this.sessionId,
      eventType: type,
      timestamp: event.timestamp,
      content: content.substring(0, 100) + (content.length > 100 ? '...' : '')
    })
  }

  async logMessage(message: Message): Promise<void> {
    const type = message.type === 'user' ? 'user_message' : 'ai_response'
    await this.logEvent(type, message.content, {
      messageId: message.id,
      messageLength: message.content.length
    })
  }

  async logQuickPromptSelection(promptText: string, selectedStem: string): Promise<void> {
    await this.logEvent('quick_prompt_selection', selectedStem, {
      promptText,
      selectionTime: Date.now()
    })
  }

  async logNudgeShown(nudgeMessage: string): Promise<void> {
    await this.logEvent('nudge_shown', nudgeMessage, {
      nudgeMessage,
      showTime: Date.now()
    })
  }

  async logNudgeDismissed(nudgeMessage: string): Promise<void> {
    await this.logEvent('nudge_dismissed', nudgeMessage, {
      nudgeMessage,
      dismissTime: Date.now()
    })
  }

  getSessionId(): string {
    return this.sessionId
  }

  getEventCount(): number {
    return this.logs.events.length
  }

  getUserMessageCount(): number {
    return this.logs.events.filter(event => event.type === 'user_message').length
  }

  getAIResponseCount(): number {
    return this.logs.events.filter(event => event.type === 'ai_response').length
  }

  getQuickPromptUsageCount(): number {
    return this.logs.events.filter(event => event.type === 'quick_prompt_selection').length
  }

  getNudgeInteractionCount(): number {
    return this.logs.events.filter(event => 
      event.type === 'nudge_shown' || event.type === 'nudge_dismissed'
    ).length
  }

  getSessionDuration(): number {
    return this.logs.lastActivity.getTime() - this.logs.startTime.getTime()
  }

  async clearLogs(): Promise<void> {
    await this.logEvent('session_end', 'Chat session cleared', {})
    this.logs.events = []
    this.logs.startTime = new Date()
    this.logs.lastActivity = new Date()
    this.saveToStorage()
  }

  async exportLogs(): Promise<ChatLog> {
    await this.logEvent('session_end', 'Chat session exported', {})
    return { ...this.logs }
  }

  // Enhanced method to prepare detailed data for Qualtrics
  prepareDetailedQualtricData(): Record<string, any> {
    const events = this.logs.events
    
    return {
      sessionId: this.sessionId,
      sessionDuration: this.getSessionDuration(),
      totalEvents: this.getEventCount(),
      userMessages: this.getUserMessageCount(),
      aiResponses: this.getAIResponseCount(),
      quickPromptUsage: this.getQuickPromptUsageCount(),
      nudgeInteractions: this.getNudgeInteractionCount(),
      startTime: this.logs.startTime.toISOString(),
      endTime: this.logs.lastActivity.toISOString(),
      userAgent: this.logs.metadata.userAgent,
      referrer: this.logs.metadata.referrer,
      url: this.logs.metadata.url,
      // Detailed event log as JSON string
      detailedEvents: JSON.stringify(events.map(event => ({
        id: event.id,
        timestamp: event.timestamp.toISOString(),
        type: event.type,
        content: event.content,
        metadata: event.metadata
      })))
    }
  }

  // Backward compatibility - simplified data
  prepareQualtricData(): Record<string, string | number | null> {
    const userMessages = this.logs.events.filter(e => e.type === 'user_message')
    const aiMessages = this.logs.events.filter(e => e.type === 'ai_response')
    
    return {
      sessionId: this.sessionId,
      messageCount: userMessages.length + aiMessages.length,
      userMessageCount: userMessages.length,
      botMessageCount: aiMessages.length,
      sessionDurationMs: this.getSessionDuration(),
      firstMessage: userMessages[0]?.content || null,
      lastMessage: aiMessages[aiMessages.length - 1]?.content || null,
      conversationSummary: [...userMessages, ...aiMessages]
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map(event => `${event.type === 'user_message' ? 'user' : 'bot'}: ${event.content}`)
        .join(' | '),
      userAgent: this.logs.metadata.userAgent,
      referrer: this.logs.metadata.referrer,
      url: this.logs.metadata.url
    }
  }
} 