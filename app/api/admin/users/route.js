// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/config/JWT';
import dbConnect from '@/lib/mongodb';
import { isTestMode } from "@/lib/testMode";
import User from '@/models/authModel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Get all users (Admin only)
export async function GET(req) {
  try {
    await dbConnect();
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }


    const adminUser = await User.findById(decoded.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }


    const { searchParams } = new URL(req.url);
    const userType = searchParams.get('userType');
    const verified = searchParams.get('verified');
    const search = searchParams.get('search');

    let query = {};
    
    if (userType && userType !== 'all') {
      query.userType = userType;
    }
    
    if (verified === 'true') {
      query.isVerified = true;
    } else if (verified === 'false') {
      query.isVerified = false;
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }


    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();


    // Calculate statistics
    const stats = {
      total: await User.countDocuments(),
      donors: await User.countDocuments({ userType: 'donor' }),
      ngos: await User.countDocuments({ userType: 'ngo' }),
      admins: await User.countDocuments({ role: 'admin' }),
      verified: await User.countDocuments({ isVerified: true }),
      unverified: await User.countDocuments({ isVerified: false }),
    };

    return NextResponse.json({
      success: true,
      users,
      stats,
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
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
