// frontend/components/auth/PasswordResetRequest.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { usePasswordResetEmailMutation } from '@/hooks/useMutations/usePasswordResetMutation'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

interface PasswordResetRequestProps {
  onBackToSignIn: () => void
}

export function PasswordResetRequest({ onBackToSignIn }: PasswordResetRequestProps) {
  const [emailSent, setEmailSent] = useState(false)
  
  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
    },
  })
  
  const resetEmailMutation = usePasswordResetEmailMutation()

  const handleSubmit = async (values: z.infer<typeof emailSchema>) => {
    await resetEmailMutation.mutateAsync(values)
    setEmailSent(true)
  }

  const handleResend = async () => {
    const email = form.getValues('email')
    if (email) {
      await resetEmailMutation.mutateAsync({ email })
    }
  }

  if (emailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <Alert className="border-green-200 dark:border-green-800">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto" />
                <AlertDescription className="text-center">
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mt-3">
                    Check your email
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    We&apos;ve sent a password reset link to your email address.
                  </p>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Button
                  onClick={handleResend}
                  variant="outline"
                  className="w-full dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                  disabled={resetEmailMutation.isPending}
                >
                  Resend email
                </Button>
                
                <Button
                  onClick={onBackToSignIn}
                  variant="ghost"
                  className="w-full dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center dark:text-white">
            Reset Password
          </CardTitle>
          <CardDescription className="text-center dark:text-gray-400">
            Enter your email address and we&apos;ll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <motion.form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-white">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        disabled={resetEmailMutation.isPending}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Error Display */}
              {resetEmailMutation.error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {resetEmailMutation.error.message}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full dark:bg-blue-600 dark:hover:bg-blue-700"
                disabled={resetEmailMutation.isPending}
              >
                {resetEmailMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending email...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Mail className="mr-2 h-4 w-4" />
                    Send reset email
                  </div>
                )}
              </Button>
            </motion.form>
          </Form>

          <Separator />

          <Button
            onClick={onBackToSignIn}
            variant="ghost"
            className="w-full dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}