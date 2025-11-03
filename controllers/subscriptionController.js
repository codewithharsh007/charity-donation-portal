// controllers/subscriptionController.js
import SubscriptionPlan from "@/models/subscriptionPlanModel";
import NgoSubscription from "@/models/ngoSubscriptionModel";
import SubscriptionTransaction from "@/models/subscriptionTransactionModel";
import User from "@/models/authModel";
import ItemCategory from "@/models/itemCategoryModel";
import { isTestMode } from "@/lib/testMode";

// Get all subscription plans
export const getSubscriptionPlans = async () => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .sort({ tier: 1 })
      .select("-__v");

    // Populate category names for better readability
    const plansWithCategories = await Promise.all(
      plans.map(async (plan) => {
        const planObj = plan.toObject();

        // Get category names
        if (planObj.permissions?.categories?.length > 0) {
          const categories = await ItemCategory.find({
            _id: { $in: planObj.permissions.categories },
          }).select("name icon");
          planObj.categoryNames = categories.map((c) => ({
            name: c.name,
            icon: c.icon,
          }));
        }

        return planObj;
      }),
    );

    return {
      success: true,
      data: plansWithCategories,
      status: 200,
    };
  } catch (error) {
    console.error("❌ Error fetching subscription plans:", error);
    return {
      success: false,
      message: "Failed to fetch subscription plans",
      error: isTestMode() ? error.message : undefined,
      status: 500,
    };
  }
};

// Get current user's subscription
// Get current user's subscription
export const getCurrentSubscription = async (userId) => {
  try {
    // Get user data
    const user = await User.findById(userId).select(
      "subscription userType role",
    );

    if (!user) {
      return {
        success: false,
        message: "User not found",
        status: 404,
      };
    }

    // Check if user is NGO
    if (user.userType !== "ngo" && user.role !== "ngo") {
      return {
        success: false,
        message: "Only NGOs can have subscriptions",
        status: 403,
      };
    }

    // Get subscription details
    let subscriptionDetails = null;
    if (user.subscription?.subscriptionId) {
      subscriptionDetails = await NgoSubscription.findById(
        user.subscription.subscriptionId,
      ).populate(
        "planId",
        "name displayName tier pricing limits features badge",
      );
    }

    // Get plan details based on current tier
    const currentTier = user.subscription?.currentTier || 1;
    const planDetails = await SubscriptionPlan.findOne({
      tier: currentTier,
    });

    // ✅ FIX: Return data in the format your frontend expects
    return {
      success: true,
      data: {
        currentTier: user.subscription?.currentTier || 1,
        tierName: user.subscription?.tierName || "FREE",
        status: user.subscription?.status || "active",
        expiresAt: user.subscription?.expiresAt || null,
        trialUsed: user.subscription?.trialUsed || false,
        subscription: subscriptionDetails,
        plan: planDetails,
      },
      subscription: subscriptionDetails,
      userInfo: {
        userType: user.userType,
        role: user.role,
        currentTier: user.subscription?.currentTier || 1,
        tierName: user.subscription?.tierName || "FREE",
        status: user.subscription?.status || "active",
        expiresAt: user.subscription?.expiresAt || null,
      },
      status: 200,
    };
  } catch (error) {
    console.error("❌ Error fetching current subscription:", error);
    return {
      success: false,
      message: "Failed to fetch subscription details",
      error: isTestMode() ? error.message : undefined,
      status: 500,
    };
  }
};

// Get subscription usage statistics
export const getSubscriptionUsage = async (userId) => {
  try {
    const user = await User.findById(userId).select("subscription");
    if (!user || !user.subscription?.subscriptionId) {
      return {
        success: false,
        message: "No active subscription found",
        status: 404,
      };
    }

    const subscription = await NgoSubscription.findById(
      user.subscription.subscriptionId,
    ).populate("planId", "limits");

    if (!subscription) {
      return {
        success: false,
        message: "Subscription not found",
        status: 404,
      };
    }

    const plan = subscription.planId;
    const usage = subscription.usage || {};

    return {
      success: true,
      data: {
        usage: {
          activeRequests: {
            current: usage.activeRequests || 0,
            limit: plan.limits.activeRequests,
            percentage: Math.round(
              ((usage.activeRequests || 0) / plan.limits.activeRequests) * 100,
            ),
          },
          monthlyAcceptedItems: {
            current: usage.monthlyAcceptedItems || 0,
            limit: plan.limits.monthlyAcceptance,
            percentage: Math.round(
              ((usage.monthlyAcceptedItems || 0) /
                plan.limits.monthlyAcceptance) *
                100,
            ),
          },
          financialRequestsThisMonth: {
            current: usage.financialRequestsThisMonth || 0,
            limit: plan.limits.financialDonationLimit > 0 ? 1 : 0,
          },
          lastResetDate: usage.lastResetDate || null,
        },
        limits: plan.limits,
      },
      status: 200,
    };
  } catch (error) {
    console.error("❌ Error fetching subscription usage:", error);
    return {
      success: false,
      message: "Failed to fetch usage statistics",
      error: isTestMode() ? error.message : undefined,
      status: 500,
    };
  }
};

// Create or upgrade subscription (requires payment)
export const createSubscription = async (userId, data) => {
  try {
    const { planId, billingCycle, isTrial } = data;

    // Validate input
    if (!planId || !billingCycle) {
      return {
        success: false,
        message: "Plan ID and billing cycle are required",
        status: 400,
      };
    }

    if (!["monthly", "yearly"].includes(billingCycle)) {
      return {
        success: false,
        message: "Billing cycle must be monthly or yearly",
        status: 400,
      };
    }

    // Get user and plan
    const user = await User.findById(userId);
    const plan = await SubscriptionPlan.findById(planId);

    if (!plan || !plan.isActive) {
      return {
        success: false,
        message: "Subscription plan not found",
        status: 404,
      };
    }

    // Check if trying to "buy" FREE tier
    if (plan.tier === 1) {
      return {
        success: false,
        message: "FREE tier does not require payment",
        status: 400,
      };
    }

    // Check trial eligibility
    if (isTrial && user.subscription?.trialUsed) {
      return {
        success: false,
        message: "Trial already used",
        status: 400,
      };
    }

    // Calculate dates
    const startDate = new Date();
    let endDate, nextBillingDate, trialEndsAt;

    if (isTrial) {
      const trialDays = plan.tier === 2 ? 14 : 7;
      trialEndsAt = new Date(startDate);
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
      endDate = trialEndsAt;
      nextBillingDate = trialEndsAt;
    } else {
      if (billingCycle === "monthly") {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      nextBillingDate = endDate;
    }

    // Check if upgrading existing subscription
    let subscription;
    if (user.subscription?.subscriptionId) {
      subscription = await NgoSubscription.findById(
        user.subscription.subscriptionId,
      );

      if (subscription) {
        subscription.planId = planId;
        subscription.tier = plan.tier;
        subscription.status = isTrial ? "trial" : "active";
        subscription.billingCycle = billingCycle;
        subscription.endDate = endDate;
        subscription.nextBillingDate = nextBillingDate;
        subscription.isTrial = isTrial || false;
        subscription.trialEndsAt = trialEndsAt;

        await subscription.save();
      }
    }

    if (!subscription) {
      subscription = await NgoSubscription.create({
        userId,
        planId,
        tier: plan.tier,
        status: isTrial ? "trial" : "active",
        billingCycle,
        startDate,
        endDate,
        nextBillingDate,
        isTrial: isTrial || false,
        trialEndsAt,
        autoRenew: true,
      });
    }

    // Update user subscription info
    user.subscription = {
      currentTier: plan.tier,
      tierName: plan.name,
      subscriptionId: subscription._id,
      status: isTrial ? "trial" : "active",
      expiresAt: endDate,
      trialUsed: isTrial ? true : user.subscription?.trialUsed || false,
    };

    await user.save();

    return {
      success: true,
      message: isTrial
        ? "Trial subscription activated successfully"
        : "Subscription created successfully",
      subscription,
      plan: {
        name: plan.name,
        displayName: plan.displayName,
        tier: plan.tier,
      },
      status: 201,
    };
  } catch (error) {
    console.error("❌ Error creating subscription:", error);
    return {
      success: false,
      message: "Failed to create subscription",
      error: isTestMode() ? error.message : undefined,
      status: 500,
    };
  }
};

// Cancel subscription
export const cancelSubscription = async (userId, data = {}) => {
  try {
    const { reason } = data;

    const user = await User.findById(userId);

    if (!user.subscription?.subscriptionId) {
      return {
        success: false,
        message: "No active subscription found",
        status: 404,
      };
    }

    const subscription = await NgoSubscription.findById(
      user.subscription.subscriptionId,
    );

    if (!subscription) {
      return {
        success: false,
        message: "Subscription not found",
        status: 404,
      };
    }

    // Don't allow canceling FREE tier
    if (subscription.tier === 1) {
      return {
        success: false,
        message: "Cannot cancel FREE tier",
        status: 400,
      };
    }

    // Mark as cancelled
    subscription.status = "cancelled";
    subscription.autoRenew = false;
    subscription.cancelledAt = new Date();
    subscription.cancelReason = reason || "No reason provided";

    await subscription.save();

    // Update user status
    user.subscription.status = "cancelled";
    await user.save();

    return {
      success: true,
      message:
        "Subscription cancelled successfully. Access will continue until " +
        subscription.endDate.toLocaleDateString(),
      subscription,
      accessUntil: subscription.endDate,
      status: 200,
    };
  } catch (error) {
    console.error("❌ Error cancelling subscription:", error);
    return {
      success: false,
      message: "Failed to cancel subscription",
      error: isTestMode() ? error.message : undefined,
      status: 500,
    };
  }
};

// Downgrade to FREE tier
export const downgradeToFree = async (userId) => {
  try {
    const user = await User.findById(userId);

    // Get FREE tier plan
    const freePlan = await SubscriptionPlan.findOne({ tier: 1 });

    if (!freePlan) {
      return {
        success: false,
        message: "FREE tier plan not found",
        status: 500,
      };
    }

    // If has paid subscription, cancel it
    if (user.subscription?.subscriptionId) {
      const subscription = await NgoSubscription.findById(
        user.subscription.subscriptionId,
      );

      if (subscription && subscription.tier > 1) {
        subscription.status = "cancelled";
        subscription.autoRenew = false;
        subscription.cancelledAt = new Date();
        subscription.cancelReason = "Downgraded to FREE tier";
        await subscription.save();
      }
    }

    // Create FREE tier subscription
    const freeSubscription = await NgoSubscription.create({
      userId,
      planId: freePlan._id,
      tier: 1,
      status: "active",
      billingCycle: "monthly",
      startDate: new Date(),
      autoRenew: true,
    });

    // Update user
    user.subscription = {
      currentTier: 1,
      tierName: "FREE",
      subscriptionId: freeSubscription._id,
      status: "active",
      expiresAt: null,
      trialUsed: user.subscription?.trialUsed || false,
    };

    await user.save();

    return {
      success: true,
      message: "Successfully downgraded to FREE tier",
      subscription: freeSubscription,
      plan: freePlan,
      status: 200,
    };
  } catch (error) {
    console.error("❌ Error downgrading to FREE:", error);
    return {
      success: false,
      message: "Failed to downgrade subscription",
      error: isTestMode() ? error.message : undefined,
      status: 500,
    };
  }
};

// Check if user can upgrade (helper function)
export const checkUpgradeEligibility = async (userId, targetTier) => {
  try {
    if (!targetTier) {
      return {
        success: false,
        message: "Target tier is required",
        status: 400,
      };
    }

    const user = await User.findById(userId);
    const currentTier = user.subscription?.currentTier || 1;

    if (targetTier <= currentTier) {
      return {
        success: false,
        message: "Target tier must be higher than current tier",
        status: 400,
      };
    }

    const targetPlan = await SubscriptionPlan.findOne({
      tier: parseInt(targetTier),
    });

    if (!targetPlan) {
      return {
        success: false,
        message: "Target plan not found",
        status: 404,
      };
    }

    // Check if trial is available
    const canUseTrial = !user.subscription?.trialUsed && targetTier > 1;

    return {
      success: true,
      data: {
        canUpgrade: true,
        currentTier,
        targetTier: parseInt(targetTier),
        targetPlan,
        canUseTrial,
        trialDays: targetTier === 2 ? 14 : 7,
      },
      status: 200,
    };
  } catch (error) {
    console.error("❌ Error checking upgrade eligibility:", error);
    return {
      success: false,
      message: "Failed to check eligibility",
      error: isTestMode() ? error.message : undefined,
      status: 500,
    };
  }
};

// Get Transaction History
export const getTransactionHistory = async (userId, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    const transactions = await SubscriptionTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v");

    const total = await SubscriptionTransaction.countDocuments({ userId });

    return {
      success: true,
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      status: 200,
    };
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    return {
      success: false,
      message: "Failed to fetch transaction history",
      error: isTestMode() ? error.message : undefined,
      status: 500,
    };
  }
};
