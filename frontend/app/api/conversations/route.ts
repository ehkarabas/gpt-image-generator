import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

function requireEnv(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing environment variable: ${key}`)
  return v
}

async function getToken(req: NextRequest): Promise<string | null> {
  const h = req.headers.get('authorization') || req.headers.get('Authorization')
  if (h && h.toLowerCase().startsWith('bearer ')) return h.slice(7).trim()
  const supabase = createRouteHandlerClient({ cookies })
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

function rlsClient(token: string) {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anon = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req: NextRequest) {
  const token = await getToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supa = rlsClient(token)
  const { data: userInfo } = await supa.auth.getUser()
  const userId = userInfo?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({} as any))
  const title = (body?.title?.toString()?.trim() || 'New Conversation').slice(0, 200)

  const { data, error } = await supa
    .from('conversations')
    .insert({ title, user_id: userId })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(req: NextRequest) {
  const token = await getToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supa = rlsClient(token)

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10) || 10))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supa
    .from('conversations')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(from, to)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [], count: count ?? 0 })
}


