'use client'

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

// Types
export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  messageType?: 'text' | 'image'
  createdAt: Date
  metadata?: {
    imageUrls?: string[]
    promptTokens?: number
    completionTokens?: number
  }
}

export interface SendMessageRequest {
  conversationId: string
  content: string
  role: 'user' | 'assistant'
}

export interface MessagePage {
  messages: Message[]
  nextCursor?: string
  hasMore: boolean
}

// Query Keys Factory
export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (conversationId: string) => [...messageKeys.lists(), conversationId] as const,
  infinite: (conversationId: string) => [...messageKeys.list(conversationId), 'infinite'] as const,
}

// API Functions
async function fetchMessages(conversationId: string, cursor?: string): Promise<MessagePage> {
  const url = new URL('/api/conversations/' + conversationId + '/messages', window.location.origin)
  if (cursor) url.searchParams.set('cursor', cursor)
  
  const response = await fetch(url.toString())
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to fetch messages')
  }
  
  const data = await response.json()
  
  // Transform messages to ensure proper typing
  const messages = data.messages.map((msg: any) => ({
    id: msg.id,
    conversationId: msg.conversationId,
    role: msg.role,
    content: msg.content,
    messageType: msg.messageType || 'text',
    createdAt: new Date(msg.created_at || msg.createdAt),
    metadata: msg.metadata || {},
  }))
  
  return {
    messages,
    nextCursor: data.nextCursor,
    hasMore: data.hasMore,
  }
}

async function sendMessage(data: SendMessageRequest): Promise<{ userMessage: Message; aiMessage?: Message }> {
  const response = await fetch(`/api/conversations/${data.conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: data.content,
      role: data.role,
    }),
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to send message')
  }
  
  return response.json()
}

async function generateImageFromPrompt(data: { conversationId: string; prompt: string }): Promise<Message> {
  const response = await fetch('/api/images/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: data.conversationId,
      prompt: data.prompt,
    }),
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to generate image')
  }
  
  const result = await response.json()
  
  // Transform the response to match Message interface
  return {
    id: result.id,
    conversationId: result.conversationId,
    role: result.role,
    content: result.content, // This should be the image URL
    messageType: result.messageType || 'image',
    createdAt: new Date(result.createdAt),
    metadata: {
      imageUrls: [result.content],
    },
  }
}

// Query Hooks
export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: messageKeys.infinite(conversationId),
    queryFn: ({ pageParam }) => fetchMessages(conversationId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!conversationId,
    staleTime: 1000 * 30, // 30 seconds for real-time feel
    gcTime: 1000 * 60 * 5, // 5 minutes
    initialPageParam: undefined,
  })
}

export function useLatestMessages(conversationId: string, limit: number = 20) {
  return useQuery({
    queryKey: [...messageKeys.list(conversationId), 'latest', limit],
    queryFn: async () => {
      const result = await fetchMessages(conversationId)
      return result.messages.slice(0, limit)
    },
    enabled: !!conversationId,
    staleTime: 1000 * 15, // 15 seconds
  })
}

// Mutation Hooks
export function useSendMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: sendMessage,
    onMutate: async (variables) => {
      // Cancel outgoing queries for this conversation
      await queryClient.cancelQueries({ 
        queryKey: messageKeys.infinite(variables.conversationId) 
      })
      
      // Get previous value for rollback
      const previous = queryClient.getQueryData(
        messageKeys.infinite(variables.conversationId)
      )
      
      // Create optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId: variables.conversationId,
        role: variables.role,
        content: variables.content,
        createdAt: new Date(),
      }
      
      // Optimistic update - add to first page
      queryClient.setQueryData(
        messageKeys.infinite(variables.conversationId),
        (old: any) => {
          if (!old) {
            return {
              pages: [{ messages: [optimisticMessage], hasMore: false }],
              pageParams: [undefined],
            }
          }
          
          const newPages = [...old.pages]
          newPages[0] = {
            ...newPages[0],
            messages: [optimisticMessage, ...newPages[0].messages],
          }
          
          return { ...old, pages: newPages }
        }
      )
      
      return { previous, optimisticId: optimisticMessage.id }
    },
    onSuccess: (response, variables, context) => {
      // Both user message and AI response
      const { userMessage, aiMessage } = response
      
      // Replace optimistic message with real user message and add AI response
      queryClient.setQueryData(
        messageKeys.infinite(variables.conversationId),
        (old: any) => {
          if (!old) return old
          
          const newPages = old.pages.map((page: any, index: number) => {
            if (index === 0) {
              let messages = page.messages.map((msg: Message) =>
                msg.id === context?.optimisticId ? userMessage : msg
              )
              
              // Add AI response if exists
              if (aiMessage) {
                messages = [aiMessage, ...messages]
              }
              
              return {
                ...page,
                messages,
              }
            }
            return page
          })
          
          return { ...old, pages: newPages }
        }
      )
      
      // Invalidate conversation list to update message counts
      queryClient.invalidateQueries({ 
        queryKey: ['conversations'] 
      })
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previous) {
        queryClient.setQueryData(
          messageKeys.infinite(variables.conversationId),
          context.previous
        )
      }
      
      toast.error(error.message || 'Failed to send message')
    },
  })
}

export function useGenerateImage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: generateImageFromPrompt,
    onMutate: async (variables) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: messageKeys.infinite(variables.conversationId) 
      })
      
      // Store previous value
      const previous = queryClient.getQueryData(
        messageKeys.infinite(variables.conversationId)
      )
      
      // Create optimistic loading message
      const loadingMessage: Message = {
        id: `temp-generating-${Date.now()}`,
        conversationId: variables.conversationId,
        role: 'assistant',
        content: `Generating image for: "${variables.prompt}"...`,
        createdAt: new Date(),
        metadata: { imageUrls: [] },
      }
      
      // Add loading message
      queryClient.setQueryData(
        messageKeys.infinite(variables.conversationId),
        (old: any) => {
          if (!old) {
            return {
              pages: [{ messages: [loadingMessage], hasMore: false }],
              pageParams: [undefined],
            }
          }
          
          const newPages = [...old.pages]
          newPages[0] = {
            ...newPages[0],
            messages: [loadingMessage, ...newPages[0].messages],
          }
          
          return { ...old, pages: newPages }
        }
      )
      
      return { previous, loadingId: loadingMessage.id }
    },
    onSuccess: (generatedMessage, variables, context) => {
      // Replace loading message with actual generated message
      queryClient.setQueryData(
        messageKeys.infinite(variables.conversationId),
        (old: any) => {
          if (!old) return old
          
          const newPages = old.pages.map((page: any, index: number) => {
            if (index === 0) {
              return {
                ...page,
                messages: page.messages.map((msg: Message) =>
                  msg.id === context?.loadingId ? generatedMessage : msg
                ),
              }
            }
            return page
          })
          
          return { ...old, pages: newPages }
        }
      )
      
      toast.success('Image generated successfully!')
      
      // Invalidate gallery and conversation list
      queryClient.invalidateQueries({ queryKey: ['images', 'gallery'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (error, variables, context) => {
      // Remove loading message and show error
      if (context?.previous) {
        queryClient.setQueryData(
          messageKeys.infinite(variables.conversationId),
          context.previous
        )
      }
      
      toast.error(error.message || 'Failed to generate image')
    },
  })
}

// Real-time subscription hook (for future WebSocket integration)
export function useMessagesRealtime(conversationId: string) {
  const queryClient = useQueryClient()
  
  // TODO: Implement WebSocket subscription
  // This is a placeholder for future real-time functionality
  const subscribeToMessages = (conversationId: string, callback: (message: Message) => void) => {
    // WebSocket implementation would go here
    return () => {
      // Cleanup function
    }
  }
  
  return {
    subscribeToMessages,
    // For now, we'll use polling as fallback
    enablePolling: () => {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ 
          queryKey: messageKeys.infinite(conversationId),
          refetchType: 'active'
        })
      }, 5000) // Poll every 5 seconds
      
      return () => clearInterval(interval)
    }
  }
}

// Cache Utilities
export function useMessageCache() {
  const queryClient = useQueryClient()
  
  const invalidateConversationMessages = (conversationId: string) => {
    queryClient.invalidateQueries({ 
      queryKey: messageKeys.list(conversationId) 
    })
  }
  
  const clearConversationMessages = (conversationId: string) => {
    queryClient.removeQueries({ 
      queryKey: messageKeys.list(conversationId) 
    })
  }
  
  const addMessageToCache = (conversationId: string, message: Message) => {
    queryClient.setQueryData(
      messageKeys.infinite(conversationId),
      (old: any) => {
        if (!old) {
          return {
            pages: [{ messages: [message], hasMore: false }],
            pageParams: [undefined],
          }
        }
        
        const newPages = [...old.pages]
        newPages[0] = {
          ...newPages[0],
          messages: [message, ...newPages[0].messages],
        }
        
        return { ...old, pages: newPages }
      }
    )
  }
  
  return {
    invalidateConversationMessages,
    clearConversationMessages,
    addMessageToCache,
  }
}