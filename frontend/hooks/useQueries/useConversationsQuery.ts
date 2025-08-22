'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Types
export interface Conversation {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  message_count?: number
}

export interface CreateConversationRequest {
  userId: string
  title: string
}

export interface UpdateConversationRequest {
  id: string
  title: string
}

// Query Keys Factory
export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (userId: string) => [...conversationKeys.lists(), userId] as const,
  details: () => [...conversationKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
}

// API Functions
async function fetchConversations(userId: string): Promise<Conversation[]> {
  const response = await fetch(`/api/conversations?userId=${userId}`)
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to fetch conversations')
  }
  
  const result = await response.json()
  
  // API returns { data: [...], count, page } but we need just the array
  return Array.isArray(result) ? result : (result.data || [])
}

async function createConversation(data: CreateConversationRequest): Promise<Conversation> {
  const response = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to create conversation')
  }
  
  return response.json()
}

async function updateConversation(data: UpdateConversationRequest): Promise<Conversation> {
  const response = await fetch(`/api/conversations/${data.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: data.title }),
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update conversation')
  }
  
  return response.json()
}

async function deleteConversation(id: string): Promise<void> {
  const response = await fetch(`/api/conversations/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to delete conversation')
  }
}

// Query Hooks
export function useConversations(userId: string) {
  return useQuery({
    queryKey: conversationKeys.list(userId),
    queryFn: () => fetchConversations(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
  })
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: conversationKeys.detail(id),
    queryFn: () => fetch(`/api/conversations/${id}`).then(res => res.json()),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Mutation Hooks
export function useCreateConversation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createConversation,
    onMutate: async (variables) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: conversationKeys.list(variables.userId) 
      })
      
      // Get previous value for rollback
      const previous = queryClient.getQueryData(conversationKeys.list(variables.userId))
      
      // Optimistic update
      const optimisticConversation: Conversation = {
        id: `temp-${Date.now()}`,
        userId: variables.userId,
        title: variables.title,
        createdAt: new Date(),
        updatedAt: new Date(),
        message_count: 0,
      }
      
      queryClient.setQueryData(
        conversationKeys.list(variables.userId),
        (old: Conversation[] = []) => [optimisticConversation, ...old]
      )
      
      return { previous, optimisticId: optimisticConversation.id }
    },
    onSuccess: (newConversation, variables, context) => {
      // Replace optimistic update with real data
      queryClient.setQueryData(
        conversationKeys.list(variables.userId),
        (old: Conversation[] = []) => 
          old.map(conv => 
            conv.id === context?.optimisticId ? newConversation : conv
          )
      )
      
      toast.success('Conversation created successfully!')
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previous) {
        queryClient.setQueryData(
          conversationKeys.list(variables.userId),
          context.previous
        )
      }
      
      toast.error(error.message || 'Failed to create conversation')
    },
    onSettled: (data, error, variables) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: conversationKeys.list(variables.userId) 
      })
    }
  })
}

export function useUpdateConversation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateConversation,
    onMutate: async (variables) => {
      // Find which userId's conversations list to update
      const conversationData = queryClient.getQueriesData({
        queryKey: conversationKeys.lists()
      })
      
      const relevantUserData = conversationData.find(([queryKey, data]) => {
        const conversations = data as Conversation[]
        return conversations?.some(conv => conv.id === variables.id)
      })
      
      if (!relevantUserData) return { previous: null }
      
      const [queryKey, previous] = relevantUserData
      
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey })
      
      // Optimistic update
      queryClient.setQueryData(queryKey, (old: Conversation[] = []) =>
        old.map(conv =>
          conv.id === variables.id 
            ? { ...conv, title: variables.title, updatedAt: new Date() }
            : conv
        )
      )
      
      return { previous, queryKey }
    },
    onSuccess: (updatedConversation, variables) => {
      toast.success('Conversation updated successfully!')
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previous && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previous)
      }
      
      toast.error(error.message || 'Failed to update conversation')
    },
    onSettled: () => {
      // Refetch all conversation lists to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: conversationKeys.lists() 
      })
    }
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteConversation,
    onMutate: async (conversationId) => {
      // Find which user's conversations list contains this conversation
      const conversationData = queryClient.getQueriesData({
        queryKey: conversationKeys.lists()
      })
      
      const relevantUserData = conversationData.find(([queryKey, data]) => {
        const conversations = data as Conversation[]
        return conversations?.some(conv => conv.id === conversationId)
      })
      
      if (!relevantUserData) return { previous: null }
      
      const [queryKey, previous] = relevantUserData
      
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey })
      
      // Optimistic removal
      queryClient.setQueryData(queryKey, (old: Conversation[] = []) =>
        old.filter(conv => conv.id !== conversationId)
      )
      
      return { previous, queryKey }
    },
    onSuccess: () => {
      toast.success('Conversation deleted successfully!')
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previous && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previous)
      }
      
      toast.error(error.message || 'Failed to delete conversation')
    },
    onSettled: () => {
      // Refetch all conversation lists to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: conversationKeys.lists() 
      })
    }
  })
}

// Cache Utilities
export function useConversationCache() {
  const queryClient = useQueryClient()
  
  const invalidateUserConversations = (userId: string) => {
    queryClient.invalidateQueries({ 
      queryKey: conversationKeys.list(userId) 
    })
  }
  
  const prefetchConversation = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: conversationKeys.detail(id),
      queryFn: () => fetch(`/api/conversations/${id}`).then(res => res.json()),
      staleTime: 1000 * 60 * 5,
    })
  }
  
  const clearConversationCache = (userId: string) => {
    queryClient.removeQueries({ 
      queryKey: conversationKeys.list(userId) 
    })
  }
  
  return {
    invalidateUserConversations,
    prefetchConversation,
    clearConversationCache,
  }
}