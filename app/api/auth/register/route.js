import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { register } from '@/controllers/authController';

export async function POST(request) {
  try {
    await dbConnect();
    const userData = await request.json();


    const result = await register(userData);


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
