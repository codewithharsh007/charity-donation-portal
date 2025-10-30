import { NextResponse } from 'next/server';
import { protect } from '@/middlewares/authMiddleware';
import dbConnect from '@/lib/mongodb';
import NGOSubscription from '@/models/ngoSubscriptionModel';
import User from '@/models/authModel';
import SubscriptionPlan from '@/models/subscriptionPlanModel';
import { sendCancellationEmail } from '@/utils/subscriptionEmailService';

// POST - Admin cancel subscription with reason
export async function POST(req) {
  try {
    await dbConnect();
    
    // Verify authentication and admin role
    const authResult = await protect(req);
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
    const subscriptionId = searchParams.get('id');
    const body = await req.json();
    const { reason } = body;

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { message: 'Cancellation reason must be at least 10 characters' },
        { status: 400 }
      );
    }

    const subscription = await NGOSubscription.findById(subscriptionId)
      .populate('ngo', 'userName email')
      .populate('plan', 'name');
    
    if (!subscription) {
      return NextResponse.json(
        { message: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.status === 'cancelled' || subscription.status === 'expired') {
      return NextResponse.json(
        { message: 'Subscription is already cancelled or expired' },
        { status: 400 }
      );
    }

    // Cancel subscription
    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    subscription.cancelledAt = new Date();
    subscription.cancelledBy = 'admin';
    subscription.cancellationReason = `[ADMIN] ${reason}`;
    await subscription.save();

    // Update user's subscription status
    const user = await User.findById(subscription.ngo._id);
    if (user) {
      user.subscriptionStatus = 'cancelled';
      // Don't downgrade tier immediately - let them use until period ends
      await user.save();
    }

    // Send email notification to NGO about cancellation
    try {
      await sendCancellationEmail(subscription.ngo.email, {
        ngoName: subscription.ngo.userName,
        planName: subscription.plan?.name || 'Premium',
        reason: reason,
        cancelledAt: subscription.cancelledAt,
      });
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
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
