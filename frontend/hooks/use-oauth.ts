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

      console.log('signInWithProvider', provider)
      console.log('window.location.origin', window.location.origin)
      console.log('redirectTo', `${window.location.origin}/auth/callback`)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        toast.error(`Authentication failed: ${error.message}`)
        setIsLoading(false)
      }
      // Success durumunda redirect olur, setIsLoading(false) gerekmez
    } catch (error) {
      toast.error('Authentication failed')
      setIsLoading(false)
    }
  }

  return { signInWithProvider, isLoading }
}