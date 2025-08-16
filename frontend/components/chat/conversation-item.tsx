'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare, MoreHorizontal, Trash2, Edit2 } from 'lucide-react'
import { useConversations } from '@/hooks/use-conversations'
import { cn } from '@/lib/utils'

interface ConversationItemProps {
  conversation: {
    id: string
    title: string
    message_count?: number
    updated_at: string
  }
  index: number
}

export function ConversationItem({ conversation, index }: ConversationItemProps) {
  const { activeConversation, switchConversation, deleteConversation, updateConversation } = useConversations()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(conversation.title)
  const [isDeleting, setIsDeleting] = useState(false)

  const isActive = activeConversation?.id === conversation.id

  const handleClick = () => {
    if (!isEditing) switchConversation(conversation.id)
  }

  const handleSaveEdit = async () => {
    const next = editTitle.trim()
    if (next && next !== conversation.title) {
      await updateConversation(conversation.id, { title: next })
    }
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      setIsDeleting(true)
      try {
        await deleteConversation(conversation.id)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors relative',
        isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
      )}
      data-testid="conversation-item"
      data-conversation-id={conversation.id}
      data-conversation-index={index}
      data-active={isActive}
      role="listitem"
    >
      <MessageSquare className={cn('h-4 w-4 shrink-0', isActive ? 'text-blue-600' : 'text-gray-400')} />
      <div className="flex-1 min-w-0" onClick={handleClick} data-testid="conversation-content">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit()
              if (e.key === 'Escape') {
                setEditTitle(conversation.title)
                setIsEditing(false)
              }
            }}
            className="w-full text-sm font-medium bg-transparent border-none outline-none focus:ring-0"
            data-testid="conversation-title-input"
            aria-label="Edit conversation title"
            autoFocus
          />
        ) : (
          <h3 className={cn('text-sm font-medium truncate', isActive ? 'text-blue-900' : 'text-gray-900')} data-testid="conversation-title">
            {conversation.title}
          </h3>
        )}

        <div className="flex items-center gap-2 mt-1">
          <span className={cn('text-xs', isActive ? 'text-blue-600' : 'text-gray-500')} data-testid="conversation-message-count">
            {conversation.message_count || 0} messages
          </span>
          <span className="text-xs text-gray-400">•</span>
          <time className={cn('text-xs', isActive ? 'text-blue-600' : 'text-gray-500')} dateTime={conversation.updated_at} data-testid="conversation-timestamp">
            {new Date(conversation.updated_at).toLocaleString()}
          </time>
        </div>
      </div>

      <div>
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity', isActive && 'opacity-100')}
          data-testid="conversation-menu-button"
          aria-label="Conversation options"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation()
            setIsEditing((v) => !v)
          }}
        >
          {isEditing ? <Edit2 className="h-3 w-3" /> : <MoreHorizontal className="h-3 w-3" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-6 w-6 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity', isActive && 'opacity-100')}
          data-testid="delete-conversation"
          aria-label="Delete conversation"
          disabled={isDeleting}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation()
            handleDelete()
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}


