import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock the hooks first
vi.mock('@/hooks/use-conversations', () => ({
  useConversations: vi.fn(() => ({
    activeConversation: null,
    switchConversation: vi.fn(),
    deleteConversation: vi.fn(),
    updateConversation: vi.fn(),
  })),
}))

// Mock the confirmation dialog
vi.mock('@/components/ui/confirmation-dialog', () => ({
  ConfirmationDialog: ({ isOpen, onConfirm, onCancel, isLoading }: any) => 
    isOpen ? (
      <div data-testid="confirmation-dialog">
        <button 
          data-testid="dialog-confirm" 
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Deleting...' : 'Delete'}
        </button>
        <button data-testid="dialog-cancel" onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}))

import { ConversationItem } from '@/components/chat/conversation-item'
import { useConversations } from '@/hooks/use-conversations'

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  MessageSquare: () => <span data-testid="message-square-icon">💬</span>,
  MoreHorizontal: () => <span data-testid="more-horizontal-icon">⋯</span>,
  Trash2: () => <span data-testid="trash-icon">🗑</span>,
  Edit2: () => <span data-testid="edit-icon">✏️</span>,
}))

// Mock the cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | boolean | undefined)[]) => 
    classes.filter(Boolean).join(' '),
}))

describe('ConversationItem', () => {
  const mockConversation = {
    id: '1',
    title: 'Test Conversation',
    message_count: 5,
    updated_at: '2024-01-15T10:00:00Z',
  }

  const defaultProps = {
    conversation: mockConversation,
    index: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders conversation item with correct structure', () => {
      render(<ConversationItem {...defaultProps} />)
      
      expect(screen.getByTestId('conversation-item')).toBeInTheDocument()
      expect(screen.getByTestId('conversation-content')).toBeInTheDocument()
      expect(screen.getByTestId('conversation-title')).toHaveTextContent('Test Conversation')
    })

    it('displays message count correctly', () => {
      render(<ConversationItem {...defaultProps} />)
      
      expect(screen.getByTestId('conversation-message-count')).toHaveTextContent('5 messages')
    })

    it('displays formatted timestamp', () => {
      render(<ConversationItem {...defaultProps} />)
      
      const timestamp = screen.getByTestId('conversation-timestamp')
      expect(timestamp).toBeInTheDocument()
      expect(timestamp).toHaveAttribute('dateTime', '2024-01-15T10:00:00Z')
    })

    it('renders edit and delete buttons', () => {
      render(<ConversationItem {...defaultProps} />)
      
      expect(screen.getByTestId('conversation-menu-button')).toBeInTheDocument()
      expect(screen.getByTestId('delete-conversation')).toBeInTheDocument()
    })
  })

  describe('Active State', () => {
    it('highlights active conversation', () => {
      vi.mocked(useConversations).mockReturnValue({
        activeConversation: mockConversation,
        switchConversation: vi.fn(),
        deleteConversation: vi.fn(),
        updateConversation: vi.fn(),
      })

      render(<ConversationItem {...defaultProps} />)
      
      const item = screen.getByTestId('conversation-item')
      expect(item).toHaveAttribute('data-active', 'true')
    })

    it('does not highlight inactive conversation', () => {
      vi.mocked(useConversations).mockReturnValue({
        activeConversation: { id: '2', title: 'Other', message_count: 1, updated_at: '2024-01-15T10:00:00Z' },
        switchConversation: vi.fn(),
        deleteConversation: vi.fn(),
        updateConversation: vi.fn(),
      })

      render(<ConversationItem {...defaultProps} />)
      
      const item = screen.getByTestId('conversation-item')
      expect(item).toHaveAttribute('data-active', 'false')
    })
  })

  describe('Conversation Selection', () => {
    it('calls switchConversation when conversation content is clicked', () => {
      const mockSwitchConversation = vi.fn()
      vi.mocked(useConversations).mockReturnValue({
        activeConversation: null,
        switchConversation: mockSwitchConversation,
        deleteConversation: vi.fn(),
        updateConversation: vi.fn(),
      })

      render(<ConversationItem {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('conversation-content'))
      
      expect(mockSwitchConversation).toHaveBeenCalledWith('1')
    })

    it('does not switch conversation when in edit mode', () => {
      const mockSwitchConversation = vi.fn()
      vi.mocked(useConversations).mockReturnValue({
        activeConversation: null,
        switchConversation: mockSwitchConversation,
        deleteConversation: vi.fn(),
        updateConversation: vi.fn(),
      })

      render(<ConversationItem {...defaultProps} />)
      
      // Enter edit mode
      fireEvent.click(screen.getByTestId('conversation-menu-button'))
      
      // Click on content while in edit mode
      fireEvent.click(screen.getByTestId('conversation-content'))
      
      expect(mockSwitchConversation).not.toHaveBeenCalled()
    })
  })

  describe('Title Editing', () => {
    it('enters edit mode when edit button is clicked', () => {
      render(<ConversationItem {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('conversation-menu-button'))
      
      expect(screen.getByTestId('conversation-title-input')).toBeInTheDocument()
      expect(screen.queryByTestId('conversation-title')).not.toBeInTheDocument()
    })

    it('saves edit on Enter key', async () => {
      const mockUpdateConversation = vi.fn()
      vi.mocked(useConversations).mockReturnValue({
        activeConversation: null,
        switchConversation: vi.fn(),
        deleteConversation: vi.fn(),
        updateConversation: mockUpdateConversation,
      })

      render(<ConversationItem {...defaultProps} />)
      
      // Enter edit mode
      fireEvent.click(screen.getByTestId('conversation-menu-button'))
      
      const input = screen.getByTestId('conversation-title-input')
      fireEvent.change(input, { target: { value: 'Updated Title' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      
      expect(mockUpdateConversation).toHaveBeenCalledWith('1', { title: 'Updated Title' })
    })

    it('cancels edit on Escape key', () => {
      render(<ConversationItem {...defaultProps} />)
      
      // Enter edit mode
      fireEvent.click(screen.getByTestId('conversation-menu-button'))
      
      const input = screen.getByTestId('conversation-title-input')
      fireEvent.change(input, { target: { value: 'Changed' } })
      fireEvent.keyDown(input, { key: 'Escape' })
      
      expect(screen.getByTestId('conversation-title')).toHaveTextContent('Test Conversation')
    })

    it('saves edit on blur', async () => {
      const mockUpdateConversation = vi.fn()
      vi.mocked(useConversations).mockReturnValue({
        activeConversation: null,
        switchConversation: vi.fn(),
        deleteConversation: vi.fn(),
        updateConversation: mockUpdateConversation,
      })

      render(<ConversationItem {...defaultProps} />)
      
      // Enter edit mode
      fireEvent.click(screen.getByTestId('conversation-menu-button'))
      
      const input = screen.getByTestId('conversation-title-input')
      fireEvent.change(input, { target: { value: 'Blurred Title' } })
      fireEvent.blur(input)
      
      expect(mockUpdateConversation).toHaveBeenCalledWith('1', { title: 'Blurred Title' })
    })
  })

  describe('Delete Functionality', () => {
    it('shows confirmation dialog when delete button is clicked', () => {
      render(<ConversationItem {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('delete-conversation'))
      
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
    })

    it('calls deleteConversation when deletion is confirmed', async () => {
      const mockDeleteConversation = vi.fn()
      vi.mocked(useConversations).mockReturnValue({
        activeConversation: null,
        switchConversation: vi.fn(),
        deleteConversation: mockDeleteConversation,
        updateConversation: vi.fn(),
      })

      render(<ConversationItem {...defaultProps} />)
      
      // Open delete dialog
      fireEvent.click(screen.getByTestId('delete-conversation'))
      
      // Confirm deletion
      fireEvent.click(screen.getByTestId('dialog-confirm'))
      
      expect(mockDeleteConversation).toHaveBeenCalledWith('1')
    })

    it('closes dialog when deletion is cancelled', () => {
      render(<ConversationItem {...defaultProps} />)
      
      // Open delete dialog
      fireEvent.click(screen.getByTestId('delete-conversation'))
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
      
      // Cancel deletion
      fireEvent.click(screen.getByTestId('dialog-cancel'))
      
      expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ConversationItem {...defaultProps} />)
      
      const item = screen.getByTestId('conversation-item')
      expect(item).toHaveAttribute('role', 'listitem')
      
      const editButton = screen.getByTestId('conversation-menu-button')
      expect(editButton).toHaveAttribute('aria-label', 'Edit conversation title')
      
      const deleteButton = screen.getByTestId('delete-conversation')
      expect(deleteButton).toHaveAttribute('aria-label', 'Delete conversation')
    })

    it('has proper input accessibility in edit mode', () => {
      render(<ConversationItem {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('conversation-menu-button'))
      
      const input = screen.getByTestId('conversation-title-input')
      expect(input).toHaveAttribute('aria-label', 'Edit conversation title')
    })
  })

  describe('Visual States', () => {
    it('updates data attributes correctly', () => {
      render(<ConversationItem {...defaultProps} />)
      
      const item = screen.getByTestId('conversation-item')
      expect(item).toHaveAttribute('data-conversation-id', '1')
      expect(item).toHaveAttribute('data-conversation-index', '0')
    })

    it('disables delete button when deleting', () => {
      render(<ConversationItem {...defaultProps} />)
      
      // Open and confirm delete
      fireEvent.click(screen.getByTestId('delete-conversation'))
      fireEvent.click(screen.getByTestId('dialog-confirm'))
      
      // Button should be disabled during deletion
      expect(screen.getByTestId('delete-conversation')).toBeDisabled()
    })
  })
})