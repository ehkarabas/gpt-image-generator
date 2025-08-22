'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { emailVerificationSchema, type EmailVerificationInput } from '@/lib/validations/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [attemptCount, setAttemptCount] = useState(0)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [remainingTime, setRemainingTime] = useState(0)

  const form = useForm<EmailVerificationInput>({
    resolver: zodResolver(emailVerificationSchema),
    mode: 'onBlur', // Focus kaybında validation
    defaultValues: {
      email: '',
    },
  })

  // Cache'den değerleri oku ve cooldown timer'ını yönet
  useEffect(() => {
    const cachedAttemptCount = queryClient.getQueryData<number>(['email-attempt-count']) || 0
    const cachedCooldownUntil = queryClient.getQueryData<number>(['email-cooldown-until'])
    
    setAttemptCount(cachedAttemptCount)
    
    if (cachedCooldownUntil && cachedCooldownUntil > Date.now()) {
      setCooldownUntil(cachedCooldownUntil)
      setRemainingTime(Math.ceil((cachedCooldownUntil - Date.now()) / 1000))
      
      // Timer countdown
      const interval = setInterval(() => {
        const remaining = Math.ceil((cachedCooldownUntil - Date.now()) / 1000)
        if (remaining <= 0) {
          setCooldownUntil(null)
          setRemainingTime(0)
          setAttemptCount(0)
          queryClient.removeQueries({ queryKey: ['email-attempt-count'] })
          queryClient.removeQueries({ queryKey: ['email-cooldown-until'] })
          clearInterval(interval)
        } else {
          setRemainingTime(remaining)
        }
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [queryClient])

  const onSubmit = async (data: EmailVerificationInput) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        // Hatalı deneme sayısını artır
        const newAttemptCount = attemptCount + 1
        // setAttemptCount((prev) => prev + 1)
        setAttemptCount(newAttemptCount)
        queryClient.setQueryData(['email-attempt-count'], newAttemptCount)
        
        // 3. hatalı denemede cooldown başlat
        if (newAttemptCount >= 3) {
          const cooldownEnd = Date.now() + (3 * 60 * 1000) // 3 dakika
          setCooldownUntil(cooldownEnd)
          setRemainingTime(180) // 3 dakika = 180 saniye
          queryClient.setQueryData(['email-cooldown-until'], cooldownEnd)
        }
        console.log('=== ERROR IN RESET PASSWORD ===', result.error)
        throw new Error(result.error || 'Failed to send reset email')
      }

      // Başarılı request - cache'leri temizle ve hash'i kaydet
      queryClient.removeQueries({ queryKey: ['email-attempt-count'] })
      queryClient.removeQueries({ queryKey: ['email-cooldown-until'] })
      setAttemptCount(0)
      setCooldownUntil(null)
      
      // Validation hash'i cache'e kaydet ve yönlendir
      if (result.tokenData) {
        const { userId, hash } = result.tokenData
        // Cache'e kaydet
        queryClient.setQueryData([`validation-hash-${userId}-${hash}`], result.tokenData)
        
        // Yönlendirme için kısa bir success göster
        setSubmitStatus('success')
        form.reset()
        
        // 1 saniye sonra yönlendir
        setTimeout(() => {
          router.push(`/auth/reset-password/${userId}/${hash}`)
        }, 1000)
      } else {
        throw new Error('No token data received')
      }
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

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
                    Verification Successful
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Redirecting you to reset your password...
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
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-2xl text-center dark:text-white">
                Reset Password
              </CardTitle>
            </motion.div>
            <CardDescription className="text-center dark:text-gray-400">
              Enter your email address and we'll send you a link to reset your password
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-white">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                          disabled={cooldownUntil !== null}
                          {...field}
                        />
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

                {cooldownUntil && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Too many failed attempts. Please wait {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')} before trying again.
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full dark:bg-blue-600 dark:hover:bg-blue-700"
                    disabled={isSubmitting || cooldownUntil !== null}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Sending Reset Link...
                      </>
                    ) : cooldownUntil ? (
                      'Please wait...'
                    ) : (
                      'Send Reset Link'
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