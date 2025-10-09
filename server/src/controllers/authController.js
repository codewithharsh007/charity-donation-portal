import User from '../models/authModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendorgEmail from '../utils/emailService.js';

// In-memory OTP store (for demo only)
const otpStore = {};

// Step 1: Send OTP to email
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // If user already exists, you might still want to allow OTP for login flows.
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 minutes

    // send OTP (simple text)
    await sendorgEmail(email, 'Your OTP Code', `Your OTP is: ${otp}`);

    return res.status(200).json({ message: 'OTP sent to email' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Step 2: Verify OTP
export const verifyOtp = (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    const record = otpStore[email];
    if (!record) return res.status(400).json({ message: 'OTP not found. Request again.' });
    if (record.expires < Date.now()) {
      delete otpStore[email];
      return res.status(400).json({ message: 'OTP expired. Request again.' });
    }
    if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    otpStore[email].verified = true;
    return res.status(200).json({ message: 'OTP verified' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Step 3: Complete registration
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      address,
      city,
      state,
      pincode,
      roles, // expect array like ["ngo"] or ["donor"]
      registrationNumber,
      website,
      description
    } = req.body;

    // Basic required validation
    if (!name || !email || !phone || !password || !address || !city || !state || !pincode || !roles) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Normalize roles to array
    const roleArray = Array.isArray(roles) ? roles : [roles];

    // Example business rule: don't allow both admin and ngo together
    if (roleArray.includes('admin') && roleArray.includes('ngo')) {
      return res.status(400).json({ message: 'Cannot be both admin and ngo at the same time' });
    }

    // OTP verification check
    const record = otpStore[email];
    if (!record || !record.verified) {
      return res.status(400).json({ message: 'Email not verified via OTP' });
    }

    // Existing user check
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // If role includes ngo, ensure registrationNumber is provided and unique
    if (roleArray.includes('ngo')) {
      if (!registrationNumber) return res.status(400).json({ message: 'registrationNumber is required for NGO' });

      // check uniqueness of registrationNumber across collection
      const regUsed = await User.findOne({ registrationNumber });
      if (regUsed) return res.status(400).json({ message: 'registrationNumber already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Build user document
    const userData = {
      name,
      email,
      phone,
      password: hashedPassword,
      address,
      city,
      state,
      pincode,
      roles: roleArray,
      // include NGO-specific fields only if NGO role present
      ...(roleArray.includes('ngo') && { registrationNumber, website, description, verified: false })
    };

    const user = new User(userData);
    await user.save();

    // cleanup OTP
    delete otpStore[email];

    return res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (err) {
    // handle duplicate key errors gracefully
    if (err.code === 11000) {
      const dupKey = Object.keys(err.keyPattern || {}).join(', ');
      return res.status(400).json({ message: `Duplicate field: ${dupKey}` });
    }
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, roles: user.roles },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Logout controller
export const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  return res.status(200).json({ message: 'Logged out successfully' });
};
