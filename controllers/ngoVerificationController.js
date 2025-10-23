import NgoVerification from '../models/ngoVerificationModel.js';
import User from '../models/authModel.js';
import sendorgEmail from '../utils/emailService.js';

// Submit NGO verification application
export const submitVerification = async (userId, verificationData) => {
  try {
    // Check if user exists and is NGO
    const user = await User.findById(userId);
    if (!user || user.userType !== 'ngo') {
      return {
        success: false,
        message: 'Only NGO users can submit verification',
        status: 403,
      };
    }

    // Check if there's an existing application
    const existingApp = await NgoVerification.findOne({ userId });

    // If existing and accepted, cannot submit again
    if (existingApp && existingApp.verificationStatus === 'accepted') {
      return {
        success: false,
        message: 'Your NGO is already verified',
        status: 400,
      };
    }

    // If existing and pending, cannot submit again
    if (existingApp && existingApp.verificationStatus === 'pending') {
      return {
        success: false,
        message: 'Your application is under review',
        status: 400,
      };
    }

    // Check attempts remaining
    if (existingApp && existingApp.attemptsRemaining <= 0) {
      return {
        success: false,
        message: 'You have exhausted all attempts (3 maximum)',
        status: 400,
      };
    }

    // Create or update verification application
    let verification;
    if (existingApp) {
      // Reapplication - decrease attempts
      verification = await NgoVerification.findByIdAndUpdate(
        existingApp._id,
        {
          userId,
          ...verificationData,
          verificationStatus: 'pending',
          submittedAt: Date.now(),
          attemptsRemaining: existingApp.attemptsRemaining - 1,
          rejectionReason: undefined,
          adminNotes: undefined,
          reviewedAt: undefined,
          reviewedBy: undefined,
        },
        { new: true, runValidators: true }
      );
      // ensure userId persisted and populate user info for response
      if (verification && !verification.userId) {
        verification.userId = userId;
        await verification.save();
      }
      if (verification) await verification.populate('userId', 'userName email userType');
    } else {
      // First application
      verification = new NgoVerification({
        userId,
        ...verificationData,
        attemptsRemaining: 3,
      });
      await verification.save();
    }

    // Send confirmation email
    await sendorgEmail(
      user.email,
      'NGO Verification Application Received',
      `
      <h2>Application Received Successfully!</h2>
      <p>Dear ${verificationData.ngoName},</p>
      <p>We have received your NGO verification application. Our team will review it and get back to you within 3-5 business days.</p>
      <p><strong>Application Details:</strong></p>
      <ul>
        <li>NGO Name: ${verificationData.ngoName}</li>
        <li>Registration Number: ${verificationData.registrationNumber}</li>
        <li>Submitted At: ${new Date().toLocaleString()}</li>
      </ul>
      <p>You will receive an email once the review is complete.</p>
      <br>
      <p>Best regards,<br>Charity Platform Team</p>
      `
    );

    return {
      success: true,
      message: 'Application submitted successfully',
      verification,
      status: 201,
    };
  } catch (err) {
    console.error('Submit verification error:', err);
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};

// Get verification status for logged-in NGO
export const getVerificationStatus = async (userId) => {
  try {
  const verification = await NgoVerification.findOne({ userId }).populate('userId', 'userName email userType');

    if (!verification) {
      return {
        success: true,
        status: 200,
        verification: null,
        message: 'No application found',
      };
    }

    return {
      success: true,
      verification,
      status: 200,
    };
  } catch (err) {
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};

// Admin: Get all pending verifications
export const getPendingVerifications = async () => {
  try {
    const verifications = await NgoVerification.find({
      verificationStatus: 'pending',
    })
      .populate('userId', 'userName email userType')
      .sort({ submittedAt: -1 });

    return {
      success: true,
      verifications,
      count: verifications.length,
      status: 200,
    };
  } catch (err) {
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};

// Admin: Get all verifications (with filters)
export const getAllVerifications = async (filter = {}) => {
  try {
    const verifications = await NgoVerification.find(filter)
      .populate('userId', 'userName email userType')
      .populate('reviewedBy', 'userName email')
      .sort({ submittedAt: -1 });

    return {
      success: true,
      verifications,
      count: verifications.length,
      status: 200,
    };
  } catch (err) {
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};

// Admin: Approve verification
export const approveVerification = async (verificationId, adminId) => {
  try {
    const verification = await NgoVerification.findById(
      verificationId
    ).populate('userId');

    if (!verification) {
      return {
        success: false,
        message: 'Verification not found',
        status: 404,
      };
    }

    verification.verificationStatus = 'accepted';
    verification.reviewedAt = Date.now();
    verification.reviewedBy = adminId;
    verification.rejectionReason = undefined;
    verification.adminNotes = undefined;

    await verification.save();

    // Send approval email
    await sendorgEmail(
      verification.userId.email,
      'NGO Verification Approved! ✓',
      `
      <h2 style="color: green;">Congratulations! Your NGO is Verified ✓</h2>
      <p>Dear ${verification.ngoName},</p>
      <p>We are pleased to inform you that your NGO verification application has been <strong>approved</strong>!</p>
      <p><strong>NGO Details:</strong></p>
      <ul>
        <li>NGO Name: ${verification.ngoName}</li>
        <li>Registration Number: ${verification.registrationNumber}</li>
        <li>Status: <span style="color: green; font-weight: bold;">✓ Verified</span></li>
      </ul>
      <p>You can now enjoy full access to all NGO features on our platform, including receiving donations and creating campaigns.</p>
      <br>
      <p>Best regards,<br>Charity Platform Team</p>
      `
    );

    return {
      success: true,
      message: 'Verification approved successfully',
      verification,
      status: 200,
    };
  } catch (err) {
    console.error('Approve verification error:', err);
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};

// Admin: Reject verification
export const rejectVerification = async (
  verificationId,
  adminId,
  rejectionReason,
  adminNotes
) => {
  try {
    const verification = await NgoVerification.findById(
      verificationId
    ).populate('userId');

    if (!verification) {
      return {
        success: false,
        message: 'Verification not found',
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

    verification.verificationStatus = 'rejected';
    verification.reviewedAt = Date.now();
    verification.reviewedBy = adminId;
    verification.rejectionReason = rejectionReason;
    verification.adminNotes = adminNotes || '';

    await verification.save();

    const attemptsLeft = verification.attemptsRemaining;

    // Send rejection email
    await sendorgEmail(
      verification.userId.email,
      'NGO Verification Application Update',
      `
      <h2 style="color: red;">Application Status: Rejected</h2>
      <p>Dear ${verification.ngoName},</p>
      <p>We regret to inform you that your NGO verification application has been rejected.</p>
      <p><strong>Rejection Reason:</strong></p>
      <p style="background: #f5f5f5; padding: 10px; border-left: 3px solid red;">${rejectionReason}</p>
      ${
        adminNotes
          ? `<p><strong>Admin Notes:</strong></p><p style="background: #f5f5f5; padding: 10px;">${adminNotes}</p>`
          : ''
      }
      <p><strong>Attempts Remaining:</strong> ${attemptsLeft} out of 3</p>
      ${
        attemptsLeft > 0
          ? '<p>You can reapply by logging into your account and submitting a new application with the required corrections.</p>'
          : '<p style="color: red;">You have exhausted all attempts. Please contact support for assistance.</p>'
      }
      <br>
      <p>Best regards,<br>Charity Platform Team</p>
      `
    );

    return {
      success: true,
      message: 'Verification rejected',
      verification,
      attemptsRemaining: attemptsLeft,
      status: 200,
    };
  } catch (err) {
    console.error('Reject verification error:', err);
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};

// Send reminder email to NGOs who haven't submitted (called by cron job)
export const sendReminderEmails = async () => {
  try {
    // Find NGO users who registered more than 3 days ago
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const ngoUsers = await User.find({
      userType: 'ngo',
      createdAt: { $lte: threeDaysAgo },
    });

    let remindersSent = 0;

    for (const user of ngoUsers) {
      // Check if they have submitted verification
      const verification = await NgoVerification.findOne({ userId: user._id });

      // If no verification or already accepted, skip
      if (!verification || verification.verificationStatus === 'accepted') {
        continue;
      }

      // If reminder already sent, skip
      if (verification && verification.reminderSent) {
        continue;
      }

      // Send reminder email
      await sendorgEmail(
        user.email,
        'Reminder: Complete Your NGO Verification',
        `
        <h2>Complete Your NGO Verification</h2>
        <p>Dear ${user.userName},</p>
        <p>We noticed that you haven't completed your NGO verification process yet.</p>
        <p>Verifying your NGO will allow you to:</p>
        <ul>
          <li>Receive donations from donors</li>
          <li>Create fundraising campaigns</li>
          <li>Get verified badge (✓ Verified)</li>
          <li>Gain trust from donors</li>
        </ul>
        <p>Please log in to your account and complete the verification form.</p>
        <br>
        <p>Best regards,<br>Charity Platform Team</p>
        `
      );

      // Mark reminder as sent (create record if doesn't exist)
      if (verification) {
        verification.reminderSent = true;
        verification.reminderSentAt = Date.now();
        await verification.save();
      } else {
        // Create a placeholder record
        await NgoVerification.create({
          userId: user._id,
          reminderSent: true,
          reminderSentAt: Date.now(),
          attemptsRemaining: 3,
        });
      }

      remindersSent++;
    }

    return {
      success: true,
      message: `Sent ${remindersSent} reminder emails`,
      remindersSent,
      status: 200,
    };
  } catch (err) {
    console.error('Send reminder emails error:', err);
    return {
      success: false,
      message: 'Server error',
      error: err.message,
      status: 500,
    };
  }
};
