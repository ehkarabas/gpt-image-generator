import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import crypto from 'crypto';

const resetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = resetPasswordRequestSchema.parse(body);

    const supabase = await createClient();

    // Check if user exists and is not soft deleted
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, deleted_at')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      return NextResponse.json(
        { error: 'Failed to process request' },
        { status: 500 }
      );
    }

    // If no profile found or profile is soft deleted, return error
    if (!profile || profile.deleted_at) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Generate a unique validation hash
    const validationHash = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    
    // Create token data to be cached on client
    const tokenData = {
      userId: profile.id,
      email: profile.email,
      hash: validationHash,
      timestamp: timestamp,
      expiresAt: timestamp + (15 * 60 * 1000), // 15 minutes expiry
    };

    // Return success with token data
    return NextResponse.json({
      success: true,
      message: 'Password reset initiated',
      tokenData: tokenData,
    });

  } catch (error) {
    console.error('Reset password request error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}