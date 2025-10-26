import ItemCategory from '../models/itemCategoryModel.js';
import User from '../models/authModel.js';

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await ItemCategory.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};

// Get categories accessible by user's tier
export const getCategoriesByTier = async (req, res) => {
  try {
    const userId = req.user.id;
    const { includeHidden = false } = req.query;

    const user = await User.findById(userId);
    const userTier = user.subscription.currentTier;

    // Build query
    const query = {
      isActive: true,
      requiredTier: { $lte: userTier },
    };

    // Optionally exclude hidden categories
    if (includeHidden === 'false' || includeHidden === false) {
      query.isHidden = false;
    }

    const categories = await ItemCategory.find(query)
      .sort({ displayOrder: 1, name: 1 })
      .select('-__v');

    // Group by tier for better organization
    const groupedByTier = categories.reduce((acc, category) => {
      const tier = category.requiredTier;
      if (!acc[tier]) {
        acc[tier] = [];
      }
      acc[tier].push(category);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        userTier,
        categories,
        groupedByTier,
      },
    });
  } catch (error) {
    console.error('Error fetching categories by tier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};

// Get visible categories (non-hidden) by tier
export const getVisibleCategories = async (req, res) => {
  try {
    const { tier } = req.query;

    const query = {
      isActive: true,
      isHidden: false,
    };

    if (tier) {
      query.requiredTier = { $lte: parseInt(tier) };
    }

    const categories = await ItemCategory.find(query)
      .sort({ displayOrder: 1, name: 1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching visible categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await ItemCategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message,
    });
  }
};

// Check if user can access a category
export const checkCategoryAccess = async (req, res) => {
  try {
    const userId = req.user.id;
    const { categoryId } = req.params;

    const user = await User.findById(userId);
    const userTier = user.subscription.currentTier;

    const category = await ItemCategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const canAccess = userTier >= category.requiredTier;

    res.status(200).json({
      success: true,
      data: {
        canAccess,
        category: {
          id: category._id,
          name: category.name,
          requiredTier: category.requiredTier,
        },
        userTier,
      },
    });
  } catch (error) {
    console.error('Error checking category access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check category access',
      error: error.message,
    });
  }
};

// Get locked categories (categories user cannot access)
export const getLockedCategories = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    const userTier = user.subscription.currentTier;

    const lockedCategories = await ItemCategory.find({
      isActive: true,
      isHidden: false,
      requiredTier: { $gt: userTier },
    })
      .sort({ requiredTier: 1, displayOrder: 1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: {
        userTier,
        lockedCategories,
      },
    });
  } catch (error) {
    console.error('Error fetching locked categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locked categories',
      error: error.message,
    });
  }
};

// Get categories for a specific tier (exact match)
export const getCategoriesForTier = async (req, res) => {
  try {
    const { tier } = req.params;

    if (!tier || tier < 1 || tier > 4) {
      return res.status(400).json({
        success: false,
        message: 'Valid tier (1-4) is required',
      });
    }

    const categories = await ItemCategory.find({
      isActive: true,
      requiredTier: parseInt(tier),
    })
      .sort({ displayOrder: 1, name: 1 })
      .select('-__v');

    // Separate visible and hidden
    const visible = categories.filter((c) => !c.isHidden);
    const hidden = categories.filter((c) => c.isHidden);

    res.status(200).json({
      success: true,
      data: {
        tier: parseInt(tier),
        visible,
        hidden,
        total: categories.length,
      },
    });
  } catch (error) {
    console.error('Error fetching categories for tier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};
