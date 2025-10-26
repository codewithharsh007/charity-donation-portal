import { NextResponse } from 'next/server';
import { protect } from '@/middlewares/authMiddleware';
import SubscriptionTransaction from '@/models/subscriptionTransactionModel';
import dbConnect from '@/lib/mongodb';

export async function GET(req) {
  try {
    // Verify authentication
    const authResult = await protect(req);
    if (!authResult.success) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.user.userId;

    await dbConnect();

    // Fetch transactions for this user
    const transactions = await SubscriptionTransaction.find({
      ngo: userId
    })
      .populate('subscriptionPlan', 'name tier')
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch transactions',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
