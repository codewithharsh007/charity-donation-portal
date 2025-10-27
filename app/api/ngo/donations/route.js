import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ItemDonation from '@/models/itemDonationModel';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No authorization token' },
        { status: 401 }
      );
    }

    // Verify token and get NGO ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const ngoId = decoded.userId || decoded.id;

    // First, check total donations in database
    const totalDonations = await ItemDonation.countDocuments();

    // Check donations accepted by this NGO (any status)
    const anyAccepted = await ItemDonation.countDocuments({ acceptedBy: ngoId });

    // Check donations with received status (any NGO)
    const anyReceived = await ItemDonation.countDocuments({ deliveryStatus: 'received' });

    // Find donations for this NGO with received status
    const donations = await ItemDonation.find({
      acceptedBy: ngoId,
      deliveryStatus: 'received',
      adminStatus: 'approved'
    })
    .populate('donor', 'name email phone address')
    .populate('categoryId', 'name')
    .sort({ receivedDate: -1, createdAt: -1 });

    

    // Let's also check without the adminStatus filter
    const donationsNoStatus = await ItemDonation.find({
      acceptedBy: ngoId,
      deliveryStatus: 'received'
    });

    return NextResponse.json({
      success: true,
      donations: donations,
      count: donations.length,
      debug: {
        ngoId,
        totalInDB: totalDonations,
        acceptedByNGO: anyAccepted,
        totalReceived: anyReceived
      }
    });

  } catch (error) {
    console.error('❌ Error fetching NGO donations:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
