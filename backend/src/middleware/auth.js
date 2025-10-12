import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { fail } from '../utils/response.js';

// Protect routes - require authentication
export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    }

    // Check if token exists
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
      user.updateLastActive();
      
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

// Optional authentication - doesn't fail if no token
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
          user.updateLastActive();
        }
      } catch (error) {
        // Token invalid, but continue without user
        console.log('Optional auth - invalid token:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Check if user owns resource
export const checkOwnership = (resourceField = 'user') => {
  return (req, res, next) => {
    // For admin users, skip ownership check
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.resource?.[resourceField]?.toString() || req.params.userId;
    
    if (resourceUserId !== req.user.id) {
      return fail(res, 'Access denied. You can only access your own resources.', 403);
    }

    next();
  };
};

// Rate limiting per user
export const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter(time => time > windowStart);
      requests.set(userId, userRequests);
    }

    // Get current user requests
    const userRequests = requests.get(userId) || [];

    // Check if limit exceeded
    if (userRequests.length >= maxRequests) {
      return fail(res, 'Rate limit exceeded. Please try again later.', 429);
    }

    // Add current request
    userRequests.push(now);
    requests.set(userId, userRequests);

    next();
  };
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
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceUserId = req.resource?.[resourceField]?.toString() || req.params.userId;
    
    if (resourceUserId !== req.user.id) {
      return fail(res, 'Access denied. Admin privileges or ownership required.', 403);
    }

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