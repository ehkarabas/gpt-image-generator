import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

/**
 * API routes için gelişmiş authentication helper
 * Service role token'ı ve normal JWT token'ları destekler
 */
export async function getAuthUser(request: NextRequest): Promise<{
  user: AuthUser | null;
  supabase: any;
  error?: string;
}> {
  const supabase = await createClient();
  
  // Basic JWT authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return {
      user: null,
      supabase,
      error: authError?.message || 'Authentication failed'
    };
  }
  
  // Check if user profile exists and is not deleted
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, display_name, deleted_at')
    .eq('id', user.id)
    .single();
  
  if (profileError || !profile) {
    return {
      user: null,
      supabase,
      error: 'User profile not found'
    };
  }
  
  if (profile.deleted_at) {
    return {
      user: null,
      supabase,
      error: 'User account has been deleted'
    };
  }
  
  return {
    user: {
      id: user.id,
      email: user.email || '',
      role: 'user'
    },
    supabase
  };
}