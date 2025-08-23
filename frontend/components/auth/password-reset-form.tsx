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
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { usePasswordUpdateMutation } from '@/hooks/useMutations/usePasswordResetMutation'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const passwordResetSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export function PasswordResetForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const form = useForm<z.infer<typeof passwordResetSchema>>({
    resolver: zodResolver(passwordResetSchema),
    mode: 'onBlur',
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })
  
  const updatePasswordMutation = usePasswordUpdateMutation()

  const handleSubmit = async (values: z.infer<typeof passwordResetSchema>) => {
    // TODO: Get actual userId and validationHash from URL params or context
    const mockUserId = 'mock-user-id'
    const mockValidationHash = 'mock-hash'
    
    await updatePasswordMutation.mutateAsync({
      userId: mockUserId,
      validationHash: mockValidationHash,
      password: values.newPassword,
    })
    setSuccess(true)
  }

  const getPasswordStrength = (password: string) => {
    if (password.length < 4) return 0
    if (password.length < 6) return 1
    if (password.length < 8) return 2
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return 4
    return 3
  }

  const passwordStrength = getPasswordStrength(form.watch('newPassword'))

  if (success) {
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
                    Password Updated!
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    Your password has been successfully updated. Redirecting to homepage...
                  </p>
                </AlertDescription>
              </Alert>
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
            Update Password
          </CardTitle>
          <CardDescription className="text-center dark:text-gray-400">
            Enter your new password below
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
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-white">New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter new password"
                          disabled={updatePasswordMutation.isPending}
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
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                    <FormLabel className="dark:text-white">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm new password"
                          disabled={updatePasswordMutation.isPending}
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
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Strength Indicator */}
              {form.watch('newPassword') && (
                <div className="space-y-2">
                  <div className="flex space-x-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded ${
                          i < passwordStrength
                            ? passwordStrength === 1
                              ? 'bg-red-500'
                              : passwordStrength === 2
                              ? 'bg-yellow-500'
                              : passwordStrength === 3
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {passwordStrength === 1 && 'Weak'}
                    {passwordStrength === 2 && 'Fair'}
                    {passwordStrength === 3 && 'Good'}
                    {passwordStrength === 4 && 'Strong'}
                  </p>
                </div>
              )}

              {/* Error Display */}
              {updatePasswordMutation.error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {updatePasswordMutation.error.message}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full dark:bg-blue-600 dark:hover:bg-blue-700"
                disabled={updatePasswordMutation.isPending}
              >
                {updatePasswordMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating Password...
                  </div>
                ) : (
                  'Update Password'
                )}
              </Button>
            </motion.form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  )
}