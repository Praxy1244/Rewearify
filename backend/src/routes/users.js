import express from 'express';
import User from '../models/User.js';
import { ok, fail, paginated } from '../utils/response.js';
import { protect, restrictTo, adminOrOwner } from '../middleware/auth.js';
import { userValidations, handleValidationErrors } from '../utils/validation.js';
import { getAchievementProgress } from '../utils/achievements.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// --- CONFIGURE MULTER FOR IMAGE UPLOAD ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'public/uploads/profiles';
    if (!fs.existsSync(uploadPath)){
        fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.params.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Helper function for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// @desc    Get all users for admin dashboard
// @route   GET /api/users
// @access  Private (Admin only)
router.get('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      search, 
      status = 'active'
    } = req.query;

    let query = { status };

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'organization.name': { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select('-password -security')
      .lean()
      .sort({ 
        createdAt: -1,
        _id: -1
      })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const usersWithDates = users.map(user => ({
      ...user,
      createdAt: user.createdAt || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: user.updatedAt || new Date()
    }));

    const roleStats = await User.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const stats = {
      total,
      active: await User.countDocuments({ status: 'active' }),
      suspended: await User.countDocuments({ status: { $ne: 'active' } }),
      byRole: {
        admin: roleStats.find(r => r._id === 'admin')?.count || 0,
        donor: roleStats.find(r => r._id === 'donor')?.count || 0,
        recipient: roleStats.find(r => r._id === 'recipient')?.count || 0
      }
    };

    return res.json({
      success: true,
      data: usersWithDates,
      stats
    });

  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

// --- 💡 SPECIFIC ROUTES BEFORE PARAMETER ROUTES ---

// @desc    Get nearby users
// @route   GET /api/users/nearby
// @access  Private
router.get('/nearby', protect, async (req, res) => {
  try {
    const { lat, lng, radius = 25, role } = req.query;

    console.log(`📍 Nearby users request: lat=${lat}, lng=${lng}, radius=${radius}km, role=${role}`);

    if (!lat || !lng) {
      return fail(res, 'Latitude and longitude are required', 400);
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
      return fail(res, 'Invalid coordinates or radius', 400);
    }

    const query = {
      _id: { $ne: req.user.id },
      status: 'active'
    };

    if (role) {
      query.role = role;
    }

    console.log(`   Searching for users near [${longitude}, ${latitude}]`);

    try {
      // Try using $geoNear aggregation first
      const nearbyUsers = await User.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            distanceField: 'distance',
            maxDistance: radiusKm * 1000,
            spherical: true,
            query: query,
            distanceMultiplier: 0.001
          }
        },
        {
          $limit: 50
        },
        {
          $project: {
            name: 1,
            role: 1,
            'profile.profilePicture': 1,
            'location.city': 1,
            'location.state': 1,
            'statistics.rating': 1,
            'organization.name': 1,
            trust_score: { $ifNull: ['$trust_score', 75] },
            impact_score: { $ifNull: ['$impact_score', 70] },
            distance: 1
          }
        }
      ]);

      console.log(`✅ Found ${nearbyUsers.length} nearby users`);

      return ok(res, { 
        users: nearbyUsers,
        count: nearbyUsers.length,
        search_params: {
          latitude,
          longitude,
          radius: radiusKm
        }
      }, 'Nearby users retrieved successfully');

    } catch (geoError) {
      console.log('⚠️ $geoNear failed, using fallback method');
      console.error('   Error:', geoError.message);
      
      // Fallback: Get all users and filter manually
      const allUsers = await User.find(query)
        .select('name role profile location statistics organization')
        .limit(200);
      
      const nearbyUsers = allUsers.filter(user => {
        if (!user.location?.coordinates?.coordinates) return false;
        
        const [userLng, userLat] = user.location.coordinates.coordinates;
        
        if (!userLng || !userLat || userLng === 0 || userLat === 0) return false;
        
        const distance = calculateDistance(latitude, longitude, userLat, userLng);
        
        user.distance = distance;
        
        return distance <= radiusKm;
      }).slice(0, 50);
      
      // Transform to match aggregation format
      const formattedUsers = nearbyUsers.map(user => ({
        _id: user._id,
        name: user.name,
        role: user.role,
        profile: user.profile,
        location: user.location,
        statistics: user.statistics,
        organization: user.organization,
        trust_score: user.trust_score || 75,
        impact_score: user.impact_score || 70,
        distance: user.distance
      }));
      
      console.log(`✅ Fallback found ${formattedUsers.length} nearby users`);
      
      return ok(res, { 
        users: formattedUsers,
        count: formattedUsers.length,
        method: 'fallback'
      }, 'Nearby users retrieved (fallback)');
    }
    
  } catch (error) {
    console.error('❌ Nearby users error:', error);
    return fail(res, `Failed to get nearby users: ${error.message}`, 500);
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

// --- UPLOAD PROFILE PICTURE ---
// @route   POST /api/users/:id/profile-picture
// @access  Private (Owner)
router.post('/:id/profile-picture', protect, adminOrOwner('id'), upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return fail(res, 'No file uploaded', 400);
    }

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

// --- GET USER STATS ---
// @route   GET /api/users/:id/stats
// @access  Private (Owner or Admin)
router.get('/:id/stats', protect, adminOrOwner('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('statistics role createdAt');

    if (!user) {
      return fail(res, 'User not found', 404);
    }

    let additionalStats = {};
    
    if (user.role === 'donor') {
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

// --- UPDATE USER STATUS ---
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

// --- 💡 PARAMETER ROUTE LAST ---

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

    const publicProfile = {
      id: user._id,
      name: user.name,
      role: user.role,
      profile: user.profile,
      statistics: user.statistics,
      createdAt: user.createdAt
    };

    if (user.preferences.privacy.showLocation) {
      publicProfile.location = {
        city: user.location.city,
        state: user.location.state,
        country: user.location.country
      };
    }

    if (user.preferences.privacy.showContact) {
      publicProfile.contact = user.contact;
    }

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

// @desc    Get donor achievements and stats
// @route   GET /api/users/:id/achievements
// @access  Private (Owner or Public for donors)
router.get('/:id/achievements', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name statistics achievements role');
    
    if (!user) {
      return fail(res, 'User not found', 404);
    }

    // Only show achievements for donors
    if (user.role !== 'donor') {
      return fail(res, 'Achievements are only available for donors', 400);
    }

    const achievementProgress = getAchievementProgress(user.statistics || {});

    return ok(res, {
      statistics: user.statistics,
      achievements: user.achievements || [],
      progress: achievementProgress
    }, 'Achievements retrieved successfully');
  } catch (error) {
    console.error('Get achievements error:', error);
    return fail(res, 'Failed to get achievements', 500);
  }
});

export default router;
