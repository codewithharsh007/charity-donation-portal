import User from '../models/authModel.js';
import { verifyToken } from '../config/JWT.js';

/**
 * protect - authentication middleware
 * - Accepts JWT from cookie 'token' or Authorization: Bearer <token>
 * - Verifies token, loads user (without password) and attaches to req.user and req.userId
 */
export const protect = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ message: 'Token invalid or expired' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.userId = user._id;
    req.user = user;
    return next();
  } catch (err) {
    return res.status(500).json({ message: 'Authentication error', error: err.message });
  }
};

/**
 * authorize - role-based access control middleware factory
 * usage: app.get('/admin', protect, authorize('admin'), handler)
 */
export const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  return next();
};

export default protect;