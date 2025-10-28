import express from 'express';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import Request from '../models/Request.js';
import { ok, fail } from '../utils/response.js';

const router = express.Router();

// @desc    Get platform statistics
// @route   GET /api/public/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalDonations,
      totalRequests,
      activeDonations,
      activeRequests
    ] = await Promise.all([
      User.countDocuments({ status: 'active' }),
      Donation.countDocuments({ status: { $in: ['approved', 'matched', 'completed'] } }),
      Request.countDocuments({ status: { $in: ['active', 'matched', 'fulfilled'] } }),
      Donation.countDocuments({ status: 'approved' }),
      Request.countDocuments({ status: 'active' })
    ]);

    const stats = {
      users: totalUsers,
      donations: totalDonations,
      requests: totalRequests,
      activeDonations,
      activeRequests,
      impactMetrics: {
        itemsShared: totalDonations,
        communitiesHelped: Math.floor(totalUsers * 0.3), // Estimated
        co2Saved: Math.floor(totalDonations * 2.5) // Estimated kg CO2 saved
      }
    };

    return ok(res, stats, 'Platform statistics retrieved successfully');
  } catch (error) {
    console.error('Get public stats error:', error);
    return fail(res, 'Failed to get platform statistics', 500);
  }
});

// @desc    Get featured donations
// @route   GET /api/public/featured-donations
// @access  Public
router.get('/featured-donations', async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const featuredDonations = await Donation.find({
      status: 'approved',
      'preferences.featured': true
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('donor', 'name profile.profilePicture location.city statistics.rating')
    .select('-aiAnalysis -preferences.notes');

    return ok(res, { donations: featuredDonations }, 'Featured donations retrieved successfully');
  } catch (error) {
    console.error('Get featured donations error:', error);
    return fail(res, 'Failed to get featured donations', 500);
  }
});

// @desc    Get recent success stories
// @route   GET /api/public/success-stories
// @access  Public
router.get('/success-stories', async (req, res) => {
  try {
    const { limit = 3 } = req.query;

    // Get completed matches with success stories
    const Match = (await import('../models/Match.js')).default;
    const successStories = await Match.find({
      status: 'completed',
      'feedback.story': { $exists: true, $ne: '' }
    })
    .sort({ completedAt: -1 })
    .limit(parseInt(limit))
    .populate('donation', 'title images category')
    .populate('request', 'title')
    .populate('donor', 'name profile.profilePicture location.city')
    .populate('requester', 'name organization.name location.city')
    .select('feedback.story feedback.rating completedAt');

    return ok(res, { stories: successStories }, 'Success stories retrieved successfully');
  } catch (error) {
    console.error('Get success stories error:', error);
    return fail(res, 'Failed to get success stories', 500);
  }
});

// @desc    Get donation categories with counts
// @route   GET /api/public/categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Donation.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const categoryData = categories.map(cat => ({
      name: cat._id,
      count: cat.count,
      // Add category descriptions and icons
      description: getCategoryDescription(cat._id),
      icon: getCategoryIcon(cat._id)
    }));

    return ok(res, { categories: categoryData }, 'Categories retrieved successfully');
  } catch (error) {
    console.error('Get categories error:', error);
    return fail(res, 'Failed to get categories', 500);
  }
});

// @desc    Search public donations
// @route   GET /api/public/search
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, category, location, page = 1, limit = 12 } = req.query;

    if (!q || q.length < 2) {
      return fail(res, 'Search query must be at least 2 characters', 400);
    }

    let query = {
      status: 'approved',
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    };

    if (category) {
      query.category = category;
    }

    if (location) {
      // Add location-based search if coordinates are provided
      // This would need additional implementation for geocoding
    }

    const donations = await Donation.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('donor', 'name profile.profilePicture location.city statistics.rating')
      .select('-aiAnalysis -preferences.notes');

    const total = await Donation.countDocuments(query);

    return ok(res, {
      donations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Search completed successfully');
  } catch (error) {
    console.error('Public search error:', error);
    return fail(res, 'Failed to perform search', 500);
  }
});

// Helper functions
function getCategoryDescription(category) {
  const descriptions = {
    'clothing': 'Clothes, shoes, and accessories for all ages',
    'electronics': 'Phones, computers, and electronic devices',
    'furniture': 'Home and office furniture',
    'books': 'Educational and recreational reading materials',
    'toys': 'Children\'s toys and games',
    'sports': 'Sports equipment and gear',
    'kitchen': 'Kitchen appliances and utensils',
    'other': 'Miscellaneous items'
  };
  return descriptions[category] || 'Various items';
}

function getCategoryIcon(category) {
  const icons = {
    'clothing': '👕',
    'electronics': '📱',
    'furniture': '🪑',
    'books': '📚',
    'toys': '🧸',
    'sports': '⚽',
    'kitchen': '🍳',
    'other': '📦'
  };
  return icons[category] || '📦';
}

// --- 💡 A TEMPORARY ROUTE FOR TESTING OUR ERROR HANDLER ---
// This route will intentionally throw an error.
router.get('/test-error', (req, res, next) => {
  try {
    // We are simulating a bug by calling a function that doesn't exist.
    nonExistentFunction(); 
  } catch (error) {
    // Pass the error to our global error handler in errorMiddleware.js
    next(error);
  }
});


export default router;