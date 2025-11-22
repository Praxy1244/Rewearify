import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { fail } from '../utils/response.js';

// --- Existing Logic ---

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
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return fail(res, 'Token is not valid - user not found.', 401);
      }

      if (user.status !== 'active') {
        return fail(res, 'Account is not active.', 403);
      }

      if (user.isLocked) {
        return fail(res, 'Account is locked.', 423);
      }

      req.user = user;
      await user.updateLastActive();
      next();
    } catch (error) {
      return fail(res, 'Token is not valid.', 401);
    }
  } catch (error) {
    return fail(res, 'Server error in authentication.', 500);
  }
};

// Restrict to certain roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log('🔒 restrictTo middleware');
    console.log('   User:', req.user);
    console.log('   User role:', req.user?.role);
    console.log('   Allowed roles:', roles);
    console.log('   Match:', roles.includes(req.user?.role));
    
    if (!req.user || !roles.includes(req.user.role)) {
      console.log('   ❌ Access denied');
      return fail(res, 'You do not have permission to perform this action', 403);
    }
    
    console.log('   ✅ Access granted');
    next();
  };
};


// Optional authentication
export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.status === 'active' && !user.isLocked) {
          req.user = user;
          await user.updateLastActive();
        }
      } catch (error) { }
    }
    next();
  } catch (error) {
    next();
  }
};

export const checkOwnership = (resourceField = 'user') => {
  return (req, res, next) => {
    if (req.user.role === 'admin') return next();
    const resourceUserId = req.resource?.[resourceField]?.toString() || req.params.userId;
    if (resourceUserId !== req.user._id.toString()) {
      return fail(res, 'Access denied.', 403);
    }
    next();
  };
};

export const requireEmailVerification = (req, res, next) => {
  if (!req.user.verification?.isEmailVerified) {
    return fail(res, 'Email verification required.', 403);
  }
  next();
};

export const adminOrOwner = (resourceField = 'user') => {
  return (req, res, next) => {
    if (req.user.role === 'admin') return next();
    const resourceUserId = req.resource?.[resourceField]?.toString() || req.params[resourceField] || req.params.id || req.params.userId;
    if (resourceUserId !== req.user._id.toString()) {
      return fail(res, 'Access denied.', 403);
    }
    next();
  };
};

// --- COMPATIBILITY ALIASES (The Fix) ---
// These exports map your existing logic to the names the AI routes expect.

export const protectedRoute = protect;
export const adminRoute = restrictTo('admin');

export default {
  protect,
  restrictTo,
  optionalAuth,
  checkOwnership,
  requireEmailVerification,
  adminOrOwner,
  // Add aliases to default export too
  protectedRoute,
  adminRoute
};