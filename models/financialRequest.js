import mongoose from "mongoose";

const financialRequestSchema = new mongoose.Schema(
  {
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Request Details
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },

    requestedAmount: {
      type: Number,
      required: true,
      min: 1000,
      max: 1000000, // 10 lakh max
    },

    purpose: {
      type: String,
      enum: [
        "medical",
        "education",
        "infrastructure",
        "emergency",
        "program",
        "operational",
        "other",
      ],
      required: true,
    },

    description: {
      type: String,
      required: true,
      minlength: 100,
      maxlength: 2000,
    },

    // Supporting Documents
    documents: [
      {
        url: String,
        publicId: String,
        name: String,
        type: String, // pdf, image, etc.
      },
    ],

    beneficiaryCount: {
      type: Number,
      min: 1,
    },

    // ✅ REMOVED: timeline field (startDate and endDate)

    // Budget Breakdown
    budgetBreakdown: [
      {
        item: String,
        amount: Number,
        description: String,
      },
    ],

    // Admin Review
    adminStatus: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected", "completed"],
      default: "pending",
    },

    adminReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    adminReviewedAt: Date,

    adminNotes: String,

    rejectionReason: String,

    // Allocation
    approvedAmount: {
      type: Number,
      default: 0,
    },

    allocatedAmount: {
      type: Number,
      default: 0,
    },

    disbursedAmount: {
      type: Number,
      default: 0,
    },

    disbursementDate: Date,

    // Tracking
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    completionProof: [
      {
        url: String,
        publicId: String,
        description: String,
      },
    ],

    completionReport: String,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Indexes
financialRequestSchema.index({ ngo: 1, adminStatus: 1 });
financialRequestSchema.index({ adminStatus: 1, createdAt: -1 });

const FinancialRequest =
  mongoose.models.FinancialRequest ||
  mongoose.model("FinancialRequest", financialRequestSchema);

export default FinancialRequest;
