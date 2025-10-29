import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import FinancialRequest from "@/models/financialRequest";
import User from "@/models/authModel";
import NGOSubscription from "@/models/ngoSubscriptionModel";
import NGOVerification from "@/models/ngoVerificationModel";
import jwt from "jsonwebtoken";

export async function POST(request) {
  console.log("🚀 POST /api/ngo/funding-requests called");

  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      console.log("❌ No token found");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔓 Decoded token:", decoded);

    const ngoId =
      decoded.userId || decoded.id || decoded._id || decoded.user?.id;

    if (!ngoId) {
      console.log("❌ No user ID found in token. Decoded:", decoded);
      return NextResponse.json(
        { success: false, message: "Invalid token structure" },
        { status: 401 },
      );
    }

    console.log("👤 NGO ID:", ngoId);

    const ngo = await User.findById(ngoId);

    if (!ngo) {
      console.log("❌ NGO not found for ID:", ngoId);
      return NextResponse.json(
        { success: false, message: "NGO not found" },
        { status: 404 },
      );
    }

    // ✅ Get subscription and verification
    const subscription = await NGOSubscription.findOne({
      userId: ngoId,
      status: "active",
    }).sort({ createdAt: -1 });

    const verification = await NGOVerification.findOne({
      userId: ngoId,
    });

    const currentTier = subscription?.tier || 1;
    const verificationStatus = verification?.verificationStatus || "pending";

    console.log("✅ NGO found:", ngo.name || ngo.email);
    console.log("📊 Tier:", currentTier, "Status:", verificationStatus);

    // ✅ Check verification
    if (
      verificationStatus !== "verified" &&
      verificationStatus !== "accepted"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Complete NGO verification to request funding",
        },
        { status: 403 },
      );
    }

    // ✅ Check tier (must be 3 or 4)
    if (currentTier < 3) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Upgrade to Silver (Tier 3) or Gold (Tier 4) to request funding",
        },
        { status: 403 },
      );
    }

    // ✅ NEW LOGIC: Monthly limit based on tier
    const monthlyLimit =
      currentTier === 4 ? 50000 : currentTier === 3 ? 20000 : 0;

    console.log("💰 Monthly Limit:", monthlyLimit);

    // ✅ Check for PENDING or UNDER_REVIEW requests only
    const activeRequest = await FinancialRequest.findOne({
      ngo: ngoId,
      adminStatus: { $in: ["pending", "under_review"] },
      isActive: true,
    });

    if (activeRequest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You already have a pending funding request. Please wait for admin review.",
        },
        { status: 400 },
      );
    }

    // ✅ NEW LOGIC: Calculate monthly funding received (approved amounts)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const monthlyApprovedRequests = await FinancialRequest.find({
      ngo: ngoId,
      adminStatus: "approved",
      adminReviewedAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const monthlyReceived = monthlyApprovedRequests.reduce(
      (sum, req) => sum + (req.approvedAmount || 0),
      0,
    );

    const remainingAllocation = monthlyLimit - monthlyReceived;

    console.log("📊 Monthly Stats:", {
      monthlyLimit,
      monthlyReceived,
      remainingAllocation,
    });

    // ✅ Check if monthly limit reached
    if (remainingAllocation <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: `You have reached your monthly funding limit of ₹${monthlyLimit.toLocaleString()}. You've received ₹${monthlyReceived.toLocaleString()} this month. Your limit will reset on the 1st of next month.`,
        },
        { status: 400 },
      );
    }

    // ✅ Parse request body
    const body = await request.json();
    const {
      requestedAmount,
      title,
      purpose,
      description,
      beneficiaryCount,
      budgetBreakdown,
      documents,
    } = body;

    // ✅ Validate requested amount
    if (!requestedAmount || requestedAmount < 1000) {
      return NextResponse.json(
        { success: false, message: "Minimum request amount is ₹1,000" },
        { status: 400 },
      );
    }

    // ✅ Check against tier limit
    if (requestedAmount > monthlyLimit) {
      return NextResponse.json(
        {
          success: false,
          message: `Maximum amount for ${currentTier === 4 ? "Gold" : "Silver"} tier is ₹${monthlyLimit.toLocaleString()} per month`,
        },
        { status: 400 },
      );
    }

    // ✅ Check against remaining allocation
    if (requestedAmount > remainingAllocation) {
      return NextResponse.json(
        {
          success: false,
          message: `Request amount (₹${requestedAmount.toLocaleString()}) exceeds your remaining monthly allocation of ₹${remainingAllocation.toLocaleString()}. You have received ₹${monthlyReceived.toLocaleString()} this month.`,
        },
        { status: 400 },
      );
    }

    // ✅ Create funding request
    const financialRequest = await FinancialRequest.create({
      ngo: ngoId,
      title,
      requestedAmount: parseFloat(requestedAmount),
      purpose,
      description,
      beneficiaryCount: parseInt(beneficiaryCount) || 0,
      budgetBreakdown: budgetBreakdown || [],
      documents: documents || [],
      adminStatus: "pending",
      approvedAmount: 0,
      allocatedAmount: 0,
      disbursedAmount: 0,
      priority: "medium",
      isActive: true,
    });

    console.log("✅ Request created:", financialRequest._id);

    return NextResponse.json(
      {
        success: true,
        message: "Funding request submitted successfully!",
        request: financialRequest,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const ngoId =
      decoded.userId || decoded.id || decoded._id || decoded.user?.id;

    if (!ngoId) {
      return NextResponse.json(
        { success: false, message: "Invalid token structure" },
        { status: 401 },
      );
    }

    const requests = await FinancialRequest.find({ ngo: ngoId })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📋 Found ${requests.length} requests for NGO:`, ngoId);

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}
 