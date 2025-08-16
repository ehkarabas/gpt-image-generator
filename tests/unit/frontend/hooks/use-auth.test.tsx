import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase client using factory function with singleton `from` return
const fromReturn = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

vi.mock('@/lib/supabase/client', () => ({
  default: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => fromReturn),
  }
}))

import { useAuth } from '@/hooks/use-auth'
import supabase from '@/lib/supabase/client'

// Get the mocked functions
const mockAuth = supabase.auth as any
const mockFrom = supabase.from as any
// Expose singleton for chaining expectations
const mockFromReturn = fromReturn as any

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: {
    display_name: 'John Doe',
    avatar_url: 'https://example.com/avatar.png'
  }
}

const mockSession = {
  user: mockUser,
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token'
}

const mockProfile = {
  user_id: 'user-123',
  display_name: 'John Doe',
  avatar_url: 'https://example.com/avatar.png',
  created_at: '2024-01-15T10:30:00Z'
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock responses
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
  })

  it('initializes with null user when not authenticated', async () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.user).toBeNull()
    expect(result.current.profile).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('loads user and profile when authenticated', async () => {
    mockAuth.getSession.mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    })
    mockFromReturn.single.mockResolvedValue({ 
      data: mockProfile, 
      error: null 
    })

    const { result } = renderHook(() => useAuth())
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.profile).toEqual(mockProfile)
    expect(result.current.session).toEqual(mockSession)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('handles sign in with email and password', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null
    })
    mockFromReturn.single.mockResolvedValue({ 
      data: mockProfile, 
      error: null 
    })

    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.signIn('test@example.com', 'password123')
    })

    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
    expect(result.current.error).toBeNull()
  })

  it('handles sign in errors correctly', async () => {
    const signInError = { message: 'Invalid login credentials' }
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: signInError
    })

    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.signIn('test@example.com', 'wrongpassword')
    })

    expect(result.current.error).toEqual(signInError)
    expect(result.current.user).toBeNull()
  })

  it('handles sign up with email and password', async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null
    })

    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.signUp('newuser@example.com', 'password123', {
        display_name: 'New User'
      })
    })

    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'password123',
      options: {
        data: {
          display_name: 'New User'
        }
      }
    })
    expect(result.current.error).toBeNull()
  })

  it('handles sign up errors correctly', async () => {
    const signUpError = { message: 'User already registered' }
    mockAuth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: signUpError
    })

    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.signUp('existing@example.com', 'password123')
    })

    expect(result.current.error).toEqual(signUpError)
    expect(result.current.user).toBeNull()
  })

  it('handles OAuth sign in', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({
      data: { provider: 'google', url: 'https://oauth-url.com' },
      error: null
    })

    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.signInWithOAuth('google')
    })

    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('/auth/callback')
      }
    })
  })

  it('handles sign out correctly', async () => {
    // First set up authenticated state
    mockAuth.getSession.mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    })
    
    const { result } = renderHook(() => useAuth())
    
    // Mock successful sign out
    mockAuth.signOut.mockResolvedValue({ error: null })
    
    await act(async () => {
      await result.current.signOut()
    })

    expect(mockAuth.signOut).toHaveBeenCalled()
  })

  it('clears error when clearError is called', async () => {
    const { result } = renderHook(() => useAuth())
    
    // Set an error
    await act(async () => {
      await result.current.signIn('test@example.com', 'wrongpassword')
    })
    
    expect(result.current.error).toBeTruthy()
    
    // Clear the error
    act(() => {
      result.current.clearError()
    })
    
    expect(result.current.error).toBeNull()
  })

  it('updates profile correctly', async () => {
    mockAuth.getSession.mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    })
    mockFromReturn.single.mockResolvedValue({ 
      data: mockProfile, 
      error: null 
    })

    const { result } = renderHook(() => useAuth())
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const updatedProfile = { ...mockProfile, display_name: 'Updated Name' }
    mockFromReturn.single.mockResolvedValue({ 
      data: updatedProfile, 
      error: null 
    })

    await act(async () => {
      await result.current.updateProfile({ display_name: 'Updated Name' })
    })

    expect(result.current.profile?.display_name).toBe('Updated Name')
  })

  it('handles auth state changes correctly', async () => {
    mockAuth.onAuthStateChange.mockImplementation((callback) => {
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    mockFromReturn.single.mockResolvedValue({ data: mockProfile, error: null })

    const { result } = renderHook(() => useAuth())

    // Ensure subscription set
    expect(mockAuth.onAuthStateChange).toHaveBeenCalled()
    const cb = mockAuth.onAuthStateChange.mock.calls[0][0]

    await act(async () => {
      await cb('SIGNED_IN', mockSession)
    })

    await waitFor(() => {
      // Verify our auth change handler executed by checking profile load side-effect
      expect(mockFrom).toHaveBeenCalledWith('profiles')
    })
  })

  it('provides loading state during authentication operations', async () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.isLoading).toBe(true)
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('handles profile creation for new users', async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null
    })
    mockAuth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })
    mockFromReturn.single
      .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // Profile not found
      .mockResolvedValueOnce({ data: mockProfile, error: null }) // After creation

    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.signUp('newuser@example.com', 'password123', {
        display_name: 'New User'
      })
    })

    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockFromReturn.insert).toHaveBeenCalled()
  })
})
