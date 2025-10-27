import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FinancialRequest from '@/models/financialRequest';
import User from '@/models/authModel';
import jwt from 'jsonwebtoken';

export async function POST(request, { params }) {
  try {
    await connectDB();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminId = decoded.userId || decoded.id || decoded._id;

    // Verify admin
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { approvedAmount, adminNotes } = body;

    const requestId = params.id;

    // Find and update the request
    const fundingRequest = await FinancialRequest.findById(requestId);

    if (!fundingRequest) {
      return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });
    }

    // Update request
    fundingRequest.adminStatus = 'approved';
    fundingRequest.approvedAmount = approvedAmount;
    fundingRequest.adminNotes = adminNotes || '';
    fundingRequest.adminReviewedBy = adminId;
    fundingRequest.adminReviewedAt = new Date();

    await fundingRequest.save();

    console.log('✅ Request approved:', requestId);

    return NextResponse.json({
      success: true,
      message: 'Request approved successfully',
      request: fundingRequest,
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
