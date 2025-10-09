import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { verifyOtp } from "@/controllers/authController";

export async function POST(request) {
  try {
    await dbConnect();
    const { email, otp } = await request.json();

    const result = verifyOtp(email, otp);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
      },
      { status: result.status },
    );
  } catch (error) {
    console.error("❌ Verify OTP API error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}
