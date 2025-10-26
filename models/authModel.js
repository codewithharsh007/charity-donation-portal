import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [50, 'Username cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      default: '.',
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^[0-9]{6}$/, 'Please provide a valid 6-digit pincode'],
    },
    userType: {
      type: String,
      required: [true, 'User type is required'],
      enum: ['donor', 'ngo'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['donor', 'ngo', 'admin'],
      default: 'donor',
    },
    // Subscription fields for NGOs
    subscription: {
      currentTier: {
        type: Number,
        default: 1, // FREE tier
        min: 1,
        max: 4,
      },
      tierName: {
        type: String,
        default: 'FREE',
        enum: ['FREE', 'BRONZE', 'SILVER', 'GOLD'],
      },
      subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NgoSubscription',
      },
      status: {
        type: String,
        enum: ['active', 'trial', 'expired', 'cancelled'],
        default: 'active', // FREE is always active
      },
      expiresAt: {
        type: Date, // null for FREE tier
      },
      trialUsed: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
// userSchema.index({ email: 1 });
// userSchema.index({ userName: 1 });

// Prevent model recompilation in Next.js development (hot reload)
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
