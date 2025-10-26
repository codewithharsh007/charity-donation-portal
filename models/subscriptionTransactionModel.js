// models/subscriptionTransactionModel.js
import mongoose from 'mongoose';

const subscriptionTransactionSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NgoSubscription',
      required: false, // ✅ CHANGED: Not required for new subscriptions
      default: null,   // ✅ ADDED: Default to null
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // ✅ ADDED: Better performance
    },
    type: {
      type: String,
      enum: ['subscription', 'upgrade', 'renewal'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      required: true, // ✅ ADDED: Should be required
    },
    razorpayPaymentId: {
      type: String,
      default: null, // ✅ ADDED: Explicit default
    },
    razorpayOrderId: {
      type: String,
      required: true, // ✅ ADDED: Order ID is always required
      unique: true,   // ✅ ADDED: Prevent duplicates
    },
    razorpaySignature: {
      type: String,
      default: null, // ✅ ADDED: Explicit default
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'], // ✅ ADDED: refunded status
      default: 'pending',
      required: true, // ✅ ADDED: Should be required
    },
    billingPeriod: {
      start: {
        type: Date,
        default: null, // ✅ ADDED: Explicit default
      },
      end: {
        type: Date,
        default: null, // ✅ ADDED: Explicit default
      },
    },
    planDetails: {
      tier: {
        type: Number,
        min: 1,
        max: 4,
        required: true, // ✅ ADDED: Should be required
      },
      planName: {
        type: String,
        required: true, // ✅ ADDED: Should be required
      },
      billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
        required: true, // ✅ ADDED: Should be required
      },
    },
    invoice: {
      invoiceNumber: {
        type: String,
        unique: true,
        sparse: true, // Good - allows multiple null values
      },
      gstAmount: {
        type: Number,
        default: 0,
        min: 0, // ✅ ADDED: Cannot be negative
      },
      subtotal: {
        type: Number,
        required: true, // ✅ ADDED: Should be required
        min: 0,         // ✅ ADDED: Cannot be negative
      },
      total: {
        type: Number,
        required: true, // ✅ ADDED: Should be required
        min: 0,         // ✅ ADDED: Cannot be negative
      },
      invoiceUrl: {
        type: String,
        default: null, // ✅ ADDED: Explicit default
      },
    },
    failureReason: {
      type: String,
      default: null, // ✅ ADDED: Explicit default
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
subscriptionTransactionSchema.index({ subscriptionId: 1 });
subscriptionTransactionSchema.index({ userId: 1, createdAt: -1 }); // ✅ CHANGED: Compound index
subscriptionTransactionSchema.index({ status: 1 });
// subscriptionTransactionSchema.index({ createdAt: -1 }); // ✅ REMOVED: Redundant (covered by compound index)

// Pre-save hook to generate invoice number
subscriptionTransactionSchema.pre('save', async function (next) {
  if (this.isNew && this.status === 'completed' && !this.invoice.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments({
      'invoice.invoiceNumber': { $exists: true },
    });
    this.invoice.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Method to calculate GST (18%)
subscriptionTransactionSchema.methods.calculateGST = function () {
  const gstRate = 0.18;
  this.invoice.subtotal = this.amount;
  this.invoice.gstAmount = this.amount * gstRate;
  this.invoice.total = this.amount + this.invoice.gstAmount;
};

const SubscriptionTransaction =
  mongoose.models.SubscriptionTransaction ||
  mongoose.model('SubscriptionTransaction', subscriptionTransactionSchema);

export default SubscriptionTransaction;
