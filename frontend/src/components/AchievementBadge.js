import React from 'react';

const AchievementBadge = ({ achievement, size = 'md', showDetails = true }) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-2xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-24 h-24 text-5xl'
  };

  const containerSizeClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <div className={`flex items-center gap-3 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl ${containerSizeClasses[size]} hover:shadow-lg transition-all duration-300 hover:scale-105`}>
      <div className={`${sizeClasses[size]} flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-400 rounded-full shadow-md`}>
        <span className="drop-shadow-sm">{achievement.icon}</span>
      </div>
      {showDetails && (
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 text-sm md:text-base">{achievement.title}</h4>
          <p className="text-xs md:text-sm text-gray-600">{achievement.description}</p>
          {achievement.earnedAt && (
            <p className="text-xs text-gray-500 mt-1">
              Earned {new Date(achievement.earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AchievementBadge;
