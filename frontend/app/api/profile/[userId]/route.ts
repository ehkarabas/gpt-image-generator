import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// Get profile by userId (public endpoint - no auth required for viewing)
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    console.log('📡 GET /api/profile/[userId] - Starting request for userId:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Get profile from database - no auth check, just get the public profile
    console.log('✅ Querying profile for userId:', userId);
    
    const { data: profile, error: dbError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      
      // If profile doesn't exist
      if (dbError.code === 'PGRST116') {
        console.log('❌ Profile not found for userId:', userId);
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
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
    console.error('❌ GET /api/profile/[userId] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}