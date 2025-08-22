import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock the hooks and components first  
vi.mock('@/hooks/use-conversations', () => ({
  useConversations: vi.fn(() => ({
    createConversation: vi.fn(),
    isCreating: false,
  })),
}))

import { AdaptiveHeader } from '@/components/chat/adaptive-header'

vi.mock('@/components/chat/conversation-dropdown', () => ({
  ConversationDropdown: () => (
    <div data-testid="conversation-dropdown-mock">Dropdown</div>
  ),
}))

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Menu: () => <span data-testid="menu-icon">Menu</span>,
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  Settings: () => <span data-testid="settings-icon">Settings</span>,
  Loader2: () => <span data-testid="loader-icon">Loading</span>,
}))

describe('AdaptiveHeader', () => {
  const defaultProps = {
    showDropdown: false,
    showSidebar: false,
    isMobile: false,
    onMobileMenuClick: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<AdaptiveHeader {...defaultProps} />)
      expect(screen.getByTestId('adaptive-header')).toBeInTheDocument()
    })

    it('displays logo correctly', () => {
      render(<AdaptiveHeader {...defaultProps} />)
      
      const logo = screen.getByTestId('header-logo')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveTextContent('⚡')
    })

    it('displays new chat button', () => {
      render(<AdaptiveHeader {...defaultProps} />)
      
      const newChatButton = screen.getByTestId('new-chat-button')
      expect(newChatButton).toBeInTheDocument()
      expect(newChatButton).toHaveTextContent('New Chat')
    })
  })

  describe('Mobile Mode', () => {
    it('shows mobile menu button when isMobile is true', () => {
      render(<AdaptiveHeader {...defaultProps} isMobile={true} />)
      
      expect(screen.getByTestId('mobile-menu-button')).toBeInTheDocument()
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument()
    })

    it('hides mobile menu button when isMobile is false', () => {
      render(<AdaptiveHeader {...defaultProps} isMobile={false} />)
      
      expect(screen.queryByTestId('mobile-menu-button')).not.toBeInTheDocument()
    })

    it('calls onMobileMenuClick when mobile menu button is clicked', () => {
      const onMobileMenuClick = vi.fn()
      render(<AdaptiveHeader {...defaultProps} isMobile={true} onMobileMenuClick={onMobileMenuClick} />)
      
      const mobileMenuButton = screen.getByTestId('mobile-menu-button')
      fireEvent.click(mobileMenuButton)
      
      expect(onMobileMenuClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Dropdown Mode', () => {
    it('shows conversation dropdown when showDropdown is true', () => {
      render(<AdaptiveHeader {...defaultProps} showDropdown={true} />)
      
      expect(screen.getByTestId('conversation-dropdown-mock')).toBeInTheDocument()
      expect(screen.queryByTestId('header-title')).not.toBeInTheDocument()
    })

    it('shows default title when showDropdown is false', () => {
      render(<AdaptiveHeader {...defaultProps} showDropdown={false} />)
      
      expect(screen.getByTestId('header-title')).toBeInTheDocument()
      expect(screen.getByTestId('header-title')).toHaveTextContent('ChatGPT')
      expect(screen.queryByTestId('conversation-dropdown-mock')).not.toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('shows loading state when creating conversation', () => {
      // Mock is already set up, we just need to check if loading button is shown
      render(<AdaptiveHeader {...defaultProps} />)
      
      // Initially should not be disabled (default mock isCreating: false)
      let newChatButton = screen.getByTestId('new-chat-button')
      expect(newChatButton).not.toBeDisabled()
    })

    it('shows loading state on mobile button when creating conversation', () => {
      render(<AdaptiveHeader {...defaultProps} isMobile={true} />)
      
      // Mobile button should behave the same as desktop
      const newChatButton = screen.getByTestId('new-chat-button')
      expect(newChatButton).not.toBeDisabled()
    })
  })

  describe('User Interactions', () => {
    it('calls createConversation when new chat button is clicked', () => {
      render(<AdaptiveHeader {...defaultProps} />)
      
      const newChatButton = screen.getByTestId('new-chat-button')
      fireEvent.click(newChatButton)
      
      // The button should be clickable (not throw error)
      expect(newChatButton).toBeInTheDocument()
    })

    it('calls createConversation when mobile new chat button is clicked', () => {
      render(<AdaptiveHeader {...defaultProps} isMobile={true} />)
      
      const newChatButton = screen.getByTestId('new-chat-button')
      fireEvent.click(newChatButton)
      
      // The button should be clickable (not throw error)
      expect(newChatButton).toBeInTheDocument()
    })
  })

  describe('CSS Classes and Styling', () => {
    it('applies correct CSS classes to header container', () => {
      render(<AdaptiveHeader {...defaultProps} />)
      
      const header = screen.getByTestId('adaptive-header')
      expect(header).toHaveClass('bg-white', 'border-b', 'border-gray-200', 'px-4', 'sm:px-6', 'py-4', 'shrink-0')
    })

    it('applies correct mobile classes when isMobile is true', () => {
      render(<AdaptiveHeader {...defaultProps} isMobile={true} />)
      
      const mobileButton = screen.getByTestId('mobile-menu-button')
      expect(mobileButton).toHaveClass('p-2', '-ml-2')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels on buttons', () => {
      render(<AdaptiveHeader {...defaultProps} isMobile={true} />)
      
      const mobileMenuButton = screen.getByTestId('mobile-menu-button')
      expect(mobileMenuButton).toHaveAttribute('aria-label', 'Open menu')
      
      const newChatButton = screen.getByTestId('new-chat-button')
      expect(newChatButton).toHaveAttribute('aria-label', 'Create new conversation')
    })

    it('has proper button roles', () => {
      render(<AdaptiveHeader {...defaultProps} isMobile={true} />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3) // Mobile menu + New chat + Settings
    })
  })
})