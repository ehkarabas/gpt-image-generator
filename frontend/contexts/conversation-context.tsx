'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  useConversations as useConversationsQuery,
  useCreateConversation,
  useUpdateConversation,
  useDeleteConversation,
  type Conversation
} from '@/hooks/useQueries/useConversationsQuery'
import { useAuth } from '@/hooks/use-auth'

interface ConversationContextType {
  conversations: Conversation[]
  activeConversation: Conversation | undefined
  activeConversationId: string | null
  isLoading: boolean
  isCreating: boolean
  createConversation: () => void
  switchConversation: (id: string) => void
  updateConversation: (id: string, data: any) => void
  renameConversation: (id: string, title: string) => Promise<void>
  deleteConversation: (id: string) => void
  filteredConversations: (query: string) => Conversation[]
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined)

export function ConversationProvider({ children }: { children: ReactNode }) {
  // EXPERIMENTAL: Try to restore from sessionStorage on initial load
  const getInitialConversationId = () => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem('activeConversationId');
    } catch {
      return null;
    }
  };
  
  const [activeConversationId, setActiveConversationId] = useState<string | null>(getInitialConversationId())
  
  // Get current user ID from auth context
  const { user } = useAuth()
  
  // Only fetch conversations if user is authenticated
  const { data: conversations = [], isLoading } = useConversationsQuery(user?.id || '')
  const createMutation = useCreateConversation()
  const updateMutation = useUpdateConversation()
  const deleteMutation = useDeleteConversation()

  const activeConversation = Array.isArray(conversations) 
    ? conversations.find(c => c.id === activeConversationId) 
    : undefined

  const createConversation = () => {
    if (!user?.id) {
      console.error('Cannot create conversation: user not authenticated');
      return;
    }

    createMutation.mutate({
      userId: user.id,
      title: 'New conversation',
    }, {
      onSuccess: (newConversation) => {
        setActiveConversationId(newConversation.id)
      }
    })
  }

  const switchConversation = (id: string) => {
    // Önemli: Yeni conversation'a geçerken activeConversationId'yi güncelle
    setActiveConversationId(id)
    
    // EXPERIMENTAL: Save to sessionStorage when manually switching
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('activeConversationId', id);
      } catch (error) {
        console.warn('Failed to save activeConversationId to sessionStorage:', error);
      }
    }
  }

  const updateConversation = (id: string, data: any) => {
    updateMutation.mutate({ id, title: data.title })
  }

  const renameConversation = async (id: string, title: string) => {
    await updateMutation.mutateAsync({ id, title })
  }

  const deleteConversation = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        if (activeConversationId === id) {
          const remaining = conversations.filter(c => c.id !== id)
          setActiveConversationId(remaining[0]?.id || null)
        }
      }
    })
  }

  const filteredConversations = (query: string) => {
    return Array.isArray(conversations) 
      ? conversations.filter(c => 
          c.title.toLowerCase().includes(query.toLowerCase())
        ) 
      : []
  }

  // EXPERIMENTAL: Enhanced auto-select with sessionStorage validation
  useEffect(() => {
    // Check if saved conversation still exists in current conversations
    if (activeConversationId && conversations.length > 0) {
      const savedConversationExists = conversations.some(c => c.id === activeConversationId);
      if (!savedConversationExists) {
        // Saved conversation doesn't exist anymore, fallback to first
        const firstConversationId = conversations[0].id;
        setActiveConversationId(firstConversationId);
        // Update sessionStorage with new selection
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('activeConversationId', firstConversationId);
          } catch (error) {
            console.warn('Failed to update sessionStorage:', error);
          }
        }
      }
    } else if (!activeConversationId && conversations.length > 0) {
      // BACKUP: Original behavior - select first conversation
      const firstConversationId = conversations[0].id;
      setActiveConversationId(firstConversationId);
      // Save to sessionStorage
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('activeConversationId', firstConversationId);
        } catch (error) {
          console.warn('Failed to save to sessionStorage:', error);
        }
      }
    }
  }, [conversations]) // REMOVED activeConversationId from deps to prevent infinite loop

  return (
    <ConversationContext.Provider value={{
      conversations,
      activeConversation,
      activeConversationId,
      isLoading,
      isCreating: createMutation.isPending,
      createConversation,
      switchConversation,
      updateConversation,
      renameConversation,
      deleteConversation,
      filteredConversations,
    }}>
      {children}
    </ConversationContext.Provider>
  )
}

export function useConversations() {
  const context = useContext(ConversationContext)
  if (context === undefined) {
    throw new Error('useConversations must be used within a ConversationProvider')
  }
  return context
}