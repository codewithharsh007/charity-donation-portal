import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { sendOtp } from '@/controllers/authController';

export async function POST(request) {
  try {
    await dbConnect();
    const { email } = await request.json();

    const result = await sendOtp(email);

    return NextResponse.json(
      { 
        success: result.success,
        message: result.message 
      },
      { status: result.status }
    );
  } catch (error) {
    console.error('❌ Send OTP API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
