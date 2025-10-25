import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { protect } from '@/middlewares/authMiddleware';
import {
  createItemDonation,
  getDonorItemDonations,
  getAvailableItemsForNGOs,
  getNGOAcceptedDonations,
} from '@/controllers/itemDonationController';

// POST - Create item donation
export async function POST(request) {
  try {
    await dbConnect();

    const auth = await protect(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const donationData = await request.json();

    const result = await createItemDonation(auth.userId, donationData);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        donation: result.donation,
      },
      { status: result.status }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// GET - Get item donations
export async function GET(request) {
  try {
    await dbConnect();

    const auth = await protect(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'donor', 'ngo'
    const filter = searchParams.get('filter'); // 'available', 'accepted'

    let result;
    
    if (type === 'ngo') {
      if (filter === 'available') {
        // NGO viewing available items - filtered by their state
        result = await getAvailableItemsForNGOs(auth.userId);
      } else if (filter === 'accepted') {
        // NGO viewing their accepted items
        result = await getNGOAcceptedDonations(auth.userId);
      } else {
        result = await getAvailableItemsForNGOs(auth.userId);
      }
    } else {
      // Donor viewing their donations
      result = await getDonorItemDonations(auth.userId);
    }

    return NextResponse.json(
      {
        success: result.success,
        donations: result.donations,
        count: result.count,
      },
      { status: result.status }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
