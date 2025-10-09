import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { protect } from '@/middlewares/authMiddleware';
import User from '@/models/authModel';

export async function GET(request) {
  try {
    await dbConnect();
    
    // Check authentication
    const auth = await protect(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: auth.user,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    
    // Check authentication
    const auth = await protect(request);
    if (!auth.success) {
      return NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      );
    }

    const { userName, lastName, phone, address, city, state, pincode } = await request.json();

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      auth.userId,
      {
        userName,
        lastName,
        phone,
        address,
        city,
        state,
        pincode,
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
