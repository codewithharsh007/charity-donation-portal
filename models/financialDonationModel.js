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
  // NGO allocation fields (for future distribution)
  allocatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  allocationAmount: {
    type: Number,
    min: 0,
  },
  allocationDate: {
    type: Date,
  },
  allocationStatus: {
    type: String,
    enum: ['pending', 'disbursed', 'completed'],
    default: 'pending',
  },
}, { timestamps: true });

const FinancialDonation = mongoose.models.FinancialDonation || mongoose.model('FinancialDonation', financialDonationSchema);

export default FinancialDonation;
