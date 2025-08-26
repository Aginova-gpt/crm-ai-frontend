import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, new_password } = body;

    // Validate required fields
    if (!token || !new_password) {
      return NextResponse.json(
        { msg: 'Token and new password required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (new_password.length < 6) {
      return NextResponse.json(
        { msg: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Simulate token validation (in real app, this would decode and verify the JWT)
    if (!token || token === 'invalid_token') {
      return NextResponse.json(
        { msg: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Simulate successful password reset
    return NextResponse.json(
      { msg: 'Password has been reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { msg: 'Internal server error' },
      { status: 500 }
    );
  }
}
