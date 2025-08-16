import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChatInput } from '@/components/chat/chat-input'

// Create a more reliable mock
const mockSendMessage = vi.fn().mockResolvedValue(undefined)
const mockClearError = vi.fn()
const mockRetry = vi.fn()

// Mock the useMessages hook completely
vi.mock('@/hooks/use-messages', () => ({
  useMessages: vi.fn(() => ({
    sendMessage: mockSendMessage,
    error: null,
    clearError: mockClearError,
    retry: mockRetry,
    messages: [],
    isLoading: false,
    hasMore: false,
    loadMoreMessages: vi.fn(),
  }))
}))

describe('ChatInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders chat input form with all required elements', () => {
    render(<ChatInput />)
    
    expect(screen.getByTestId('chat-input-container')).toBeInTheDocument()
    expect(screen.getByTestId('chat-form')).toBeInTheDocument()
    expect(screen.getByTestId('chat-textarea')).toBeInTheDocument()
    expect(screen.getByTestId('send-button')).toBeInTheDocument()
    expect(screen.getByTestId('character-count')).toBeInTheDocument()
  })

  it('has correct placeholder text', () => {
    render(<ChatInput />)
    
    const textarea = screen.getByTestId('chat-textarea')
    expect(textarea).toHaveAttribute('placeholder', 'Try asking a question to get started!')
  })

  it('shows character count', () => {
    render(<ChatInput />)
    
    const characterCount = screen.getByTestId('character-count')
    expect(characterCount).toHaveTextContent('0/2000')
  })

  it('updates character count when typing', () => {
    render(<ChatInput />)
    
    const textarea = screen.getByTestId('chat-textarea')
    fireEvent.change(textarea, { target: { value: 'Hello world' } })
    
    const characterCount = screen.getByTestId('character-count')
    expect(characterCount).toHaveTextContent('11/2000')
  })

  it('disables send button when input is empty', () => {
    render(<ChatInput />)
    
    const sendButton = screen.getByTestId('send-button')
    expect(sendButton).toBeDisabled()
  })

  it('enables send button when input has text', () => {
    render(<ChatInput />)
    
    const textarea = screen.getByTestId('chat-textarea')
    const sendButton = screen.getByTestId('send-button')
    
    fireEvent.change(textarea, { target: { value: 'Hello' } })
    expect(sendButton).not.toBeDisabled()
  })

  it('calls sendMessage when form is submitted', async () => {
    render(<ChatInput />)
    
    const textarea = screen.getByTestId('chat-textarea')
    const form = screen.getByTestId('chat-form')
    
    fireEvent.change(textarea, { target: { value: 'Test message' } })
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Test message')
    })
  })

  it('clears input after sending message', async () => {
    render(<ChatInput />)
    
    const textarea = screen.getByTestId('chat-textarea') as HTMLTextAreaElement
    const form = screen.getByTestId('chat-form')
    
    fireEvent.change(textarea, { target: { value: 'Test message' } })
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(textarea.value).toBe('')
    })
  })

  it('sends message on Enter key (without Shift)', async () => {
    render(<ChatInput />)
    
    const textarea = screen.getByTestId('chat-textarea')
    
    fireEvent.change(textarea, { target: { value: 'Test message' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Test message')
    })
  })

  it('does not send message on Shift+Enter', () => {
    render(<ChatInput />)
    
    const textarea = screen.getByTestId('chat-textarea')
    
    fireEvent.change(textarea, { target: { value: 'Test message' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })
    
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('has proper accessibility attributes', () => {
    render(<ChatInput />)
    
    const textarea = screen.getByTestId('chat-textarea')
    const sendButton = screen.getByTestId('send-button')
    const characterCount = screen.getByTestId('character-count')
    
    expect(textarea).toHaveAttribute('aria-label', 'Chat message')
    expect(textarea).toHaveAttribute('aria-describedby', 'character-count')
    expect(sendButton).toHaveAttribute('aria-label', 'Send message')
    expect(characterCount).toHaveAttribute('aria-live', 'polite')
  })
})
