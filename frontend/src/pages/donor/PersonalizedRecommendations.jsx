import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Heart,
  MapPin,
  Star,
  TrendingUp,
  Award,
  ArrowRight,
  Sparkles,
  Target,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const PersonalizedRecommendations = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendationMethod, setRecommendationMethod] = useState('');
  const [donorProfile, setDonorProfile] = useState(null);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchRecommendations();
    fetchDonorProfile();
  }, [limit]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recommendations?limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setRecommendations(response.data.data.recommendations || []);
        setRecommendationMethod(response.data.data.method || 'hybrid');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load personalized recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchDonorProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/recommendations/profile`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setDonorProfile(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching donor profile:', err);
    }
  };

  const handleDonateToNGO = (ngoId) => {
    navigate(`/donate?ngo=${ngoId}`);
  };

  const handleViewNGO = (ngoId) => {
    // Navigate to NGO details page (implement based on your routing)
    console.log('View NGO:', ngoId);
  };

  const getMethodBadge = () => {
    const badges = {
      hybrid: { text: '🎯 AI Powered', color: 'bg-purple-100 text-purple-700' },
      collaborative: { text: '👥 Community Based', color: 'bg-blue-100 text-blue-700' },
      content: { text: '📊 Profile Based', color: 'bg-green-100 text-green-700' },
      popular: { text: '⭐ Popular Choices', color: 'bg-yellow-100 text-yellow-700' }
    };
    return badges[recommendationMethod] || badges.popular;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded-lg w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-purple-600" />
                <h1 className="text-4xl font-bold text-gray-900">
                  Personalized For You
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                NGOs matched to your donation preferences and impact goals
              </p>
            </div>
            <button
              onClick={fetchRecommendations}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Method Badge */}
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 rounded-full font-semibold ${getMethodBadge().color}`}>
              {getMethodBadge().text}
            </span>
            <span className="text-sm text-gray-500">
              {recommendations.length} recommendations found
            </span>
          </div>

          {/* Donor Profile Insights */}
          {donorProfile && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                <div className="text-sm text-blue-700 font-semibold mb-1">Total Donations</div>
                <div className="text-2xl font-bold text-blue-900">
                  {donorProfile.total_donations || 0}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                <div className="text-sm text-green-700 font-semibold mb-1">Favorite Category</div>
                <div className="text-2xl font-bold text-green-900">
                  {donorProfile.top_categories?.[0] || 'N/A'}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                <div className="text-sm text-purple-700 font-semibold mb-1">Impact Score</div>
                <div className="text-2xl font-bold text-purple-900">
                  {donorProfile.avg_impact_score?.toFixed(1) || 'N/A'}
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                <div className="text-sm text-orange-700 font-semibold mb-1">Active NGOs</div>
                <div className="text-2xl font-bold text-orange-900">
                  {donorProfile.unique_ngos || 0}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Recommendations Grid */}
        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((ngo, index) => (
              <div
                key={ngo._id || index}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-white">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      <span className="text-sm font-semibold">
                        {(ngo.match_score * 100 || ngo.score * 100 || 0).toFixed(0)}% Match
                      </span>
                    </div>
                    {index < 3 && (
                      <Award className="w-5 h-5 text-yellow-300" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1">{ngo.name}</h3>
                  <div className="flex items-center gap-1 text-sm opacity-90">
                    <MapPin className="w-4 h-4" />
                    <span>{ngo.city || ngo.location}</span>
                    {ngo.distance && (
                      <span className="ml-2">• {ngo.distance.toFixed(1)} km away</span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  {/* Scores */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-blue-700 text-sm mb-1">
                        <Star className="w-4 h-4" />
                        <span className="font-semibold">Trust Score</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        {(ngo.trust_score || 4.5).toFixed(1)}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-700 text-sm mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-semibold">Impact Score</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        {(ngo.impact_score || 4.0).toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* Match Reasons */}
                  {ngo.match_reasons && ngo.match_reasons.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        Why this match?
                      </h4>
                      <ul className="space-y-1">
                        {ngo.match_reasons.slice(0, 3).map((reason, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-purple-500 mt-1">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleDonateToNGO(ngo._id)}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition flex items-center justify-center gap-2"
                    >
                      Donate Now
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleViewNGO(ngo._id)}
                      className="px-4 py-2.5 border-2 border-purple-200 text-purple-700 rounded-lg font-semibold hover:bg-purple-50 transition"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Building Your Profile
              </h3>
              <p className="text-gray-600 mb-6">
                Make your first donation to help us personalize NGO recommendations for you!
              </p>
              <button
                onClick={() => navigate('/donate')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition"
              >
                Make Your First Donation
              </button>
            </div>
          </div>
        )}

        {/* Load More */}
        {recommendations.length >= limit && (
          <div className="text-center mt-8">
            <button
              onClick={() => setLimit(limit + 10)}
              className="px-6 py-3 bg-white text-purple-700 border-2 border-purple-200 rounded-lg font-semibold hover:bg-purple-50 transition"
            >
              Load More Recommendations
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizedRecommendations;
