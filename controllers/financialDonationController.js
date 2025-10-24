import FinancialDonation from '../models/financialDonationModel.js';
import User from '../models/authModel.js';
import sendorgEmail from '../utils/emailService.js';

// Create financial donation
export const createFinancialDonation = async (userId, donationData) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        status: 404,
      };
    }

    const donation = new FinancialDonation({
      donor: userId,
      amount: donationData.amount,
      note: donationData.note,
      transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    });

    await donation.save();

    // Send thank you email
    await sendorgEmail(
      user.email,
      'Thank You for Your Generous Donation! 💝',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Thank You for Your Donation!</h2>
        <p>Dear ${user.userName},</p>
        <p>We have received your generous donation of <strong>₹${donation.amount.toLocaleString()}</strong>.</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Donation Details:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Amount: ₹${donation.amount.toLocaleString()}</li>
            <li>Transaction ID: ${donation.transactionId}</li>
            <li>Date: ${new Date().toLocaleString()}</li>
          </ul>
        </div>

        <p>Your contribution will make a real difference in the lives of those in need. We will keep you informed via email about how your donation is being utilized to support various causes.</p>
        
        <p style="margin-top: 30px;">Thank you for your generosity and trust in our platform.</p>
        
        <p style="margin-top: 20px;">
          <strong>With gratitude,</strong><br>
          Charity Platform Team
        </p>
      </div>
      `
    );

    return {
      success: true,
      message: 'Donation successful',
      donation,
      status: 201,
    };
  } catch (err) {
    console.error('Create financial donation error:', err);
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};

// Get donor's financial donations
export const getDonorFinancialDonations = async (userId) => {
  try {
    const donations = await FinancialDonation.find({ donor: userId })
      .sort({ createdAt: -1 })
      .populate('donor', 'userName email');

    return {
      success: true,
      donations,
      count: donations.length,
      status: 200,
    };
  } catch (err) {
    console.error('Get donor financial donations error:', err);
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};

// Get all financial donations (admin)
export const getAllFinancialDonations = async () => {
  try {
    const donations = await FinancialDonation.find()
      .sort({ createdAt: -1 })
      .populate('donor', 'userName email phone');

    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

    return {
      success: true,
      donations,
      count: donations.length,
      totalAmount,
      status: 200,
    };
  } catch (err) {
    console.error('Get all financial donations error:', err);
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};
