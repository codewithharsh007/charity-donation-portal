import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ['FREE', 'BRONZE', 'SILVER', 'GOLD'],
    },
    displayName: {
      type: String,
      required: true,
    },
    tier: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
      unique: true,
    },
    pricing: {
      monthly: {
        type: Number,
        required: true,
        min: 0,
      },
      yearly: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: 'INR',
      },
    },
    limits: {
      activeRequests: {
        type: Number,
        required: true,
        min: 0,
      },
      maxItemValue: {
        type: Number,
        required: true,
        min: 0,
      },
      monthlyAcceptance: {
        type: Number,
        required: true,
        min: 0,
      },
      bulkRequestSize: {
        type: Number,
        required: true,
        min: 0,
      },
      financialDonationLimit: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    permissions: {
      categories: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ItemCategory',
        },
      ],
      hiddenCategories: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ItemCategory',
        },
      ],
      canRequestFinancial: {
        type: Boolean,
        default: false,
      },
      priorityLevel: {
        type: Number,
        min: 1,
        max: 4,
        required: true,
      },
    },
    features: [
      {
        type: String,
      },
    ],
    badge: {
      icon: {
        type: String,
      },
      color: {
        type: String,
      },
      label: {
        type: String,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
subscriptionPlanSchema.index({ isActive: 1 });

const SubscriptionPlan =
  mongoose.models.SubscriptionPlan ||
  mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

export default SubscriptionPlan;
