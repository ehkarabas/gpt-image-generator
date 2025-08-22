"use client";

import { Message } from '@/lib/db/schema';
import { 
  useMessages as useMessagesQuery,
  useSendMessage,
  useGenerateImage,
  type Message as QueryMessage
} from './useQueries/useMessagesQuery';

// Service logic moved to useQueries/useMessagesQuery.ts

export function useMessages(conversationId: string | null) {
  // Use new React Query infinite query hook
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessagesQuery(conversationId || '')
  
  const sendMutation = useSendMessage()
  const generateImageMutation = useGenerateImage()

  // Flatten pages into single message array for backward compatibility
  const messages = data?.pages.flatMap(page => page.messages) || []

  const sendMessage = (content: string, role: 'user' | 'assistant' = 'user') => {
    if (!conversationId) {
      throw new Error('No active conversation')
    }
    
    return sendMutation.mutate({
      conversationId,
      content,
      role,
    })
  }

  const generateImage = (prompt: string) => {
    if (!conversationId) {
      throw new Error('No active conversation')
    }
    
    return generateImageMutation.mutate({
      conversationId,
      prompt,
    })
  }

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    generateImage,
    isSending: sendMutation.isPending,
    isGenerating: generateImageMutation.isPending,
    sendError: sendMutation.error,
    generateError: generateImageMutation.error,
    // Additional pagination methods for future use
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  }
}