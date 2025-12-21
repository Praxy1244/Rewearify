// backend/src/services/donorMetricsService.js
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import Request from '../models/Request.js';

/**
 * Calculate comprehensive donor metrics for fraud detection AI
 * @param {String} donorId - Donor's user ID
 * @returns {Object} Metrics object with 12 features for fraud model
 */
export async function calculateDonorMetrics(donorId) {
  try {
    // Get donor
    const donor = await User.findById(donorId);
    if (!donor) {
      console.warn(`Donor ${donorId} not found, using defaults`);
      return getDefaultMetrics();
    }

    // Get all donations by this donor
    const donations = await Donation.find({ donor: donorId }).sort({ createdAt: -1 });
    
    const totalDonations = donations.length;
    
    // If no history, return safe defaults
    if (totalDonations === 0) {
      console.log(`New donor ${donorId}, using default metrics`);
      return getDefaultMetrics();
    }

    // Calculate status-based metrics
    const completedDonations = donations.filter(d => d.status === 'completed').length;
    const rejectedDonations = donations.filter(d => d.status === 'rejected').length;
    const flaggedCount = donations.filter(d => d.isFlagged === true).length;
    const approvedDonations = donations.filter(d => 
      ['approved', 'matched', 'completed'].includes(d.status)
    ).length;

    // 1. DONOR RELIABILITY (0-1 scale)
    const donorReliability = calculateReliabilityScore(donations, donor, {
      completed: completedDonations,
      rejected: rejectedDonations,
      flagged: flaggedCount,
      approved: approvedDonations,
      total: totalDonations
    });

    // 2. PAST DONATIONS COUNT
    const pastDonations = totalDonations;

    // 3. FLAGGED STATUS (0 or 1)
    const flagged = flaggedCount > 0 ? 1 : 0;

    // 4. AVERAGE FEEDBACK SCORE (1-5 scale)
    const feedbackMean = calculateAverageFeedback(donations);

    // 5. FULFILLMENT RATE (0-1)
    const fulfillmentRate = totalDonations > 0 
      ? completedDonations / totalDonations 
      : 1.0;

    // 6. AVERAGE QUANTITY CLAIMED
    const avgQuantityClaimed = totalDonations > 0
      ? donations.reduce((sum, d) => sum + (d.quantity || 0), 0) / totalDonations
      : 0;

    // 7. AVERAGE QUANTITY RECEIVED RATIO (0-1)
    const avgQuantityReceivedRatio = calculateReceivedRatio(donations);

    // 8. AVERAGE FULFILLMENT DELAY (in days)
    const avgFulfillmentDelay = calculateAvgDelay(donations);

    // 9. NUMBER OF MANUAL REJECTIONS
    const numManualRejects = rejectedDonations;

    // Return all 12 features (last 3 will be added per donation)
    const metrics = {
      DonorReliability: donorReliability,
      Past_Donations: pastDonations,
      Flagged: flagged,
      Feedback_mean: feedbackMean,
      Fulfillment_Rate: fulfillmentRate,
      Avg_Quantity_Claimed: avgQuantityClaimed,
      Avg_Quantity_Received_ratio: avgQuantityReceivedRatio,
      Avg_Fulfillment_Delay: avgFulfillmentDelay,
      Num_ManualRejects: numManualRejects,
      
      // These 3 will be added per donation in the route:
      // Condition_New: (set based on current donation condition)
      // Proof_Provided: (set based on current donation images)
      // Quantity: (set based on current donation quantity)
    };

    console.log(`📊 Metrics for donor ${donor.name}:`, {
      reliability: donorReliability.toFixed(2),
      pastDonations,
      fulfillmentRate: (fulfillmentRate * 100).toFixed(0) + '%'
    });

    return metrics;

  } catch (error) {
    console.error('Error calculating donor metrics:', error);
    return getDefaultMetrics();
  }
}

/**
 * Calculate donor reliability score (0-1)
 */
function calculateReliabilityScore(donations, donor, stats) {
  if (stats.total === 0) return 0.8; // New donor benefit
  
  let score = 0.5; // Base score
  
  // ✅ POSITIVE FACTORS
  // Has completed donations
  if (stats.completed > 0) score += 0.15;
  if (stats.completed > 5) score += 0.1;
  if (stats.completed > 10) score += 0.1;
  
  // High approval rate
  const approvalRate = stats.approved / stats.total;
  if (approvalRate > 0.8) score += 0.15;
  else if (approvalRate > 0.6) score += 0.08;
  
  // High fulfillment rate
  const fulfillmentRate = stats.completed / stats.total;
  if (fulfillmentRate > 0.7) score += 0.1;
  
  // User verification
  if (donor.verification?.isEmailVerified) score += 0.05;
  if (donor.verification?.isPhoneVerified) score += 0.05;
  
  // User rating (if exists)
  if (donor.statistics?.rating > 4) score += 0.1;
  else if (donor.statistics?.rating > 3.5) score += 0.05;
  
  // ❌ NEGATIVE FACTORS
  // Has flagged donations
  if (stats.flagged > 0) score -= 0.25;
  if (stats.flagged > 2) score -= 0.15;
  
  // High rejection rate
  const rejectionRate = stats.rejected / stats.total;
  if (rejectionRate > 0.3) score -= 0.2;
  else if (rejectionRate > 0.15) score -= 0.1;
  
  // Account status issues
  if (donor.status !== 'active') score -= 0.3;
  
  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate average feedback rating (1-5)
 */
function calculateAverageFeedback(donations) {
  const completedWithFeedback = donations.filter(d => 
    d.status === 'completed' && 
    d.completion?.feedback?.rating
  );
  
  if (completedWithFeedback.length === 0) {
    return 4.0; // Default good rating for donors without feedback
  }
  
  const totalRating = completedWithFeedback.reduce((sum, d) => 
    sum + d.completion.feedback.rating, 0
  );
  
  return totalRating / completedWithFeedback.length;
}

/**
 * Calculate average quantity received ratio (0-1)
 * Represents: actual_quantity_received / claimed_quantity
 */
function calculateReceivedRatio(donations) {
  const completed = donations.filter(d => d.status === 'completed');
  
  if (completed.length === 0) {
    return 1.0; // Assume perfect for new donors
  }
  
  // TODO: Once you track actual received quantities, calculate real ratio
  // For now, use heuristic based on completion status
  
  // If donor completes donations, assume high received ratio
  const hasGoodHistory = completed.length > 3;
  return hasGoodHistory ? 0.95 : 0.90;
}

/**
 * Calculate average fulfillment delay in days
 * Time from donation creation to completion
 */
function calculateAvgDelay(donations) {
  const completed = donations.filter(d => 
    d.status === 'completed' && 
    d.completedAt
  );
  
  if (completed.length === 0) {
    return 7; // Default 7 days for new donors
  }
  
  const delays = completed.map(d => {
    const created = new Date(d.createdAt);
    const completedDate = new Date(d.completedAt);
    return (completedDate - created) / (1000 * 60 * 60 * 24); // Convert to days
  });
  
  const avgDelay = delays.reduce((sum, d) => sum + d, 0) / delays.length;
  
  return avgDelay;
}

/**
 * Get default metrics for new donors (benefit of doubt)
 */
function getDefaultMetrics() {
  return {
    DonorReliability: 0.75,        // Moderate-high for new users
    Past_Donations: 0,             // No history
    Flagged: 0,                    // Not flagged
    Feedback_mean: 4.0,            // Assume good
    Fulfillment_Rate: 1.0,         // Perfect (no history to judge)
    Avg_Quantity_Claimed: 0,       // No history
    Avg_Quantity_Received_ratio: 1.0,  // Perfect (no history)
    Avg_Fulfillment_Delay: 7,      // Assume 7 days
    Num_ManualRejects: 0,          // No rejections
  };
}

export default {
  calculateDonorMetrics
};
