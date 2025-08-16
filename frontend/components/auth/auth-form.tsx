'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase/client'

type AuthFormProps = {
  className?: string
}

export function AuthForm({ className }: AuthFormProps) {
  return (
    <div className={className ?? 'w-full max-w-md mx-auto p-4 rounded-lg border'}>
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: 'hsl(0 0% 9%)',
                brandAccent: 'hsl(0 0% 20%)'
              }
            }
          }
        }}
        providers={['github', 'google']}
        onlyThirdPartyProviders={false}
        view="sign_in"
        localization={{
          variables: {
            sign_in: {
              email_label: 'Email',
              password_label: 'Password'
            }
          }
        }}
      />
    </div>
  )
}

export default AuthForm


