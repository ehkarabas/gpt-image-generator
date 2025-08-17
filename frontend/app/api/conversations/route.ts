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

  try {
    // Step 1: Determine email
    let email = jwtEmail
    if (!email) {
      try {
        const adminRes: any = await (supa as any).auth.admin.getUserById(userId)
        email = adminRes?.data?.user?.email
      } catch {}
    }
    if (!email) {
      email = `user-${userId.slice(0, 8)}@generated.local`
    }
    
    console.log(`[API] Processing request for user ${userId} with email ${email}`)
    
    // Step 2: Ensure profile exists with upsert (always do this, don't check first)
    const profileData = {
      id: userId,
      email,
      display_name: email.split('@')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log(`[API] Upserting profile...`)
    const { error: upsertError } = await supa
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id',
        ignoreDuplicates: false // Force update
      })
    
    if (upsertError) {
      console.error(`[API] Profile upsert error:`, upsertError)
      // Don't return error here, continue to conversation creation
    }
    
    // Step 3: Small delay to ensure database consistency
    await new Promise(r => setTimeout(r, 100))
    
    // Step 4: Create conversation with multiple retry attempts
    console.log(`[API] Creating conversation...`)
    let lastError: any = null
    let conversation = null
    
    for (let attempt = 0; attempt < 10; attempt++) {
      const { data, error } = await supa
        .from('conversations')
        .insert({
          title,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (!error && data) {
        console.log(`[API] Conversation created successfully on attempt ${attempt + 1}`)
        conversation = data
        break
      }
      
      lastError = error
      console.log(`[API] Attempt ${attempt + 1} failed: ${error?.message}`)
      
      // If it's a foreign key error, retry profile creation
      if (error?.message?.includes('violates foreign key constraint')) {
        console.log(`[API] Retrying profile upsert...`)
        await supa
          .from('profiles')
          .upsert(profileData, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
      }
      
      // Exponential backoff
      const delay = Math.min(100 * Math.pow(2, attempt), 2000)
      await new Promise(r => setTimeout(r, delay))
    }
    
    if (!conversation) {
      console.error(`[API] Failed to create conversation after all attempts:`, lastError)
      return NextResponse.json({ 
        error: lastError?.message || 'Failed to create conversation',
        details: lastError
      }, { status: 500 })
    }
    
    return NextResponse.json(conversation)
    
  } catch (err: any) {
    console.error(`[API] Unexpected error:`, err)
    return NextResponse.json({ 
      error: err.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 })
  }
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
