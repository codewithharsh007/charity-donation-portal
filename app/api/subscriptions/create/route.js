import { NextResponse } from 'next/server';
import { protect } from '@/middlewares/authMiddleware';
import { createSubscription } from '@/controllers/subscriptionController';
import dbConnect from '@/lib/mongodb';

// POST - Create new subscription
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
    const body = await req.json();
    
    const result = await createSubscription(userId, body);
    
    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        subscription: result.subscription,
      },
      { status: result.status }
    );
  } catch (error) {
    console.error('Error creating subscription:', error);
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
