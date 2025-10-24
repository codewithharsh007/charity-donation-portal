import mongoose from 'mongoose';

const financialDonationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['completed'],
    default: 'completed',
  },
  transactionId: {
    type: String,
  },
  paymentMethod: {
    type: String,
    default: 'online',
  },
  note: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

const FinancialDonation = mongoose.models.FinancialDonation || mongoose.model('FinancialDonation', financialDonationSchema);

export default FinancialDonation;
