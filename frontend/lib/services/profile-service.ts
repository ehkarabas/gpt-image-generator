'use client';

import { Profile, ApiResponse } from "@/lib/types/database";

/**
 * Profile Service with Supabase Integration
 * Provides secure profile management with authentication checks
 */

/**
 * Get user profile by ID
 * Filters out soft-deleted profiles
 */
export async function getProfile(userId: string): Promise<ApiResponse<Profile>> {
  try {
    console.log('🔍 getProfile called with userId:', userId);
    
    // Use the new API endpoint that accepts userId as a parameter
    console.log('📡 Calling /api/profile/[userId] endpoint...');
    
    const response = await fetch(`/api/profile/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for auth if needed
    });
    
    console.log('📡 API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ API error:', errorData);
      return {
        error: errorData.error || `HTTP ${response.status} error`,
      };
    }
    
    const result = await response.json();
    console.log('✅ Profile fetched successfully via API');
    
    return {
      data: result.data,
      message: result.message,
    };
    
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    return {
      error: 'Failed to fetch profile',
    };
  }
}

/**
 * Update user profile
 * Only works on active (non-deleted) profiles
 */
export async function updateProfile(
  userId: string, 
  updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>
): Promise<ApiResponse<Profile>> {
  try {
    console.log('✏️ updateProfile called with:', { userId, updates });
    
    // Validate display_name if provided
    if (updates.display_name !== undefined) {
      const trimmedName = updates.display_name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 50) {
        return {
          error: 'Name must be between 2 and 50 characters',
        };
      }
      updates.display_name = trimmedName;
    }
    
    // Import Supabase client
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    // Convert 'current-user' to actual user ID if needed
    let actualUserId = userId;
    if (userId === 'current-user') {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user && !error) {
          actualUserId = user.id;
        }
      } catch (error) {
        console.log('❌ Auth conversion failed, using userId as-is');
      }
    }
    
    // Update profile in Supabase database
    const { data: updatedProfile, error: dbError } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', actualUserId)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (dbError || !updatedProfile) {
      return {
        error: 'Failed to update profile: ' + (dbError?.message || 'Profile not found'),
      };
    }
    
    return {
      data: updatedProfile,
      message: 'Profile updated successfully',
    };
  } catch (error) {
    console.error('Error updating profile:', error);
    return {
      error: 'Failed to update profile',
    };
  }
}

/**
 * Soft delete user account
 * Sets deleted_at timestamp, making account inaccessible
 * This cascades to make all user's conversations/messages inaccessible
 */
export async function softDeleteProfile(userId: string): Promise<ApiResponse<void>> {
  try {
    console.log('🗑️ softDeleteProfile called with userId:', userId);
    
    // Import Supabase client
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    // Convert 'current-user' to actual user ID if needed
    let actualUserId = userId;
    if (userId === 'current-user') {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user && !error) {
          actualUserId = user.id;
        }
      } catch (error) {
        console.log('❌ Auth conversion failed, using userId as-is');
      }
    }
    
    // Soft delete profile in Supabase database
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', actualUserId)
      .is('deleted_at', null);
    
    if (dbError) {
      return {
        error: 'Failed to delete account: ' + dbError.message,
      };
    }
    
    return {
      message: 'Account deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting profile:', error);
    return {
      error: 'Failed to delete account',
    };
  }
}

/**
 * Check if profile exists and is active
 */
export async function isProfileActive(userId: string): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, deleted_at')
      .eq('id', userId)
      .single();
    
    return profile !== null && !profile.deleted_at;
  } catch (error) {
    return false;
  }
}

/**
 * Recovery function (for admin/support use)
 * Restores a soft-deleted profile
 */
export async function restoreProfile(userId: string): Promise<ApiResponse<Profile>> {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    // Get current user from Supabase auth (admin check could be added here)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        error: 'User not authenticated',
      };
    }
    
    // Restore profile in Supabase database
    const { data: restoredProfile, error: dbError } = await supabase
      .from('profiles')
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .not('deleted_at', 'is', null)
      .select()
      .single();
    
    if (dbError || !restoredProfile) {
      return {
        error: 'Profile not found in deleted records',
      };
    }
    
    return {
      data: restoredProfile,
      message: 'Profile restored successfully',
    };
  } catch (error) {
    console.error('Error restoring profile:', error);
    return {
      error: 'Failed to restore profile',
    };
  }
}

/**
 * Get profile statistics (for admin dashboard)
 */
export async function getProfileStats(): Promise<ApiResponse<{
  activeCount: number;
  deletedCount: number;
  totalCount: number;
}>> {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    // Get current user from Supabase auth (admin check could be added here)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        error: 'User not authenticated',
      };
    }
    
    // Get active profiles count
    const { count: activeCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);
    
    // Get deleted profiles count
    const { count: deletedCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('deleted_at', 'is', null);
    
    // Get total profiles count
    const { count: totalCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    return {
      data: {
        activeCount: activeCount || 0,
        deletedCount: deletedCount || 0,
        totalCount: totalCount || 0,
      },
    };
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    return {
      error: 'Failed to fetch statistics',
    };
  }
}