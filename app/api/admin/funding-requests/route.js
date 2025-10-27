import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FinancialRequest from '@/models/financialRequest';
import User from '@/models/authModel';
import jwt from 'jsonwebtoken';

export async function GET(request) {
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

    // Get all funding requests with NGO details
    const requests = await FinancialRequest.find()
      .populate('ngo', 'userName email')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📋 Admin fetched ${requests.length} funding requests`);

    return NextResponse.json({
      success: true,
      requests,
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
