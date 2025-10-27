import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FinancialRequest from '@/models/financialRequest';
import jwt from 'jsonwebtoken';

export async function DELETE(request, { params }) {
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
    const ngoId = decoded.userId || decoded.id || decoded._id || decoded.user?.id;

    if (!ngoId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const requestId = params.id;

    // Find the request
    const fundingRequest = await FinancialRequest.findById(requestId);

    if (!fundingRequest) {
      return NextResponse.json(
        { success: false, message: 'Request not found' },
        { status: 404 }
      );
    }

    // Check if this request belongs to the NGO
    if (fundingRequest.ngo.toString() !== ngoId.toString()) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to delete this request' },
        { status: 403 }
      );
    }

    // Only allow deleting pending requests
    if (fundingRequest.adminStatus !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Can only delete pending requests' },
        { status: 400 }
      );
    }

    // Delete the request
    await FinancialRequest.findByIdAndDelete(requestId);

    console.log('✅ Request deleted:', requestId);

    return NextResponse.json(
      {
        success: true,
        message: 'Funding request deleted successfully',
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error deleting request:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
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
    const ngoId = decoded.userId || decoded.id || decoded._id || decoded.user?.id;

    if (!ngoId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const requestId = params.id;

    // Find the specific request
    const fundingRequest = await FinancialRequest.findById(requestId).lean();

    if (!fundingRequest) {
      return NextResponse.json(
        { success: false, message: 'Request not found' },
        { status: 404 }
      );
    }

    // Check if this request belongs to the NGO
    if (fundingRequest.ngo.toString() !== ngoId.toString()) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      request: fundingRequest,
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
