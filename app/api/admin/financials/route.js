import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/config/JWT';
import dbConnect from '@/lib/mongodb';
import SubscriptionTransaction from '@/models/subscriptionTransactionModel';
import FinancialDonation from '@/models/financialDonationModel';
import FinancialRequest from '@/models/financialRequest'; 
import { isTestMode } from "@/lib/testMode";
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
        { success: false, message: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }

    // ===== SUBSCRIPTION REVENUE =====
    const completedTransactions = await SubscriptionTransaction.find({ 
      status: 'completed' 
    }).lean();

    let subTotal = 0;
    let gstTotal = 0;
    let grandTotal = 0;

    completedTransactions.forEach(tx => {
      subTotal += tx.amount || 0;
      gstTotal += tx.invoice?.gstAmount || 0;
      grandTotal += tx.invoice?.total || tx.amount || 0;
    });

    // ===== FINANCIAL DONATIONS =====
    const completedDonations = await FinancialDonation.find({ 
      status: 'completed'
    }).lean();

    const donationTotal = completedDonations.reduce((sum, d) => sum + (d.amount || 0), 0);

    // ===== APPROVED FUNDING REQUESTS (EXPENSES) =====
    const approvedFundingRequests = await FinancialRequest.find({
      adminStatus: 'approved'
    }).lean();

    const fundingRequestsTotal = approvedFundingRequests.reduce(
      (sum, fr) => sum + (fr.approvedAmount || 0), 0
    );

    // This month's calculations
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyDonations = completedDonations.filter(d => 
      new Date(d.createdAt) >= startOfMonth
    );
    const monthlyDonationTotal = monthlyDonations.reduce((sum, d) => 
      sum + (d.amount || 0), 0
    );

    const monthlyTransactions = completedTransactions.filter(tx => 
      new Date(tx.createdAt) >= startOfMonth
    );
    const monthlySubTotal = monthlyTransactions.reduce((sum, tx) => 
      sum + (tx.invoice?.total || tx.amount || 0), 0
    );

    // Monthly funding requests
    const monthlyFundingRequests = approvedFundingRequests.filter(fr =>
      new Date(fr.adminReviewedAt) >= startOfMonth
    );
    const monthlyFundingTotal = monthlyFundingRequests.reduce(
      (sum, fr) => sum + (fr.approvedAmount || 0), 0
    );

    // Revenue by tier
    const revenueByTier = {};
    completedTransactions.forEach(tx => {
      const tier = tx.planDetails?.tier;
      if (tier) {
        if (!revenueByTier[tier]) {
          revenueByTier[tier] = {
            _id: tier,
            revenue: 0,
            count: 0,
            planName: tx.planDetails.planName
          };
        }
        revenueByTier[tier].revenue += tx.invoice?.total || tx.amount || 0;
        revenueByTier[tier].count += 1;
      }
    });

    const revenueByTierArray = Object.values(revenueByTier).sort((a, b) => a._id - b._id);

    // Monthly trend (last 6 months)
    const monthlyTrend = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Add subscription revenue
    completedTransactions
      .filter(tx => new Date(tx.createdAt) >= sixMonthsAgo)
      .forEach(tx => {
        const date = new Date(tx.createdAt);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (!monthlyTrend[key]) {
          monthlyTrend[key] = {
            _id: { year: date.getFullYear(), month: date.getMonth() + 1 },
            subscriptionRevenue: 0,
            donationRevenue: 0,
            fundingExpenses: 0,
            totalRevenue: 0,
            subscriptionCount: 0,
            donationCount: 0,
            fundingCount: 0,
          };
        }
        
        const amount = tx.invoice?.total || tx.amount || 0;
        monthlyTrend[key].subscriptionRevenue += amount;
        monthlyTrend[key].totalRevenue += amount;
        monthlyTrend[key].subscriptionCount += 1;
      });

    // Add donation revenue
    completedDonations
      .filter(d => new Date(d.createdAt) >= sixMonthsAgo)
      .forEach(d => {
        const date = new Date(d.createdAt);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (!monthlyTrend[key]) {
          monthlyTrend[key] = {
            _id: { year: date.getFullYear(), month: date.getMonth() + 1 },
            subscriptionRevenue: 0,
            donationRevenue: 0,
            fundingExpenses: 0,
            totalRevenue: 0,
            subscriptionCount: 0,
            donationCount: 0,
            fundingCount: 0,
          };
        }
        
        monthlyTrend[key].donationRevenue += d.amount || 0;
        monthlyTrend[key].totalRevenue += d.amount || 0;
        monthlyTrend[key].donationCount += 1;
      });

    // Add funding expenses
    approvedFundingRequests
      .filter(fr => new Date(fr.adminReviewedAt) >= sixMonthsAgo)
      .forEach(fr => {
        const date = new Date(fr.adminReviewedAt);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (!monthlyTrend[key]) {
          monthlyTrend[key] = {
            _id: { year: date.getFullYear(), month: date.getMonth() + 1 },
            subscriptionRevenue: 0,
            donationRevenue: 0,
            fundingExpenses: 0,
            totalRevenue: 0,
            subscriptionCount: 0,
            donationCount: 0,
            fundingCount: 0,
          };
        }
        
        monthlyTrend[key].fundingExpenses += fr.approvedAmount || 0;
        monthlyTrend[key].fundingCount += 1;
      });

    const monthlyTrendArray = Object.values(monthlyTrend).sort((a, b) => {
      if (a._id.year !== b._id.year) return a._id.year - b._id.year;
      return a._id.month - b._id.month;
    });

    // Calculate refunds
    const refundedTransactions = await SubscriptionTransaction.find({ 
      status: 'refunded' 
    }).lean();

    const refundTotal = refundedTransactions.reduce((sum, tx) => 
      sum + (tx.refundAmount || 0), 0
    );

    // Total revenue & net calculations
    const totalRevenue = grandTotal + donationTotal;
    const netRevenue = totalRevenue - refundTotal;

    return NextResponse.json({
      success: true,
      financials: {
        subscriptionRevenue: {
          allTime: grandTotal,
          thisMonth: monthlySubTotal,
          transactionCount: completedTransactions.length,
          monthlyTransactions: monthlyTransactions.length,
          subtotal: subTotal,
          gst: gstTotal,
        },
        donations: {
          allTime: donationTotal,
          thisMonth: monthlyDonationTotal,
          count: completedDonations.length,
          monthlyCount: monthlyDonations.length,
        },
        fundingRequests: {
          allTime: fundingRequestsTotal,
          thisMonth: monthlyFundingTotal,
          count: approvedFundingRequests.length,
          monthlyCount: monthlyFundingRequests.length,
        },
        refunds: {
          total: refundTotal,
          count: refundedTransactions.length,
        },
        totalRevenue: totalRevenue,
        netRevenue: netRevenue,
        revenueByTier: revenueByTierArray,
        monthlyTrend: monthlyTrendArray,
      }
    });
  } catch (error) {
    console.error('❌ Error fetching financials:', error);
    console.error('Stack:', error.stack); // ✅ Add stack trace for debugging
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error', 
        error: isTestMode() ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
