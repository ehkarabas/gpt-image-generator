import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MessageList } from '@/components/chat/message-list'

describe('MessageList', () => {
  it('renders Phase 2 placeholder without crashing', () => {
    render(<MessageList />)
    expect(screen.getByTestId('message-list-placeholder')).toBeInTheDocument()
  })

  it('displays Phase 2 placeholder content', () => {
    render(<MessageList />)
    
    expect(screen.getByTestId('message-list-placeholder')).toBeInTheDocument()
    expect(screen.getByText('Start a conversation')).toBeInTheDocument()
    expect(screen.getByText('Your messages will appear here. This is a placeholder for Phase 2 testing.')).toBeInTheDocument()
  })

  it('applies custom className properly', () => {
    const customClass = 'custom-message-list'
    render(<MessageList className={customClass} />)
    
    const container = screen.getByTestId('message-list-placeholder')
    expect(container).toHaveClass(customClass)
  })

  it('has proper accessibility elements', () => {
    render(<MessageList />)
    
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('Start a conversation')
  })

  it('displays placeholder icon', () => {
    render(<MessageList />)
    
    expect(screen.getByText('💬')).toBeInTheDocument()
  })
})