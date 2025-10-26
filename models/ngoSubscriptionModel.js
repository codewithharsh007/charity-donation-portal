import mongoose from 'mongoose';

const ngoSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NgoVerification',
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    tier: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },
    status: {
      type: String,
      enum: ['active', 'trial', 'expired', 'cancelled'],
      default: 'active',
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    nextBillingDate: {
      type: Date,
    },
    isTrial: {
      type: Boolean,
      default: false,
    },
    trialEndsAt: {
      type: Date,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    usage: {
      activeRequests: {
        type: Number,
        default: 0,
        min: 0,
      },
      monthlyAcceptedItems: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastResetDate: {
        type: Date,
        default: Date.now,
      },
      financialRequestsThisMonth: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    razorpaySubscriptionId: {
      type: String,
    },
    razorpayCustomerId: {
      type: String,
    },
    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
ngoSubscriptionSchema.index({ userId: 1 });
ngoSubscriptionSchema.index({ status: 1 });
ngoSubscriptionSchema.index({ tier: 1 });
ngoSubscriptionSchema.index({ endDate: 1 });
ngoSubscriptionSchema.index({ nextBillingDate: 1 });

// Virtual for checking if subscription is valid
ngoSubscriptionSchema.virtual('isValid').get(function () {
  if (this.tier === 1) return true; // FREE tier always valid
  if (this.status === 'cancelled' || this.status === 'expired') return false;
  if (this.endDate && new Date() > this.endDate) return false;
  return true;
});

// Method to check if user can make more requests
ngoSubscriptionSchema.methods.canMakeRequest = async function () {
  const plan = await mongoose.model('SubscriptionPlan').findById(this.planId);
  if (!plan) return false;
  return this.usage.activeRequests < plan.limits.activeRequests;
};

// Method to check if user can accept more items this month
ngoSubscriptionSchema.methods.canAcceptItem = async function () {
  const plan = await mongoose.model('SubscriptionPlan').findById(this.planId);
  if (!plan) return false;
  return this.usage.monthlyAcceptedItems < plan.limits.monthlyAcceptance;
};

// Method to reset monthly usage
ngoSubscriptionSchema.methods.resetMonthlyUsage = function () {
  this.usage.monthlyAcceptedItems = 0;
  this.usage.financialRequestsThisMonth = 0;
  this.usage.lastResetDate = new Date();
  return this.save();
};

const NgoSubscription =
  mongoose.models.NgoSubscription ||
  mongoose.model('NgoSubscription', ngoSubscriptionSchema);

export default NgoSubscription;
