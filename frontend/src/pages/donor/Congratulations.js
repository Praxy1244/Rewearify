import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { requestService, donationService } from '../../services';
import { toast } from 'sonner';
import { Loader2, Star, Heart, Award, TrendingUp } from 'lucide-react';

const Congratulations = () => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isVoluntaryDonation, setIsVoluntaryDonation] = useState(false);

  // Get ID from params
  // NEW CODE (line 14) - Simpler since route now uses :id
const id = params.id;


  console.log('🔍 Route params:', params);
  console.log('🔍 Location:', location.pathname);
  console.log('🔍 Extracted ID:', id);

  useEffect(() => {
    if (id) {
      fetchCongratulationsData();
    } else {
      console.error('❌ No ID found in route params!');
      toast.error('No ID provided in URL');
      navigate('/donor/dashboard');
    }
  }, [id]);

 const fetchCongratulationsData = async () => {
  if (!id || id === 'undefined') {
    console.error('❌ Invalid ID:', id);
    toast.error('Invalid ID provided');
    navigate('/donor/dashboard');
    return;
  }

  try {
    setLoading(true);
    console.log('🔍 Fetching congratulations data for ID:', id);
    
    // Try fetching as REQUEST first (most common case)
    try {
      console.log('📋 Trying as REQUEST with ID:', id);
      const response = await requestService.getCongratulations(id);
      console.log('✅ Request response:', response);
      
      if (response.success) {
        setData(response.data);
        setIsVoluntaryDonation(false);
        console.log('✅ Loaded as request-based donation');
        return;
      }
    } catch (requestError) {
      console.log('❌ Not a valid request, trying as donation...', requestError.message);
    }

    // If request fails, try as DONATION (voluntary donation)
    try {
      console.log('🎁 Trying as DONATION with ID:', id);
      const response = await donationService.getCongratulations(id);
      console.log('✅ Donation response:', response);
      
      if (response.success) {
        setData(response.data);
        setIsVoluntaryDonation(response.data.isVoluntaryDonation || true);
        console.log('✅ Loaded as voluntary donation');
        return;
      }
    } catch (donationError) {
      console.error('❌ Donation fetch failed:', donationError);
    }
    
    // If both fail
    throw new Error('Failed to load congratulations data - ID not found in requests or donations');
    
  } catch (error) {
    console.error('❌ Final error:', error);
    toast.error('Unable to load congratulations data');
    // Don't redirect immediately - show error state
    setTimeout(() => {
      navigate('/donor/dashboard');
    }, 2000);
  } finally {
    setLoading(false);
  }
};


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No data available</p>
          <button
            onClick={() => navigate('/donor/dashboard')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { donation, recipient, feedback, impact, donorStats, achievements } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Main Congratulations Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8 transform hover:scale-105 transition-transform duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 p-8 text-white text-center relative overflow-hidden">
            <div className="relative z-10">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <h1 className="text-4xl font-bold mb-2">Congratulations!</h1>
              <p className="text-xl opacity-90">Your generosity made a real difference!</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Donation Info */}
            <div className="mb-8">
              <div className="flex items-start gap-6">
                {donation?.images && donation.images.length > 0 && (
                  <img 
                    src={donation.images[0].url || donation.images[0]} 
                    alt={donation.title}
                    className="w-32 h-32 object-cover rounded-lg shadow-md"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {donation?.title || 'Your Donation'}
                  </h2>
                  <div className="flex items-center gap-4 text-gray-600 mb-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {donation?.category}
                    </span>
                    <span className="text-sm">
                      Quantity: {donation?.quantity}
                    </span>
                  </div>
                  
                  {/* Recipient Info */}
                  <div className="flex items-center gap-3 mt-4">
                    {recipient?.profilePicture && (
                      <img 
                        src={recipient.profilePicture} 
                        alt={recipient.name}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{recipient?.name}</p>
                      {recipient?.organization && (
                        <p className="text-sm text-gray-600">{recipient.organization}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Section */}
            {feedback && feedback.rating > 0 && (
              <div className="bg-yellow-50 rounded-xl p-6 mb-6 border border-yellow-200">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  <h3 className="text-xl font-bold text-gray-900">Recipient Feedback</h3>
                </div>
                
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= feedback.rating
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-lg font-semibold text-gray-700">
                    {feedback.rating}/5
                  </span>
                </div>

                {feedback.comment && (
                  <p className="text-gray-700 italic">"{feedback.comment}"</p>
                )}
              </div>
            )}

            {/* Impact Section */}
            {impact && impact.beneficiariesHelped > 0 && (
              <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                  <h3 className="text-xl font-bold text-gray-900">Your Impact</h3>
                </div>
                
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {impact.beneficiariesHelped}
                  </div>
                  <div className="text-sm text-gray-600">People Helped</div>
                </div>
                
                {impact.impactStory && (
                  <div className="mt-4 bg-white rounded-lg p-4">
                    <p className="text-gray-700">{impact.impactStory}</p>
                  </div>
                )}
              </div>
            )}

            {/* Donor Statistics */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6 border border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900">Your Journey</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {donorStats?.completedDonations || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Donations</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {donorStats?.totalBeneficiariesHelped || 0}
                  </div>
                  <div className="text-sm text-gray-600">Lives Touched</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                    {donorStats?.rating?.toFixed(1) || '0.0'}
                    <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  </div>
                  <div className="text-sm text-gray-600">Avg Rating</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {achievements?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Achievements</div>
                </div>
              </div>
            </div>

            {/* New Achievements */}
            {achievements && achievements.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-6 h-6 text-orange-600" />
                  <h3 className="text-xl font-bold text-gray-900">Achievements 🏆</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.slice(-3).map((achievement, idx) => (
                    <div 
                      key={idx}
                      className="bg-white rounded-lg p-4 flex items-center gap-3"
                    >
                      <div className="text-4xl">{achievement.icon || '🏅'}</div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {achievement.name || achievement.title}
                        </div>
                        <div className="text-sm text-gray-600">
                          {achievement.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={() => navigate('/donor/my-donations')}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                View All Donations
              </button>
              <button
                onClick={() => navigate('/donor/achievements')}
                className="flex-1 bg-white border-2 border-purple-500 text-purple-600 py-3 px-6 rounded-lg font-semibold hover:bg-purple-50 transition-all"
              >
                View Achievements
              </button>
            </div>
          </div>
        </div>

        {/* Encouragement Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <p className="text-gray-700 text-lg mb-2">
            Thank you for making the world a better place! 🌍
          </p>
          <p className="text-gray-600">
            {isVoluntaryDonation 
              ? 'Your direct donation is creating real change.'
              : 'Your donation fulfilled someone\'s request and brought joy to their life.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Congratulations;
