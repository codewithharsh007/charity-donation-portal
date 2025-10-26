import User from '../models/authModel.js';
import NgoSubscription from '../models/ngoSubscriptionModel.js';
import SubscriptionPlan from '../models/subscriptionPlanModel.js';
import ItemCategory from '../models/itemCategoryModel.js';
import ItemDonation from '../models/itemDonationModel.js';

// Check if user's subscription is active and not expired
export const checkSubscriptionStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if NGO
    if (user.userType !== 'ngo' && user.role !== 'ngo') {
      return res.status(403).json({
        success: false,
        message: 'This feature is only available for NGOs',
      });
    }

    // FREE tier is always active
    if (user.subscription.currentTier === 1) {
      req.userTier = 1;
      req.subscriptionStatus = 'active';
      return next();
    }

    // Check if subscription exists and is valid
    if (!user.subscription.subscriptionId) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription found',
      });
    }

    const subscription = await NgoSubscription.findById(
      user.subscription.subscriptionId
    );

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    // Check if subscription has expired
    if (subscription.endDate && new Date() > subscription.endDate) {
      // Auto-downgrade to FREE
      user.subscription.currentTier = 1;
      user.subscription.tierName = 'FREE';
      user.subscription.status = 'expired';
      await user.save();

      subscription.status = 'expired';
      await subscription.save();

      return res.status(403).json({
        success: false,
        message: 'Subscription has expired. You have been downgraded to FREE tier.',
        needsUpgrade: true,
      });
    }

    // Check if cancelled but still has access
    if (subscription.status === 'cancelled' && subscription.endDate > new Date()) {
      req.userTier = subscription.tier;
      req.subscriptionStatus = 'cancelled';
      req.subscription = subscription;
      return next();
    }

    // Check if active or trial
    if (['active', 'trial'].includes(subscription.status)) {
      req.userTier = subscription.tier;
      req.subscriptionStatus = subscription.status;
      req.subscription = subscription;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Subscription is not active',
      needsUpgrade: true,
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify subscription',
      error: error.message,
    });
  }
};

// Check if user's tier is sufficient for the required tier
export const checkTierAccess = (requiredTier) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const userTier = user.subscription.currentTier;

      if (userTier < requiredTier) {
        const requiredPlan = await SubscriptionPlan.findOne({
          tier: requiredTier,
        });

        return res.status(403).json({
          success: false,
          message: `This feature requires ${requiredPlan.displayName} (${requiredPlan.name}) tier or higher`,
          requiredTier,
          currentTier: userTier,
          needsUpgrade: true,
          upgradeTo: requiredPlan.name,
        });
      }

      req.userTier = userTier;
      next();
    } catch (error) {
      console.error('Error checking tier access:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify tier access',
        error: error.message,
      });
    }
  };
};

// Check usage limits before allowing action
export const checkUsageLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user.subscription.subscriptionId) {
        return res.status(403).json({
          success: false,
          message: 'No subscription found',
        });
      }

      const subscription = await NgoSubscription.findById(
        user.subscription.subscriptionId
      ).populate('planId');

      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: 'Subscription not found',
        });
      }

      const plan = subscription.planId;
      const usage = subscription.usage;

      // Check monthly reset
      const lastReset = new Date(usage.lastResetDate);
      const now = new Date();
      const daysSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));

      if (daysSinceReset >= 30) {
        // Reset monthly counters
        await subscription.resetMonthlyUsage();
        usage.monthlyAcceptedItems = 0;
        usage.financialRequestsThisMonth = 0;
      }

      switch (limitType) {
        case 'activeRequests':
          if (usage.activeRequests >= plan.limits.activeRequests) {
            return res.status(429).json({
              success: false,
              message: `You have reached your limit of ${plan.limits.activeRequests} active requests`,
              limit: plan.limits.activeRequests,
              current: usage.activeRequests,
              limitType: 'activeRequests',
              needsUpgrade: true,
            });
          }
          break;

        case 'monthlyAcceptance':
          if (usage.monthlyAcceptedItems >= plan.limits.monthlyAcceptance) {
            return res.status(429).json({
              success: false,
              message: `You have reached your monthly limit of ${plan.limits.monthlyAcceptance} item acceptances`,
              limit: plan.limits.monthlyAcceptance,
              current: usage.monthlyAcceptedItems,
              limitType: 'monthlyAcceptance',
              resetsOn: new Date(lastReset.getTime() + 30 * 24 * 60 * 60 * 1000),
              needsUpgrade: true,
            });
          }
          break;

        case 'financialRequest':
          if (!plan.permissions.canRequestFinancial) {
            return res.status(403).json({
              success: false,
              message: 'Your tier does not support financial donation requests',
              needsUpgrade: true,
            });
          }
          if (usage.financialRequestsThisMonth >= 1) {
            return res.status(429).json({
              success: false,
              message: 'You can only make one financial request per month',
              limit: 1,
              current: usage.financialRequestsThisMonth,
              limitType: 'financialRequest',
              resetsOn: new Date(lastReset.getTime() + 30 * 24 * 60 * 60 * 1000),
            });
          }
          break;

        default:
          break;
      }

      req.subscription = subscription;
      req.plan = plan;
      next();
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify usage limits',
        error: error.message,
      });
    }
  };
};

// Validate item value against tier limit
export const validateItemValue = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemValue } = req.body;

    if (!itemValue) {
      return next(); // Skip if no value provided
    }

    const user = await User.findById(userId);
    const subscription = await NgoSubscription.findById(
      user.subscription.subscriptionId
    ).populate('planId');

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No subscription found',
      });
    }

    const maxItemValue = subscription.planId.limits.maxItemValue;

    if (itemValue > maxItemValue) {
      return res.status(403).json({
        success: false,
        message: `Item value (₹${itemValue}) exceeds your tier limit of ₹${maxItemValue}`,
        maxItemValue,
        itemValue,
        needsUpgrade: true,
      });
    }

    next();
  } catch (error) {
    console.error('Error validating item value:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate item value',
      error: error.message,
    });
  }
};

// Check if user can access a specific item category
export const validateCategoryAccess = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { categoryId } = req.body;

    if (!categoryId) {
      return next(); // Skip if no category provided
    }

    const user = await User.findById(userId);
    const userTier = user.subscription.currentTier;

    const category = await ItemCategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    if (userTier < category.requiredTier) {
      const requiredPlan = await SubscriptionPlan.findOne({
        tier: category.requiredTier,
      });

      return res.status(403).json({
        success: false,
        message: `This category requires ${requiredPlan.displayName} tier or higher`,
        category: category.name,
        requiredTier: category.requiredTier,
        currentTier: userTier,
        needsUpgrade: true,
      });
    }

    req.category = category;
    next();
  } catch (error) {
    console.error('Error validating category access:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate category access',
      error: error.message,
    });
  }
};

// Check if user can accept a specific item donation
export const validateItemAccess = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const user = await User.findById(userId);
    const userTier = user.subscription.currentTier;

    const item = await ItemDonation.findById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Check tier requirement
    if (userTier < item.requiredTier) {
      const requiredPlan = await SubscriptionPlan.findOne({
        tier: item.requiredTier,
      });

      return res.status(403).json({
        success: false,
        message: `This item requires ${requiredPlan.displayName} tier or higher`,
        requiredTier: item.requiredTier,
        currentTier: userTier,
        needsUpgrade: true,
      });
    }

    // Check item value
    const subscription = await NgoSubscription.findById(
      user.subscription.subscriptionId
    ).populate('planId');

    if (subscription && item.itemValue > subscription.planId.limits.maxItemValue) {
      return res.status(403).json({
        success: false,
        message: `This item value (₹${item.itemValue}) exceeds your tier limit of ₹${subscription.planId.limits.maxItemValue}`,
        itemValue: item.itemValue,
        maxItemValue: subscription.planId.limits.maxItemValue,
        needsUpgrade: true,
      });
    }

    req.item = item;
    next();
  } catch (error) {
    console.error('Error validating item access:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate item access',
      error: error.message,
    });
  }
};

// Increment usage counter after successful action
export const incrementUsage = (usageType) => {
  return async (req, res, next) => {
    try {
      if (!req.subscription) {
        return next();
      }

      switch (usageType) {
        case 'activeRequest':
          req.subscription.usage.activeRequests += 1;
          break;
        case 'monthlyAcceptance':
          req.subscription.usage.monthlyAcceptedItems += 1;
          break;
        case 'financialRequest':
          req.subscription.usage.financialRequestsThisMonth += 1;
          break;
        default:
          break;
      }

      await req.subscription.save();
      next();
    } catch (error) {
      console.error('Error incrementing usage:', error);
      // Don't block the request, just log the error
      next();
    }
  };
};

// Decrement usage counter (for cancellations/deletions)
export const decrementUsage = (usageType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user.subscription.subscriptionId) {
        return next();
      }

      const subscription = await NgoSubscription.findById(
        user.subscription.subscriptionId
      );

      if (!subscription) {
        return next();
      }

      switch (usageType) {
        case 'activeRequest':
          if (subscription.usage.activeRequests > 0) {
            subscription.usage.activeRequests -= 1;
          }
          break;
        default:
          break;
      }

      await subscription.save();
      next();
    } catch (error) {
      console.error('Error decrementing usage:', error);
      // Don't block the request, just log the error
      next();
    }
  };
};
