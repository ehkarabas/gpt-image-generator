import { test, expect, request as pwRequest } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import path from 'path'
import fs from 'fs'

// Load frontend env for Supabase config used by Next server and tests
const frontendEnvPath = path.resolve(__dirname, '../../../frontend/.env')
if (fs.existsSync(frontendEnvPath)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: frontendEnvPath })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string

test.describe('Conversations API', () => {
  test('should create, list, and delete a conversation via API routes', async ({ request, baseURL }) => {
    expect(SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL is required').toBeTruthy()
    expect(SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required').toBeTruthy()
    expect(SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY is required').toBeTruthy()

    // 1) Create a test user via admin API (service role)
    const admin: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const unique = Date.now()
    const email = `e2e.conversations.${unique}@example.com`
    const password = 'E2e-Test-Password-123!'

    const { data: createdUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    expect(createErr, `admin.createUser failed: ${createErr?.message || ''}`).toBeNull()
    expect(createdUser?.user?.id).toBeTruthy()

    // 2) Sign in as that user to get an access token
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: signInData, error: signInErr } = await userClient.auth.signInWithPassword({ email, password })
    expect(signInErr, `signIn failed: ${signInErr?.message || ''}`).toBeNull()
    const accessToken = signInData?.session?.access_token
    expect(accessToken, 'access token').toBeTruthy()

    // Helper: authorized request with Bearer token
    const api = await pwRequest.newContext({ baseURL })
    const authHeaders = { Authorization: `Bearer ${accessToken}` }

    // 3) Create conversation (POST /api/conversations)
    const title = `E2E Test Conversation ${unique}`
    const postRes = await api.post('/api/conversations', {
      data: { title },
      headers: authHeaders,
    })
    expect(postRes.status(), await postRes.text()).toBe(200)
    const created = await postRes.json()
    expect(created?.id).toBeTruthy()
    expect(created?.title).toBe(title)

    // 4) List conversations (GET /api/conversations)
    const listRes = await api.get('/api/conversations?page=1&pageSize=10', { headers: authHeaders })
    expect(listRes.status(), await listRes.text()).toBe(200)
    const listJson = await listRes.json()
    expect(Array.isArray(listJson?.data)).toBe(true)
    const found = listJson.data.find((c: any) => c.id === created.id)
    expect(found).toBeTruthy()

    // 5) Delete conversation (DELETE /api/conversations/[id])
    const delRes = await api.delete(`/api/conversations/${created.id}`, { headers: authHeaders })
    expect(delRes.status(), await delRes.text()).toBe(200)
    const delJson = await delRes.json()
    expect(delJson?.success).toBe(true)
  })
})


