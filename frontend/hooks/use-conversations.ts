'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { conversationService } from '@/lib/services/conversation-service'

type Conversation = {
  id: string
  title: string
  user_id: string
  message_count: number
  created_at: string
  updated_at: string
}

export function useConversations() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: conversationService.getAll,
  })

  const createMutation = useMutation({
    mutationFn: conversationService.create,
    onSuccess: (newConversation: Conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setActiveConversationId(newConversation.id)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<Conversation, 'title'>> }) =>
      conversationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: conversationService.delete,
    onSuccess: (_: unknown, deletedId: string) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      if (activeConversationId === deletedId) {
        const remaining = conversations.filter((c) => c.id !== deletedId)
        setActiveConversationId(remaining[0]?.id || null)
      }
    },
  })

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null

  const createConversation = () => {
    createMutation.mutate({ title: 'New conversation' })
  }

  const switchConversation = (id: string) => {
    setActiveConversationId(id)
  }

  const updateConversation = (id: string, data: Partial<Pick<Conversation, 'title'>>) => {
    updateMutation.mutate({ id, data })
  }

  const deleteConversation = (id: string) => {
    deleteMutation.mutate(id)
  }

  const filteredConversations = (query: string) => {
    const q = query.toLowerCase()
    return conversations.filter((c) => c.title.toLowerCase().includes(q))
  }

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id)
    }
  }, [conversations, activeConversationId])

  return {
    conversations,
    activeConversation,
    activeConversationId,
    isLoading,
    isCreating: createMutation.isPending,
    createConversation,
    switchConversation,
    updateConversation,
    deleteConversation,
    filteredConversations,
  }
}


