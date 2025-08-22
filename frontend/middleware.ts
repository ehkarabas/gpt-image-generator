import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Tüm route protection logic'i Supabase middleware'de yapılıyor
  // Sadece session güncellemesi ve cookie yönetimi burada
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Static file'lar ve Next.js internal'ları hariç tüm route'lar
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}