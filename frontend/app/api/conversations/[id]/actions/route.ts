import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = 'force-dynamic'

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

// POST Method - Actions handler
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const id = params.id

  console.log('[ACTIONS POST] Route handler called for conversation:', id)

  try {
    const token = await getToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = getUserIdFromJwt(token)
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body
    const supa = adminClient()

    // DELETE action handler
    if (action === 'delete') {
      console.log(`[ACTIONS POST DELETE] Deleting conversation ${id} for user ${userId}`)

      const { data: conversation, error: fetchError } = await supa
        .from('conversations')
        .select('id, user_id')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (fetchError || !conversation) {
        console.log('[ACTIONS POST DELETE] Conversation not found:', fetchError?.message)
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      const { error } = await supa
        .from('conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) {
        console.log('[ACTIONS POST DELETE] Database error:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log(`[ACTIONS POST DELETE] Successfully deleted conversation ${id}`)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (err: any) {
    console.error('[ACTIONS POST] Error:', err)
    return NextResponse.json({ 
      error: err.message || 'Internal server error'
    }, { status: 500 })
  }
}