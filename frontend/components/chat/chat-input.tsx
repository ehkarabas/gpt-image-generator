'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'
import { useMessages } from '@/hooks/use-messages'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  className?: string
  onSend?: (message: string) => Promise<void> | void
}

export function ChatInput({ className, onSend }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { sendMessage, error, clearError, retry } = useMessages()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const message = input.trim()
    setInput('')
    setIsLoading(true)
    
    try {
      // Use onSend prop if provided, otherwise use useMessages hook
      if (onSend) {
        await onSend(message)
      } else {
        await sendMessage(message)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  return (
    <div 
      className={cn("border-t border-gray-200 bg-white", className)}
      data-testid="chat-input-container"
    >
      <div className="max-w-3xl mx-auto p-6">
        {/* Error Display */}
        {error && (
          <div 
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
            data-testid="chat-error"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-center justify-between">
              <p 
                className="text-sm text-red-600"
                data-testid="error-message"
              >
                {error.message}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={retry}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  data-testid="retry-button"
                  aria-label="Retry sending message"
                >
                  Retry
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearError}
                  className="text-red-600 hover:bg-red-50"
                  data-testid="dismiss-error-button"
                  aria-label="Dismiss error"
                >
                  ×
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Input Form */}
        <form 
          onSubmit={handleSubmit} 
          className="flex gap-3 items-end"
          data-testid="chat-form"
        >
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Try asking a question to get started!"
              className="min-h-[44px] max-h-32 resize-none border-gray-300 rounded-xl pr-12 text-sm leading-relaxed focus:border-blue-500 focus:ring-blue-500"
              disabled={isLoading}
              data-testid="chat-textarea"
              aria-label="Chat message"
              aria-describedby="character-count"
            />
            
            <div 
              className="absolute bottom-2 right-2 text-xs text-gray-400"
              id="character-count"
              data-testid="character-count"
              aria-live="polite"
            >
              {input.length}/2000
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="h-11 px-4 rounded-xl bg-black hover:bg-gray-800 text-white"
            data-testid="send-button"
            aria-label={isLoading ? "Sending message" : "Send message"}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="sr-only" data-testid="sending-indicator">
                  Sending...
                </span>
              </>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}






