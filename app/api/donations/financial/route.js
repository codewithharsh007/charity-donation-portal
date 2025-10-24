import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { protect } from '@/middlewares/authMiddleware';
import {
  createFinancialDonation,
  getDonorFinancialDonations,
  getAllFinancialDonations,
} from '@/controllers/financialDonationController';

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
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
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
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
