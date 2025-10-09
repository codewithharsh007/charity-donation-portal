import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { protect } from '@/middlewares/authMiddleware';
import {
  submitVerification,
  getVerificationStatus,
} from '@/controllers/ngoVerificationController';

// GET - Get verification status for logged-in NGO
export async function GET(request) {
  try {
    await dbConnect();

    // Check authentication
    const auth = await protect(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const result = await getVerificationStatus(auth.userId);

    return NextResponse.json(
      {
        success: result.success,
        verification: result.verification,
        message: result.message,
      },
      { status: result.status }
    );
  } catch (error) {
    console.error('Get verification status error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Submit NGO verification application
export async function POST(request) {
  try {
    await dbConnect();

    // Check authentication
    const auth = await protect(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const verificationData = await request.json();

    const result = await submitVerification(auth.userId, verificationData);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        verification: result.verification,
      },
      { status: result.status }
    );
  } catch (error) {
    console.error('Submit verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
