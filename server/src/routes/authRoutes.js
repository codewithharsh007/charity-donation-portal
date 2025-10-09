import express from 'express';
import { sendOtp, verifyOtp, register, login, logout } from '../controllers/authController.js';

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

export default router;
