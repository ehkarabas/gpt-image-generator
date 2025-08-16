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

export async function POST(request: NextRequest) {
  try {
    const token = await getAuthTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rls = createRlsClient(token)

    // Resolve user id from token
    const { data: userInfo, error: userErr } = await rls.auth.getUser()
    if (userErr || !userInfo?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = userInfo.user.id

    const { title } = await request.json().catch(() => ({ title: undefined as string | undefined }))
    const safeTitle = (title && String(title).trim()) || 'New Conversation'

    const { data, error } = await rls
      .from('conversations')
      .insert({ title: safeTitle, user_id: userId })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rls = createRlsClient(token)

    // Sanitize and parse pagination
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10) || 10))
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await rls
      .from('conversations')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [], count: count ?? 0 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


