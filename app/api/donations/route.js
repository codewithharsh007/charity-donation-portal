import { NextResponse } from "next/server";
import { isTestMode } from "@/lib/testMode"; // ✅ ADD THIS
import * as donorController from "@/controllers/donorController";
import dbConnect from "@/lib/mongodb"; // ✅ ADD THIS

export const runtime = "nodejs"; // ✅ ADD THIS

export async function POST(request) {
  try {
    await dbConnect(); // ✅ ADD THIS
    const result = await donorController.createDonation(request);
    return NextResponse.json(result, { status: result.status || 500 });
  } catch (error) {
    console.error("❌ POST /api/donations error:", error);
    // ✅ CHANGED: Use isTestMode()
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: isTestMode() ? error.message : undefined,
        stack: isTestMode() ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    await dbConnect(); // ✅ ADD THIS
    const result = await donorController.getDonorDonations(request);
    return NextResponse.json(result, { status: result.status || 500 });
  } catch (error) {
    console.error("❌ GET /api/donations error:", error);
    // ✅ CHANGED: Use isTestMode()
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: isTestMode() ? error.message : undefined,
        stack: isTestMode() ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
