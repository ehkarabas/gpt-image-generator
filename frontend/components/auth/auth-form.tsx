// Modern auth form with shadcn/ui + react-hook-form + zod validation

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'


import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Eye, EyeOff, Github, Mail, ArrowRight } from 'lucide-react'

import { signInSchema, signUpSchema, type SignInInput, type SignUpInput } from '@/lib/validations/auth'
import { useSignInMutation, useSignUpMutation } from '@/hooks/useQueries/useAuthQuery'
import useOAuth from '@/hooks/use-oauth'

type AuthMode = 'signin' | 'signup'

interface AuthFormProps {
  className?: string
}

export function AuthForm({ className }: AuthFormProps) {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Check for error or success in URL params (from middleware redirect or password reset)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    const reset = urlParams.get('reset')
    
    if (error === 'account_deactivated') {
      // Show error toast and clean URL
      import('sonner').then(({ toast }) => {
        toast.error('Your account has been deactivated. Please contact support to restore access.')
      })
      
      // Clean URL without refresh
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url.toString())
    }
    
    if (reset === 'success') {
      // Show success toast for password reset
      import('sonner').then(({ toast }) => {
        toast.success('Password reset successful! You can now sign in with your new password.')
      })
      
      // Clean URL without refresh
      const url = new URL(window.location.href)
      url.searchParams.delete('reset')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  // React Query mutations - replacing useState isLoading and message
  const signInMutation = useSignInMutation()
  const signUpMutation = useSignUpMutation()
  const { signInWithProvider, isLoading: oauthLoading } = useOAuth()

  const isLoading = signInMutation.isPending || signUpMutation.isPending || oauthLoading
  const error = signInMutation.error || signUpMutation.error

  // Form setup for both modes - onBlur validation için mode: 'onBlur' eklendi
  const signInForm = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    mode: 'onBlur', // Focus kaybında validation
    defaultValues: { email: '', password: '' }
  })

  const signUpForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur', // Focus kaybında validation
    defaultValues: { email: '', password: '', displayName: '', confirmPassword: '' }
  })

  const currentForm = mode === 'signin' ? signInForm : signUpForm

  // Sign in handler - using React Query mutation
  const handleSignIn = async (data: SignInInput) => {
    signInMutation.mutate(data, {
      onSuccess: () => {
        router.push('/')
        router.refresh()
      }
    })
  }

  // Sign up handler - using React Query mutation  
  const handleSignUp = (data: SignUpInput) => {
    signUpMutation.mutate(data)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // OAuth handlers
  const handleGoogleOAuth = () => {
    signInWithProvider('google')
  }

  const handleGitHubOAuth = () => {
    signInWithProvider('github')
  }

  const onSubmit = mode === 'signin' ? handleSignIn : handleSignUp

  return (
    <div className={className}>
      <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center dark:text-white">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </CardTitle>
          <CardDescription className="text-center dark:text-gray-400">
            {mode === 'signin'
              ? 'Enter your email and password to sign in'
              : 'Enter your email and password to create an account'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Social Authentication Buttons */}
          <div className="space-y-2">
            <div>
              <Button
                onClick={handleGoogleOAuth}
                variant="outline"
                className="w-full dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                disabled={oauthLoading}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  <span>{oauthLoading ? 'Redirecting...' : 'Continue with Google'}</span>
                </div>
              </Button>
            </div>
            <div>
              <Button
                onClick={handleGitHubOAuth}
                variant="outline"
                className="w-full dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                disabled={oauthLoading} // isLoading yerine
              >
                <div className="flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  <span>{isLoading ? 'Redirecting...' : 'Continue with GitHub'}</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background dark:bg-gray-800 px-2 text-muted-foreground dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* Sign In Form */}
          {mode === 'signin' && (
            <Form {...signInForm}>
              <form
                onSubmit={signInForm.handleSubmit(handleSignIn)}
                className="space-y-4"
              >
                {/* Email Field */}
                <FormField
                  control={signInForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-white">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={signInForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-white">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div>
                  <Button
                    type="submit"
                    className="w-full dark:bg-blue-600 dark:hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Sign in
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <Form {...signUpForm}>
              <form
                onSubmit={signUpForm.handleSubmit(handleSignUp)}
                className="space-y-4"
              >
                {/* Email Field */}
                <FormField
                  control={signUpForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-white">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Display Name Field */}
                <FormField
                  control={signUpForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-white">Display Name</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter your display name"
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={signUpForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-white">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password Field */}
                <FormField
                  control={signUpForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-white">Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div>
                  <Button
                    type="submit"
                    className="w-full dark:bg-blue-600 dark:hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating account...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Sign up
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Error Display - React Query mutations handle success via toast */}
          {error && (
            <p className="text-sm text-center text-red-500 dark:text-red-400">
              {error.message}
            </p>
          )}

          {/* Mode Switch & Links */}
          <div className="text-center space-y-2">
            <Button
              variant="link"
              onClick={() => {
                const newMode = mode === 'signin' ? 'signup' : 'signin'
                // Her iki form'u da reset et
                signInForm.reset()
                signUpForm.reset()
                setMode(newMode)
              }}
              disabled={isLoading}
              className="dark:text-blue-400 dark:hover:text-blue-300"
            >
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'
              }
            </Button>

            {/* Forgot Password Link (Sign In Only) */}
            {mode === 'signin' && (
              <div className="mt-2">
                <Button
                  variant="link"
                  onClick={() => router.push('/auth/reset-password')}
                  disabled={isLoading}
                  className="text-sm dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Forgot your password?
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}