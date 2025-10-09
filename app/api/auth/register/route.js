import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { register } from '@/controllers/authController';

export async function POST(request) {
  try {
    await dbConnect();
    const userData = await request.json();

    console.log('📥 Register API called with:', { ...userData, password: '***' });

    const result = await register(userData);

    console.log('📤 Register result:', result);

    return NextResponse.json(
      { 
        success: result.success,
        message: result.message 
      },
      { status: result.status }
    );
  } catch (error) {
    console.error('❌ Register API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
