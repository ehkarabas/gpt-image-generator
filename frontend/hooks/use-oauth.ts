import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { toast } from 'sonner'

// hooks/useAuth.ts
export default function useOAuth() {
  const [isLoading, setIsLoading] = useState(false)

  const signInWithProvider = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Use static site URL instead of dynamic window.location.origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const redirectTo = `${siteUrl}/auth/callback`

      console.log('signInWithProvider', provider)
      console.log('siteUrl', siteUrl)
      console.log('redirectTo', redirectTo)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo
        }
      })

      if (error) {
        toast.error(`Authentication failed: ${error.message}`)
        setIsLoading(false)
        return
      }

      // Best practice: Use data.url for redirect
      if (data.url) {
        console.log('Redirecting to:', data.url)
        window.location.href = data.url
      }
      
    } catch (error) {
      console.error('OAuth error:', error)
      toast.error('Authentication failed')
      setIsLoading(false)
    }
  }

  return { signInWithProvider, isLoading }
}