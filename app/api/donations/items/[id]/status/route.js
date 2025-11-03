import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { protect } from '@/middlewares/authMiddleware';
import { isTestMode } from "@/lib/testMode"; // ✅ ADD THIS
import { updateDeliveryStatus } from '@/controllers/itemDonationController';

export const runtime = 'nodejs'; // ✅ ADD THIS

export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const auth = await protect(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    // ✅ Await params in Next.js 15
    const { id } = await params;
    const { status } = await request.json();

    const result = await updateDeliveryStatus(id, auth.userId, status);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        donation: result.donation,
      },
      { status: result.status }
    );
  } catch (error) {
    console.error('Update delivery status error:', error);
    // ✅ CHANGED: Use isTestMode()
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error', 
        error: isTestMode() ? error.message : undefined,
        stack: isTestMode() ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
