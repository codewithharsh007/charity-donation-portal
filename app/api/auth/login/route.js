import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { login } from '@/controllers/authController';
import { cookieOptions } from '@/config/JWT';

export async function POST(request) {
  try {
    await dbConnect();
    const { email, password } = await request.json();

    const result = await login(email, password);

    if (result.success) {
      const cookieStore = await cookies();
      cookieStore.set('token', result.token, cookieOptions);
    }

    // ✅ RETURN TOKEN IN RESPONSE
    return NextResponse.json(
      {
        success: result.success, // ✅ Added
        message: result.message,
        user: result.user,
        token: result.token, // ✅ Added - Return token to frontend
        userId: result.user?._id || result.user?.id, // ✅ Added
        role: result.user?.role // ✅ Added
      },
      { status: result.status }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
