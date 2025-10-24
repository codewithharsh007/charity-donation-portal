import mongoose from 'mongoose';

const itemDonationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: {
    type: [String],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  images: {
    type: [{
      url: String,
      publicId: String,
    }],
    default: [],
  },
  videos: {
    type: [{
      url: String,
      publicId: String,
    }],
    default: [],
  },
  // Admin approval workflow
  adminStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  adminReviewedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
  // NGO acceptance workflow
  isActive: {
    type: Boolean,
    default: false, // Only active after admin approval
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  acceptedAt: {
    type: Date,
  },
  // Delivery status
  deliveryStatus: {
    type: String,
    enum: ['pending', 'not_picked_up', 'picked_up', 'received'],
    default: 'pending',
  },
  pickupAddress: {
    type: String,
  },
  pickupPhone: {
    type: String,
  },
  pickupDate: {
    type: Date,
  },
  receivedDate: {
    type: Date,
  },
  donorNotes: {
    type: String,
  },
  ngoNotes: {
    type: String,
  },
}, { timestamps: true });

// Index for quick querying
itemDonationSchema.index({ adminStatus: 1, isActive: 1 });
itemDonationSchema.index({ acceptedBy: 1 });
itemDonationSchema.index({ donor: 1 });

const ItemDonation = mongoose.models.ItemDonation || mongoose.model('ItemDonation', itemDonationSchema);

export default ItemDonation;
