import React from 'react';

const AchievementProgress = ({ progress }) => {
  const getProgressColor = (percent) => {
    if (percent >= 100) return 'bg-green-500';
    if (percent >= 75) return 'bg-blue-500';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getProgressBgColor = (percent) => {
    if (percent >= 100) return 'bg-green-100';
    if (percent >= 75) return 'bg-blue-100';
    if (percent >= 50) return 'bg-yellow-100';
    return 'bg-gray-100';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Achievement Progress</h3>
      <div className="space-y-3">
        {progress.map((item, index) => (
          <div key={index} className={`p-4 rounded-lg border ${item.earned ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                  <p className="text-xs text-gray-600">{item.description}</p>
                </div>
              </div>
              {item.earned && (
                <span className="text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded-full">
                  ✓ Earned
                </span>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <div className={`flex-1 h-2 rounded-full overflow-hidden ${getProgressBgColor(item.progress)}`}>
                <div 
                  className={`h-full ${getProgressColor(item.progress)} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(item.progress, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 min-w-[60px] text-right">
                {item.current}/{item.target}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementProgress;
