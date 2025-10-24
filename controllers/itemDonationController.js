import ItemDonation from '../models/itemDonationModel.js';
import User from '../models/authModel.js';
import sendorgEmail from '../utils/emailService.js';

// Create item donation
export const createItemDonation = async (userId, donationData) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        status: 404,
      };
    }

    const donation = new ItemDonation({
      donor: userId,
      items: donationData.items,
      category: donationData.category,
      description: donationData.description,
      images: donationData.images || [],
      videos: donationData.videos || [],
      pickupAddress: donationData.pickupAddress || user.address,
      pickupPhone: donationData.pickupPhone || user.phone,
      donorNotes: donationData.donorNotes,
    });

    await donation.save();

    // Send confirmation email
    await sendorgEmail(
      user.email,
      'Item Donation Submitted for Review 📦',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Item Donation Submitted!</h2>
        <p>Dear ${user.userName},</p>
        <p>Thank you for your generous donation! Your items have been submitted and are pending admin approval.</p>
        
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Donation Details:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Category: ${donation.category}</li>
            <li>Items: ${donation.items.join(', ')}</li>
            <li>Status: Pending Admin Approval</li>
            <li>Submitted: ${new Date().toLocaleString()}</li>
          </ul>
        </div>

        <p><strong>What's Next?</strong></p>
        <ol>
          <li>Our admin team will review your donation</li>
          <li>Once approved, it will be visible to verified NGOs</li>
          <li>When an NGO accepts, you'll receive pickup details</li>
          <li>You'll be notified at every step via email</li>
        </ol>
        
        <p style="margin-top: 20px;">
          <strong>Thank you for making a difference!</strong><br>
          Charity Platform Team
        </p>
      </div>
      `
    );

    return {
      success: true,
      message: 'Item donation submitted for admin review',
      donation,
      status: 201,
    };
  } catch (err) {
    console.error('Create item donation error:', err);
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};

// Get donor's item donations
export const getDonorItemDonations = async (userId) => {
  try {
    const donations = await ItemDonation.find({ donor: userId })
      .sort({ createdAt: -1 })
      .populate('donor', 'userName email')
      .populate('acceptedBy', 'userName email phone');

    return {
      success: true,
      donations,
      count: donations.length,
      status: 200,
    };
  } catch (err) {
    console.error('Get donor item donations error:', err);
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};

// Get all item donations for admin review
export const getItemDonationsForAdmin = async (filter = {}) => {
  try {
    const donations = await ItemDonation.find(filter)
      .sort({ createdAt: -1 })
      .populate('donor', 'userName email phone address')
      .populate('acceptedBy', 'userName email phone')
      .populate('adminReviewedBy', 'userName email');

    return {
      success: true,
      donations,
      count: donations.length,
      status: 200,
    };
  } catch (err) {
    console.error('Get item donations for admin error:', err);
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};

// Admin approve item donation
export const approveItemDonation = async (donationId, adminId) => {
  try {
    const donation = await ItemDonation.findById(donationId).populate('donor', 'userName email');
    
    if (!donation) {
      return {
        success: false,
        message: 'Donation not found',
        status: 404,
      };
    }

    donation.adminStatus = 'approved';
    donation.isActive = true;
    donation.adminReviewedBy = adminId;
    donation.adminReviewedAt = Date.now();
    donation.deliveryStatus = 'not_picked_up';

    await donation.save();

    // Send approval email to donor
    await sendorgEmail(
      donation.donor.email,
      'Item Donation Approved! ✅',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Your Donation Has Been Approved! ✅</h2>
        <p>Dear ${donation.donor.userName},</p>
        <p>Great news! Your item donation has been approved and is now visible to verified NGOs.</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Donation Details:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Category: ${donation.category}</li>
            <li>Items: ${donation.items.join(', ')}</li>
            <li>Status: Approved & Active</li>
          </ul>
        </div>

        <p>NGOs can now view and request your donation. You'll receive an email when an NGO accepts it with pickup details.</p>
        
        <p style="margin-top: 20px;">
          <strong>Thank you for your generosity!</strong><br>
          Charity Platform Team
        </p>
      </div>
      `
    );

    return {
      success: true,
      message: 'Item donation approved',
      donation,
      status: 200,
    };
  } catch (err) {
    console.error('Approve item donation error:', err);
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};

// Admin reject item donation
export const rejectItemDonation = async (donationId, adminId, rejectionReason) => {
  try {
    const donation = await ItemDonation.findById(donationId).populate('donor', 'userName email');
    
    if (!donation) {
      return {
        success: false,
        message: 'Donation not found',
        status: 404,
      };
    }

    if (!rejectionReason) {
      return {
        success: false,
        message: 'Rejection reason is required',
        status: 400,
      };
    }

    donation.adminStatus = 'rejected';
    donation.isActive = false;
    donation.adminReviewedBy = adminId;
    donation.adminReviewedAt = Date.now();
    donation.rejectionReason = rejectionReason;

    await donation.save();

    // Send rejection email to donor
    await sendorgEmail(
      donation.donor.email,
      'Item Donation Status Update',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Donation Status Update</h2>
        <p>Dear ${donation.donor.userName},</p>
        <p>We regret to inform you that your item donation could not be approved at this time.</p>
        
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Reason:</strong></p>
          <p style="margin: 10px 0;">${rejectionReason}</p>
        </div>

        <p>If you have any questions or would like to submit a new donation, please feel free to contact us.</p>
        
        <p style="margin-top: 20px;">
          <strong>Charity Platform Team</strong>
        </p>
      </div>
      `
    );

    return {
      success: true,
      message: 'Item donation rejected',
      donation,
      status: 200,
    };
  } catch (err) {
    console.error('Reject item donation error:', err);
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};

// Get available items for NGOs (approved and active)
export const getAvailableItemsForNGOs = async () => {
  try {
    const donations = await ItemDonation.find({
      adminStatus: 'approved',
      isActive: true,
      acceptedBy: null,
    })
      .sort({ createdAt: -1 })
      .populate('donor', 'userName phone address city state');

    return {
      success: true,
      donations,
      count: donations.length,
      status: 200,
    };
  } catch (err) {
    console.error('Get available items for NGOs error:', err);
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};

// NGO accept item donation
export const acceptItemDonation = async (donationId, ngoId) => {
  try {
    const donation = await ItemDonation.findById(donationId)
      .populate('donor', 'userName email phone address');
    
    if (!donation) {
      return {
        success: false,
        message: 'Donation not found',
        status: 404,
      };
    }

    if (!donation.isActive || donation.acceptedBy) {
      return {
        success: false,
        message: 'This donation is no longer available',
        status: 400,
      };
    }

    const ngo = await User.findById(ngoId);
    if (!ngo || ngo.userType !== 'ngo') {
      return {
        success: false,
        message: 'Invalid NGO',
        status: 403,
      };
    }

    donation.acceptedBy = ngoId;
    donation.acceptedAt = Date.now();
    donation.isActive = false; // Make inactive so others can't accept
    donation.deliveryStatus = 'not_picked_up';

    await donation.save();
    await donation.populate('acceptedBy', 'userName email phone');

    // Send email to donor with NGO details
    await sendorgEmail(
      donation.donor.email,
      'Your Donation Has Been Accepted! 🎉',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Great News! Your Donation Has Been Accepted! 🎉</h2>
        <p>Dear ${donation.donor.userName},</p>
        <p>An NGO has accepted your donation and will arrange pickup shortly.</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>NGO Details:</strong></p>
          <ul style="margin: 10px 0;">
            <li>NGO: ${ngo.userName}</li>
            <li>Email: ${ngo.email}</li>
            <li>Phone: ${ngo.phone || 'Not provided'}</li>
          </ul>
        </div>

        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Your Pickup Details:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Address: ${donation.pickupAddress}</li>
            <li>Phone: ${donation.pickupPhone}</li>
            <li>Items: ${donation.items.join(', ')}</li>
          </ul>
        </div>

        <p>The NGO will contact you to arrange the pickup. Please keep the items ready.</p>
        
        <p style="margin-top: 20px;">
          <strong>Thank you for your contribution!</strong><br>
          Charity Platform Team
        </p>
      </div>
      `
    );

    // Send email to NGO with donor details
    await sendorgEmail(
      ngo.email,
      'Donation Accepted - Pickup Details 📦',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Donation Accepted Successfully! 📦</h2>
        <p>Dear ${ngo.userName},</p>
        <p>You have successfully accepted a donation. Please arrange pickup with the donor.</p>
        
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Donor Details:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Name: ${donation.donor.userName}</li>
            <li>Phone: ${donation.pickupPhone}</li>
            <li>Address: ${donation.pickupAddress}</li>
          </ul>
        </div>

        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Donation Items:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Category: ${donation.category}</li>
            <li>Items: ${donation.items.join(', ')}</li>
            ${donation.description ? `<li>Description: ${donation.description}</li>` : ''}
          </ul>
        </div>

        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Contact the donor to schedule pickup</li>
          <li>Update status to "Picked Up" after collecting items</li>
          <li>Update status to "Received" once delivered to your facility</li>
        </ol>
        
        <p style="margin-top: 20px;">
          <strong>Charity Platform Team</strong>
        </p>
      </div>
      `
    );

    return {
      success: true,
      message: 'Donation accepted successfully',
      donation,
      status: 200,
    };
  } catch (err) {
    console.error('Accept item donation error:', err);
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};

// Update delivery status
export const updateDeliveryStatus = async (donationId, ngoId, newStatus) => {
  try {
    const donation = await ItemDonation.findById(donationId)
      .populate('donor', 'userName email')
      .populate('acceptedBy', 'userName email');
    
    if (!donation) {
      return {
        success: false,
        message: 'Donation not found',
        status: 404,
      };
    }

    if (donation.acceptedBy._id.toString() !== ngoId.toString()) {
      return {
        success: false,
        message: 'Unauthorized',
        status: 403,
      };
    }

    const validTransitions = {
      'not_picked_up': ['picked_up'],
      'picked_up': ['received'],
    };

    if (!validTransitions[donation.deliveryStatus]?.includes(newStatus)) {
      return {
        success: false,
        message: 'Invalid status transition',
        status: 400,
      };
    }

    donation.deliveryStatus = newStatus;
    
    if (newStatus === 'picked_up') {
      donation.pickupDate = Date.now();
    } else if (newStatus === 'received') {
      donation.receivedDate = Date.now();
    }

    await donation.save();

    // Send status update email to donor
    const statusMessages = {
      'picked_up': {
        subject: 'Your Donation Has Been Picked Up 📦',
        message: 'Your donated items have been picked up by the NGO.',
      },
      'received': {
        subject: 'Your Donation Has Been Received 🎉',
        message: 'Your donated items have been received by the NGO and will be put to good use!',
      },
    };

    const statusInfo = statusMessages[newStatus];

    await sendorgEmail(
      donation.donor.email,
      statusInfo.subject,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">${statusInfo.subject}</h2>
        <p>Dear ${donation.donor.userName},</p>
        <p>${statusInfo.message}</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Donation Details:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Items: ${donation.items.join(', ')}</li>
            <li>NGO: ${donation.acceptedBy.userName}</li>
            <li>Status: ${newStatus.replace('_', ' ').toUpperCase()}</li>
            ${newStatus === 'received' ? `<li>Received: ${new Date().toLocaleString()}</li>` : ''}
          </ul>
        </div>

        <p>Thank you for your generosity and for making a difference in the lives of those in need!</p>
        
        <p style="margin-top: 20px;">
          <strong>With gratitude,</strong><br>
          Charity Platform Team
        </p>
      </div>
      `
    );

    return {
      success: true,
      message: 'Delivery status updated',
      donation,
      status: 200,
    };
  } catch (err) {
    console.error('Update delivery status error:', err);
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};

// Get NGO's accepted donations
export const getNGOAcceptedDonations = async (ngoId) => {
  try {
    const donations = await ItemDonation.find({ acceptedBy: ngoId })
      .sort({ acceptedAt: -1 })
      .populate('donor', 'userName email phone address city state');

    return {
      success: true,
      donations,
      count: donations.length,
      status: 200,
    };
  } catch (err) {
    console.error('Get NGO accepted donations error:', err);
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};
