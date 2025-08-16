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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supa = rlsClient(token)
  const { id } = await params
  const { error } = await supa.from('conversations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}


