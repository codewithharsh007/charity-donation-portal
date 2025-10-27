import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FinancialRequest from '@/models/financialRequest';
import User from '@/models/authModel';
import NGOSubscription from '@/models/ngoSubscriptionModel';
import NGOVerification from '@/models/ngoVerificationModel';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  console.log('🚀 POST /api/ngo/funding-requests called');
  
  try {
    await connectDB();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ No token found');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔓 Decoded token:', decoded);
    
    // ✅ FIXED: Try multiple possible field names
    const ngoId = decoded.userId || decoded.id || decoded._id || decoded.user?.id;
    
    if (!ngoId) {
      console.log('❌ No user ID found in token. Decoded:', decoded);
      return NextResponse.json(
        { success: false, message: 'Invalid token structure' },
        { status: 401 }
      );
    }

    console.log('👤 NGO ID:', ngoId);

    const ngo = await User.findById(ngoId);
    
    if (!ngo) {
      console.log('❌ NGO not found for ID:', ngoId);
      return NextResponse.json(
        { success: false, message: 'NGO not found' },
        { status: 404 }
      );
    }

    const subscription = await NGOSubscription.findOne({ 
      userId: ngoId, 
      status: 'active' 
    }).sort({ createdAt: -1 });

    const verification = await NGOVerification.findOne({ 
      userId: ngoId 
    });

    const currentTier = subscription?.tier || 1;
    const verificationStatus = verification?.verificationStatus || 'pending';

    console.log('✅ NGO found:', ngo.name || ngo.email);
    console.log('📊 Tier:', currentTier, 'Status:', verificationStatus);

    if (verificationStatus !== 'verified' && verificationStatus !== 'accepted') {
      return NextResponse.json(
        { success: false, message: 'Complete NGO verification to request funding' },
        { status: 403 }
      );
    }

    if (currentTier < 3) {
      return NextResponse.json(
        { success: false, message: 'Upgrade to Silver or Gold tier to request funding' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      requestedAmount, 
      title, 
      purpose, 
      description, 
      beneficiaryCount, 
      timeline, 
      budgetBreakdown, 
      documents 
    } = body;

    const maxAmount = currentTier === 4 ? 50000 : currentTier === 3 ? 20000 : 0;
    if (requestedAmount > maxAmount) {
      return NextResponse.json(
        { success: false, message: `Maximum amount for your tier is ₹${maxAmount.toLocaleString()}` },
        { status: 400 }
      );
    }

    const activeRequest = await FinancialRequest.findOne({
      ngo: ngoId,
      adminStatus: { $nin: ['completed', 'rejected'] },
      isActive: true
    });

    if (activeRequest) {
      return NextResponse.json(
        { success: false, message: 'You already have an active funding request' },
        { status: 400 }
      );
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const thisMonthRequests = await FinancialRequest.countDocuments({
      ngo: ngoId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    if (thisMonthRequests >= 1) {
      return NextResponse.json(
        { success: false, message: 'You can only create one funding request per month' },
        { status: 400 }
      );
    }

    const financialRequest = await FinancialRequest.create({
      ngo: ngoId,
      title,
      requestedAmount,
      purpose,
      description,
      beneficiaryCount,
      timeline: timeline || {},
      budgetBreakdown: budgetBreakdown || [],
      documents: documents || [],
      adminStatus: 'pending',
      approvedAmount: 0,
      allocatedAmount: 0,
      disbursedAmount: 0,
      priority: 'medium',
      isActive: true,
    });

    console.log('✅ Request created:', financialRequest._id);

    return NextResponse.json(
      {
        success: true,
        message: 'Funding request submitted successfully!',
        request: financialRequest,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ FIXED: Try multiple possible field names
    const ngoId = decoded.userId || decoded.id || decoded._id || decoded.user?.id;

    if (!ngoId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token structure' },
        { status: 401 }
      );
    }

    const requests = await FinancialRequest.find({ ngo: ngoId })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📋 Found ${requests.length} requests for NGO:`, ngoId);

    return NextResponse.json({
      success: true,
      requests,
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
