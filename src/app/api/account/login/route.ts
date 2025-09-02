import { NextRequest, NextResponse } from 'next/server';

// Mock user data for testing
const mockUsers = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User'
  },
  {
    email: 'user@example.com',
    password: 'user123',
    role: 'user',
    name: 'Regular User'
  },
  {
    email: 'test@example.com',
    password: 'test123',
    role: 'user',
    name: 'Test User'
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { msg: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = mockUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { msg: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate mock tokens
    const access_token = `mock_access_token_${user.email}_${Date.now()}`;
    const refresh_token = `mock_refresh_token_${user.email}_${Date.now()}`;

    // Build response
    const response = NextResponse.json({
      access_token,
      refresh_token,
      user: {
        email: user.email,
        role: user.role,
        name: user.name
      },
      msg: 'Login successful'
    });

    // ✅ Set "auth=true" cookie for middleware
    response.cookies.set("auth", "true", {
      path: "/",
      httpOnly: false,   // front-end can still read if needed
      sameSite: "lax"
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { msg: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ msg: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ msg: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ msg: 'Method not allowed' }, { status: 405 });
}
