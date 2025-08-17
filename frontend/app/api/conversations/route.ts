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

function adminClient() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const service = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
function getUserIdFromJwt(token: string): string | null {
  try {
    const payloadPart = token.split('.')[1]
    const json = Buffer.from(payloadPart.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    const payload = JSON.parse(json)
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

function getEmailFromJwt(token: string): string | null {
  try {
    const payloadPart = token.split('.')[1]
    const json = Buffer.from(payloadPart.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    const payload = JSON.parse(json)
    if (typeof payload.email === 'string' && payload.email.includes('@')) return payload.email
    return null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supa = adminClient()
  const userId = getUserIdFromJwt(token)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const jwtEmail = getEmailFromJwt(token)

  const body = await req.json().catch(() => ({} as any))
  const title = (body?.title?.toString()?.trim() || 'New Conversation').slice(0, 200)

  // Ensure profile exists; try upsert once from JWT, then fallback to admin lookup on retry
  const ensureProfile = async () => {
    let email = jwtEmail
    if (!email) {
      try {
        const adminRes: any = await (supa as any).auth.admin.getUserById(userId)
        email = adminRes?.data?.user?.email ?? null
      } catch {
        email = null
      }
    }
    if (!email) email = `${userId}@noemail.local`
    await supa.from('profiles').upsert({ id: userId, email }, { onConflict: 'id' })
  }
  await ensureProfile()

  for (let attempt = 0; attempt < 60; attempt++) {
    const { data, error } = await supa
      .from('conversations')
      .insert({ title, user_id: userId })
      .select()
      .single()
    if (!error) return NextResponse.json(data)
    if (!/foreign key|profiles/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    // FK failure: race with trigger; re-upsert profile and backoff
    await ensureProfile()
    await new Promise((r) => setTimeout(r, 300))
  }
  return NextResponse.json({ error: 'Profile not ready' }, { status: 500 })
}
export async function GET(req: NextRequest) {
  const token = await getToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supa = adminClient()
  const userId = getUserIdFromJwt(token)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10) || 10))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supa
    .from('conversations')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .range(from, to)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [], count: count ?? 0 })
}
