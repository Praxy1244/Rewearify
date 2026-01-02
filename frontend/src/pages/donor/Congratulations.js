import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Heart, Award, TrendingUp, Users, Package, ArrowLeft, Share2, Download } from 'lucide-react';
import api from '../../lib/api';
import AchievementBadge from '../../components/AchievementBadge';

const Congratulations = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCongratulationsData();
  }, [requestId]);

  const fetchCongratulationsData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/requests/${requestId}/congratulations`);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching congratulations:', err);
      setError(err.response?.data?.message || 'Failed to load congratulations data');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your impact report...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load congratulations data'}</p>
          <button
            onClick={() => navigate('/donor/dashboard')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { request, recipient, donation, feedback, impact, donorStats, achievements } = data;
  
  // Filter out new achievements (earned today)
  const newAchievements = achievements.filter(a => {
    const earnedDate = new Date(a.earnedAt);
    const today = new Date();
    return earnedDate.toDateString() === today.toDateString();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/donor/dashboard')}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Confetti Animation */}
        <div className="text-center mb-8 animate-bounce">
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Congratulations!
          </h1>
          <p className="text-xl text-gray-700">You've Made a Real Difference!</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-6">
          {/* Rating Section */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-8 text-center border-b-4 border-yellow-200">
            <div className="mb-4">
              {renderStars(feedback.rating)}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              {feedback.rating}.0 / 5.0 Rating
            </h2>
            <p className="text-gray-700 flex items-center justify-center gap-2">
              <span>From</span>
              <span className="font-semibold">{recipient.name}</span>
              {recipient.organization && (
                <span className="text-sm text-gray-600">({recipient.organization})</span>
              )}
            </p>
          </div>

          {/* Feedback Comment */}
          {feedback.comment && (
            <div className="p-8 bg-gray-50 border-l-4 border-purple-500">
              <div className="flex items-start gap-3">
                <div className="text-3xl">💬</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Recipient's Feedback:</h3>
                  <p className="text-gray-700 italic leading-relaxed">"{feedback.comment}"</p>
                </div>
              </div>
            </div>
          )}

          {/* Impact Summary */}
          <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-50">
            <h3 className="text-2xl font-bold text-green-800 mb-6 text-center">📊 Impact Summary</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 text-center shadow-md">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {impact.beneficiariesHelped || 0}
                </div>
                <p className="text-gray-700 font-medium">Lives Touched</p>
              </div>
              
              {impact.impactStory && (
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <p className="text-sm text-gray-600 mb-2">📖 Impact Story:</p>
                  <p className="text-gray-800 text-sm leading-relaxed">{impact.impactStory}</p>
                </div>
              )}
            </div>
          </div>

          {/* Lifetime Stats */}
          <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
            <h3 className="text-2xl font-bold text-blue-800 mb-6 text-center flex items-center justify-center gap-2">
              <Award className="w-6 h-6" />
              Your Lifetime Impact
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 text-center shadow-md">
                <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-blue-600">{donorStats.completedDonations}</div>
                <p className="text-sm text-gray-600 mt-1">Total Donations</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 text-center shadow-md">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-purple-600">{donorStats.totalBeneficiariesHelped}</div>
                <p className="text-sm text-gray-600 mt-1">Lives Helped</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 text-center shadow-md">
                <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-yellow-600">{donorStats.rating.toFixed(1)}</div>
                <p className="text-sm text-gray-600 mt-1">Avg Rating</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 text-center shadow-md">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-green-600">{donorStats.totalRatings}</div>
                <p className="text-sm text-gray-600 mt-1">Total Ratings</p>
              </div>
            </div>
          </div>

          {/* New Achievements */}
          {newAchievements.length > 0 && (
            <div className="p-8 bg-gradient-to-br from-amber-50 to-yellow-50">
              <h3 className="text-2xl font-bold text-amber-800 mb-6 text-center flex items-center justify-center gap-2">
                🎖️ New Achievements Unlocked!
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {newAchievements.map((achievement, index) => (
                  <AchievementBadge key={index} achievement={achievement} size="md" />
                ))}
              </div>
            </div>
          )}

          {/* All Achievements */}
          {achievements.length > 0 && (
            <div className="p-8 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">🏆 All Your Achievements</h3>
              <div className="grid md:grid-cols-3 gap-3">
                {achievements.map((achievement, index) => (
                  <AchievementBadge key={index} achievement={achievement} size="sm" showDetails={false} />
                ))}
              </div>
            </div>
          )}

          {/* Closing Message */}
          <div className="p-8 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <Heart className="w-12 h-12 mx-auto mb-4 animate-pulse" />
            <h3 className="text-2xl font-bold mb-2">Thank You for Your Generosity!</h3>
            <p className="text-lg opacity-90 mb-6">
              Your donation is changing lives and creating a better world.
            </p>
            <p className="text-sm opacity-80">Keep making a difference! Every donation matters. 💙</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => navigate('/donor/dashboard')}
            className="bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Package className="w-5 h-5" />
            View My Donations
          </button>
          
          <button
            onClick={() => navigate('/donor/achievements')}
            className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 border-2 border-purple-600"
          >
            <Award className="w-5 h-5" />
            View All Achievements
          </button>
        </div>
      </div>
    </div>
  );
};

export default Congratulations;
