import { Message } from '@/types/chat'

export interface MinimalChatEvent {
  id: string
  timestamp: Date
  type: 'user_message' | 'ai_response' | 'session_start' | 'session_end'
  content: string
  participantId: string
}

export interface MinimalChatLog {
  sessionId: string
  participantId: string
  events: MinimalChatEvent[]
  startTime: Date
  lastActivity: Date
}

interface StoredMinimalChatLog {
  sessionId: string
  participantId: string
  events: Array<{
    id: string
    timestamp: string
    type: string
    content: string
    participantId: string
  }>
  startTime: string
  lastActivity: string
}

export class MinimalChatLogger {
  private sessionId: string
  private participantId: string
  private logs: MinimalChatLog
  private readonly STORAGE_KEY = 'minimal-chat-logs'

  constructor(participantId: string = '') {
    this.sessionId = this.generateSessionId()
    this.participantId = participantId || this.generateParticipantId()
    this.logs = this.initializeLog()
    this.loadFromStorage()
  }

  // Initialize session logging (call this after component mounts)
  async initializeSession(): Promise<void> {
    await this.logEvent('session_start', 'Chat session started')
  }

  private generateSessionId(): string {
    return `minimal_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateParticipantId(): string {
    return `participant_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }

  private initializeLog(): MinimalChatLog {
    return {
      sessionId: this.sessionId,
      participantId: this.participantId,
      events: [],
      startTime: new Date(),
      lastActivity: new Date()
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return

    try {
      const storableLog: StoredMinimalChatLog = {
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
      console.error('Error saving minimal chat logs to storage:', error)
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsedLogs: StoredMinimalChatLog = JSON.parse(stored)
        this.logs = {
          ...parsedLogs,
          startTime: new Date(parsedLogs.startTime),
          lastActivity: new Date(parsedLogs.lastActivity),
          events: parsedLogs.events.map(event => ({
            ...event,
            type: event.type as MinimalChatEvent['type'],
            timestamp: new Date(event.timestamp)
          }))
        }
      }
    } catch (error) {
      console.error('Error loading minimal chat logs from storage:', error)
    }
  }

  async logEvent(
    type: MinimalChatEvent['type'], 
    content: string
  ): Promise<void> {
    const event: MinimalChatEvent = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date(),
      type,
      content,
      participantId: this.participantId
    }

    this.logs.events.push(event)
    this.logs.lastActivity = new Date()
    this.saveToStorage()

    console.log('Minimal event logged:', {
      sessionId: this.sessionId,
      participantId: this.participantId,
      eventType: type,
      timestamp: event.timestamp,
      content: content.substring(0, 100) + (content.length > 100 ? '...' : '')
    })
  }

  async logMessage(message: Message): Promise<void> {
    const type = message.type === 'user' ? 'user_message' : 'ai_response'
    await this.logEvent(type, message.content)
  }

  getSessionId(): string {
    return this.sessionId
  }

  getParticipantId(): string {
    return this.participantId
  }

  getUserMessageCount(): number {
    return this.logs.events.filter(event => event.type === 'user_message').length
  }

  getAIResponseCount(): number {
    return this.logs.events.filter(event => event.type === 'ai_response').length
  }

  getSessionDuration(): number {
    return this.logs.lastActivity.getTime() - this.logs.startTime.getTime()
  }

  async clearLogs(): Promise<void> {
    await this.logEvent('session_end', 'Chat session cleared')
    this.logs.events = []
    this.logs.startTime = new Date()
    this.logs.lastActivity = new Date()
    this.saveToStorage()
  }

  // Prepare data for Qualtrics - simplified version
  prepareQualtricData(): Record<string, any> {
    const userMessages = this.logs.events.filter(e => e.type === 'user_message')
    const aiMessages = this.logs.events.filter(e => e.type === 'ai_response')
    
    return {
      sessionId: this.sessionId,
      participantId: this.participantId,
      messageCount: userMessages.length + aiMessages.length,
      userMessageCount: userMessages.length,
      aiMessageCount: aiMessages.length,
      sessionDurationMs: this.getSessionDuration(),
      startTime: this.logs.startTime.toISOString(),
      endTime: this.logs.lastActivity.toISOString(),
      // Detailed conversation log as array (will be stringified later)
      conversationLog: this.logs.events.map(event => ({
        id: event.id,
        timestamp: event.timestamp.toISOString(),
        type: event.type,
        content: event.content,
        participantId: event.participantId
      }))
    }
  }

  // Export raw log data
  async exportLogs(): Promise<MinimalChatLog> {
    await this.logEvent('session_end', 'Chat session exported')
    return { ...this.logs }
  }
}
