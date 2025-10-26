import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SubscriptionPlan from '@/models/subscriptionPlanModel';

export async function GET() {
  await dbConnect();
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ tier: 1 });
    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch plans.' }, { status: 500 });
  }
}