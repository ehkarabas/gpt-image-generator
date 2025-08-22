'use client'

import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordFormPage() {
  const router = useRouter()
  const params = useParams()
  
  // https://nextjs.org/docs/messages/sync-dynamic-apis
  // async function Page({ params }) {
  //   // asynchronous access of `params.id`.
  //   const { id } = await params
  // }

  // In Next.js 15, both params (a Promise prop requiring await or React.use()) and useParams (a synchronous hook) access the same dynamic route segments, differing only in their usage context and resolution method.

  // In Next.js 15, params and searchParams for dynamic routes are now provided as Promises rather than direct objects. This means components must either await these values or, in Client Components, unwrap them using React.use() before accessing their properties. This change enables better integration with asynchronous data loading patterns.

  // useParams, on the other hand, is a React Hook used in Client Components to access dynamic segments from the URL. While params was a direct object in Next.js 14 and earlier, and useParams was used synchronously, in Next.js 15 params has become asynchronous. However, useParams remains a synchronous hook and does not require await or React.use(). It is particularly useful for accessing dynamic route segments deep within the component tree where the params object is not directly passed as a prop.

  const queryClient = useQueryClient()
  const userId = params.userId as string
  const validationHash = params.validationHash as string
  
  const [isValidating, setIsValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [tokenData, setTokenData] = useState<any>(null)

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // Validate the hash on component mount
  useEffect(() => {
    const validateHash = async () => {
      try {
        // Get cached token data
        const cachedData = queryClient.getQueryData([`validation-hash-${userId}-${validationHash}`])
        
        if (!cachedData) {
          setErrorMessage('Invalid or expired reset link')
          setIsValid(false)
          setIsValidating(false)
          return
        }

        const token = cachedData as any
        
        // Check if token is expired
        if (token.expiresAt < Date.now()) {
          setErrorMessage('Reset link has expired. Please request a new one.')
          setIsValid(false)
          setIsValidating(false)
          // Clear expired token from cache
          queryClient.removeQueries({ queryKey: [`validation-hash-${userId}-${validationHash}`] })
          return
        }

        // Validate that userId and hash match
        if (token.userId !== userId || token.hash !== validationHash) {
          setErrorMessage('Invalid reset link')
          setIsValid(false)
          setIsValidating(false)
          return
        }

        setTokenData(token)
        setIsValid(true)
        setIsValidating(false)
      } catch (error) {
        console.error('Validation error:', error)
        setErrorMessage('Failed to validate reset link')
        setIsValid(false)
        setIsValidating(false)
      }
    }

    validateHash()
  }, [userId, validationHash, queryClient])

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/auth/reset-password/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          validationHash,
          newPassword: data.password,
          tokenData: tokenData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password')
      }

      // Clear the used token from cache
      queryClient.removeQueries({ queryKey: [`validation-hash-${userId}-${validationHash}`] })
      
      setSubmitStatus('success')
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth?reset=success')
      }, 2000)
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isValidating) {
    return (
      <div className="!h-screen !w-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Validating reset link...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid link state
  if (!isValid) {
    return (
      <div className="!h-screen !w-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <AlertCircle className="h-16 w-16 text-red-600 dark:text-red-400 mx-auto" />
                </motion.div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Invalid Reset Link
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {errorMessage || 'This password reset link is invalid or has expired.'}
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="pt-4"
                >
                  <Button
                    onClick={() => router.push('/auth/reset-password')}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Request New Link
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Success state
  if (submitStatus === 'success') {
    return (
      <div className="!h-screen !w-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto" />
                </motion.div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Password Reset Successful
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your password has been successfully reset. Redirecting to login...
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="pt-2"
                >
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 dark:border-green-400 mx-auto" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Reset form
  return (
    <div className="!h-screen !w-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="space-y-1">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 mb-2"
            >
              <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-2xl text-center dark:text-white">
                Set New Password
              </CardTitle>
            </motion.div>
            <CardDescription className="text-center dark:text-gray-400">
              Enter your new password below
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Form {...form}>
              <motion.form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-white">New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pr-10"
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
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-white">Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pr-10"
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
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {submitStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full dark:bg-blue-600 dark:hover:bg-blue-700"
                    disabled={isSubmitting || !form.formState.isValid}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            </Form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <Button
                onClick={() => router.push('/auth')}
                variant="link"
                className="text-sm dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Sign In
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}