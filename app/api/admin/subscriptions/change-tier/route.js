import { NextResponse } from 'next/server';
import { protect } from '@/middlewares/authMiddleware';
import dbConnect from '@/lib/mongodb';
import NGOSubscription from '@/models/ngoSubscriptionModel';
import SubscriptionPlan from '@/models/subscriptionPlanModel';
import User from '@/models/authModel';
import { sendTierChangeEmail } from '@/utils/subscriptionEmailService';

// POST - Admin change NGO tier with reason
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
    const { newTier, reason } = body;

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { message: 'Change reason must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (!newTier || newTier < 1 || newTier > 4) {
      return NextResponse.json(
        { message: 'Invalid tier. Must be between 1-4' },
        { status: 400 }
      );
    }

    const subscription = await NGOSubscription.findById(subscriptionId)
      .populate('ngo', 'userName email')
      .populate('plan');
    
    if (!subscription) {
      return NextResponse.json(
        { message: 'Subscription not found' },
        { status: 404 }
      );
    }

    const currentTier = subscription.plan.tier;
    const currentPlanName = subscription.plan.name;
    if (currentTier === newTier) {
      return NextResponse.json(
        { message: 'NGO is already on this tier' },
        { status: 400 }
      );
    }

    // Get new plan
    const newPlan = await SubscriptionPlan.findOne({ tier: newTier });
    if (!newPlan) {
      return NextResponse.json(
        { message: 'Plan not found for this tier' },
        { status: 404 }
      );
    }

    // Update subscription
    subscription.plan = newPlan._id;
    subscription.tierChangeHistory = subscription.tierChangeHistory || [];
    subscription.tierChangeHistory.push({
      from: currentTier,
      to: newTier,
      changedBy: 'admin',
      reason: `[ADMIN] ${reason}`,
      changedAt: new Date(),
    });
    await subscription.save();

    // Update user
    const user = await User.findById(subscription.ngo._id);
    if (user) {
      user.currentTier = newTier;
      user.tierName = newPlan.name;
      await user.save();
    }

    // Send email notification to NGO about tier change
    try {
      await sendTierChangeEmail(subscription.ngo.email, {
        ngoName: subscription.ngo.userName,
        oldTier: currentPlanName,
        newTier: newPlan.name,
        reason: reason,
        changedAt: new Date(),
        isUpgrade: newTier > currentTier,
      });
    } catch (emailError) {
      console.error('Failed to send tier change email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Tier changed from ${currentTier} to ${newTier} successfully`,
      subscription: await subscription.populate('plan'),
    });
  } catch (error) {
    console.error('Error changing tier:', error);
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
