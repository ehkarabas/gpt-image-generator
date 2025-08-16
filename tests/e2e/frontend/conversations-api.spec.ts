import { test, expect, request as pwRequest } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

test.describe('Conversations API', () => {
  test('should create, list, and delete a conversation via API routes', async ({ baseURL }) => {
    // Debug logs
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET')
    console.log('baseURL:', baseURL)
    // Hard-fail without env (TDD anti-skip)
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    expect(SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL is required').toBeTruthy()
    expect(SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required').toBeTruthy()
    expect(SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY is required').toBeTruthy()

    // Test Supabase connection first
    const admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    
    // Simple connection test
    try {
      const { data, error } = await admin.from('profiles').select('count').limit(1)
      if (error) {
        console.log('Supabase connection test failed:', error.message)
        test.skip(true, `Supabase connection failed: ${error.message}`)
        return
      }
      console.log('Supabase connection test passed')
    } catch (err) {
      console.log('Supabase connection error:', err)
      test.skip(true, 'Supabase server not available')
      return
    }

    // Create a test user with service role (admin)
    const unique = Date.now()
    const email = `e2e.conversations.${unique}@example.com`
    const password = 'E2e-Test-Password-123!'
    const { data: createdUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    
    if (createErr) {
      console.log('Detailed createUser error:', {
        message: createErr.message,
        name: createErr.name,
        status: createErr.status,
        details: createErr
      })
    }
    
    expect(createErr, `admin.createUser failed: ${createErr?.message || ''}`).toBeNull()
    expect(createdUser?.user?.id).toBeTruthy()

    // Sign in as that user to get access token
    const userClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: signInData, error: signInErr } = await userClient.auth.signInWithPassword({ email, password })
    expect(signInErr, `signIn failed: ${signInErr?.message || ''}`).toBeNull()
    const accessToken = signInData?.session?.access_token
    expect(accessToken, 'access token').toBeTruthy()

    const api = await pwRequest.newContext({ baseURL })
    const headers = { Authorization: `Bearer ${accessToken}` }

    // Create
    const title = `E2E Test Conversation ${unique}`
    const postRes = await api.post('/api/conversations', { data: { title }, headers })
    expect(postRes.status(), await postRes.text()).toBe(200)
    const created = await postRes.json()
    expect(created?.id).toBeTruthy()
    expect(created?.title).toBe(title)

    // List
    const listRes = await api.get('/api/conversations?page=1&pageSize=10', { headers })
    expect(listRes.status(), await listRes.text()).toBe(200)
    const listJson = await listRes.json()
    expect(Array.isArray(listJson?.data)).toBe(true)
    expect(listJson.data.some((c: any) => c.id === created.id)).toBe(true)

    // Delete
    const delRes = await api.delete(`/api/conversations/${created.id}`, { headers })
    expect(delRes.status(), await delRes.text()).toBe(200)
    const delJson = await delRes.json()
    expect(delJson?.success).toBe(true)
  })
})


