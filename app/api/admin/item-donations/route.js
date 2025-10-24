import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { protect } from '@/middlewares/authMiddleware';
import { getItemDonationsForAdmin } from '@/controllers/itemDonationController';
import User from '@/models/authModel';

export async function GET(request) {
  try {
    await dbConnect();

    const auth = await protect(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    // Check if user is admin
    const user = await User.findById(auth.userId);
    if (!user || user.userType !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let filter = {};
    if (status && status !== 'all') {
      filter.adminStatus = status;
    }

    const result = await getItemDonationsForAdmin(filter);

    return NextResponse.json(
      {
        success: result.success,
        donations: result.donations,
        count: result.count,
      },
      { status: result.status }
    );
  } catch (error) {
    console.error('Get item donations for admin error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
