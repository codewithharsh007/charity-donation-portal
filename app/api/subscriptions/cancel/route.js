import { NextResponse } from 'next/server';
import { protect } from '@/middlewares/authMiddleware';
import { cancelSubscription } from '@/controllers/subscriptionController';
import dbConnect from '@/lib/mongodb';

// POST - Cancel subscription
export async function POST(req) {
  try {
    await dbConnect();
    
    // Verify authentication
    const authResult = await protect(req);
    if (!authResult.success) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.user.userId;
    
    const result = await cancelSubscription(userId);
    
    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        subscription: result.subscription,
      },
      { status: result.status }
    );
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
