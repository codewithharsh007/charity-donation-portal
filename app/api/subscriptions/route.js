import { NextResponse } from 'next/server';
import { protect } from '@/middlewares/authMiddleware';
import {
  getSubscriptionPlans,
} from '@/controllers/subscriptionController';
import dbConnect from '@/lib/mongodb';

// GET - Get all subscription plans
export async function GET(req) {
  try {
    await dbConnect();
    
    const result = await getSubscriptionPlans();
    
    return NextResponse.json(
      {
        success: result.success,
        plans: result.plans,
      },
      { status: result.status }
    );
  } catch (error) {
    console.error('Error fetching plans:', error);
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
