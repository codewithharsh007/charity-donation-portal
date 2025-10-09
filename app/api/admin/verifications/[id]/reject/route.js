import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { authorize } from '@/middlewares/authMiddleware';
import { rejectVerification } from '@/controllers/ngoVerificationController';

// PUT - Reject verification (admin only)
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    // Check authentication and admin authorization
    const auth = await authorize(request, ['admin']);
    if (!auth.success) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const { id } = params;
    const { rejectionReason, adminNotes } = await request.json();

    const result = await rejectVerification(
      id,
      auth.userId,
      rejectionReason,
      adminNotes
    );

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        verification: result.verification,
        attemptsRemaining: result.attemptsRemaining,
      },
      { status: result.status }
    );
  } catch (error) {
    console.error('Reject verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
