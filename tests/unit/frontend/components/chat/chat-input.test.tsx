import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChatInput } from '@/components/chat/chat-input'

describe('ChatInput', () => {
  it('renders Phase 2 placeholder without crashing', () => {
    render(<ChatInput />)
    expect(screen.getByTestId('chat-input-placeholder')).toBeInTheDocument()
  })

  it('displays Phase 2 placeholder content', () => {
    render(<ChatInput />)
    
    expect(screen.getByTestId('chat-input-placeholder')).toBeInTheDocument()
    expect(screen.getByTestId('message-input-placeholder')).toBeInTheDocument()
    expect(screen.getByTestId('send-button-placeholder')).toBeInTheDocument()
    expect(screen.getByText('Message input will be implemented in Phase 3')).toBeInTheDocument()
  })

  it('has disabled input and button', () => {
    render(<ChatInput />)
    
    const input = screen.getByTestId('message-input-placeholder')
    const button = screen.getByTestId('send-button-placeholder')
    
    expect(input).toBeDisabled()
    expect(button).toBeDisabled()
  })

  it('displays placeholder text', () => {
    render(<ChatInput />)
    
    const input = screen.getByPlaceholderText('Type your message here... (Phase 3 feature)')
    expect(input).toBeInTheDocument()
  })

  it('applies custom className properly', () => {
    const customClass = 'custom-chat-input'
    render(<ChatInput className={customClass} />)
    
    const container = screen.getByTestId('chat-input-placeholder')
    expect(container).toHaveClass(customClass)
  })

  it('has proper accessibility elements', () => {
    render(<ChatInput />)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })
})