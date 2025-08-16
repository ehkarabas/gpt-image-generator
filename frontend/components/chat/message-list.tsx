'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowDown } from 'lucide-react'
import { MessageItem } from './message-item'
import { cn } from '@/lib/utils'

interface MessageListProps {
  messages: Array<{
    id: string
    content: string
    role: 'user' | 'assistant'
    created_at: string
    user?: {
      display_name?: string
      avatar_url?: string
    }
    images?: Array<{
      id: string
      image_url: string
      prompt: string
      size: string
      quality?: string
      model?: string
    }>
  }>
  isLoading?: boolean
  autoScroll?: boolean
  showScrollToBottom?: boolean
  className?: string
}

export function MessageList({ 
  messages, 
  isLoading = false, 
  autoScroll = true, 
  showScrollToBottom = false,
  className 
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle null/undefined messages
  const safeMessages = messages || []

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [safeMessages.length, autoScroll])

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div 
        ref={containerRef}
        className={cn(
          "flex flex-col space-y-4 p-4 overflow-y-auto h-full",
          className
        )}
        data-testid="message-list-container"
      >
        {/* Loading State */}
        {isLoading && (
          <div 
            className="flex items-center justify-center py-8"
            data-testid="message-list-loading"
          >
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Loading messages...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && safeMessages.length === 0 && (
          <div 
            className="flex flex-col items-center justify-center py-12 text-center"
            data-testid="message-list-empty"
          >
            <div className="rounded-full bg-gray-100 p-6 mb-4">
              <svg 
                className="w-8 h-8 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-500 max-w-sm">
              Send a message to begin chatting with the AI assistant or request image generation.
            </p>
          </div>
        )}

        {/* Messages */}
        {!isLoading && safeMessages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            index={index}
            data-testid={`message-item-${message.id}`}
          />
        ))}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <div className="absolute bottom-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToBottom}
            className="rounded-full shadow-lg"
            data-testid="scroll-to-bottom-button"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
