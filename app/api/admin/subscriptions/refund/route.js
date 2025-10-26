import { NextResponse } from 'next/server';
import { verifyToken } from '@/middlewares/authMiddleware';
import dbConnect from '@/lib/mongodb';
import SubscriptionTransaction from '@/models/subscriptionTransactionModel';
import User from '@/models/authModel';
import { sendRefundEmail } from '@/utils/subscriptionEmailService';

// POST - Admin issue refund with reason
export async function POST(req) {
  try {
    await dbConnect();
    
    // Verify authentication and admin role
    const authResult = await verifyToken(req);
    if (!authResult.success) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const adminUser = await User.findById(authResult.user.userId);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { message: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('id');
    const body = await req.json();
    const { reason, refundAmount } = body;

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { message: 'Refund reason must be at least 10 characters' },
        { status: 400 }
      );
    }

    const transaction = await SubscriptionTransaction.findById(transactionId)
      .populate('ngo', 'userName email');
    
    if (!transaction) {
      return NextResponse.json(
        { message: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.status === 'refunded') {
      return NextResponse.json(
        { message: 'Transaction is already refunded' },
        { status: 400 }
      );
    }

    if (transaction.status !== 'completed') {
      return NextResponse.json(
        { message: 'Can only refund completed transactions' },
        { status: 400 }
      );
    }

    const maxRefund = transaction.totalAmount;
    const refund = refundAmount || maxRefund;

    if (refund > maxRefund) {
      return NextResponse.json(
        { message: `Refund amount cannot exceed ${maxRefund}` },
        { status: 400 }
      );
    }

    // Update transaction
    transaction.status = 'refunded';
    transaction.refundAmount = refund;
    transaction.refundReason = `[ADMIN] ${reason}`;
    transaction.refundedAt = new Date();
    transaction.refundedBy = adminUser._id;
    
    // In test mode, just mark as refunded
    // In production, integrate with Razorpay refund API
    const isTestMode = process.env.SUBSCRIPTION_TEST_MODE === 'true';
    
    if (!isTestMode) {
      // TODO: Call Razorpay refund API
      // const razorpay = require('razorpay');
      // const refundResponse = await razorpay.payments.refund(transaction.razorpayPaymentId, { amount: refund * 100 });
      // transaction.razorpayRefundId = refundResponse.id;
    } else {
      transaction.razorpayRefundId = `TEST_REFUND_${Date.now()}`;
    }

    await transaction.save();

    // Send email notification to NGO about refund
    try {
      await sendRefundEmail(transaction.ngo.email, {
        ngoName: transaction.ngo.userName,
        amount: refund,
        reason: reason,
        refundId: transaction.razorpayRefundId,
        refundedAt: transaction.refundedAt,
      });
    } catch (emailError) {
      console.error('Failed to send refund email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Refund issued successfully',
      transaction,
    });
  } catch (error) {
    console.error('Error issuing refund:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
