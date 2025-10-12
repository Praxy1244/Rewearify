import User from '../models/User.js';
import Donation from '../models/Donation.js';
import Request from '../models/Request.js';
import ResetToken from '../models/ResetToken.js';
import Notification from '../models/Notification.js';
import { sendTemplateEmail } from './email.js';

// Clean up expired tokens
export const cleanupExpiredTokens = async () => {
  try {
    console.log('🧹 Starting cleanup of expired tokens...');
    
    const result = await ResetToken.cleanupExpired();
    console.log(`✅ Cleaned up ${result.deletedCount} expired tokens`);
    
    return result;
  } catch (error) {
    console.error('❌ Error cleaning up expired tokens:', error);
    throw error;
  }
};

// Update donation statuses
export const updateDonationStatuses = async () => {
  try {
    console.log('📦 Starting donation status updates...');
    
    // Mark expired donations
    const expiredDonations = await Donation.updateMany(
      {
        expiresAt: { $lt: new Date() },
        status: { $in: ['pending', 'approved'] }
      },
      { status: 'expired' }
    );
    
    console.log(`⏰ Marked ${expiredDonations.modifiedCount} donations as expired`);
    
    // Mark expired requests
    const expiredRequests = await Request.updateMany(
      {
        expiresAt: { $lt: new Date() },
        status: 'active'
      },
      { status: 'expired' }
    );
    
    console.log(`⏰ Marked ${expiredRequests.modifiedCount} requests as expired`);
    
    return {
      expiredDonations: expiredDonations.modifiedCount,
      expiredRequests: expiredRequests.modifiedCount
    };
  } catch (error) {
    console.error('❌ Error updating donation statuses:', error);
    throw error;
  }
};

// Clean up old notifications
export const cleanupOldNotifications = async () => {
  try {
    console.log('🔔 Starting cleanup of old notifications...');
    
    // Delete notifications older than 30 days
    const result = await Notification.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    console.log(`✅ Cleaned up ${result.deletedCount} old notifications`);
    
    return result;
  } catch (error) {
    console.error('❌ Error cleaning up old notifications:', error);
    throw error;
  }
};

// Send reminder emails for pending donations
export const sendPendingDonationReminders = async () => {
  try {
    console.log('📧 Starting pending donation reminders...');
    
    // Find donations pending for more than 3 days
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    
    const pendingDonations = await Donation.find({
      status: 'pending',
      createdAt: { $lt: threeDaysAgo },
      'reminderSent': { $ne: true }
    }).populate('donor', 'name email');
    
    let remindersSent = 0;
    
    for (const donation of pendingDonations) {
      try {
        await sendTemplateEmail(
          donation.donor.email,
          'donationPendingReminder',
          {
            name: donation.donor.name,
            donationTitle: donation.title,
            donationId: donation._id
          }
        );
        
        // Mark reminder as sent
        donation.reminderSent = true;
        await donation.save();
        
        remindersSent++;
      } catch (emailError) {
        console.error(`Failed to send reminder for donation ${donation._id}:`, emailError);
      }
    }
    
    console.log(`📧 Sent ${remindersSent} pending donation reminders`);
    
    return { remindersSent };
  } catch (error) {
    console.error('❌ Error sending pending donation reminders:', error);
    throw error;
  }
};

// Update user activity status
export const updateUserActivityStatus = async () => {
  try {
    console.log('👥 Starting user activity status update...');
    
    // Mark users as inactive if they haven't been active for 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const inactiveUsers = await User.updateMany(
      {
        lastActive: { $lt: thirtyDaysAgo },
        status: 'active'
      },
      { status: 'inactive' }
    );
    
    console.log(`😴 Marked ${inactiveUsers.modifiedCount} users as inactive`);
    
    return { inactiveUsers: inactiveUsers.modifiedCount };
  } catch (error) {
    console.error('❌ Error updating user activity status:', error);
    throw error;
  }
};

// Generate daily analytics report
export const generateDailyReport = async () => {
  try {
    console.log('📊 Generating daily analytics report...');
    
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    // Get daily statistics
    const stats = await Promise.all([
      // New users
      User.countDocuments({
        createdAt: { $gte: yesterday, $lt: today }
      }),
      
      // New donations
      Donation.countDocuments({
        createdAt: { $gte: yesterday, $lt: today }
      }),
      
      // New requests
      Request.countDocuments({
        createdAt: { $gte: yesterday, $lt: today }
      }),
      
      // Approved donations
      Donation.countDocuments({
        'moderation.approvedAt': { $gte: yesterday, $lt: today }
      }),
      
      // Completed matches
      Donation.countDocuments({
        'completion.completedAt': { $gte: yesterday, $lt: today }
      })
    ]);
    
    const report = {
      date: yesterday.toISOString().split('T')[0],
      newUsers: stats[0],
      newDonations: stats[1],
      newRequests: stats[2],
      approvedDonations: stats[3],
      completedMatches: stats[4]
    };
    
    console.log('📊 Daily Report:', report);
    
    // Here you could save the report to database or send to admin
    // await DailyReport.create(report);
    
    return report;
  } catch (error) {
    console.error('❌ Error generating daily report:', error);
    throw error;
  }
};

// Send weekly digest to users
export const sendWeeklyDigest = async () => {
  try {
    console.log('📧 Starting weekly digest emails...');
    
    // Get active users who opted in for email notifications
    const users = await User.find({
      status: 'active',
      'preferences.notifications.email': true,
      'verification.isEmailVerified': true
    }).select('name email role location');
    
    let digestsSent = 0;
    
    for (const user of users) {
      try {
        // Get user-specific stats for the week
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        let stats = {};
        
        if (user.role === 'donor') {
          // Get nearby requests for donors
          const nearbyRequests = await Request.countDocuments({
            status: 'active',
            'location.coordinates': {
              $near: {
                $geometry: user.location.coordinates,
                $maxDistance: 25000 // 25km
              }
            },
            createdAt: { $gte: weekAgo }
          });
          
          stats = { nearbyRequests };
        } else if (user.role === 'recipient') {
          // Get nearby donations for recipients
          const nearbyDonations = await Donation.countDocuments({
            status: 'approved',
            'location.coordinates': {
              $near: {
                $geometry: user.location.coordinates,
                $maxDistance: 25000 // 25km
              }
            },
            createdAt: { $gte: weekAgo }
          });
          
          stats = { nearbyDonations };
        }
        
        // Send digest email (you would implement the template)
        // await sendTemplateEmail(user.email, 'weeklyDigest', {
        //   name: user.name,
        //   stats
        // });
        
        digestsSent++;
      } catch (emailError) {
        console.error(`Failed to send digest to ${user.email}:`, emailError);
      }
    }
    
    console.log(`📧 Sent ${digestsSent} weekly digest emails`);
    
    return { digestsSent };
  } catch (error) {
    console.error('❌ Error sending weekly digests:', error);
    throw error;
  }
};

// Backup critical data
export const backupCriticalData = async () => {
  try {
    console.log('💾 Starting critical data backup...');
    
    // Get counts of critical collections
    const counts = await Promise.all([
      User.countDocuments(),
      Donation.countDocuments(),
      Request.countDocuments(),
      Notification.countDocuments()
    ]);
    
    const backup = {
      timestamp: new Date().toISOString(),
      collections: {
        users: counts[0],
        donations: counts[1],
        requests: counts[2],
        notifications: counts[3]
      }
    };
    
    console.log('💾 Backup summary:', backup);
    
    // Here you would implement actual backup logic
    // e.g., export to cloud storage, create database dump, etc.
    
    return backup;
  } catch (error) {
    console.error('❌ Error backing up critical data:', error);
    throw error;
  }
};

export default {
  cleanupExpiredTokens,
  updateDonationStatuses,
  cleanupOldNotifications,
  sendPendingDonationReminders,
  updateUserActivityStatus,
  generateDailyReport,
  sendWeeklyDigest,
  backupCriticalData
};