// app/api/payments/verify/route.js
import { NextResponse } from 'next/server';
import { protect } from '@/middlewares/authMiddleware';
import { verifyPayment } from '@/controllers/paymentController';
import dbConnect from '@/lib/mongodb';
import { isTestMode } from "@/lib/testMode";

export const runtime = 'nodejs';

// POST - Verify payment
export async function POST(req) {
  try {
    await dbConnect();
    
    
    // Verify authentication
    const authResult = await protect(req);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    
    const body = await req.json();
  
    const result = await verifyPayment(userId, body);
    
    // Convert ObjectIds to strings
    const responseData = {
      success: result.success,
      message: result.message,
      subscription: result.subscription ? {
        ...(result.subscription.toObject ? result.subscription.toObject() : result.subscription),
        _id: result.subscription._id?.toString(),
        userId: result.subscription.userId?.toString(),
        planId: result.subscription.planId?.toString(),
      } : null,
      transaction: result.transaction ? {
        ...(result.transaction.toObject ? result.transaction.toObject() : result.transaction),
        _id: result.transaction._id?.toString(),
        userId: result.transaction.userId?.toString(),
        subscriptionId: result.transaction.subscriptionId?.toString(),
      } : null,
      plan: result.plan,
    };
    
    return NextResponse.json(responseData, { status: result.status });
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
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
