// app/api/payments/create-order/route.js
import { NextResponse } from 'next/server';
import { protect } from '@/middlewares/authMiddleware';
import { createPaymentOrder } from '@/controllers/paymentController';
import dbConnect from '@/lib/mongodb';
import { isTestMode } from "@/lib/testMode";

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    // Step 1: Connect to database
    await dbConnect();
    
    // Step 2: Authenticate user
    const authResult = await protect(req);
    
    
    if (!authResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: authResult.message || 'Unauthorized' 
        },
        { status: authResult.status || 401 }
      );
    }

    const userId = authResult.userId;

    // Step 3: Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('❌ Body parse error:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid JSON in request body',
          error: parseError.message
        },
        { status: 400 }
      );
    }

    // Step 4: Validate required fields
    if (!body.planId) {
      return NextResponse.json(
        { success: false, message: 'planId is required' },
        { status: 400 }
      );
    }
    if (!body.billingCycle) {
      return NextResponse.json(
        { success: false, message: 'billingCycle is required' },
        { status: 400 }
      );
    }
    
    // Step 5: Create payment order
    const result = await createPaymentOrder(userId, body);
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || 'Failed to create payment order',
          error: result.error
        },
        { status: result.status || 500 }
      );
    }
    
    // ✅ FIX: Convert ObjectId to string and remove status field
    const responseData = {
      success: result.success,
      message: result.message,
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      keyId: result.keyId,
      transactionId: result.transactionId?.toString() || result.transactionId, // Convert to string
      testMode: result.testMode,
      breakdown: result.breakdown,
      plan: result.plan,
      order: result.order,
    };

    
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('\n❌ === UNHANDLED ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=========================\n');
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error', 
        error: isTestMode() ? error.message : undefined,
        errorType: error.name
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for testing
export async function GET(req) {
  return NextResponse.json({
    success: true,
    message: 'Payment create-order endpoint is working',
    methods: ['POST'],
    timestamp: new Date().toISOString()
  });
}
