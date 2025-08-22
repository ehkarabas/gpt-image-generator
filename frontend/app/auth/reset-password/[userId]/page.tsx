// frontend/app/auth/reset-password/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { PasswordResetForm } from '@/components/auth/password-reset-form'
import { useAuth } from '@/hooks/use-auth'

export default function ResetPasswordPage() {
  const { isPasswordRecovery, isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Eğer password recovery mode değilse ve authenticated değilse auth page'e redirect et
    if (!isPasswordRecovery && !isAuthenticated) {
      router.push('/auth')
      return
    }

    // Eğer user authenticated ama password recovery mode değilse ana sayfaya redirect et
    if (isAuthenticated && !isPasswordRecovery) {
      router.push('/')
      return
    }
  }, [isPasswordRecovery, isAuthenticated, router])

  // Loading state - auth state henüz determine edilmemiş
  if (!isPasswordRecovery && !isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-8 rounded-full mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-background dark:bg-gray-900 overflow-auto">
      <div className="min-h-full w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 lg:gap-8 w-full max-w-2xl mx-auto">
          {/* Header Section */}
          <motion.div
            className="text-center space-y-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="flex items-center justify-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=80&h=80&fit=crop&crop=face" alt="GPT Logo" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                  AI
                </AvatarFallback>
              </Avatar>
              <h1 className="text-3xl font-bold tracking-tight dark:text-white">
                GPT Image Generator
              </h1>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold dark:text-white">
                Reset Your Password
              </h2>
              <p className="text-muted-foreground dark:text-gray-400">
                {user?.email && (
                  <>
                    Setting new password for <span className="font-medium">{user.email}</span>
                  </>
                )}
              </p>
            </div>
          </motion.div>

          {/* Password Reset Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <PasswordResetForm />
          </motion.div>
        </div>
      </div>
    </div>
  )
}