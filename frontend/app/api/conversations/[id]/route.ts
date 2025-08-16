import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

function getEnv(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing environment variable: ${key}`)
  return v
}

async function getAuthTokenFromRequest(request: NextRequest): Promise<string | null> {
  const auth = request.headers.get('authorization') || request.headers.get('Authorization')
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim()
  }
  // Fallback to cookie-based session
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

function createRlsClient(token: string): SupabaseClient {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anon = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return createClient(url, anon, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getAuthTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const rls = createRlsClient(token)

    // Ensure it exists and belongs to user implicitly via RLS delete
    const { error } = await rls.from('conversations').delete().eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


