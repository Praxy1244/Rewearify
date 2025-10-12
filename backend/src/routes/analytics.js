import express from 'express';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import Request from '../models/Request.js';
import Match from '../models/Match.js';
import { ok, fail } from '../utils/response.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get platform analytics overview
// @route   GET /api/analytics/overview
// @access  Private (Admin)
router.get('/overview', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get basic counts
    const [
      totalUsers,
      totalDonations,
      totalRequests,
      totalMatches,
      newUsers,
      newDonations,
      newRequests,
      completedMatches
    ] = await Promise.all([
      User.countDocuments({ status: 'active' }),
      Donation.countDocuments(),
      Request.countDocuments(),
      Match.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Donation.countDocuments({ createdAt: { $gte: startDate } }),
      Request.countDocuments({ createdAt: { $gte: startDate } }),
      Match.countDocuments({ 
        status: 'completed',
        createdAt: { $gte: startDate }
      })
    ]);

    // Get user distribution by role
    const usersByRole = await User.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Get donations by category
    const donationsByCategory = await Donation.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get donations by status
    const donationsByStatus = await Donation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Calculate match rate
    const matchRate = totalDonations > 0 ? (totalMatches / totalDonations) * 100 : 0;

    // Get geographic distribution
    const geographicDistribution = await User.aggregate([
      { $match: { status: 'active', 'location.city': { $ne: '' } } },
      { 
        $group: { 
          _id: { 
            city: '$location.city', 
            state: '$location.state' 
          }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const analytics = {
      overview: {
        totalUsers,
        totalDonations,
        totalRequests,
        totalMatches,
        matchRate: Math.round(matchRate * 100) / 100
      },
      growth: {
        newUsers,
        newDonations,
        newRequests,
        completedMatches,
        period
      },
      distribution: {
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        donationsByCategory: donationsByCategory.slice(0, 10),
        donationsByStatus: donationsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        geographicDistribution
      }
    };

    return ok(res, analytics, 'Analytics retrieved successfully');
  } catch (error) {
    console.error('Get analytics error:', error);
    return fail(res, 'Failed to get analytics', 500);
  }
});

// @desc    Get donation trends
// @route   GET /api/analytics/donations/trends
// @access  Private (Admin)
router.get('/donations/trends', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { period = '30d', groupBy = 'day' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    let dateFormat;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFormat = '%Y-%m-%d';
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFormat = '%Y-%m-%d';
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        dateFormat = groupBy === 'week' ? '%Y-%U' : '%Y-%m-%d';
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        dateFormat = '%Y-%m';
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFormat = '%Y-%m-%d';
    }

    const trends = await Donation.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Transform data for easier consumption
    const trendData = {};
    trends.forEach(item => {
      if (!trendData[item._id.date]) {
        trendData[item._id.date] = {};
      }
      trendData[item._id.date][item._id.status] = item.count;
    });

    return ok(res, { trends: trendData, period, groupBy }, 'Donation trends retrieved successfully');
  } catch (error) {
    console.error('Get donation trends error:', error);
    return fail(res, 'Failed to get donation trends', 500);
  }
});

// @desc    Get user engagement metrics
// @route   GET /api/analytics/users/engagement
// @access  Private (Admin)
router.get('/users/engagement', protect, restrictTo('admin'), async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      activeUsers30d,
      activeUsers7d,
      newUsers30d,
      returningUsers,
      topDonors,
      topRecipients
    ] = await Promise.all([
      User.countDocuments({ lastActive: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ lastActive: { $gte: sevenDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ 
        createdAt: { $lt: thirtyDaysAgo },
        lastActive: { $gte: sevenDaysAgo }
      }),
      User.find({ role: 'donor' })
        .sort({ 'statistics.totalDonations': -1 })
        .limit(10)
        .select('name statistics.totalDonations profile.profilePicture'),
      User.find({ role: 'recipient' })
        .sort({ 'statistics.totalRequests': -1 })
        .limit(10)
        .select('name statistics.totalRequests profile.profilePicture organization.name')
    ]);

    const engagement = {
      activeUsers: {
        last30Days: activeUsers30d,
        last7Days: activeUsers7d
      },
      userGrowth: {
        newUsers30d,
        returningUsers,
        retentionRate: newUsers30d > 0 ? (returningUsers / newUsers30d) * 100 : 0
      },
      topContributors: {
        donors: topDonors,
        recipients: topRecipients
      }
    };

    return ok(res, engagement, 'User engagement metrics retrieved successfully');
  } catch (error) {
    console.error('Get user engagement error:', error);
    return fail(res, 'Failed to get user engagement metrics', 500);
  }
});

// @desc    Get matching efficiency metrics
// @route   GET /api/analytics/matching/efficiency
// @access  Private (Admin)
router.get('/matching/efficiency', protect, restrictTo('admin'), async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalMatches,
      completedMatches,
      avgMatchTime,
      matchesByCategory,
      recentMatches
    ] = await Promise.all([
      Match.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Match.countDocuments({ 
        status: 'completed',
        createdAt: { $gte: thirtyDaysAgo }
      }),
      Match.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: null,
            avgTime: { 
              $avg: { 
                $subtract: ['$completedAt', '$createdAt'] 
              }
            }
          }
        }
      ]),
      Match.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $lookup: {
            from: 'donations',
            localField: 'donation',
            foreignField: '_id',
            as: 'donationInfo'
          }
        },
        { $unwind: '$donationInfo' },
        {
          $group: {
            _id: '$donationInfo.category',
            count: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Match.find({ createdAt: { $gte: thirtyDaysAgo } })
        .populate('donation', 'title category')
        .populate('request', 'title')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    const efficiency = {
      overview: {
        totalMatches,
        completedMatches,
        completionRate: totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0,
        avgMatchTime: avgMatchTime.length > 0 ? avgMatchTime[0].avgTime / (1000 * 60 * 60) : 0 // Convert to hours
      },
      byCategory: matchesByCategory,
      recentActivity: recentMatches
    };

    return ok(res, efficiency, 'Matching efficiency metrics retrieved successfully');
  } catch (error) {
    console.error('Get matching efficiency error:', error);
    return fail(res, 'Failed to get matching efficiency metrics', 500);
  }
});

export default router;