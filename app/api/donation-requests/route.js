import express from 'express';
import {
  createDonationRequest,
  getDonationRequests,
  getMyDonationRequests,
  getDonationRequestById,
  updateDonationRequest,
  closeDonationRequest,
  deleteDonationRequest,
} from '../../../controllers/donationRequestController.js';
import { protect } from '../../../middlewares/authMiddleware.js';
import {
  checkSubscriptionStatus,
  checkUsageLimit,
  incrementUsage,
  decrementUsage,
} from '../../../middlewares/subscriptionMiddleware.js';

const router = express.Router();

// Public routes
router.get('/all', getDonationRequests);
router.get('/:requestId', getDonationRequestById);

// Protected routes (require authentication)
router.get('/my/requests', protect, checkSubscriptionStatus, getMyDonationRequests);

router.post(
  '/create',
  protect,
  checkSubscriptionStatus,
  checkUsageLimit('activeRequests'),
  incrementUsage('activeRequest'),
  createDonationRequest
);

router.patch('/:requestId', verifyToken, checkSubscriptionStatus, updateDonationRequest);

router.post('/:requestId/close', verifyToken, checkSubscriptionStatus, closeDonationRequest);

router.delete(
  '/:requestId',
  verifyToken,
  checkSubscriptionStatus,
  decrementUsage('activeRequest'),
  deleteDonationRequest
);

export default router;
