'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Types
export interface EmailVerificationRequest {
  email: string
}

export interface PasswordResetRequest {
  userId: string
  validationHash: string
  password: string
}

export interface PasswordValidationRequest {
  userId: string
  validationHash: string
  tokenData?: any
}

// Query Keys
export const passwordResetKeys = {
  all: ['password-reset'] as const,
  verification: () => [...passwordResetKeys.all, 'verification'] as const,
  validation: (userId: string, hash: string) => 
    [...passwordResetKeys.all, 'validation', userId, hash] as const,
  update: () => [...passwordResetKeys.all, 'update'] as const,
}

// API Functions
async function sendPasswordResetEmail(data: EmailVerificationRequest) {
  const response = await fetch('/api/auth/reset-password/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to send reset email')
  }
  
  return response.json()
}

async function validatePasswordResetToken(data: PasswordValidationRequest) {
  const response = await fetch('/api/auth/reset-password/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to validate token')
  }
  
  return response.json()
}

async function updatePassword(data: PasswordResetRequest) {
  const response = await fetch('/api/auth/reset-password/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update password')
  }
  
  return response.json()
}

// Mutation Hooks
export function usePasswordResetEmailMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: sendPasswordResetEmail,
    onSuccess: (data) => {
      // Store token data in React Query cache for validation
      if (data.tokenData) {
        queryClient.setQueryData(
          ['password-reset-token', data.tokenData.userId], 
          data.tokenData
        )
      }
      toast.success('Password reset email sent successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send reset email')
    }
  })
}

export function usePasswordValidationMutation() {
  return useMutation({
    mutationFn: validatePasswordResetToken,
    onError: (error: Error) => {
      toast.error(error.message || 'Invalid or expired reset token')
    }
  })
}

export function usePasswordUpdateMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updatePassword,
    onSuccess: (data) => {
      // Clear all password reset related cache
      queryClient.removeQueries({ queryKey: passwordResetKeys.all })
      queryClient.removeQueries({ queryKey: ['password-reset-token'] })
      
      toast.success('Password updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update password')
    }
  })
}

// Cache utilities
export function usePasswordResetTokenCache(userId?: string) {
  const queryClient = useQueryClient()
  
  const getTokenData = () => {
    if (!userId) return null
    return queryClient.getQueryData(['password-reset-token', userId])
  }
  
  const setTokenData = (tokenData: any) => {
    if (!userId) return
    queryClient.setQueryData(['password-reset-token', userId], tokenData)
  }
  
  const clearTokenData = () => {
    if (!userId) return
    queryClient.removeQueries({ queryKey: ['password-reset-token', userId] })
  }
  
  return { getTokenData, setTokenData, clearTokenData }
}