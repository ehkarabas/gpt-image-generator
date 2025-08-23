import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: createServerClient ve supabase.auth.getUser() arasına 
  // başka kod yazmamalıyız - session termination problemlerine neden olur
  
  // Authentication check
  const { data: { user } } = await supabase.auth.getUser()

  // Profile deletedAt check - user varsa profile'ın soft delete olup olmadığını kontrol et
  let profileDeleted = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('deleted_at')
      .eq('id', user.id)
      .single()
    
    // Profile soft delete edilmişse (deletedAt var) auth sayfasına yönlendir
    profileDeleted = profile?.deleted_at !== null
  }

  // Route protection logic - CLAUDE.local.md gereksinimlerine göre
  const pathname = request.nextUrl.pathname

  // Public routes - auth gerektirmeyen (static)
  const publicRoutes = ['/auth', '/api/auth', '/api/health', '/api/supabase']
  
  // Dynamic route patterns - RegExp ile dynamic routes destekleniyor
  const authRoutePatterns = [
    /^\/auth\/reset-password(\/.*)?$/, // /auth/reset-password ve /auth/reset-password/[userId]
    /^\/auth\/callback(\/.*)?$/,       // Supabase callback routes
    /^\/api\/auth\/reset-password(\/.*)?$/, // Reset password API endpoint'leri - ÇOK ÖNEMLİ!
  ]
  
  // Combined public route check: static + dynamic patterns
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route)) || 
    authRoutePatterns.some(pattern => pattern.test(pathname))



  // Profile soft delete edilmişse auth sayfasına yönlendir (logout benzeri davranış)
  if (user && profileDeleted && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    // Add query parameter to show error message on auth page
    url.searchParams.set('error', 'account_deactivated')
    return NextResponse.redirect(url)
  }

  // Auth kullanıcıları auth sayfalarından uzak tut (ama profile deleted değilse)
  if (user && !profileDeleted && pathname.startsWith('/auth') && pathname !== '/auth/callback') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Eğer kullanıcı yok ve route protected ise auth sayfasına yönlendir
  // VEYA user var ama profile soft delete edilmişse
  if ((!user || profileDeleted) && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }



  // IMPORTANT: supabaseResponse'u değiştirmeden döndürmeliyiz
  // Cookie sync'i korunması için kritik
  return supabaseResponse
}