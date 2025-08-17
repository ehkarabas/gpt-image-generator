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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const supa = adminClient()
  const userId = getUserIdFromJwt(token)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { id } = await params
  
  // First verify the conversation belongs to the user
  const { data: conversation, error: fetchError } = await supa
    .from('conversations')
    .select('id, user_id')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  
  if (fetchError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }
  
  // Delete the conversation
  const { error } = await supa
    .from('conversations')
    .delete()
    .eq('id', id)
    .eq('user_id', userId) // Extra safety check
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
