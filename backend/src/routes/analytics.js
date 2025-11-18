import express from 'express';
import { protectedRoute, adminRoute } from '../middleware/auth.js';
import Donation from '../models/Donation.js';
import Request from '../models/Request.js';
import User from '../models/User.js';

const router = express.Router();

// @desc    Get Admin Analytics Dashboard Data
// @route   GET /api/analytics/dashboard
// @access  Admin
router.get('/dashboard', protectedRoute, adminRoute, async (req, res) => {
  try {
    // 1. Fetch Basic Counts from Database
    const totalDonations = await Donation.countDocuments();
    const totalRequests = await Request.countDocuments();
    const totalUsers = await User.countDocuments();
    
    const pendingDonations = await Donation.countDocuments({ status: 'pending' });
    const completedDonations = await Donation.countDocuments({ status: 'completed' });

    // 2. Calculate Monthly Activity (Simple Aggregation)
    // This groups donations by month for a basic trend chart
    const monthlyStats = await Donation.aggregate([
      {
        $match: {
          createdAt: { 
            $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) 
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Format data for the frontend chart
    const chartData = monthlyStats.map(item => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return {
            name: months[item._id - 1],
            value: item.count
        };
    });

    // 3. Return Combined Data
    res.json({
      stats: {
        donations: totalDonations,
        requests: totalRequests,
        users: totalUsers,
        pending: pendingDonations,
        completed: completedDonations
      },
      trends: chartData
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;