import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { protect } from '@/middlewares/authMiddleware';
import { updateDeliveryStatus } from '@/controllers/itemDonationController';

export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const auth = await protect(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    // ✅ FIX: Await params in Next.js 15
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
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
