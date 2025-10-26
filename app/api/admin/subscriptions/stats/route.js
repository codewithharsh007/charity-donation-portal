// app/api/admin/subscriptions/stats/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/config/JWT';
import dbConnect from '@/lib/mongodb';
import NgoSubscription from '@/models/ngoSubscriptionModel';
import SubscriptionTransaction from '@/models/subscriptionTransactionModel';
import User from '@/models/authModel';

export const runtime = 'nodejs';

export async function GET(req) {
  try {
    await dbConnect();
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const allSubs = await NgoSubscription.find().lean();
    const completedTransactions = await SubscriptionTransaction.find({ 
      status: 'completed' 
    }).lean();

    const stats = {
      total: allSubs.length,
      active: allSubs.filter(s => s.status === 'active').length,
      trial: allSubs.filter(s => s.status === 'trial').length,
      cancelled: allSubs.filter(s => s.status === 'cancelled').length,
      expired: allSubs.filter(s => s.status === 'expired').length,
    };

    const revenueByTier = {
      tier1: 0,
      tier2: 0,
      tier3: 0,
      tier4: 0,
      total: 0,
    };

    completedTransactions.forEach(tx => {
      const tier = tx.planDetails?.tier;
      const amount = tx.invoice?.total || tx.amount || 0;
      
      if (tier && tier >= 1 && tier <= 4) {
        revenueByTier[`tier${tier}`] += amount;
        revenueByTier.total += amount;
      }
    });

    return NextResponse.json({
      success: true,
      stats,
      revenueByTier,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
