import { NextResponse } from 'next/server';
import * as donorController from '@/controllers/donorController';

export async function POST(request) {
  try {
    const result = await donorController.createDonation(request);
    return NextResponse.json(result, { status: result.status || 500 });
  } catch (error) {
    console.error('❌ POST /api/donations error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const result = await donorController.getDonorDonations(request);
    return NextResponse.json(result, { status: result.status || 500 });
  } catch (error) {
    console.error('❌ GET /api/donations error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
