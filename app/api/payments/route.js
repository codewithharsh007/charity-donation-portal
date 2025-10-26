// app/api/payments/route.js
import { NextResponse } from 'next/server';
import { handleWebhook } from '@/controllers/paymentController';
import dbConnect from '@/lib/mongodb';

export const runtime = 'nodejs';

// POST - Razorpay webhook handler
export async function POST(req) {
  try {
    await dbConnect();
    
    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();
    const webhookData = JSON.parse(body);
    
    const result = await handleWebhook(webhookData, signature);
    
    return NextResponse.json(
      { success: result.success },
      { status: result.status }
    );
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Webhook processing failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
