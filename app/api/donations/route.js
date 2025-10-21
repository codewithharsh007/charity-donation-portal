import { NextResponse } from 'next/server';
import * as donorController from '@/controllers/donorController';

export async function POST(request) {
  const result = await donorController.createDonation(request);
  return NextResponse.json(result, { status: result.status || 500 });
}

export async function GET(request) {
  const result = await donorController.getDonorDonations(request);
  return NextResponse.json(result, { status: result.status || 500 });
}
