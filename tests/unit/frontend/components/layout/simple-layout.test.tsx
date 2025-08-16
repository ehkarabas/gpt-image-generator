import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdaptiveLayout } from '@/components/chat/layouts/adaptive-layout'

vi.mock('@/components/chat/chat-interface', () => ({
  ChatInterface: () => <div data-testid="chat-interface-mock" />,
}))

vi.mock('@/hooks/use-conversations', () => ({
  useConversations: () => ({
    conversations: [],
    activeConversation: null,
    activeConversationId: null,
    isLoading: false,
    isCreating: false,
    createConversation: () => {},
    switchConversation: () => {},
    updateConversation: () => {},
    deleteConversation: () => {},
    filteredConversations: () => [],
  }),
}))

describe('AdaptiveLayout', () => {
  it('renders sidebar when showSidebar=true and not mobile', () => {
    render(<AdaptiveLayout showSidebar={true} showDropdown={true} isMobile={false} />)
    expect(screen.getByTestId('desktop-sidebar')).toBeDefined()
  })

  it('hides sidebar on mobile by default', () => {
    render(<AdaptiveLayout showSidebar={true} showDropdown={true} isMobile={true} />)
    expect(screen.queryByTestId('desktop-sidebar')).toBeNull()
  })
})

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SimpleLayout } from '@/components/layout/simple-layout'

describe('SimpleLayout', () => {
  it('renders layout container with proper test id', () => {
    render(
      <SimpleLayout>
        <div>Test content</div>
      </SimpleLayout>
    )
    
    expect(screen.getByTestId('simple-layout-container')).toBeInTheDocument()
  })

  it('renders children content correctly', () => {
    render(
      <SimpleLayout>
        <div>Test content</div>
        <p>Another element</p>
      </SimpleLayout>
    )
    
    expect(screen.getByText('Test content')).toBeInTheDocument()
    expect(screen.getByText('Another element')).toBeInTheDocument()
  })

  it('applies default styling classes', () => {
    render(
      <SimpleLayout>
        <div>Content</div>
      </SimpleLayout>
    )
    
    const container = screen.getByTestId('simple-layout-container')
    expect(container).toHaveClass('min-h-screen', 'bg-gray-50', 'flex', 'flex-col')
  })

  it('renders header section correctly', () => {
    render(
      <SimpleLayout>
        <div>Content</div>
      </SimpleLayout>
    )
    
    expect(screen.getByTestId('layout-header')).toBeInTheDocument()
    expect(screen.getByText('GPT Image Generator')).toBeInTheDocument()
  })

  it('renders main content area', () => {
    render(
      <SimpleLayout>
        <div data-testid="main-content">Main content</div>
      </SimpleLayout>
    )
    
    expect(screen.getByTestId('layout-main')).toBeInTheDocument()
    expect(screen.getByTestId('main-content')).toBeInTheDocument()
  })

  it('applies custom className when provided', () => {
    const customClass = 'custom-layout'
    render(
      <SimpleLayout className={customClass}>
        <div>Content</div>
      </SimpleLayout>
    )
    
    const container = screen.getByTestId('simple-layout-container')
    expect(container).toHaveClass(customClass)
  })

  it('renders with proper semantic structure', () => {
    render(
      <SimpleLayout>
        <div>Content</div>
      </SimpleLayout>
    )
    
    const header = screen.getByRole('banner')
    const main = screen.getByRole('main')
    
    expect(header).toBeInTheDocument()
    expect(main).toBeInTheDocument()
  })

  it('header contains correct navigation elements', () => {
    render(
      <SimpleLayout>
        <div>Content</div>
      </SimpleLayout>
    )
    
    expect(screen.getByTestId('layout-header')).toBeInTheDocument()
    expect(screen.getByText('GPT Image Generator')).toBeInTheDocument()
  })

  it('main content area is scrollable', () => {
    render(
      <SimpleLayout>
        <div>Content</div>
      </SimpleLayout>
    )
    
    const main = screen.getByTestId('layout-main')
    expect(main).toHaveClass('flex-1', 'overflow-hidden')
  })

  it('handles empty children gracefully', () => {
    render(
      <SimpleLayout>
        {null}
      </SimpleLayout>
    )
    
    expect(screen.getByTestId('simple-layout-container')).toBeInTheDocument()
    expect(screen.getByTestId('layout-main')).toBeInTheDocument()
  })

  it('renders footer when provided', () => {
    render(
      <SimpleLayout showFooter={true}>
        <div>Content</div>
      </SimpleLayout>
    )
    
    expect(screen.getByTestId('layout-footer')).toBeInTheDocument()
  })

  it('does not render footer by default', () => {
    render(
      <SimpleLayout>
        <div>Content</div>
      </SimpleLayout>
    )
    
    expect(screen.queryByTestId('layout-footer')).not.toBeInTheDocument()
  })

  it('supports fullWidth mode', () => {
    render(
      <SimpleLayout fullWidth={true}>
        <div>Content</div>
      </SimpleLayout>
    )
    
    const main = screen.getByTestId('layout-main')
    expect(main).toHaveClass('w-full')
  })

  it('applies container max-width by default', () => {
    render(
      <SimpleLayout>
        <div>Content</div>
      </SimpleLayout>
    )
    
    const main = screen.getByTestId('layout-main')
    expect(main).toHaveClass('max-w-7xl', 'mx-auto')
  })
})
