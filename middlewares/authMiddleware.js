import { cookies } from 'next/headers';
import User from '../models/authModel';
import { verifyToken } from '../config/JWT';

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
        message: 'Not authorized', 
        status: 401 
      };
    }

    // Verify token (handle verify errors gracefully)
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (verifyErr) {
      // Token malformed or expired - return 401 instead of 500
      console.warn('Token verification failed:', verifyErr.message || verifyErr);
      return {
        success: false,
        message: 'Token invalid or expired',
        status: 401,
      };
    }

    // Find user
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return { 
        success: false, 
        message: 'User not found', 
        status: 401 
      };
    }

    return {
      success: true,
      user: user,
      userId: user._id,
      status: 200
    };
  } catch (err) {
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
        message: 'Forbidden - Insufficient permissions', 
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

export default protect;
