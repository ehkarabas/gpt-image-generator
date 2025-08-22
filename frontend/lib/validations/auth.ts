import { z } from 'zod'

// Sign In Schema
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .min(6, { message: 'Password must be at least 6 characters' })
})

// Sign Up Schema - same structure as signIn to prevent typing issues
export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .min(6, { message: 'Password must be at least 6 characters' }),
  displayName: z
    .string()
    .min(1, { message: 'Display name is required' })
    .min(2, { message: 'Display name must be at least 2 characters' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'Please confirm your password' })
})

// Password Reset Schema
export const passwordResetSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' })
})

// Email Verification Schema (for password reset process)
export const emailVerificationSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' })
})

// Password Update Schema
export const passwordUpdateSchema = z
  .object({
    password: z
      .string()
      .min(1, { message: 'Password is required' })
      .min(6, { message: 'Password must be at least 6 characters' })
      .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Please confirm your password' })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  })

// Type exports
export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type PasswordResetInput = z.infer<typeof passwordResetSchema>
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>