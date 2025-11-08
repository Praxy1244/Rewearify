import express from 'express';
import Donation from '../models/Donation.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { ok, fail, created, paginated } from '../utils/response.js';
import { protect, restrictTo, adminOrOwner } from '../middleware/auth.js';
import { donationValidations, searchValidations, handleValidationErrors } from '../utils/validation.js';
import axios from 'axios';

const router = express.Router();

// @desc    Get all donations with filters and search
// @route   GET /api/donations
// @access  Public
router.get('/', searchValidations.donations, handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      condition,
      location,
      radius = 25,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status = 'approved',
      urgent,
      search
    } = req.query;

    // Build query
    let query = { status };
    
    if (category) query.category = category;
    if (condition) query.condition = { $in: condition.split(',') };
    if (urgent === 'true') query['preferences.urgentNeeded'] = true;
    
    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Location-based search
    if (location && req.query.lat && req.query.lng) {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const donations = await Donation.find(query)
    .sort(sortObj)
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Donation.countDocuments(query);

    return paginated(res, donations, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }, 'Donations retrieved successfully');
  } catch (error) {
    console.error('Get donations error:', error);
    return fail(res, 'Failed to get donations', 500);
  }
});

// @desc    Get single donation
// @route   GET /api/donations/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      

    if (!donation) {
      return fail(res, 'Donation not found', 404);
    }

    // Increment view count if not the owner
    if (!req.user || req.user.id !== donation.donor._id.toString()) {
      await donation.incrementViews();
    }

    return ok(res, { donation }, 'Donation retrieved successfully');
  } catch (error) {
    console.error('Get donation error:', error);
    return fail(res, 'Failed to get donation', 500);
  }
});

// @desc    Create new donation
// @route   POST /api/donations
// @access  Private (Donor)
router.post('/', 
  protect, 
  restrictTo('donor'), 
  donationValidations.create, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const donationData = {
        ...req.body,
        donor: req.user.id
      };

      // Wrap AI call in try/catch so it doesn't crash
      try {
        const aiAnalysis = await getAIAnalysis(donationData);
        donationData.aiAnalysis = aiAnalysis;
      } catch (aiError) {
        console.error('AI analysis error (non-blocking):', aiError.message);
        // Continue without AI analysis
      }

      // Create donation
      const donation = await Donation.create(donationData);

      // Update user statistics
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'statistics.totalDonations': 1 }
      });

      // --- FIX: Notify all admins ---
      // 1. Find all admin users
      const admins = await User.find({ role: 'admin' });

      // 2. Create a notification for each admin
      const adminNotifications = admins.map(admin => ({
        recipient: admin._id, // <-- FIX 1: Set a real user ID
        type: 'new_donation_pending', // <-- FIX 2: Now valid
        title: 'New Donation Pending Review',
        message: `New donation "${donation.title}" submitted by ${req.user.name}`,
        data: {
          donationId: donation._id,
          actionUrl: `/admin/donations`
        },
        channels: { inApp: true }
      }));
      
      // 3. Insert all notifications
      if (adminNotifications.length > 0) {
        await Notification.insertMany(adminNotifications);
      }
      // --- END OF FIX ---

      return created(res, { donation }, 'Donation created successfully');
    } catch (error) {
      console.error('Create donation error:', error);
      return fail(res, 'Failed to create donation', 500);
    }
  }
);

// @desc    Update donation
// @route   PUT /api/donations/:id
// @access  Private (Owner or Admin)
router.put('/:id', 
  protect, 
  donationValidations.update, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const donation = await Donation.findById(req.params.id);
      
      if (!donation) {
        return fail(res, 'Donation not found', 404);
      }

      // Check ownership or admin
      if (req.user.role !== 'admin' && donation.donor._id.toString() !== req.user.id) {
        return fail(res, 'Not authorized to update this donation', 403);
      }

      // Only allow updates if donation is in draft or pending status
      if (!['draft', 'pending'].includes(donation.status) && req.user.role !== 'admin') {
        return fail(res, 'Cannot update donation in current status', 400);
      }

      // Update donation
      const updatedDonation = await Donation.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      return ok(res, { donation: updatedDonation }, 'Donation updated successfully');
    } catch (error) {
      console.error('Update donation error:', error);
      return fail(res, 'Failed to update donation', 500);
    }
  }
);

// @desc    Delete donation
// @route   DELETE /api/donations/:id
// @access  Private (Owner or Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return fail(res, 'Donation not found', 404);
    }

    // Check ownership or admin
    if (req.user.role !== 'admin' && donation.donor._id.toString() !== req.user.id) {
      return fail(res, 'Not authorized to delete this donation', 403);
    }

    // Only allow deletion if not matched or completed
    if (['matched', 'completed'].includes(donation.status)) {
      return fail(res, 'Cannot delete donation that is matched or completed', 400);
    }

    // Delete donation
    await Donation.findByIdAndDelete(req.params.id);

    // Update user statistics
    await User.findByIdAndUpdate(donation.donor._id, {
      $inc: { 'statistics.totalDonations': -1 }
    });

    return ok(res, null, 'Donation deleted successfully');
  } catch (error) {
    console.error('Delete donation error:', error);
    return fail(res, 'Failed to delete donation', 500);
  }
});

// @desc    Get user's donations
// @route   GET /api/donations/user/:userId
// @access  Private (Owner or Admin)
router.get('/user/:userId', protect, adminOrOwner('userId'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let query = { donor: req.params.userId };
    if (status) query.status = status;

    const donations = await Donation.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments(query);

    return paginated(res, donations, {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }, 'User donations retrieved successfully');
  } catch (error) {
    console.error('Get user donations error:', error);
    return fail(res, 'Failed to get user donations', 500);
  }
});

// Helper function to get AI analysis (without images)
async function getAIAnalysis(donationData) {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    const response = await axios.post(`${aiServiceUrl}/analyze-donation`, {
      title: donationData.title,
      description: donationData.description,
      category: donationData.category,
      condition: donationData.condition
    }, {
      timeout: 10000 // 10 second timeout
    });

    return response.data;
  } catch (error) {
    // This will be caught by the route handler
    console.error('AI service error:', error.message);
    throw error;
  }
}

export default router;