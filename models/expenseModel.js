import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'hosting',
        'marketing',
        'development',
        'support',
        'infrastructure',
        'payment_gateway',
        'legal',
        'operational',
        'other'
      ],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'credit_card', 'cash', 'other'],
    },
    receipt: {
      type: String, // URL to receipt/invoice
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'paid',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ status: 1 });

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

export default Expense;
