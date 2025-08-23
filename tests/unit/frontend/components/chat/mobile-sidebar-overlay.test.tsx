import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MobileSidebarOverlay } from '@/components/chat/mobile-sidebar-overlay'

// Mock React Portal - must be defined before any imports
vi.mock('react-dom', () => ({
  createPortal: vi.fn((element) => element),
}))

// Mock the ConversationSidebar component
vi.mock('@/components/chat/conversation-sidebar', () => ({
  ConversationSidebar: () => (
    <div data-testid="conversation-sidebar-mock">Sidebar Content</div>
  ),
}))

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon">×</span>,
}))

describe('MobileSidebarOverlay', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock document.body
    Object.defineProperty(document.body, 'style', {
      value: { overflow: '' },
      writable: true,
    })
  })

  afterEach(() => {
    // Clean up any DOM modifications
    document.body.style.overflow = ''
    document.removeEventListener('keydown', vi.fn())
  })

  it('renders when isOpen is true', () => {
    render(<MobileSidebarOverlay {...defaultProps} />)
    
    expect(screen.getByTestId('mobile-sidebar-overlay')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-sidebar-backdrop')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-sidebar-content')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<MobileSidebarOverlay {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByTestId('mobile-sidebar-overlay')).not.toBeInTheDocument()
  })

  it('renders conversation sidebar content', () => {
    render(<MobileSidebarOverlay {...defaultProps} />)
    
    expect(screen.getByTestId('conversation-sidebar-mock')).toBeInTheDocument()
    expect(screen.getByText('Sidebar Content')).toBeInTheDocument()
  })

  it('renders close button with correct accessibility', () => {
    render(<MobileSidebarOverlay {...defaultProps} />)
    
    const closeButton = screen.getByTestId('mobile-sidebar-close')
    expect(closeButton).toBeInTheDocument()
    expect(closeButton).toHaveAttribute('aria-label', 'Close navigation menu')
    expect(screen.getByTestId('x-icon')).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<MobileSidebarOverlay {...defaultProps} onClose={onClose} />)
    
    const backdrop = screen.getByTestId('mobile-sidebar-backdrop')
    fireEvent.click(backdrop)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<MobileSidebarOverlay {...defaultProps} onClose={onClose} />)
    
    const closeButton = screen.getByTestId('mobile-sidebar-close')
    fireEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    render(<MobileSidebarOverlay {...defaultProps} onClose={onClose} />)
    
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when other keys are pressed', () => {
    const onClose = vi.fn()
    render(<MobileSidebarOverlay {...defaultProps} onClose={onClose} />)
    
    fireEvent.keyDown(document, { key: 'Enter' })
    fireEvent.keyDown(document, { key: 'Space' })
    
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not call onClose when drawer content is clicked', () => {
    const onClose = vi.fn()
    render(<MobileSidebarOverlay {...defaultProps} onClose={onClose} />)
    
    const drawer = screen.getByTestId('mobile-sidebar-content')
    fireEvent.click(drawer)
    
    expect(onClose).not.toHaveBeenCalled()
  })

  it('prevents body scroll when open', () => {
    render(<MobileSidebarOverlay {...defaultProps} />)
    
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body scroll when closed', () => {
    const { rerender } = render(<MobileSidebarOverlay {...defaultProps} />)
    
    // Should be hidden when open
    expect(document.body.style.overflow).toBe('hidden')
    
    // Should be restored when closed
    rerender(<MobileSidebarOverlay {...defaultProps} isOpen={false} />)
    expect(document.body.style.overflow).toBe('')
  })

  it('restores body scroll on unmount', () => {
    const { unmount } = render(<MobileSidebarOverlay {...defaultProps} />)
    
    expect(document.body.style.overflow).toBe('hidden')
    
    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('adds and removes event listeners properly', async () => {
    const onClose = vi.fn()
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
    
    const { unmount } = render(<MobileSidebarOverlay {...defaultProps} onClose={onClose} />)
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })

  it('has proper CSS classes for animation', () => {
    render(<MobileSidebarOverlay {...defaultProps} />)
    
    const overlay = screen.getByTestId('mobile-sidebar-overlay')
    const backdrop = screen.getByTestId('mobile-sidebar-backdrop')
    const drawer = screen.getByTestId('mobile-sidebar-content')
    
    expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50', 'lg:hidden')
    expect(backdrop).toHaveClass('fixed', 'inset-0', 'bg-black/50')
    expect(drawer).toHaveClass('fixed', 'inset-y-0', 'left-0', 'flex', 'w-full', 'max-w-sm')
  })
})