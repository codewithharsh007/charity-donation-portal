// app/api/admin/subscriptions/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/config/JWT";
import dbConnect from "@/lib/mongodb";
import NgoSubscription from "@/models/ngoSubscriptionModel";
import SubscriptionPlan from "@/models/subscriptionPlanModel";
import { isTestMode } from "@/lib/testMode";
import SubscriptionTransaction from "@/models/subscriptionTransactionModel";
import User from "@/models/authModel";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    await dbConnect();

    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No token" },
        { status: 401 },
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    // Check if user is admin
    const user = await User.findById(decoded.id);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied. Admin only." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");
    const tier = searchParams.get("tier");

    let query = {};

    if (filter && filter !== "all") {
      query.status = filter;
    }

    if (tier) {
      query.tier = parseInt(tier);
    }

    // Fetch all subscriptions with populated data
    const subscriptions = await NgoSubscription.find(query)
      .populate("userId", "userName email phone state")
      .populate("planId", "name displayName tier pricing")
      .sort({ createdAt: -1 })
      .lean();

    // Transform data to match frontend expectations
    const transformedSubscriptions = subscriptions.map((sub) => ({
      _id: sub._id,
      ngo: sub.userId,
      plan: sub.planId,
      status: sub.status,
      billing: {
        isYearly: sub.billingCycle === "yearly",
        nextBillingDate: sub.nextBillingDate,
      },
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    }));

    // Calculate statistics
    const allSubs = await NgoSubscription.find().lean();
    const stats = {
      total: allSubs.length,
      active: allSubs.filter((s) => s.status === "active").length,
      trial: allSubs.filter((s) => s.status === "trial").length,
      cancelled: allSubs.filter((s) => s.status === "cancelled").length,
      expired: allSubs.filter((s) => s.status === "expired").length,
    };

    // Calculate revenue by tier from transactions
    const completedTransactions = await SubscriptionTransaction.find({
      status: "completed",
    })
      .populate("subscriptionId")
      .lean();

    const revenueByTier = {
      tier1: 0,
      tier2: 0,
      tier3: 0,
      tier4: 0,
      total: 0,
    };

    completedTransactions.forEach((tx) => {
      const tier = tx.planDetails?.tier;
      const amount = tx.invoice?.total || tx.amount || 0;

      if (tier && tier >= 1 && tier <= 4) {
        revenueByTier[`tier${tier}`] += amount;
        revenueByTier.total += amount;
      }
    });

    return NextResponse.json({
      success: true,
      subscriptions: transformedSubscriptions,
      stats,
      revenueByTier,
    });
  } catch (error) {
    console.error("❌ Error fetching admin subscriptions:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error:
          isTestMode() ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
