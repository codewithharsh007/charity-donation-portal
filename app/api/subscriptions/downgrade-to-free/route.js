// app/api/subscriptions/downgrade-to-free/route.js
import { NextResponse } from 'next/server';
import { protect } from '@/middlewares/authMiddleware';
import { downgradeToFree } from '@/controllers/subscriptionController';
import dbConnect from '@/lib/mongodb';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    
    await dbConnect();
    
    const authResult = await protect(req);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const result = await downgradeToFree(userId);
    
    return NextResponse.json(result, { status: result.status });
  } catch (error) {
    console.error('Error in downgrade route:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error', 
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
