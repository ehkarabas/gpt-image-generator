import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const validateResetSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  validationHash: z.string().min(64).max(64), // SHA256 hash is 64 chars
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  tokenData: z.object({
    userId: z.string(),
    email: z.string(),
    hash: z.string(),
    timestamp: z.number(),
    expiresAt: z.number(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, validationHash, newPassword, tokenData } = validateResetSchema.parse(body);

    // Validate token data matches request
    if (tokenData.userId !== userId || tokenData.hash !== validationHash) {
      return NextResponse.json(
        { error: 'Invalid or tampered token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (tokenData.expiresAt < Date.now()) {
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user exists and is not soft deleted
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, deleted_at')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile || profile.deleted_at) {
      return NextResponse.json(
        { error: 'User not found or account is deactivated' },
        { status: 404 }
      );
    }

    // Verify email matches
    if (profile.email !== tokenData.email) {
      return NextResponse.json(
        { error: 'Token email mismatch' },
        { status: 400 }
      );
    }

    // Update the user's password using Supabase Admin API
    // We'll make a direct HTTP request to Supabase Auth Admin API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const updateResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${userId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
        },
        body: JSON.stringify({
          password: newPassword,
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('Password update error:', errorData);
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      );
    }

    // Log the password reset for security purposes (optional)
    console.log(`Password reset successful for user: ${userId} at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully reset',
    });

  } catch (error) {
    console.error('Password reset validation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}