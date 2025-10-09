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

    return NextResponse.json(
      {
        message: result.message,
        user: result.user,
      },
      { status: result.status }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
