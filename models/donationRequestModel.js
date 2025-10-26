import mongoose from 'mongoose';

const donationRequestSchema = new mongoose.Schema(
  {
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    requestType: {
      type: String,
      enum: ['item', 'financial'],
      required: true,
    },
    // For item requests
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ItemCategory',
    },
    itemsNeeded: [
      {
        type: String,
        trim: true,
      },
    ],
    estimatedValue: {
      type: Number,
      min: 0,
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    // For financial requests
    amountRequested: {
      type: Number,
      min: 0,
    },
    purpose: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['open', 'partially_fulfilled', 'fulfilled', 'closed'],
      default: 'open',
    },
    expiresAt: {
      type: Date,
    },
    fulfillments: [
      {
        donorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        itemDonationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ItemDonation',
        },
        financialDonationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'FinancialDonation',
        },
        fulfilledAt: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
donationRequestSchema.index({ ngoId: 1 });
donationRequestSchema.index({ status: 1 });
donationRequestSchema.index({ requestType: 1 });
donationRequestSchema.index({ urgency: 1 });
donationRequestSchema.index({ expiresAt: 1 });
donationRequestSchema.index({ createdAt: -1 });

// Virtual to check if request is expired
donationRequestSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Method to add fulfillment
donationRequestSchema.methods.addFulfillment = function (fulfillmentData) {
  this.fulfillments.push(fulfillmentData);
  
  // Update status based on fulfillment
  if (this.requestType === 'item') {
    // For items, mark as fulfilled when at least one item is donated
    this.status = 'fulfilled';
  } else if (this.requestType === 'financial') {
    // For financial, check if amount is met
    const totalFulfilled = this.fulfillments.length;
    if (totalFulfilled > 0) {
      this.status = 'partially_fulfilled';
    }
  }
  
  return this.save();
};

// Method to close request
donationRequestSchema.methods.closeRequest = function () {
  this.status = 'closed';
  return this.save();
};

const DonationRequest =
  mongoose.models.DonationRequest ||
  mongoose.model('DonationRequest', donationRequestSchema);

export default DonationRequest;
