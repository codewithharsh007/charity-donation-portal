// middlewares/authMiddleware.js
import { cookies } from 'next/headers';
import User from '@/models/authModel';
import { verifyToken } from '@/config/JWT';
import dbConnect from '@/lib/mongodb';

/**
 * protect - authentication middleware for Next.js API routes
 * - Accepts JWT from cookie 'token' or Authorization: Bearer <token>
 * - Verifies token, loads user (without password)
 * - Returns { success, user, userId, message, status }
 */
export const protect = async (request) => {
  try {
    // Get token from cookies or Authorization header
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get('token')?.value;
    
    const authHeader = request.headers.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : null;

    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      return { 
        success: false, 
        message: 'Not authorized - No token provided', 
        status: 401 
      };
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (verifyErr) {
      console.warn('🔐 Token verification failed:', verifyErr.message || verifyErr);
      return {
        success: false,
        message: 'Token invalid or expired',
        status: 401,
      };
    }

    // Connect to database
    await dbConnect();

    // Find user (handle both decoded.id and decoded.userId)
    const userId = decoded.id || decoded.userId || decoded._id;
    const user = await User.findById(userId).select('-password').lean();
    
    if (!user) {
      return {
        success: false,
        message: 'User not found', 
        status: 401 
      };
    }

    // Return success with user data
    return {
      success: true,
      user: {
        ...user,
        userId: user._id,
        id: user._id, // Add both for compatibility
      },
      userId: user._id,
      status: 200
    };
  } catch (err) {
    console.error('🔐 Auth error:', err);
    return { 
      success: false, 
      message: 'Authentication error', 
      error: err.message, 
      status: 500 
    };
  }
};

/**
 * authorize - role-based access control
 * usage: const auth = await authorize(request, ['admin', 'moderator']);
 */
export const authorize = async (request, allowedRoles = []) => {
  try {
    const authResult = await protect(request);
    
    if (!authResult.success) {
      return authResult;
    }

    if (!allowedRoles.includes(authResult.user.role)) {
      return { 
        success: false, 
        message: `Forbidden - Requires role: ${allowedRoles.join(' or ')}`, 
        status: 403 
      };
    }

    return authResult;
  } catch (err) {
    return { 
      success: false, 
      message: 'Authorization error', 
      error: err.message, 
      status: 500 
    };
  }
};

/**
 * Helper function to use in API routes
 * Returns NextResponse if auth fails, otherwise returns user data
 */
export const authenticateRequest = async (request) => {
  const authResult = await protect(request);
  
  if (!authResult.success) {
    return {
      error: true,
      response: NextResponse.json(
        { success: false, message: authResult.message },
        { status: authResult.status }
      )
    };
  }
  
  return {
    error: false,
    user: authResult.user,
    userId: authResult.userId
  };
};

export default protect;
