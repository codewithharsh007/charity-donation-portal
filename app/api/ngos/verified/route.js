import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/authModel";
import NGOVerification from "@/models/ngoVerificationModel";
import NGOSubscription from "@/models/ngoSubscriptionModel";

export async function GET(request) {
  try {
    await connectDB();

    // Get all verified NGOs
    const verifiedNGOs = await NGOVerification.find({
      verificationStatus: { $in: ["verified", "accepted"] },
    }).lean();

    console.log("✅ Found verified NGOs:", verifiedNGOs.length);

    // Get subscription and user data for each NGO
    const ngosWithDetails = await Promise.all(
      verifiedNGOs.map(async (verification) => {
        try {
          // Get user data with full details
          const user = await User.findById(verification.userId).lean();

          // Get subscription data
          const subscription = await NGOSubscription.findOne({
            userId: verification.userId,
            status: "active",
          })
            .sort({ createdAt: -1 })
            .lean();

          // ✅ FIXED: Priority for location data
          // 1. Try NGOVerification first
          // 2. Fall back to User model
          const address = verification.address || user?.address || "";
          const city = verification.city || user?.city || "";
          const state = verification.state || user?.state || "";
          const pincode = verification.pincode || user?.pincode || "";

          // ✅ Only show if we have at least city and state
          const hasLocation = city && state;

          console.log("NGO Location Data:", {
            ngoName: verification.ngoName,
            verificationAddress: verification.address,
            verificationCity: verification.city,
            userAddress: user?.address,
            userCity: user?.city,
            finalCity: city,
            finalState: state,
          });

          return {
            id: verification._id,
            ngoName: verification.ngoName || "Unnamed NGO",
            registrationNumber: verification.registrationNumber,
            email: user?.email || verification.email || "Contact via website",
            phone: user?.phone || verification.phone || "Contact via website",
            address: hasLocation ? address : "Location not specified",
            city: hasLocation ? city : "Not specified",
            state: hasLocation ? state : "Not specified",
            pincode: hasLocation ? pincode : "",
            category: verification.category || "Other",
            description: verification.description || "No description provided.",
            website: verification.website || null,
            establishedYear:
              verification.establishedYear ||
              verification.yearEstablished ||
              null,
            founderName: verification.founderName || null,
            teamSize: verification.teamSize || null,
            beneficiariesServed: verification.beneficiariesServed || null,
            images: verification.images || [],
            verifiedAt: verification.verifiedAt || verification.updatedAt,
            tier: subscription?.tier || 1,
            tierName:
              subscription?.tier === 4
                ? "Gold"
                : subscription?.tier === 3
                  ? "Silver"
                  : subscription?.tier === 2
                    ? "Bronze"
                    : "Free",
          };
        } catch (err) {
          console.error("Error processing NGO:", verification._id, err);
          return null;
        }
      }),
    );

    // Filter out any null values
    const validNGOs = ngosWithDetails.filter((ngo) => ngo !== null);

    console.log(
      "✅ Processed NGOs with locations:",
      validNGOs.map((n) => ({
        name: n.ngoName,
        city: n.city,
        state: n.state,
      })),
    );

    return NextResponse.json({
      success: true,
      ngos: validNGOs,
      count: validNGOs.length,
    });
  } catch (error) {
    console.error("❌ Error fetching verified NGOs:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}
