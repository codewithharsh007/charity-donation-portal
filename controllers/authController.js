import bcrypt from "bcryptjs";
import User from "../models/authModel";
import sendorgEmail from "../utils/emailService";
import { signToken } from "../config/JWT";

// In-memory OTP store (persists across hot reloads in development)
// Using global to prevent reinitialization during Next.js hot reload
const globalForOtp = global;
if (!globalForOtp.otpStore) {
  globalForOtp.otpStore = new Map();
}
export const otpStore = globalForOtp.otpStore;

// Step 1: Send OTP to email
export const sendOtp = async (email) => {
  try {
    if (!email) {
      return { success: false, message: "Email is required", status: 400 };
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, message: "User already exists", status: 400 };
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, {
      otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 min expiry
    });

    // Send OTP email
    await sendorgEmail(email, "Your OTP Code", otp);

    return { success: true, message: "OTP sent to email", status: 200 };
  } catch (err) {
    return {
      success: false,
      message: "Server error",
      error: err.message,
      status: 500,
    };
  }
};

// Step 2: Verify OTP
export const verifyOtp = (email, otp) => {
  try {
    const record = otpStore.get(email);

    if (!record) {
      return {
        success: false,
        message: "OTP not found. Please request again.",
        status: 400,
      };
    }

    if (record.expires < Date.now()) {
      otpStore.delete(email);
      return {
        success: false,
        message: "OTP expired. Please request again.",
        status: 400,
      };
    }

    // Convert both to strings and trim whitespace for comparison
    const storedOtp = String(record.otp).trim();
    const inputOtp = String(otp).trim();


    if (storedOtp !== inputOtp) {
      return { success: false, message: "Invalid OTP", status: 400 };
    }

    // Mark email as verified
    otpStore.set(email, { ...record, verified: true });

    return { success: true, message: "OTP verified", status: 200 };
  } catch (err) {
    return {
      success: false,
      message: "Server error",
      error: err.message,
      status: 500,
    };
  }
};

// Step 3: Complete registration
export const register = async (userData) => {
  try {
  
    const {
      email,
      userName,
      lastName,
      userType,
      phone,
      password,
      address,
      city,
      state,
      pincode,
    } = userData;

   

    // Validate lastName
    if (!lastName || lastName.trim() === "") {
      return {
        success: false,
        message:
          'Last name is required. Use "." if you don\'t have a last name',
        status: 400,
      };
    }

    // Validate userType
    if (!userType || !['donor', 'ngo'].includes(userType)) {
      return {
        success: false,
        message: 'User type is required and must be either "donor" or "ngo"',
        status: 400,
      };
    }

    // Check OTP verification
    const record = otpStore.get(email);


    if (!record || !record.verified) {
      return { success: false, message: "Email not verified", status: 400 };
    }

    // Check if user already exists
  
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, message: "User already exists", status: 400 };
    }

    // Hash password
  
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
  
    const user = new User({
      userName,
      lastName,
      userType,
      email,
      phone,
      password: hashedPassword,
      address,
      city,
      state,
      pincode,
      role: userType, // Set role same as userType for now
    });

   
    await user.save();


    otpStore.delete(email); // Clean up OTP store

    return {
      success: true,
      message: "User registered successfully",
      status: 201,
    };
  } catch (err) {
    console.error("❌ Register error:", err);
    console.error("Error stack:", err.stack);
    return {
      success: false,
      message: "Server error",
      error: err.message,
      status: 500,
    };
  }
};

// Login controller
export const login = async (email, password) => {
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, message: "Invalid credentials", status: 400 };
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, message: "Invalid credentials", status: 400 };
    }

    // Check if NGO is verified (only for NGO users)
    let isVerified = false;
    if (user.userType === "ngo") {
      const NgoVerification = (await import("../models/ngoVerificationModel.js")).default;
      const verification = await NgoVerification.findOne({ userId: user._id });
      isVerified = verification?.verificationStatus === "accepted";
    }

    // Generate JWT token
    const token = signToken(user._id);

    return {
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        userName: user.userName,
        lastName: user.lastName,
        userType: user.userType,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        role: user.role,
        isVerified, // Add verification status for NGOs
      },
      status: 200,
    };
  } catch (err) {
    return {
      success: false,
      message: "Server error",
      error: err.message,
      status: 500,
    };
  }
};
