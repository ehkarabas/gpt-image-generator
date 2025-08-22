// Development auth bypass for testing
import { NextRequest } from 'next/server'

export function getDevTestUser(request: NextRequest) {
  // Development mode'da test header kontrolü
  if (process.env.NODE_ENV === 'development') {
    const testHeader = request.headers.get('x-test-user-id')
    const testEmail = request.headers.get('x-test-user-email')
    
    if (testHeader === 'ee1dc83c-1f8a-4faa-909c-a06c7241eca2' && testEmail === 'test@test.com') {
      return {
        user: {
          id: 'ee1dc83c-1f8a-4faa-909c-a06c7241eca2',
          email: 'test@test.com',
          aud: 'authenticated',
          role: 'authenticated'
        },
        error: null
      }
    }
  }
  
  return null
}