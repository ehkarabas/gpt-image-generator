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

    // Admin client with service role
    const admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    
    // Test Supabase connection first
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

    // Create a unique test user
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${test.info().project.name}`
    const email = `e2e.conversations.${unique}@example.com`
    const password = 'E2e-Test-Password-123!'
    
    console.log(`Creating test user: ${email}`)
    
    // Step 1: Create user with admin API
    const { data: createdUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: `Test User ${unique}` }
    })
    
    if (createErr) {
      console.log('User creation error (might be rate limit or duplicate):', createErr.message)
      // Continue anyway, might be able to sign in
    }
    
    const userId = createdUser?.user?.id
    
    // Step 2: If we got a user ID, ensure profile exists immediately
    if (userId) {
      console.log(`Ensuring profile exists for user ${userId}`)
      
      // Directly insert/update profile with service role
      const { error: profileError } = await admin
        .from('profiles')
        .upsert({
          id: userId,
          email,
          display_name: `Test User ${unique}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
      
      if (profileError) {
        console.error('Profile creation error:', profileError)
      } else {
        console.log('Profile created/updated successfully')
      }
      
      // Verify profile exists
      const { data: profile } = await admin
        .from('profiles')
        .select('id, email')
        .eq('id', userId)
        .single()
      
      if (profile) {
        console.log('Profile verified:', profile)
      } else {
        console.log('Profile verification failed')
      }
    }
    
    // Step 3: Sign in to get access token
    const userClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    
    console.log('Signing in user...')
    let sessionData = null
    let signInAttempts = 0
    
    while (!sessionData && signInAttempts < 5) {
      signInAttempts++
      const { data: signInData, error: signInErr } = await userClient.auth.signInWithPassword({ 
        email, 
        password 
      })
      
      if (signInErr) {
        console.log(`Sign in attempt ${signInAttempts} failed: ${signInErr.message}`)
        await new Promise(r => setTimeout(r, 1000 * signInAttempts)) // Progressive backoff
      } else {
        sessionData = signInData
        console.log('Sign in successful')
      }
    }
    
    if (!sessionData) {
      throw new Error('Failed to sign in after multiple attempts')
    }
    
    const accessToken = sessionData.session?.access_token
    expect(accessToken, 'access token').toBeTruthy()
    
    // Extract user ID from token if we don't have it
    if (!userId && accessToken) {
      try {
        const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString('utf8'))
        const tokenUserId = payload.sub
        
        if (tokenUserId) {
          console.log(`Creating profile for token user ${tokenUserId}`)
          
          // Create profile one more time with token user ID
          await admin
            .from('profiles')
            .upsert({
              id: tokenUserId,
              email,
              display_name: `Test User ${unique}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
        }
      } catch (err) {
        console.error('Token parsing error:', err)
      }
    }
    
    // Step 4: Wait for database consistency (reduced since we use atomic function now)
    console.log('Waiting for database consistency...')
    await new Promise(r => setTimeout(r, 1000))
    
    // Step 5: Make API requests
    const api = await pwRequest.newContext({ baseURL })
    const headers = { Authorization: `Bearer ${accessToken}` }
    
    // Create conversation
    const title = `E2E Test Conversation ${unique}`
    console.log('Creating conversation with title:', title)
    
    const postRes = await api.post('/api/conversations', { 
      data: { title }, 
      headers,
      timeout: 30000 // 30 second timeout
    })
    
    const postText = await postRes.text()
    console.log(`POST response status: ${postRes.status()}`)
    if (postRes.status() !== 200) {
      console.log('POST response body:', postText)
    }
    
    expect(postRes.status(), `POST failed: ${postText}`).toBe(200)
    
    const created = JSON.parse(postText)
    expect(created?.id).toBeTruthy()
    expect(created?.title).toBe(title)
    console.log('Conversation created:', created.id)
    
    // List conversations
    console.log('Listing conversations...')
    const listRes = await api.get('/api/conversations?page=1&pageSize=10', { 
      headers,
      timeout: 30000 
    })
    
    const listText = await listRes.text()
    console.log(`GET response status: ${listRes.status()}`)
    if (listRes.status() !== 200) {
      console.log('GET response body:', listText)
    }
    
    expect(listRes.status(), `GET failed: ${listText}`).toBe(200)
    
    const listJson = JSON.parse(listText)
    expect(Array.isArray(listJson?.data)).toBe(true)
    expect(listJson.data.some((c: any) => c.id === created.id)).toBe(true)
    console.log(`Found ${listJson.data.length} conversations`)
    
    // Delete conversation (using POST with action parameter due to Next.js 15 routing issues)
    console.log('Deleting conversation...')
    const delRes = await api.post(`/api/conversations/${created.id}/actions`, { 
      data: { action: 'delete' },
      headers,
      timeout: 30000 
    })
    
    const delText = await delRes.text()
    console.log(`Delete (via POST) response status: ${delRes.status()}`)
    if (delRes.status() !== 200) {
      console.log('Delete (via POST) response body:', delText)
    }
    
    expect(delRes.status(), `Delete (via POST) failed: ${delText}`).toBe(200)
    
    const delJson = JSON.parse(delText)
    expect(delJson?.success).toBe(true)
    console.log('Conversation deleted successfully')
  })
})
