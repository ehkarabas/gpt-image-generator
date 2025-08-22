import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock the hooks first
vi.mock('@/hooks/use-conversations', () => ({
  useConversations: vi.fn(() => ({
    conversations: [],
    activeConversation: null,
    switchConversation: vi.fn(),
  })),
}))

import { ConversationDropdown } from '@/components/chat/conversation-dropdown'
import { useConversations } from '@/hooks/use-conversations'

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  ChevronDown: ({ className }: { className?: string }) => (
    <span className={className} data-testid="chevron-down-icon">▼</span>
  ),
  MessageSquare: () => <span data-testid="message-square-icon">💬</span>,
}))

// Mock the cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | boolean | undefined)[]) => 
    classes.filter(Boolean).join(' '),
}))

describe('ConversationDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<ConversationDropdown />)
      expect(screen.getByTestId('conversation-dropdown')).toBeInTheDocument()
    })

    it('displays default title when no active conversation', () => {
      render(<ConversationDropdown />)
      
      const title = screen.getByTestId('conversation-dropdown-title')
      expect(title).toHaveTextContent('Select conversation')
    })

    it('displays active conversation title when available', () => {
      vi.mocked(useConversations).mockReturnValue({
        conversations: [{ id: '1', title: 'My Chat', message_count: 5 }],
        activeConversation: { id: '1', title: 'My Chat', message_count: 5 },
        switchConversation: vi.fn(),
      })
      
      render(<ConversationDropdown />)
      
      const title = screen.getByTestId('conversation-dropdown-title')
      expect(title).toHaveTextContent('My Chat')
    })

    it('renders trigger button with correct attributes', () => {
      render(<ConversationDropdown />)
      
      const trigger = screen.getByTestId('conversation-dropdown-trigger')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
    })
  })

  describe('Dropdown Interactions', () => {
    it('opens dropdown when trigger is clicked', () => {
      render(<ConversationDropdown />)
      
      const trigger = screen.getByTestId('conversation-dropdown-trigger')
      fireEvent.click(trigger)
      
      expect(screen.getByTestId('conversation-dropdown-menu')).toBeInTheDocument()
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    it('closes dropdown when trigger is clicked again', () => {
      render(<ConversationDropdown />)
      
      const trigger = screen.getByTestId('conversation-dropdown-trigger')
      
      // Open
      fireEvent.click(trigger)
      expect(screen.getByTestId('conversation-dropdown-menu')).toBeInTheDocument()
      
      // Close
      fireEvent.click(trigger)
      expect(screen.queryByTestId('conversation-dropdown-menu')).not.toBeInTheDocument()
    })

    it('closes dropdown on mouse leave', () => {
      render(<ConversationDropdown />)
      
      const trigger = screen.getByTestId('conversation-dropdown-trigger')
      fireEvent.click(trigger)
      
      const menu = screen.getByTestId('conversation-dropdown-menu')
      fireEvent.mouseLeave(menu)
      
      expect(screen.queryByTestId('conversation-dropdown-menu')).not.toBeInTheDocument()
    })
  })

  describe('Conversation List', () => {
    const mockConversations = [
      { id: '1', title: 'First Chat', message_count: 3 },
      { id: '2', title: 'Second Chat', message_count: 7 },
      { id: '3', title: 'Third Chat', message_count: 1 },
    ]

    beforeEach(() => {
      vi.mocked(useConversations).mockReturnValue({
        conversations: mockConversations,
        activeConversation: mockConversations[0],
        switchConversation: vi.fn(),
      })
    })

    it('renders all conversations in the dropdown', () => {
      render(<ConversationDropdown />)
      
      const trigger = screen.getByTestId('conversation-dropdown-trigger')
      fireEvent.click(trigger)
      
      const options = screen.getAllByTestId('conversation-dropdown-option')
      expect(options).toHaveLength(3)
    })

    it('displays conversation titles and message counts', () => {
      render(<ConversationDropdown />)
      
      const trigger = screen.getByTestId('conversation-dropdown-trigger')
      fireEvent.click(trigger)
      
      const optionTitles = screen.getAllByTestId('conversation-option-title')
      const optionCounts = screen.getAllByTestId('conversation-option-count')
      
      expect(optionTitles[0]).toHaveTextContent('First Chat')
      expect(optionCounts[0]).toHaveTextContent('3 messages')
      expect(optionTitles[1]).toHaveTextContent('Second Chat')
      expect(optionCounts[1]).toHaveTextContent('7 messages')
    })

    it('highlights active conversation option', () => {
      render(<ConversationDropdown />)
      
      const trigger = screen.getByTestId('conversation-dropdown-trigger')
      fireEvent.click(trigger)
      
      const activeOption = screen.getAllByTestId('conversation-dropdown-option')[0]
      expect(activeOption).toHaveAttribute('data-active', 'true')
      expect(activeOption).toHaveAttribute('aria-selected', 'true')
    })

    it('calls switchConversation when option is clicked', () => {
      const mockSwitchConversation = vi.fn()
      vi.mocked(useConversations).mockReturnValue({
        conversations: mockConversations,
        activeConversation: mockConversations[0],
        switchConversation: mockSwitchConversation,
      })
      
      render(<ConversationDropdown />)
      
      const trigger = screen.getByTestId('conversation-dropdown-trigger')
      fireEvent.click(trigger)
      
      const secondOption = screen.getAllByTestId('conversation-dropdown-option')[1]
      fireEvent.click(secondOption)
      
      expect(mockSwitchConversation).toHaveBeenCalledWith('2')
    })

    it('closes dropdown after selecting conversation', () => {
      render(<ConversationDropdown />)
      
      const trigger = screen.getByTestId('conversation-dropdown-trigger')
      fireEvent.click(trigger)
      
      const option = screen.getAllByTestId('conversation-dropdown-option')[0]
      fireEvent.click(option)
      
      expect(screen.queryByTestId('conversation-dropdown-menu')).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('handles empty conversation list gracefully', () => {
      vi.mocked(useConversations).mockReturnValue({
        conversations: [],
        activeConversation: null,
        switchConversation: vi.fn(),
      })
      
      render(<ConversationDropdown />)
      
      const trigger = screen.getByTestId('conversation-dropdown-trigger')
      fireEvent.click(trigger)
      
      const menu = screen.getByTestId('conversation-dropdown-menu')
      expect(menu).toBeInTheDocument()
      expect(screen.queryByTestId('conversation-dropdown-option')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ConversationDropdown />)
      
      const trigger = screen.getByTestId('conversation-dropdown-trigger')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
      
      fireEvent.click(trigger)
      
      const menu = screen.getByTestId('conversation-dropdown-menu')
      expect(menu).toHaveAttribute('role', 'listbox')
    })

    it('has proper option attributes', () => {
      vi.mocked(useConversations).mockReturnValue({
        conversations: [{ id: '1', title: 'Test Chat', message_count: 1 }],
        activeConversation: { id: '1', title: 'Test Chat', message_count: 1 },
        switchConversation: vi.fn(),
      })
      
      render(<ConversationDropdown />)
      
      const trigger = screen.getByTestId('conversation-dropdown-trigger')
      fireEvent.click(trigger)
      
      const option = screen.getAllByTestId('conversation-dropdown-option')[0]
      expect(option).toHaveAttribute('role', 'option')
      expect(option).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('Visual States', () => {
    it('rotates chevron icon when dropdown is open', () => {
      render(<ConversationDropdown />)
      
      const trigger = screen.getByTestId('conversation-dropdown-trigger')
      const chevron = screen.getByTestId('chevron-down-icon')
      
      // Closed state
      expect(chevron).not.toHaveClass('rotate-180')
      
      // Open state
      fireEvent.click(trigger)
      expect(chevron).toHaveClass('rotate-180')
    })

    it('updates data attributes correctly', () => {
      render(<ConversationDropdown />)
      
      const dropdown = screen.getByTestId('conversation-dropdown')
      expect(dropdown).toHaveAttribute('data-open', 'false')
      
      const trigger = screen.getByTestId('conversation-dropdown-trigger')
      fireEvent.click(trigger)
      
      expect(dropdown).toHaveAttribute('data-open', 'true')
    })
  })
})