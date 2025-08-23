import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/auth-helper';

// Get user profile
export async function GET(request: NextRequest) {
  try {
    console.log('📡 GET /api/profile - Starting request...');
    const { user, supabase, error: authError } = await getAuthUser(request);
    
    if (authError || !user) {
      console.log('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ Auth successful, querying profile for user:', user.id);

    // Get profile from database
    const { data: profile, error: dbError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .is('deleted_at', null)
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      
      // If profile doesn't exist, create it
      if (dbError.code === 'PGRST116') {
        console.log('🔨 Profile not found, creating new profile...');
        
        const newProfile = {
          id: user.id,
          display_name: (user as any).user_metadata?.full_name || user.email?.split('@')[0] || `User ${user.id.substring(0, 8)}`,
          email: user.email || '',
          created_at: new Date().toISOString(),
        };
        
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
          
        if (createError) {
          console.error('❌ Failed to create profile:', createError);
          return NextResponse.json(
            { error: 'Failed to create profile' },
            { status: 500 }
          );
        }
        
        console.log('✅ Profile created successfully');
        return NextResponse.json({
          data: createdProfile,
          message: 'Profile created successfully'
        });
      } else {
        return NextResponse.json(
          { error: 'Database error: ' + dbError.message },
          { status: 500 }
        );
      }
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found or has been deleted' },
        { status: 404 }
      );
    }

    console.log('✅ Profile found successfully');
    return NextResponse.json({
      data: profile,
      message: 'Profile retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ GET /api/profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// Update user profile (display name)
export async function PUT(request: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthUser(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { displayName } = await request.json();

    // Basic validation
    if (!displayName || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    if (displayName.length > 100) {
      return NextResponse.json(
        { error: 'Display name must be less than 100 characters' },
        { status: 400 }
      );
    }

    // Update profile in database
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .is('deleted_at', null) // Ensure account is not soft deleted
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Profile not found or account has been deleted' },
        { status: 404 }
      );
    }

    console.log(`🔄 PROFILE UPDATE: User ${user.email} updated display name to "${displayName}"`);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        displayName: updatedProfile.display_name,
        updatedAt: updatedProfile.updated_at
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error during profile update' },
      { status: 500 }
    );
  }
}

// Delete user account (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthUser(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const deleteTimestamp = new Date().toISOString();

    // Soft delete profile
    const { data: deletedProfile, error: profileError } = await supabase
      .from('profiles')
      .update({
        deleted_at: deleteTimestamp,
        updated_at: deleteTimestamp
      })
      .eq('id', user.id)
      .is('deleted_at', null) // Only delete if not already deleted
      .select()
      .single();

    if (profileError) {
      console.error('Profile soft delete error:', profileError);
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      );
    }

    if (!deletedProfile) {
      return NextResponse.json(
        { error: 'Profile not found or already deleted' },
        { status: 404 }
      );
    }

    // Soft delete all user conversations
    const { error: conversationsError } = await supabase
      .from('conversations')
      .update({
        deleted_at: deleteTimestamp,
        updated_at: deleteTimestamp
      })
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (conversationsError) {
      console.error('Conversations soft delete error:', conversationsError);
      // Continue - profile deletion is more important
    }

    // Get user's conversation IDs first
    const { data: userConversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id);

    // Soft delete all user messages if conversations exist
    let messagesError = null;
    if (userConversations && userConversations.length > 0) {
      const conversationIds = userConversations.map((conv: any) => conv.id);
      
      const { error } = await supabase
        .from('messages')
        .update({
          deleted_at: deleteTimestamp,
          updated_at: deleteTimestamp
        })
        .in('conversation_id', conversationIds)
        .is('deleted_at', null);
        
      messagesError = error;
    }

    if (messagesError) {
      console.error('Messages soft delete error:', messagesError);
      // Continue - profile deletion is more important
    }

    console.log(`🗑️ ACCOUNT DELETE: User ${user.email} account soft deleted at ${deleteTimestamp}`);

    return NextResponse.json({
      success: true,
      message: 'Account successfully deleted',
      deletedAt: deleteTimestamp
    }, { status: 200 });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error during account deletion' },
      { status: 500 }
    );
  }
}