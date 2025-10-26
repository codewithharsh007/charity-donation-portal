import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { protect } from '@/middlewares/authMiddleware';
import { acceptItemDonation } from '@/controllers/itemDonationController';

export async function POST(request, { params }) {
  try {
    await dbConnect();

    const auth = await protect(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    // ✅ FIX: Await params in Next.js 15
    const { id } = await params;

    const result = await acceptItemDonation(id, auth.userId);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        donation: result.donation,
      },
      { status: result.status }
    );
  } catch (error) {
    console.error('Accept item donation error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
