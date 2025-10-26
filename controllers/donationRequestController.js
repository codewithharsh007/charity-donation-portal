import DonationRequest from '../models/donationRequestModel.js';
import ItemCategory from '../models/itemCategoryModel.js';
import User from '../models/authModel.js';
import NgoSubscription from '../models/ngoSubscriptionModel.js';
import SubscriptionPlan from '../models/subscriptionPlanModel.js';

// Create a new donation request
export const createDonationRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      requestType,
      categoryId,
      itemsNeeded,
      estimatedValue,
      urgency,
      amountRequested,
      purpose,
      expiresInDays,
    } = req.body;

    // Validate input
    if (!title || !description || !requestType) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and request type are required',
      });
    }

    if (!['item', 'financial'].includes(requestType)) {
      return res.status(400).json({
        success: false,
        message: 'Request type must be either "item" or "financial"',
      });
    }

    // Get user and subscription
    const user = await User.findById(userId);
    const subscription = await NgoSubscription.findById(
      user.subscription.subscriptionId
    ).populate('planId');

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription found',
      });
    }

    const plan = subscription.planId;

    // Validate based on request type
    if (requestType === 'item') {
      if (!categoryId || !itemsNeeded || itemsNeeded.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Category and items needed are required for item requests',
        });
      }

      // Check category access
      const category = await ItemCategory.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }

      if (user.subscription.currentTier < category.requiredTier) {
        return res.status(403).json({
          success: false,
          message: `This category requires tier ${category.requiredTier} or higher`,
          needsUpgrade: true,
        });
      }

      // Check estimated value against tier limit
      if (estimatedValue && estimatedValue > plan.limits.maxItemValue) {
        return res.status(403).json({
          success: false,
          message: `Estimated value exceeds your tier limit of ₹${plan.limits.maxItemValue}`,
          needsUpgrade: true,
        });
      }
    }

    if (requestType === 'financial') {
      if (!amountRequested || !purpose) {
        return res.status(400).json({
          success: false,
          message: 'Amount and purpose are required for financial requests',
        });
      }

      // Check if tier allows financial requests
      if (!plan.permissions.canRequestFinancial) {
        return res.status(403).json({
          success: false,
          message: 'Your tier does not support financial donation requests',
          needsUpgrade: true,
        });
      }

      // Check amount against tier limit
      if (amountRequested > plan.limits.financialDonationLimit) {
        return res.status(403).json({
          success: false,
          message: `Amount exceeds your tier limit of ₹${plan.limits.financialDonationLimit}`,
          needsUpgrade: true,
        });
      }
    }

    // Calculate expiry date
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
    }

    // Create donation request
    const donationRequest = await DonationRequest.create({
      ngoId: userId,
      title,
      description,
      requestType,
      categoryId: requestType === 'item' ? categoryId : undefined,
      itemsNeeded: requestType === 'item' ? itemsNeeded : undefined,
      estimatedValue: requestType === 'item' ? estimatedValue : undefined,
      urgency: requestType === 'item' ? urgency || 'medium' : undefined,
      amountRequested: requestType === 'financial' ? amountRequested : undefined,
      purpose: requestType === 'financial' ? purpose : undefined,
      expiresAt,
    });

    res.status(201).json({
      success: true,
      message: 'Donation request created successfully',
      data: donationRequest,
    });
  } catch (error) {
    console.error('Error creating donation request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create donation request',
      error: error.message,
    });
  }
};

// Get all donation requests (for public viewing or NGO)
export const getDonationRequests = async (req, res) => {
  try {
    const { requestType, urgency, status, page = 1, limit = 10 } = req.query;

    const query = {};

    if (requestType) {
      query.requestType = requestType;
    }

    if (urgency) {
      query.urgency = urgency;
    }

    if (status) {
      query.status = status;
    } else {
      // By default, only show open and partially fulfilled requests
      query.status = { $in: ['open', 'partially_fulfilled'] };
    }

    const skip = (page - 1) * limit;

    const requests = await DonationRequest.find(query)
      .populate('ngoId', 'userName email')
      .populate('categoryId', 'name icon')
      .sort({ urgency: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await DonationRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching donation requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation requests',
      error: error.message,
    });
  }
};

// Get NGO's own donation requests
export const getMyDonationRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { ngoId: userId };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const requests = await DonationRequest.find(query)
      .populate('categoryId', 'name icon')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await DonationRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching my donation requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation requests',
      error: error.message,
    });
  }
};

// Get donation request by ID
export const getDonationRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await DonationRequest.findById(requestId)
      .populate('ngoId', 'userName email phone')
      .populate('categoryId', 'name icon description')
      .populate('fulfillments.donorId', 'userName email')
      .populate('fulfillments.itemDonationId')
      .populate('fulfillments.financialDonationId');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Donation request not found',
      });
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('Error fetching donation request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation request',
      error: error.message,
    });
  }
};

// Update donation request
export const updateDonationRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;
    const updateData = req.body;

    const request = await DonationRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Donation request not found',
      });
    }

    // Check ownership
    if (request.ngoId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own donation requests',
      });
    }

    // Don't allow updating fulfilled or closed requests
    if (['fulfilled', 'closed'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update fulfilled or closed requests',
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title',
      'description',
      'itemsNeeded',
      'estimatedValue',
      'urgency',
      'amountRequested',
      'purpose',
      'expiresAt',
    ];

    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        request[field] = updateData[field];
      }
    });

    await request.save();

    res.status(200).json({
      success: true,
      message: 'Donation request updated successfully',
      data: request,
    });
  } catch (error) {
    console.error('Error updating donation request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update donation request',
      error: error.message,
    });
  }
};

// Close/delete donation request
export const closeDonationRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const request = await DonationRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Donation request not found',
      });
    }

    // Check ownership
    if (request.ngoId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only close your own donation requests',
      });
    }

    request.status = 'closed';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Donation request closed successfully',
      data: request,
    });
  } catch (error) {
    console.error('Error closing donation request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close donation request',
      error: error.message,
    });
  }
};

// Delete donation request
export const deleteDonationRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const request = await DonationRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Donation request not found',
      });
    }

    // Check ownership
    if (request.ngoId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own donation requests',
      });
    }

    // Don't allow deleting fulfilled requests
    if (request.status === 'fulfilled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete fulfilled requests',
      });
    }

    await DonationRequest.findByIdAndDelete(requestId);

    res.status(200).json({
      success: true,
      message: 'Donation request deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting donation request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete donation request',
      error: error.message,
    });
  }
};
