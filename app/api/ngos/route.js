import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import NgoVerification from '@/models/ngoVerificationModel';

// Public GET - list verified NGOs for donors to choose
export async function GET(request) {
  try {
    await dbConnect();

    // Allow optional status filter via query param: ?status=accepted|pending|all
    const url = new URL(request.url);
    const statusParam = (url.searchParams.get('status') || 'accepted').toLowerCase();

    let filter = {};
    if (statusParam && statusParam !== 'all') {
      // only allow accepted or pending to avoid accidental exposure
      if (['accepted', 'pending', 'rejected'].includes(statusParam)) {
        filter.verificationStatus = statusParam;
      }
    }

    const ngos = await NgoVerification.find(filter)
      .select('ngoName ngoAddress ngoImage verificationStatus')
      .sort({ ngoName: 1 })
      .lean();

    // Map to lightweight shape
    const list = ngos.map(n => ({
      id: n._id,
      ngoName: n.ngoName,
      ngoAddress: n.ngoAddress,
      ngoImage: n.ngoImage?.url || null,
      verificationStatus: n.verificationStatus,
    }));

    return NextResponse.json({ success: true, ngos: list }, { status: 200 });
  } catch (err) {
    console.error('Get NGOs error:', err);
    return NextResponse.json({ success: false, message: 'Server error', error: err.message }, { status: 500 });
  }
}
