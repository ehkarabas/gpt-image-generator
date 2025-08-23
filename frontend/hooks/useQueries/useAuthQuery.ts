import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { SignInInput, SignUpInput } from '@/lib/validations/auth'

// Auth mutation hooks
export function useSignInMutation() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SignInInput) => {
      const supabase = createClient()
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        throw new Error(error.message)
      }

      return authData
    },
    onSuccess: async (authData) => {
      // Check if profile is soft deleted before showing welcome message
      const supabase = createClient()
      
      if (authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('deleted_at')
          .eq('id', authData.user.id)
          .single()
        
        if (profile?.deleted_at) {
          // Profile soft delete edilmiş - logout ve hata mesajı göster
          await supabase.auth.signOut()
          toast.error('Your account has been deactivated. Please contact support to restore access.')
          router.push('/auth')
          return
        } else {
          toast.success('Welcome back!')
        }
      }
      
      // Invalidate and refetch auth-related queries
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to sign in')
    }
  })
}

export function useSignUpMutation() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SignUpInput) => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          displayName: data.displayName
        }),
      })

      const responseText = await response.text()

      if (!response.ok) {
        if (responseText.startsWith('<!DOCTYPE')) {
          throw new Error('Server error - please try again')
        }
        
        try {
          const errorData = JSON.parse(responseText)
          throw new Error(errorData.error || 'Failed to create account')
        } catch {
          throw new Error('Server error - please try again')
        }
      }

      try {
        const parsedResponse = JSON.parse(responseText)
        // Signup başarılı, şimdi otomatik login yapalım
        return { ...parsedResponse, email: data.email, password: data.password }
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        throw new Error('Invalid server response')
      }
    },
    onSuccess: async (responseData) => {
      // Signup başarılı, şimdi otomatik olarak sign in yapalım
      const supabase = createClient()
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: responseData.email,
        password: responseData.password,
      })

      if (error) {
        toast.error('Account created but failed to sign in. Please sign in manually.')
        window.location.href = '/auth'
        return
      }

      // Başarılı login
      toast.success('Account created successfully! Welcome!')
      
      // Auth state invalidate et
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      
      // Ana sayfaya yönlendir
      router.push('/')
      router.refresh()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create account')
    }
  })
}

// export function useOAuthMutation() {
//   return useMutation({
//     mutationFn: async (data: { provider: 'google' | 'github' }) => {
//       const supabase = createClient()
      
//       // const { data: authData, error } = await supabase.auth.signInWithOAuth({
//       //   provider: data.provider,
//       //   options: {
//       //     redirectTo: `${window.location.origin}/api/auth/callback`
//       //   }
//       // })

//       // // Bu satıra hiç gelmez çünkü redirect olur
//       // if (error) {
//       //   throw new Error(error.message)
//       // }

//       // return authData

//       // OAuth redirect yapar, response dönmez
//       await supabase.auth.signInWithOAuth({
//         provider: data.provider,
//         options: {
//           redirectTo: `${window.location.origin}/api/auth/callback`
//         }
//       })
//     },
//     onError: (error: Error) => {
//       toast.error(error.message || `Failed to sign in with ${error.message}`)
//     }
//   })
// }

export function useSignOutMutation() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const supabase = createClient()
      
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear()
      router.push('/auth')
      router.refresh()
      toast.success('Signed out successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to sign out')
    }
  })
}