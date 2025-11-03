import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { protect } from '@/middlewares/authMiddleware';
import { isTestMode } from "@/lib/testMode"; // ✅ ADD THIS
import {
  createFinancialDonation,
  getDonorFinancialDonations,
  getAllFinancialDonations,
} from '@/controllers/financialDonationController';

export const runtime = 'nodejs'; // ✅ ADD THIS

// POST - Create financial donation
export async function POST(request) {
  try {
    await dbConnect();

    const auth = await protect(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const donationData = await request.json();

    const result = await createFinancialDonation(auth.userId, donationData);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        donation: result.donation,
      },
      { status: result.status }
    );
  } catch (error) {
    console.error('Create financial donation error:', error);
    // ✅ CHANGED: Use isTestMode() and add stack trace
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

// GET - Get financial donations
export async function GET(request) {
  try {
    await dbConnect();

    const auth = await protect(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';

    let result;
    if (isAdmin) {
      // Admin can see all donations
      result = await getAllFinancialDonations();
    } else {
      // User sees their own donations
      result = await getDonorFinancialDonations(auth.userId);
    }

    return NextResponse.json(
      {
        success: result.success,
        donations: result.donations,
        count: result.count,
        totalAmount: result.totalAmount,
      },
      { status: result.status }
    );
  } catch (error) {
    console.error('Get financial donations error:', error);
    // ✅ CHANGED: Use isTestMode() and add stack trace
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
