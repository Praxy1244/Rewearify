// Achievement definitions and checking logic

export const ACHIEVEMENTS = {
  FIRST_DONATION: {
    type: 'first_donation',
    title: 'First Steps',
    description: 'Completed your first donation',
    icon: '🌟',
    condition: (stats) => stats.completedDonations === 1
  },
  GENEROUS_GIVER: {
    type: 'generous_giver',
    title: 'Generous Giver',
    description: 'Completed 5 successful donations',
    icon: '💝',
    condition: (stats) => stats.completedDonations === 5
  },
  SUPER_DONOR: {
    type: 'super_donor',
    title: 'Super Donor',
    description: 'Completed 10 successful donations',
    icon: '🦸',
    condition: (stats) => stats.completedDonations === 10
  },
  VETERAN_DONOR: {
    type: 'veteran_donor',
    title: 'Veteran Donor',
    description: 'Completed 25+ successful donations',
    icon: '🏅',
    condition: (stats) => stats.completedDonations === 25
  },
  FIVE_STAR: {
    type: 'five_star',
    title: 'Five Star Champion',
    description: 'Achieved a 5.0 average rating',
    icon: '⭐',
    condition: (stats) => stats.rating === 5 && stats.totalRatings >= 3
  },
  HUNDRED_LIVES: {
    type: 'hundred_lives',
    title: 'Century of Impact',
    description: 'Helped 100+ beneficiaries',
    icon: '🎯',
    condition: (stats) => stats.totalBeneficiariesHelped >= 100
  },
  COMMUNITY_HERO: {
    type: 'community_hero',
    title: 'Community Hero',
    description: 'Helped 50+ beneficiaries',
    icon: '🦸‍♂️',
    condition: (stats) => stats.totalBeneficiariesHelped >= 50
  }
};

/**
 * Check if user has earned any new achievements
 * @param {Object} user - User document
 * @param {Object} updatedStats - New statistics after current donation
 * @returns {Array} Array of newly earned achievements
 */
export const checkNewAchievements = (user, updatedStats) => {
  const existingAchievements = new Set(
    (user.achievements || []).map(a => a.type)
  );
  
  const newAchievements = [];
  
  for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
    // Skip if already earned
    if (existingAchievements.has(achievement.type)) {
      continue;
    }
    
    // Check if condition is met
    if (achievement.condition(updatedStats)) {
      newAchievements.push({
        type: achievement.type,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        earnedAt: new Date()
      });
    }
  }
  
  return newAchievements;
};

/**
 * Get achievement progress for a user
 * @param {Object} stats - User statistics
 * @returns {Array} Array of achievement progress
 */
export const getAchievementProgress = (stats) => {
  return Object.entries(ACHIEVEMENTS).map(([key, achievement]) => {
    let progress = 0;
    let target = 0;
    let current = 0;
    
    // Calculate progress based on achievement type
    switch(achievement.type) {
      case 'first_donation':
        target = 1;
        current = Math.min(stats.completedDonations, target);
        break;
      case 'generous_giver':
        target = 5;
        current = Math.min(stats.completedDonations, target);
        break;
      case 'super_donor':
        target = 10;
        current = Math.min(stats.completedDonations, target);
        break;
      case 'veteran_donor':
        target = 25;
        current = Math.min(stats.completedDonations, target);
        break;
      case 'five_star':
        target = 5;
        current = stats.rating;
        break;
      case 'community_hero':
        target = 50;
        current = Math.min(stats.totalBeneficiariesHelped, target);
        break;
      case 'hundred_lives':
        target = 100;
        current = Math.min(stats.totalBeneficiariesHelped, target);
        break;
      default:
        target = 1;
        current = 0;
    }
    
    progress = target > 0 ? (current / target) * 100 : 0;
    
    return {
      type: achievement.type,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      progress: Math.min(progress, 100),
      current,
      target,
      earned: progress >= 100
    };
  });
};

export default {
  ACHIEVEMENTS,
  checkNewAchievements,
  getAchievementProgress
};
