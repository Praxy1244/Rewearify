import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, TrendingUp, Users, Package, Star, ArrowLeft } from 'lucide-react';
import api from '../../lib/api';
import AchievementBadge from '../../components/AchievementBadge';
import AchievementProgress from '../../components/AchievementProgress';
import { useAuth } from '../../contexts/AuthContext';

const Achievements = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${user.id}/achievements`);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError(err.response?.data?.message || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load achievements'}</p>
          <button
            onClick={() => navigate('/donor-dashboard')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { statistics, achievements, progress } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/donor-dashboard')}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Achievements</h1>
          <p className="text-gray-600 text-lg">Track your impact and unlock new milestones!</p>
        </div>

        {/* Statistics Overview */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            Your Impact Stats
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <Package className="w-10 h-10 text-blue-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-blue-600">{statistics.completedDonations || 0}</div>
              <p className="text-sm text-gray-700 mt-1 font-medium">Completed Donations</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <Users className="w-10 h-10 text-purple-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-purple-600">{statistics.totalBeneficiariesHelped || 0}</div>
              <p className="text-sm text-gray-700 mt-1 font-medium">Lives Helped</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
              <Star className="w-10 h-10 text-yellow-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-yellow-600">{statistics.rating?.toFixed(1) || '0.0'}</div>
              <p className="text-sm text-gray-700 mt-1 font-medium">Average Rating</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <Award className="w-10 h-10 text-green-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-600">{achievements?.length || 0}</div>
              <p className="text-sm text-gray-700 mt-1 font-medium">Achievements Earned</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Earned Achievements */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-purple-600" />
              Earned Achievements ({achievements?.length || 0})
            </h2>
            
            {achievements && achievements.length > 0 ? (
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <AchievementBadge key={index} achievement={achievement} size="md" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>No achievements earned yet.</p>
                <p className="text-sm mt-2">Complete donations to unlock achievements!</p>
              </div>
            )}
          </div>

          {/* Achievement Progress */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {progress && progress.length > 0 && (
              <AchievementProgress progress={progress} />
            )}
          </div>
        </div>

        {/* Motivational Message */}
        <div className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white text-center">
          <div className="text-5xl mb-4">💪</div>
          <h3 className="text-2xl font-bold mb-2">Keep Up The Amazing Work!</h3>
          <p className="text-lg opacity-90">
            Every donation brings you closer to new achievements and makes a real difference in people's lives.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Achievements;
