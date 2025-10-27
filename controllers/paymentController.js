// controllers/paymentController.js
import Razorpay from "razorpay";
import crypto from "crypto";
import SubscriptionTransaction from "@/models/subscriptionTransactionModel";
import NgoSubscription from "@/models/ngoSubscriptionModel";
import SubscriptionPlan from "@/models/subscriptionPlanModel";
import User from "@/models/authModel";

// Check if in test mode
const isTestMode = process.env.SUBSCRIPTION_TEST_MODE === "true";

// Initialize Razorpay instance (only if not in test mode)
let razorpay;
if (!isTestMode) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (keyId && keySecret) {
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  } else {
    console.warn('⚠️ Razorpay credentials missing. Set SUBSCRIPTION_TEST_MODE=true for testing.');
  }
} else {
}

// Create Payment Order (for subscription payment)
export const createPaymentOrder = async (userId, data) => {
  try {

    const { planId, billingCycle } = data;

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

    const plan = await SubscriptionPlan.findById(planId);

    if (!plan || !plan.isActive) {
      return {
        success: false,
        message: "Subscription plan not found",
        status: 404,
      };
    }

    // Check if FREE tier
    if (plan.tier === 1) {
      return {
        success: false,
        message: "FREE tier does not require payment",
        status: 400,
      };
    }

    const user = await User.findById(userId);

    if (!user) {
      return {
        success: false,
        message: "User not found",
        status: 404,
      };
    }

    // Calculate amount
    const amount = billingCycle === "monthly" ? plan.pricing.monthly : plan.pricing.yearly;
    const gstAmount = amount * 0.18;
    const totalAmount = amount + gstAmount;

    // Create Razorpay order
    let razorpayOrder;
    if (isTestMode) {
      razorpayOrder = {
        id: `order_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entity: "order",
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        status: "created",
        receipt: `sub_${userId}_${Date.now()}`,
      };
    } else {
      if (!razorpay || typeof razorpay.orders === "undefined") {
        return {
          success: false,
          message: "Payment gateway not configured. Please contact administrator.",
          status: 500,
        };
      }
      
      const options = {
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `sub_${userId}_${Date.now()}`,
        notes: {
          userId: userId.toString(),
          planId: planId.toString(),
          planName: plan.name,
          billingCycle,
          tier: plan.tier,
          type: "subscription",
        },
      };

      razorpayOrder = await razorpay.orders.create(options);
    }

    // Check for existing subscription
    const existingSubscriptionId = user.subscription?.subscriptionId;
    const transactionType = existingSubscriptionId ? "upgrade" : "subscription";

    // Build transaction data
    const transactionData = {
      userId,
      type: transactionType,
      amount,
      currency: "INR",
      razorpayOrderId: razorpayOrder.id,
      status: "pending",
      planDetails: {
        tier: plan.tier,
        planName: plan.name,
        billingCycle,
      },
      invoice: {
        subtotal: amount,
        gstAmount,
        total: totalAmount,
      },
    };

    if (existingSubscriptionId) {
      transactionData.subscriptionId = existingSubscriptionId;
    }

    const transaction = await SubscriptionTransaction.create(transactionData);

    return {
      success: true,
      message: "Payment order created successfully",
      order: razorpayOrder,
      orderId: razorpayOrder.id,
      amount: totalAmount,
      currency: "INR",
      keyId: isTestMode ? "test_mode" : process.env.RAZORPAY_KEY_ID,
      transactionId: transaction._id.toString(),
      testMode: isTestMode,
      breakdown: {
        subtotal: amount,
        gst: gstAmount,
        total: totalAmount,
      },
      plan: {
        name: plan.name,
        displayName: plan.displayName,
        tier: plan.tier,
      },
      status: 200,
    };
  } catch (error) {
    console.error("❌ Error in createPaymentOrder:", error);
    console.error("Error stack:", error.stack);
    return {
      success: false,
      message: "Failed to create payment order",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
      status: 500,
    };
  }
};

// Verify Razorpay Payment Signature
export const verifyPayment = async (userId, paymentData) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId,
    } = paymentData;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !transactionId) {
      return {
        success: false,
        message: "Missing required payment details",
        status: 400,
      };
    }

    // Verify signature (skip in test mode)
    if (!isTestMode) {
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keySecret) {
        return {
          success: false,
          message: "Payment gateway not configured",
          status: 500,
        };
      }

      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return {
          success: false,
          message: "Invalid payment signature",
          status: 400,
        };
      }
    }

    // Get transaction
    const transaction = await SubscriptionTransaction.findById(transactionId);

    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found",
        status: 404,
      };
    }

    // Verify transaction belongs to user
    if (transaction.userId.toString() !== userId.toString()) {
      return {
        success: false,
        message: "Unauthorized transaction access",
        status: 403,
      };
    }

    // Update transaction
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    transaction.status = "completed";

    // Get plan
    const plan = await SubscriptionPlan.findOne({
      tier: transaction.planDetails.tier,
    });

    if (!plan) {
      return {
        success: false,
        message: "Subscription plan not found",
        status: 404,
      };
    }

    // Calculate dates
    const startDate = new Date();
    let endDate;

    if (transaction.planDetails.billingCycle === "monthly") {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const nextBillingDate = endDate;

    // Update billing period in transaction
    transaction.billingPeriod = {
      start: startDate,
      end: endDate,
    };
    await transaction.save();

    // Get user
    const user = await User.findById(transaction.userId);

    if (!user) {
      return {
        success: false,
        message: "User not found",
        status: 404,
      };
    }

    // Check if upgrading existing subscription
    let subscription;
    if (user.subscription?.subscriptionId) {
      subscription = await NgoSubscription.findById(user.subscription.subscriptionId);

      if (subscription) {
        // Update existing subscription
        subscription.planId = plan._id;
        subscription.tier = plan.tier;
        subscription.status = "active";
        subscription.billingCycle = transaction.planDetails.billingCycle;
        subscription.startDate = startDate;
        subscription.endDate = endDate;
        subscription.nextBillingDate = nextBillingDate;
        subscription.isTrial = false;
        subscription.razorpaySubscriptionId = razorpay_payment_id;

        await subscription.save();
      }
    }

    if (!subscription) {
      // Create new subscription
      subscription = await NgoSubscription.create({
        userId: user._id,
        planId: plan._id,
        tier: plan.tier,
        status: "active",
        billingCycle: transaction.planDetails.billingCycle,
        startDate,
        endDate,
        nextBillingDate,
        autoRenew: true,
        razorpaySubscriptionId: razorpay_payment_id,
      });
    }

    // Update transaction with subscription ID
    transaction.subscriptionId = subscription._id;
    await transaction.save();

    // Update user subscription info
    user.subscription = {
      currentTier: plan.tier,
      tierName: plan.name,
      subscriptionId: subscription._id,
      status: "active",
      expiresAt: endDate,
      trialUsed: user.subscription?.trialUsed || false,
    };

    await user.save();

    return {
      success: true,
      message: "Payment verified and subscription activated successfully",
      transaction,
      subscription,
      plan: {
        name: plan.name,
        displayName: plan.displayName,
        tier: plan.tier,
      },
      status: 200,
    };
  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    return {
      success: false,
      message: "Failed to verify payment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      status: 500,
    };
  }
};

// Handle payment failure
export const handlePaymentFailure = async (userId, failureData) => {
  try {
    const { transactionId, errorReason } = failureData;

    if (!transactionId) {
      return {
        success: false,
        message: "Transaction ID is required",
        status: 400,
      };
    }

    const transaction = await SubscriptionTransaction.findById(transactionId);

    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found",
        status: 404,
      };
    }

    // Verify transaction belongs to user
    if (transaction.userId.toString() !== userId.toString()) {
      return {
        success: false,
        message: "Unauthorized transaction access",
        status: 403,
      };
    }

    // Update transaction status
    transaction.status = "failed";
    transaction.failureReason = errorReason || "Payment failed";
    await transaction.save();

    return {
      success: true,
      message: "Payment failure recorded",
      transaction,
      status: 200,
    };
  } catch (error) {
    console.error("Error handling payment failure:", error);
    return {
      success: false,
      message: "Failed to record payment failure",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      status: 500,
    };
  }
};

// Test mode payment completion (generates test payment credentials)
export const getTestPaymentCredentials = async (transactionId) => {
  try {
    if (!isTestMode) {
      return {
        success: false,
        message: "Test payment endpoint only available in test mode",
        status: 403,
      };
    }

    if (!transactionId) {
      return {
        success: false,
        message: "Transaction ID is required",
        status: 400,
      };
    }

    const transaction = await SubscriptionTransaction.findById(transactionId);

    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found",
        status: 404,
      };
    }

    // Generate test payment ID and signature
    const testPaymentId = `pay_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const testSignature = `sig_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      testMode: true,
      data: {
        razorpay_order_id: transaction.razorpayOrderId,
        razorpay_payment_id: testPaymentId,
        razorpay_signature: testSignature,
        transactionId: transaction._id.toString(),
      },
      status: 200,
    };
  } catch (error) {
    console.error("Error in test payment:", error);
    return {
      success: false,
      message: "Test payment failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      status: 500,
    };
  }
};

// Razorpay webhook handler
export const handleWebhook = async (webhookData, signature) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Webhook secret not configured");
      return {
        success: false,
        message: "Webhook not configured",
        status: 500,
      };
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(webhookData))
      .digest("hex");

    if (signature !== expectedSignature) {
      return {
        success: false,
        message: "Invalid webhook signature",
        status: 400,
      };
    }

    return {
      success: true,
      status: 200,
    };
  } catch (error) {
    console.error("Error handling webhook:", error);
    return {
      success: false,
      message: "Webhook processing failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      status: 500,
    };
  }
};
