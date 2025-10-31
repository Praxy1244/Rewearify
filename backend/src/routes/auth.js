import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import ResetToken from '../models/ResetToken.js';
import { ok, fail, created } from '../utils/response.js';
import { sendTemplateEmail } from '../utils/email.js';
import { userValidations, handleValidationErrors } from '../utils/validation.js';
import { protect, restrictTo } from '../middleware/auth.js';
import passport from 'passport'; 

const router = express.Router();

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', userValidations.register, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password, role, location, organization, contact } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return fail(res, 'Email is already registered', 409);
    }

    // Prevent admin registration via API
    if (role === 'admin') {
      return fail(res, 'Admin accounts cannot be created via registration', 403);
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'donor',
      location: location || {},
      organization: organization || {},
      contact: contact || {},
      profile: {
        profilePicture: {
          url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        }
      }
    });


    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await ResetToken.create({
      userId: user._id,
      token: verificationToken,
      type: 'email_verification',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Send welcome email with verification
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    try {
      await sendTemplateEmail(user.email, 'welcome', {
        name: user.name,
        verificationUrl
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    // Return user data without password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location,
      organization: user.organization,
      contact: user.contact,
      profile: user.profile,
      verification: user.verification,
      preferences: user.preferences,
      statistics: user.statistics,
      status: user.status
    };

    return created(res, { user: userData }, 'Registration successful. Please check your email to verify your account.');
  } catch (error) {
    console.error('Registration error:', error);
    return fail(res, 'Registration failed', 500);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', userValidations.login, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return fail(res, 'Invalid email or password', 401);
    }

    // Check if account is locked
    if (user.isLocked) {
      return fail(res, 'Account is temporarily locked due to too many failed login attempts', 423);
    }

// --- 💡 ADD THIS VERIFICATION CHECK ---
    if (!user.verification.isEmailVerified) {
      return fail(res, 'Email not verified. Please check your inbox for a verification link.', 403); // 403 Forbidden
    }

    // Check if account is active
    if (user.status !== 'active') {
      return fail(res, 'Account is not active. Please contact support.', 403);
    }

    // Validate password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      // Increment login attempts
      await user.incLoginAttempts();
      return fail(res, 'Invalid email or password', 401);
    }

    // Reset login attempts on successful login
    if (user.security.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last active and login info
    user.lastActive = new Date();
    user.ipAddress = req.ip;
    user.userAgent = req.get('User-Agent');
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location,
      organization: user.organization,
      contact: user.contact,
      profile: user.profile,
      verification: user.verification,
      preferences: user.preferences,
      statistics: user.statistics,
      status: user.status,
      lastActive: user.lastActive
    };

    return ok(res, { token, user: userData }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return fail(res, 'Login failed', 500);
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return fail(res, 'User not found', 404);
    }

    return ok(res, { user }, 'User profile retrieved');
  } catch (error) {
    console.error('Get profile error:', error);
    return fail(res, 'Failed to get user profile', 500);
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return fail(res, 'Email is required', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not
      return ok(res, null, 'If that email exists, a reset link has been sent');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Remove any existing reset tokens for this user
    await ResetToken.deleteMany({ userId: user._id, type: 'password_reset' });

    // Create new reset token
    await ResetToken.create({
      userId: user._id,
      token: resetToken,
      type: 'password_reset',
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    try {
      await sendTemplateEmail(user.email, 'passwordReset', {
        name: user.name,
        resetUrl
      });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      return fail(res, 'Failed to send reset email', 500);
    }

    return ok(res, null, 'If that email exists, a reset link has been sent');
  } catch (error) {
    console.error('Forgot password error:', error);
    return fail(res, 'Failed to process forgot password request', 500);
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return fail(res, 'Password must be at least 6 characters long', 400);
    }

    // Find valid reset token
    const resetToken = await ResetToken.findOne({
      token,
      type: 'password_reset'
    });

    if (!resetToken || !resetToken.isValid()) {
      return fail(res, 'Invalid or expired reset token', 400);
    }

    // Find user
    const user = await User.findById(resetToken.userId);
    if (!user) {
      return fail(res, 'User not found', 404);
    }

    // Update password
    user.password = password;
    await user.save();

    // Mark token as used
    await resetToken.use(req.ip, req.get('User-Agent'));

    // Clear any login attempts
    await user.resetLoginAttempts();

    return ok(res, null, 'Password reset successful');
  } catch (error) {
    console.error('Reset password error:', error);
    return fail(res, 'Failed to reset password', 500);
  }
});

// @desc    Verify email
// @route   POST /api/auth/verify-email/:token
// @access  Public
router.post('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find valid verification token
    const verificationToken = await ResetToken.findOne({
      token,
      type: 'email_verification'
    });

    if (!verificationToken || !verificationToken.isValid()) {
      return fail(res, 'Invalid or expired verification token', 400);
    }

    // Find user
    const user = await User.findById(verificationToken.userId);
    if (!user) {
      return fail(res, 'User not found', 404);
    }

    // Mark email as verified
    user.verification.isEmailVerified = true;
    await user.save();

    // Mark token as used
    await verificationToken.use(req.ip, req.get('User-Agent'));

    return ok(res, null, 'Email verified successfully');
  } catch (error) {
    console.error('Email verification error:', error);
    return fail(res, 'Failed to verify email', 500);
  }
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
router.post('/resend-verification', protect, async (req, res) => {
  try {
    const user = req.user;

    if (user.verification.isEmailVerified) {
      return fail(res, 'Email is already verified', 400);
    }

    // Remove existing verification tokens
    await ResetToken.deleteMany({ 
      userId: user._id, 
      type: 'email_verification' 
    });

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await ResetToken.create({
      userId: user._id,
      token: verificationToken,
      type: 'email_verification',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    try {
      await sendTemplateEmail(user.email, 'welcome', {
        name: user.name,
        verificationUrl
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return fail(res, 'Failed to send verification email', 500);
    }

    return ok(res, null, 'Verification email sent');
  } catch (error) {
    console.error('Resend verification error:', error);
    return fail(res, 'Failed to resend verification email', 500);
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, userValidations.changePassword, handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return fail(res, 'User not found', 404);
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return fail(res, 'Current password is incorrect', 400);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return ok(res, null, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    return fail(res, 'Failed to change password', 500);
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just return success and let the client handle token removal
    
    return ok(res, null, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    return fail(res, 'Failed to logout', 500);
  }
});

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
router.get('/users', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    
    // Build query
    let query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    return ok(res, {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Users retrieved successfully');
  } catch (error) {
    console.error('Get users error:', error);
    return fail(res, 'Failed to get users', 500);
  }
});

// @desc    Auth with Google
// @route   GET /api/auth/google
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @desc    Google auth callback
// @route   GET /api/auth/google/callback
// @access  Public
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    // On successful authentication, Passport attaches the user to req.user
    const user = req.user;
    
    // We generate our own JWT token for the user
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // We redirect the user to the frontend with the token
    // The frontend will need to handle this
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

export default router;