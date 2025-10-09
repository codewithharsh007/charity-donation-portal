import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { authorize } from '@/middlewares/authMiddleware';
import {
  getPendingVerifications,
  getAllVerifications,
} from '@/controllers/ngoVerificationController';

// GET - Get all verifications (admin only)
export async function GET(request) {
  try {
    await dbConnect();

    // Check authentication and admin authorization
    const auth = await authorize(request, ['admin']);
    if (!auth.success) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    // Check query params for filter
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, accepted, rejected

    let result;
    if (status === 'pending') {
      result = await getPendingVerifications();
    } else if (status) {
      result = await getAllVerifications({ verificationStatus: status });
    } else {
      result = await getAllVerifications();
    }

    return NextResponse.json(
      {
        success: result.success,
        verifications: result.verifications,
        count: result.count,
      },
      { status: result.status }
    );
  } catch (error) {
    console.error('Get verifications error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
