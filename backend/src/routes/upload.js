import express from 'express';
import { uploadProfile, deleteFromCloudinary } from '../config/cloudinary.js';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Upload/Update profile picture
router.post('/profile-picture', protect, uploadProfile.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }

    // Get user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Delete old profile picture from Cloudinary if exists
    if (user.profile.profilePicture.publicId) {
      await deleteFromCloudinary(user.profile.profilePicture.publicId);
    }

    // Update user with new profile picture
    user.profile.profilePicture = {
      url: req.file.path,
      publicId: req.file.filename
    };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        url: req.file.path,
        publicId: req.file.filename
      }
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload profile picture',
      error: error.message 
    });
  }
});

// Delete profile picture
router.delete('/profile-picture', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Delete from Cloudinary
    if (user.profile.profilePicture.publicId) {
      await deleteFromCloudinary(user.profile.profilePicture.publicId);
    }

    // Clear from database
    user.profile.profilePicture = {
      url: '',
      publicId: ''
    };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture deleted successfully'
    });
  } catch (error) {
    console.error('Profile picture delete error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete profile picture',
      error: error.message 
    });
  }
});

export default router;
