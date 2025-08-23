'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface GenerateImageRequest {
  prompt: string
  conversationId: string
  chatId: string
}

interface GeneratedImage {
  id: string
  prompt: string
  imageData: string
  createdAt: string
}

interface GenerateImageResponse {
  success: boolean
  image: GeneratedImage
  message: {
    id: string
    content: string
    role: string
    createdAt: string
  }
}

async function generateImage(params: GenerateImageRequest): Promise<GenerateImageResponse> {
  const response = await fetch('/api/images/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to generate image')
  }

  return response.json()
}

export function useImageGeneration() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: generateImage,
    onMutate: async (variables) => {
      // Optimistic update: add pending message immediately
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content: `🎨 Generating image for: "${variables.prompt}"...`,
        role: 'assistant',
        createdAt: new Date().toISOString(),
        isGenerating: true,
      }

      // Cancel outgoing queries for messages
      await queryClient.cancelQueries({ 
        queryKey: ['messages', variables.chatId] 
      })

      // Get current messages
      const previousMessages = queryClient.getQueryData(['messages', variables.chatId]) || []

      // Optimistically update with pending message
      queryClient.setQueryData(['messages', variables.chatId], (old: any[]) => [
        ...(old || []),
        optimisticMessage,
      ])

      return { previousMessages, optimisticMessage }
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic message with real data
      queryClient.setQueryData(['messages', variables.chatId], (old: any[]) => {
        if (!old) return [data.message]
        
        return old.map(msg => 
          msg.id === context?.optimisticMessage.id 
            ? { 
                ...data.message, 
                imageData: data.image.imageData,
                imageId: data.image.id 
              }
            : msg
        )
      })

      // Invalidate and refetch gallery data
      queryClient.invalidateQueries({ queryKey: ['gallery'] })
      
      // Invalidate conversations to update message count
      queryClient.invalidateQueries({ queryKey: ['conversations'] })

      toast.success('Görüntü başarıyla oluşturuldu!', {
        description: data.image.prompt,
      })
    },
    onError: (error, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', variables.chatId], context.previousMessages)
      }

      toast.error('Görüntü oluşturulamadı', {
        description: error.message || 'Bilinmeyen bir hata oluştu',
      })
    },
  })

  return {
    generateImage: mutation.mutate,
    generateImageAsync: mutation.mutateAsync,
    isGenerating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  }
}