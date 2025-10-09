import mongoose from 'mongoose';

const ngoVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Basic Information
    ngoName: {
      type: String,
      required: [true, 'NGO name is required'],
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      trim: true,
    },
    contactPersonName: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
    },
    contactPersonPhone: {
      type: String,
      required: [true, 'Contact person phone is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    contactPersonEmail: {
      type: String,
      required: [true, 'Contact person email is required'],
      lowercase: true,
      trim: true,
    },
    ngoAddress: {
      type: String,
      required: [true, 'NGO address is required'],
      trim: true,
    },
    yearEstablished: {
      type: Number,
      required: [true, 'Year of establishment is required'],
      min: [1800, 'Year must be after 1800'],
      max: [new Date().getFullYear(), 'Year cannot be in the future'],
    },
    typeOfWork: {
      type: String,
      required: [true, 'Type of work is required'],
      enum: [
        'Education',
        'Healthcare',
        'Environment',
        'Animal Welfare',
        'Women Empowerment',
        'Child Welfare',
        'Elderly Care',
        'Disaster Relief',
        'Poverty Alleviation',
        'Skill Development',
        'Other',
      ],
    },
    website: {
      type: String,
      trim: true,
    },
    // Bank Details
    bankDetails: {
      accountHolderName: {
        type: String,
        required: [true, 'Account holder name is required'],
        trim: true,
      },
      bankName: {
        type: String,
        required: [true, 'Bank name is required'],
        trim: true,
      },
      accountNumber: {
        type: String,
        required: [true, 'Account number is required'],
        trim: true,
      },
      ifscCode: {
        type: String,
        required: [true, 'IFSC code is required'],
        trim: true,
        uppercase: true,
      },
      branchName: {
        type: String,
        required: [true, 'Branch name is required'],
        trim: true,
      },
      bankDocumentImage: {
        url: String,
        publicId: String,
      },
    },
    // Documents
    documents: [
      {
        type: {
          type: String,
          enum: [
            'Registration Certificate',
            'PAN Card',
            'Trust Deed',
            '80G Certificate',
            'Other',
          ],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // NGO Image with Geotag
    ngoImage: {
      url: {
        type: String,
        required: [true, 'NGO image is required'],
      },
      publicId: {
        type: String,
        required: [true, 'Image public ID is required'],
      },
      latitude: {
        type: Number,
        required: [true, 'Location latitude is required'],
      },
      longitude: {
        type: Number,
        required: [true, 'Location longitude is required'],
      },
      address: {
        type: String,
      },
    },
    // Verification Status
    verificationStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    attemptsRemaining: {
      type: Number,
      default: 3,
      min: 0,
      max: 3,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Email Reminder
    reminderSent: {
      type: Boolean,
      default: false,
    },
    reminderSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ngoVerificationSchema.index({ userId: 1 });
ngoVerificationSchema.index({ verificationStatus: 1 });
ngoVerificationSchema.index({ submittedAt: 1 });

const NgoVerification =
  mongoose.models.NgoVerification ||
  mongoose.model('NgoVerification', ngoVerificationSchema);

export default NgoVerification;
