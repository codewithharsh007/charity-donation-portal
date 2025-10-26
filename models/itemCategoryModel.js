import mongoose from 'mongoose';

const itemCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    requiredTier: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
      default: 1,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    subcategories: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        slug: {
          type: String,
          required: true,
          lowercase: true,
          trim: true,
        },
        requiredTier: {
          type: Number,
          min: 1,
          max: 4,
        },
      },
    ],
    icon: {
      type: String,
      default: '📦',
    },
    displayOrder: {
      type: Number,
      default: 0,
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

// Indexes for faster queries
itemCategorySchema.index({ requiredTier: 1 });
itemCategorySchema.index({ isHidden: 1 });
itemCategorySchema.index({ isActive: 1 });
itemCategorySchema.index({ displayOrder: 1 });

// Pre-save hook to generate slug if not provided
itemCategorySchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Method to check if a tier can access this category
itemCategorySchema.methods.canAccess = function (userTier) {
  return userTier >= this.requiredTier;
};

const ItemCategory =
  mongoose.models.ItemCategory ||
  mongoose.model('ItemCategory', itemCategorySchema);

export default ItemCategory;
