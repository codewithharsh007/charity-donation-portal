import ItemDonation from "../models/itemDonationModel.js";
import User from "../models/authModel.js";
import sendorgEmail from "../utils/emailService.js";
import ItemCategory from "../models/itemCategoryModel.js";
import NGOSubscription from "../models/ngoSubscriptionModel.js";

// Create item donation
export const createItemDonation = async (userId, donationData) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        message: "User not found",
        status: 404,
      };
    }

    // ✅ ACCURATE TIER DETECTION based on tier structure and items
    const getTierFromCategory = (category, items = []) => {
      const cat = category.toLowerCase();
      const itemsStr = items.join(" ").toLowerCase();

      // Helper function to check for whole word match
      const hasWholeWord = (text, word) => {
        const regex = new RegExp(`\\b${word}\\b`, "i");
        return regex.test(text);
      };

      // Tier 4 (GOLD) - High-value electronics, vehicles, industrial equipment
      if (
        cat.includes("high-value electronics") ||
        cat.includes("vehicles") ||
        cat.includes("bicycle / vehicle") ||
        cat.includes("power tools") ||
        cat.includes("specialized medical") ||
        cat.includes("land") ||
        cat.includes("property") ||
        cat.includes("industrial") ||
        hasWholeWord(itemsStr, "laptop") ||
        hasWholeWord(itemsStr, "computer") ||
        hasWholeWord(itemsStr, "desktop") ||
        hasWholeWord(itemsStr, "server") ||
        hasWholeWord(itemsStr, "car") || // ✅ Now won't match "cards"
        hasWholeWord(itemsStr, "motorcycle") ||
        hasWholeWord(itemsStr, "vehicle") ||
        hasWholeWord(itemsStr, "truck") ||
        hasWholeWord(itemsStr, "van") ||
        hasWholeWord(itemsStr, "bicycle") ||
        hasWholeWord(itemsStr, "bike") // ✅ Won't match "bikes" in category name
      ) {
        return 4;
      }

      // Tier 3 (SILVER) - Basic electronics, large items, hidden categories
      if (
        cat.includes("electronics") ||
        cat.includes("basic electronics") ||
        cat.includes("large furniture") ||
        cat.includes("medical equipment") ||
        cat.includes("commercial kitchen") ||
        cat.includes("hospital beds") ||
        cat.includes("construction") ||
        cat.includes("agriculture") ||
        hasWholeWord(itemsStr, "tv") ||
        itemsStr.includes("television") ||
        itemsStr.includes("refrigerator") ||
        itemsStr.includes("fridge") ||
        itemsStr.includes("washing machine") ||
        itemsStr.includes("microwave") ||
        hasWholeWord(itemsStr, "ac") ||
        itemsStr.includes("air conditioner") ||
        hasWholeWord(itemsStr, "mobile") ||
        hasWholeWord(itemsStr, "phone") ||
        hasWholeWord(itemsStr, "tablet")
      ) {
        return 3;
      }

      // Tier 2 (BRONZE) - Clothing, toys, furniture, sports, medical basic
      if (
        cat.includes("clothing") ||
        cat.includes("clothes") ||
        cat.includes("textiles") ||
        cat.includes("toys") ||
        cat.includes("games") ||
        cat.includes("basic furniture") ||
        cat.includes("furniture") ||
        cat.includes("sports") ||
        cat.includes("medical supplies (basic)") ||
        cat.includes("medicines") ||
        cat.includes("health kits") ||
        cat.includes("kitchen equipment") ||
        itemsStr.includes("shirt") ||
        itemsStr.includes("pant") ||
        itemsStr.includes("dress") ||
        itemsStr.includes("shoe") ||
        hasWholeWord(itemsStr, "toy") ||
        hasWholeWord(itemsStr, "card") || // ✅ Add this to catch "cards" as tier 2
        hasWholeWord(itemsStr, "cards") ||
        itemsStr.includes("doll") ||
        itemsStr.includes("chair") ||
        itemsStr.includes("table") ||
        itemsStr.includes("medicine")
      ) {
        return 2;
      }

      // Tier 1 (FREE) - Basic items (default)
      // Books, Food, Stationery, Household Items, School Supplies
      return 1;
    };

    const requiredTier = getTierFromCategory(
      donationData.category,
      donationData.items,
    );

    

    const donation = new ItemDonation({
      donor: userId,
      items: donationData.items,
      category: donationData.category,
      description: donationData.description,
      images: donationData.images || [],
      videos: donationData.videos || [],
      pickupAddress: donationData.pickupAddress || user.address,
      pickupPhone: donationData.pickupPhone || user.phone,
      donorNotes: donationData.donorNotes,
      requiredTier: requiredTier, // ✅ AUTO-ASSIGNED TIER
    });

    await donation.save();

    // Send confirmation email
    await sendorgEmail(
      user.email,
      "Item Donation Submitted for Review 📦",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Item Donation Submitted!</h2>
        <p>Dear ${user.userName},</p>
        <p>Thank you for your generous donation! Your items have been submitted and are pending admin approval.</p>
        
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Donation Details:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Category: ${donation.category}</li>
            <li>Items: ${donation.items.join(", ")}</li>
            <li>Status: Pending Admin Approval</li>
            <li>Submitted: ${new Date().toLocaleString()}</li>
          </ul>
        </div>

        <p><strong>What's Next?</strong></p>
        <ol>
          <li>Our admin team will review your donation</li>
          <li>Once approved, it will be visible to verified NGOs</li>
          <li>When an NGO accepts, you'll receive pickup details</li>
          <li>You'll be notified at every step via email</li>
        </ol>
        
        <p style="margin-top: 20px;">
          <strong>Thank you for making a difference!</strong><br>
          Charity Platform Team
        </p>
      </div>
      `,
    );

    return {
      success: true,
      message: "Item donation submitted for admin review",
      donation,
      status: 201,
    };
  } catch (err) {
    console.error("Create item donation error:", err);
    return {
      success: false,
      message: "Server error",
      error: err.message,
      status: 500,
    };
  }
};

// Get donor's item donations
export const getDonorItemDonations = async (userId) => {
  try {
    const donations = await ItemDonation.find({ donor: userId })
      .sort({ createdAt: -1 })
      .populate("donor", "userName email")
      .populate("acceptedBy", "userName email phone");

    return {
      success: true,
      donations,
      count: donations.length,
      status: 200,
    };
  } catch (err) {
    console.error("Get donor item donations error:", err);
    return {
      success: false,
      message: "Server error",
      error: err.message,
      status: 500,
    };
  }
};

// Get all item donations for admin review
export const getItemDonationsForAdmin = async (filter = {}) => {
  try {
    const donations = await ItemDonation.find(filter)
      .sort({ createdAt: -1 })
      .populate("donor", "userName email phone address")
      .populate("acceptedBy", "userName email phone")
      .populate("adminReviewedBy", "userName email");

    return {
      success: true,
      donations,
      count: donations.length,
      status: 200,
    };
  } catch (err) {
    console.error("Get item donations for admin error:", err);
    return {
      success: false,
      message: "Server error",
      error: err.message,
      status: 500,
    };
  }
};

// Admin approve item donation
export const approveItemDonation = async (donationId, adminId) => {
  try {
    const donation = await ItemDonation.findById(donationId).populate(
      "donor",
      "userName email",
    );

    if (!donation) {
      return {
        success: false,
        message: "Donation not found",
        status: 404,
      };
    }

    donation.adminStatus = "approved";
    donation.isActive = true;
    donation.adminReviewedBy = adminId;
    donation.adminReviewedAt = Date.now();
    donation.deliveryStatus = "pending"; // Keep as pending until NGO accepts
    donation.rejectionReason = null; // Clear rejection reason if re-approved

    await donation.save();

    // Send approval email to donor
    await sendorgEmail(
      donation.donor.email,
      "Item Donation Approved! ✅",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Your Donation Has Been Approved! ✅</h2>
        <p>Dear ${donation.donor.userName},</p>
        <p>Great news! Your item donation has been approved and is now visible to verified NGOs.</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Donation Details:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Category: ${donation.category}</li>
            <li>Items: ${donation.items.join(", ")}</li>
            <li>Status: Approved & Active</li>
          </ul>
        </div>

        <p>NGOs can now view and request your donation. You'll receive an email when an NGO accepts it with pickup details.</p>
        
        <p style="margin-top: 20px;">
          <strong>Thank you for your generosity!</strong><br>
          Charity Platform Team
        </p>
      </div>
      `,
    );

    return {
      success: true,
      message: "Item donation approved",
      donation,
      status: 200,
    };
  } catch (err) {
    console.error("Approve item donation error:", err);
    return {
      success: false,
      message: "Server error",
      error: err.message,
      status: 500,
    };
  }
};

// Admin reject item donation
export const rejectItemDonation = async (
  donationId,
  adminId,
  rejectionReason,
) => {
  try {
    const donation = await ItemDonation.findById(donationId).populate(
      "donor",
      "userName email",
    );

    if (!donation) {
      return {
        success: false,
        message: "Donation not found",
        status: 404,
      };
    }

    if (!rejectionReason) {
      return {
        success: false,
        message: "Rejection reason is required",
        status: 400,
      };
    }

    donation.adminStatus = "rejected";
    donation.isActive = false;
    donation.adminReviewedBy = adminId;
    donation.adminReviewedAt = Date.now();
    donation.rejectionReason = rejectionReason;
    donation.deliveryStatus = "pending"; // Reset delivery status for rejected items
    donation.acceptedBy = null; // Clear acceptedBy if it exists
    donation.acceptedAt = null; // Clear acceptedAt if it exists

    await donation.save();

    // Send rejection email to donor
    await sendorgEmail(
      donation.donor.email,
      "Item Donation Status Update",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Donation Status Update</h2>
        <p>Dear ${donation.donor.userName},</p>
        <p>We regret to inform you that your item donation could not be approved at this time.</p>
        
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Reason:</strong></p>
          <p style="margin: 10px 0;">${rejectionReason}</p>
        </div>

        <p>If you have any questions or would like to submit a new donation, please feel free to contact us.</p>
        
        <p style="margin-top: 20px;">
          <strong>Charity Platform Team</strong>
        </p>
      </div>
      `,
    );

    return {
      success: true,
      message: "Item donation rejected",
      donation,
      status: 200,
    };
  } catch (err) {
    console.error("Reject item donation error:", err);
    return {
      success: false,
      message: "Server error",
      error: err.message,
      status: 500,
    };
  }
};

// Get available items for NGOs (approved and active) - filtered by NGO's state and tier
export const getAvailableItemsForNGOs = async (ngoId) => {
  try {

    // Get NGO details - POPULATE subscription if it's a reference
    const ngo = await User.findById(ngoId)
      .select('userName userType state subscription')
      .lean(); // Use lean() for better performance

    if (!ngo) {
      return {
        success: false,
        message: 'NGO not found',
        donations: [],
        count: 0,
        status: 404,
      };
    }

    // ✅ FIX: Get tier with multiple fallback checks
    const ngoTier = 
      ngo.subscription?.currentTier || 
      ngo.subscription?.tier || 
      ngo.currentTier || 
      1; // Default to tier 1

    // Fetch donations
    const donations = await ItemDonation.find({
      adminStatus: 'approved',
      isActive: true,
      acceptedBy: null,
      requiredTier: { $lte: ngoTier },
    })
    .sort({ createdAt: -1 })
    .populate('donor', 'userName phone address city state');

    // Filter by state
    const filteredDonations = ngo.state 
      ? donations.filter(d => {
          const matches = d.donor && d.donor.state === ngo.state;
          const tierMatch = d.requiredTier <= ngoTier;
                  
          return matches && tierMatch;
        })
      : donations.filter(d => d.requiredTier <= ngoTier);

    return {
      success: true,
      donations: filteredDonations,
      count: filteredDonations.length,
      ngoTier,
      status: 200,
    };
  } catch (err) {
    console.error('❌ Get available items error:', err);
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      donations: [],
      count: 0,
      status: 500,
    };
  }
};


// NGO accept item donation
export const acceptItemDonation = async (donationId, ngoId) => {
  try {
    const donation = await ItemDonation.findById(donationId)
      .populate("donor", "userName email phone address")
      .populate("categoryId", "name requiredTier");

    if (!donation) {
      return {
        success: false,
        message: "Donation not found",
        status: 404,
      };
    }

    if (!donation.isActive || donation.acceptedBy) {
      return {
        success: false,
        message: "This donation is no longer available",
        status: 400,
      };
    }

    const ngo = await User.findById(ngoId);
    if (!ngo || ngo.userType !== "ngo") {
      return {
        success: false,
        message: "Invalid NGO",
        status: 403,
      };
    }

    // Check subscription status and tier access
    const ngoTier = ngo.currentTier || 1;

    // Check if subscription is active (if not on free tier)
    if (ngoTier > 1) {
      const subscription = await NGOSubscription.findById(ngo.subscriptionId);
      if (!subscription || subscription.status !== "active") {
        return {
          success: false,
          message:
            "Your subscription is not active. Please renew to accept donations.",
          status: 403,
        };
      }

      // Check monthly acceptance limit
      const canAccept = subscription.canAcceptItem();
      if (!canAccept) {
        return {
          success: false,
          message:
            "You have reached your monthly item acceptance limit. Please upgrade your plan.",
          status: 403,
        };
      }
    }

    // Check tier access for this category
    if (donation.categoryId) {
      const categoryTier = donation.categoryId.requiredTier || 1;
      if (ngoTier < categoryTier) {
        return {
          success: false,
          message: `This item requires ${donation.categoryId.name} category access. Please upgrade to Tier ${categoryTier} or higher.`,
          status: 403,
        };
      }
    }

    // Check item value limit
    if (donation.itemValue) {
      const subscription = await NGOSubscription.findById(
        ngo.subscriptionId,
      ).populate("plan");
      const maxItemValue = subscription?.plan?.limits?.maxItemValue || 50000; // Default for free tier

      if (maxItemValue !== -1 && donation.itemValue > maxItemValue) {
        return {
          success: false,
          message: `This item exceeds your maximum item value limit of ₹${maxItemValue.toLocaleString("en-IN")}. Please upgrade your plan.`,
          status: 403,
        };
      }
    }

    // Accept the donation
    donation.acceptedBy = ngoId;
    donation.acceptedAt = Date.now();
    donation.isActive = false; // Make inactive so others can't accept
    donation.deliveryStatus = "not_picked_up";

    await donation.save();
    await donation.populate("acceptedBy", "userName email phone");

    // Increment monthly acceptance counter
    if (ngo.subscriptionId) {
      const subscription = await NGOSubscription.findById(ngo.subscriptionId);
      if (subscription) {
        subscription.usage.monthlyAcceptedItems += 1;
        subscription.usage.lastAcceptedAt = Date.now();
        await subscription.save();
      }
    }

    // Send email to donor with NGO details
    await sendorgEmail(
      donation.donor.email,
      "Your Donation Has Been Accepted! 🎉",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Great News! Your Donation Has Been Accepted! 🎉</h2>
        <p>Dear ${donation.donor.userName},</p>
        <p>An NGO has accepted your donation and will arrange pickup shortly.</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>NGO Details:</strong></p>
          <ul style="margin: 10px 0;">
            <li>NGO: ${ngo.userName}</li>
            <li>Email: ${ngo.email}</li>
            <li>Phone: ${ngo.phone || "Not provided"}</li>
          </ul>
        </div>

        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Your Pickup Details:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Address: ${donation.pickupAddress}</li>
            <li>Phone: ${donation.pickupPhone}</li>
            <li>Items: ${donation.items.join(", ")}</li>
          </ul>
        </div>

        <p>The NGO will contact you to arrange the pickup. Please keep the items ready.</p>
        
        <p style="margin-top: 20px;">
          <strong>Thank you for your contribution!</strong><br>
          Charity Platform Team
        </p>
      </div>
      `,
    );

    // Send email to NGO with donor details
    await sendorgEmail(
      ngo.email,
      "Donation Accepted - Pickup Details 📦",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Donation Accepted Successfully! 📦</h2>
        <p>Dear ${ngo.userName},</p>
        <p>You have successfully accepted a donation. Please arrange pickup with the donor.</p>
        
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Donor Details:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Name: ${donation.donor.userName}</li>
            <li>Phone: ${donation.pickupPhone}</li>
            <li>Address: ${donation.pickupAddress}</li>
          </ul>
        </div>

        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Donation Items:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Category: ${donation.category}</li>
            <li>Items: ${donation.items.join(", ")}</li>
            ${donation.description ? `<li>Description: ${donation.description}</li>` : ""}
          </ul>
        </div>

        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Contact the donor to schedule pickup</li>
          <li>Update status to "Picked Up" after collecting items</li>
          <li>Update status to "Received" once delivered to your facility</li>
        </ol>
        
        <p style="margin-top: 20px;">
          <strong>Charity Platform Team</strong>
        </p>
      </div>
      `,
    );

    return {
      success: true,
      message: "Donation accepted successfully",
      donation,
      status: 200,
    };
  } catch (err) {
    console.error("Accept item donation error:", err);
    return {
      success: false,
      message: "Server error",
      error: err.message,
      status: 500,
    };
  }
};

// Update delivery status
export const updateDeliveryStatus = async (donationId, ngoId, newStatus) => {
  try {
    const donation = await ItemDonation.findById(donationId)
      .populate("donor", "userName email")
      .populate("acceptedBy", "userName email");

    if (!donation) {
      return {
        success: false,
        message: "Donation not found",
        status: 404,
      };
    }

    if (donation.acceptedBy._id.toString() !== ngoId.toString()) {
      return {
        success: false,
        message: "Unauthorized",
        status: 403,
      };
    }

    const validTransitions = {
      not_picked_up: ["picked_up"],
      picked_up: ["received"],
    };

    if (!validTransitions[donation.deliveryStatus]?.includes(newStatus)) {
      return {
        success: false,
        message: "Invalid status transition",
        status: 400,
      };
    }

    donation.deliveryStatus = newStatus;

    if (newStatus === "picked_up") {
      donation.pickupDate = Date.now();
    } else if (newStatus === "received") {
      donation.receivedDate = Date.now();
    }

    await donation.save();

    // Send status update email to donor
    const statusMessages = {
      picked_up: {
        subject: "Your Donation Has Been Picked Up 📦",
        message: "Your donated items have been picked up by the NGO.",
      },
      received: {
        subject: "Your Donation Has Been Received 🎉",
        message:
          "Your donated items have been received by the NGO and will be put to good use!",
      },
    };

    const statusInfo = statusMessages[newStatus];

    await sendorgEmail(
      donation.donor.email,
      statusInfo.subject,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">${statusInfo.subject}</h2>
        <p>Dear ${donation.donor.userName},</p>
        <p>${statusInfo.message}</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Donation Details:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Items: ${donation.items.join(", ")}</li>
            <li>NGO: ${donation.acceptedBy.userName}</li>
            <li>Status: ${newStatus.replace("_", " ").toUpperCase()}</li>
            ${newStatus === "received" ? `<li>Received: ${new Date().toLocaleString()}</li>` : ""}
          </ul>
        </div>

        <p>Thank you for your generosity and for making a difference in the lives of those in need!</p>
        
        <p style="margin-top: 20px;">
          <strong>With gratitude,</strong><br>
          Charity Platform Team
        </p>
      </div>
      `,
    );

    return {
      success: true,
      message: "Delivery status updated",
      donation,
      status: 200,
    };
  } catch (err) {
    console.error("Update delivery status error:", err);
    return {
      success: false,
      message: "Server error",
      error: err.message,
      status: 500,
    };
  }
};

// Get NGO's accepted donations
export const getNGOAcceptedDonations = async (ngoId) => {
  try {
    const donations = await ItemDonation.find({ acceptedBy: ngoId })
      .sort({ acceptedAt: -1 })
      .populate("donor", "userName email phone address city state");

    return {
      success: true,
      donations,
      count: donations.length,
      status: 200,
    };
  } catch (err) {
    console.error("Get NGO accepted donations error:", err);
    return {
      success: false,
      message: "Server error",
      error: err.message,
      status: 500,
    };
  }
};
