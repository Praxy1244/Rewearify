import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { fail } from '../utils/response.js';

// Protect routes - require authentication
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }

    if (!token) {
      return fail(res, 'Access denied. No token provided.', 401);
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return fail(res, 'Token is not valid - user not found.', 401);
      }

      // Check if user account is active
      if (user.status !== 'active') {
        return fail(res, 'Account is not active. Please contact support.', 403);
      }

      // Check if account is locked
      if (user.isLocked) {
        return fail(res, 'Account is temporarily locked. Please try again later.', 423);
      }

      // Add user to request object
      req.user = user;
      
      // Update last active
      await user.updateLastActive();
      
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return fail(res, 'Token is not valid.', 401);
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return fail(res, 'Server error in authentication.', 500);
  }
};

// Restrict to certain roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return fail(res, 'Access denied. Insufficient permissions.', 403);
    }
    next();
  };
};

// Optional authentication
export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.status === 'active' && !user.isLocked) {
          req.user = user;
          await user.updateLastActive();
        }
      } catch (error) {
        // Token invalid, but continue without user
      }
    }
    next();
  } catch (error) {
    next();
  }
};

// Check if user owns resource
export const checkOwnership = (resourceField = 'user') => {
  return (req, res, next) => {
    if (req.user.role === 'admin') {
      return next();
    }
    const resourceUserId = req.resource?.[resourceField]?.toString() || req.params.userId;
    if (resourceUserId !== req.user._id.toString()) {
      return fail(res, 'Access denied. You can only access your own resources.', 403);
    }
    next();
  };
};

// Rate limiting per user
export const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  // ... (implementation) ...
  next();
};

// Verify email middleware
export const requireEmailVerification = (req, res, next) => {
  if (!req.user.verification.isEmailVerified) {
    return fail(res, 'Email verification required. Please verify your email address.', 403);
  }
  next();
};

// Admin or owner check
export const adminOrOwner = (resourceField = 'user') => {
  return (req, res, next) => {
    // 1. If the user is an admin, let them pass.
    if (req.user.role === 'admin') {
      return next();
    }

    // 2. Get the ID of the resource from the URL (e.g., /api/users/THIS_ID)
    const resourceUserId = req.resource?.[resourceField]?.toString() || req.params[resourceField] || req.params.id || req.params.userId;
    
    // --- 💡 THE FIX IS HERE ---
    // 3. Compare the resource ID from the URL to the logged-in user's ID
    // We must use `req.user._id.toString()` because `req.user.id` is undefined.
    if (resourceUserId !== req.user._id.toString()) {
      return fail(res, 'Access denied. Admin privileges or ownership required.', 403);
    }
    // --- END OF FIX ---

    // 4. If the IDs match, the user is the "owner". Let them pass.
    next();
  };
};

export default {
  protect,
  restrictTo,
  optionalAuth,
  checkOwnership,
  userRateLimit,
  requireEmailVerification,
  adminOrOwner
};

