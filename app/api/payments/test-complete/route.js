// app/api/payments/test-complete/route.js
import { NextResponse } from 'next/server';
import { getTestPaymentCredentials } from '@/controllers/paymentController';
import dbConnect from '@/lib/mongodb';
import { isTestMode } from "@/lib/testMode";

export const runtime = 'nodejs';

// POST - Get test payment credentials (test mode only)
export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { transactionId } = body;

    const result = await getTestPaymentCredentials(transactionId);

    return NextResponse.json(result, { status: result.status });
  } catch (error) {
    console.error('Error in test payment:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Test payment failed',
        error: isTestMode() ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
