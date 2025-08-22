import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use anon key for sign in
      {
        cookies: {
          getAll: () => [],
          setAll: () => {}
        }
      }
    );

    // Sign in user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Signin auth error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { error: 'Failed to authenticate user' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .eq('deleted_at', null) // Ensure account is not soft deleted
      .single();

    if (profileError || !profileData) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'User profile not found or account has been deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User signed in successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        displayName: profileData.display_name,
        lastSignIn: authData.user.last_sign_in_at
      },
      session: {
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresAt: authData.session.expires_at
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error during signin' },
      { status: 500 }
    );
  }
}