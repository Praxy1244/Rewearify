import express from 'express';
import User from '../models/User.js';
import { ok, fail, paginated } from '../utils/response.js';
import { protect, restrictTo, adminOrOwner } from '../middleware/auth.js';
import { userValidations, handleValidationErrors } from '../utils/validation.js';
import multer from 'multer'; // 💡 Import multer
import fs from 'fs';
import path from 'path';

const router = express.Router();
// --- 💡 CONFIGURE MULTER FOR IMAGE UPLOAD ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'public/uploads/profiles';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)){
        fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Rename: userId-timestamp.ext
    cb(null, `${req.params.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// --- 💡 NEW ROUTE: Upload Profile Picture ---
// @route   POST /api/users/:id/profile-picture
// @access  Private (Owner)
router.post('/:id/profile-picture', protect, adminOrOwner('id'), upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return fail(res, 'No file uploaded', 400);
    }

    // Construct URL (Assuming you serve 'public' folder statically)
    // If using React dev server, you might need to proxy this or use an absolute URL
    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 'profile.profilePicture.url': imageUrl },
      { new: true }
    ).select('-password');

    return ok(res, { 
      user,
      imageUrl 
    }, 'Profile picture updated successfully');

  } catch (error) {
    console.error('Upload error:', error);
    return fail(res, 'Failed to upload image', 500);
  }
});

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -security -verification.emailVerificationToken -verification.phoneVerificationCode');
    
    if (!user) {
      return fail(res, 'User not found', 404);
    }

    // Hide sensitive information based on privacy settings
    const publicProfile = {
      id: user._id,
      name: user.name,
      role: user.role,
      profile: user.profile,
      statistics: user.statistics,
      createdAt: user.createdAt
    };

    // Add location if user allows it
    if (user.preferences.privacy.showLocation) {
      publicProfile.location = {
        city: user.location.city,
        state: user.location.state,
        country: user.location.country
      };
    }

    // Add contact if user allows it
    if (user.preferences.privacy.showContact) {
      publicProfile.contact = user.contact;
    }

    // Add organization for recipients
    if (user.role === 'recipient' && user.organization.name) {
      publicProfile.organization = user.organization;
    }

    return ok(res, { user: publicProfile }, 'User profile retrieved successfully');
  } catch (error) {
    console.error('Get user profile error:', error);
    return fail(res, 'Failed to get user profile', 500);
  }
});

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private (Owner or Admin)
router.put('/:id', protect, adminOrOwner('id'), userValidations.updateProfile, handleValidationErrors, async (req, res) => {
  try {
     const allowedUpdates = [
      'name', 'location', 'organization', 'contact', 'profile', 'preferences', 'role'
    ];

    // Filter only allowed updates
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -security');

    if (!user) {
      return fail(res, 'User not found', 404);
    }

    return ok(res, { user }, 'Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    return fail(res, 'Failed to update profile', 500);
  }
});

// @desc    Get nearby users
// @route   GET /api/users/nearby
// @access  Private
router.get('/nearby', protect, async (req, res) => {
  try {
    const { lat, lng, radius = 25, role } = req.query;

    if (!lat || !lng) {
      return fail(res, 'Latitude and longitude are required', 400);
    }

    const coordinates = [parseFloat(lng), parseFloat(lat)];
    
    let query = {
      _id: { $ne: req.user.id }, // Exclude current user
      status: 'active',
      'preferences.privacy.showLocation': true
    };

    if (role) {
      query.role = role;
    }

    const nearbyUsers = await User.find({
      ...query,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coordinates
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    })
    .select('name role profile.profilePicture location.city location.state statistics.rating organization.name')
    .limit(20);

    return ok(res, { users: nearbyUsers }, 'Nearby users retrieved successfully');
  } catch (error) {
    console.error('Get nearby users error:', error);
    return fail(res, 'Failed to get nearby users', 500);
  }
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { q, role, page = 1, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return fail(res, 'Search query must be at least 2 characters', 400);
    }

    let query = {
      status: 'active',
      'preferences.privacy.showProfile': true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { 'organization.name': { $regex: q, $options: 'i' } }
      ]
    };

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('name role profile.profilePicture location.city location.state statistics.rating organization.name')
      .sort({ 'statistics.rating': -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    return paginated(res, users, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }, 'Users search completed successfully');
  } catch (error) {
    console.error('Search users error:', error);
    return fail(res, 'Failed to search users', 500);
  }
});

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Private (Owner or Admin)
router.get('/:id/stats', protect, adminOrOwner('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('statistics role createdAt');

    if (!user) {
      return fail(res, 'User not found', 404);
    }

    // Get additional statistics based on role
    let additionalStats = {};
    
    if (user.role === 'donor') {
      // Get donation statistics
      const Donation = (await import('../models/Donation.js')).default;
      const donationStats = await Donation.aggregate([
        { $match: { donor: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      additionalStats.donations = {
        total: user.statistics.totalDonations,
        byStatus: donationStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      };
    } else if (user.role === 'recipient') {
      // Get request statistics
      const Request = (await import('../models/Request.js')).default;
      const requestStats = await Request.aggregate([
        { $match: { requester: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      additionalStats.requests = {
        total: user.statistics.totalRequests,
        byStatus: requestStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      };
    }

    const stats = {
      basic: user.statistics,
      memberSince: user.createdAt,
      ...additionalStats
    };

    return ok(res, { stats }, 'User statistics retrieved successfully');
  } catch (error) {
    console.error('Get user stats error:', error);
    return fail(res, 'Failed to get user statistics', 500);
  }
});

// @desc    Update user status (Admin only)
// @route   PATCH /api/users/:id/status
// @access  Private (Admin)
router.patch('/:id/status', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'inactive', 'suspended', 'banned'];

    if (!validStatuses.includes(status)) {
      return fail(res, 'Invalid status', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password -security');

    if (!user) {
      return fail(res, 'User not found', 404);
    }

    return ok(res, { user }, 'User status updated successfully');
  } catch (error) {
    console.error('Update user status error:', error);
    return fail(res, 'Failed to update user status', 500);
  }
});

export default router;