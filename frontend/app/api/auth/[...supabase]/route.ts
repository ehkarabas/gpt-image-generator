import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Security headers - Production için önemli
function withSecurityHeaders(response: Response): Response {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "no-referrer")
  response.headers.set("Permissions-Policy", "interest-cohort=()")
  return response
}

// CORS - API endpoint'leri için gerekli olabilir
export async function OPTIONS() {
  const res = new Response(null, { status: 204 })
  res.headers.set("Access-Control-Allow-Origin", "*")
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return withSecurityHeaders(res)
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Production forwarded host support
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      const redirectUrl = isLocalEnv 
        ? `${origin}${next}`
        : forwardedHost 
          ? `https://${forwardedHost}${next}`
          : `${origin}${next}`
      
      const redirect = NextResponse.redirect(redirectUrl)
      return withSecurityHeaders(redirect)
    }
  }

  // Error durumunda /auth/error'a redirect
  const redirect = NextResponse.redirect(`${origin}/auth/error`)
  return withSecurityHeaders(redirect)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { event, session } = await request.json()
    .catch(() => ({ event: null, session: null }))

  if (event === 'SIGNED_IN' && session) {
    // Session cookies otomatik set ediliyor
  }

  const res = Response.json({ ok: true })
  return withSecurityHeaders(res)
}