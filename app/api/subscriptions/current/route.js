// app/api/subscriptions/current/route.js
import { NextResponse } from 'next/server';
import { protect } from '@/middlewares/authMiddleware';
import { getCurrentSubscription } from '@/controllers/subscriptionController';
import dbConnect from '@/lib/mongodb';
import { isTestMode } from "@/lib/testMode";

export const runtime = 'nodejs';

export async function GET(req) {
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
    
    const result = await getCurrentSubscription(userId);
    
    
    // ✅ FIX: Return the data object correctly
    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        data: result.data, // ✅ This is the key field your frontend expects
        subscription: result.subscription,
        userInfo: result.userInfo,
      },
      { status: result.status }
    );
  } catch (error) {
    console.error('Error in current subscription route:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error', 
        error: isTestMode() ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
