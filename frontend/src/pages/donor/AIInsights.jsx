import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Brain, TrendingUp, Users, MapPin, Award, 
  Sparkles, BarChart, Clock, ArrowLeft 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AIInsights = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    recommendations: [],
    profile: null,
    popular: []
  });

  useEffect(() => {
    fetchAllAIData();
  }, []);

  const fetchAllAIData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [recsRes, profileRes, popularRes] = await Promise.all([
        fetch('http://localhost:5000/api/recommendations', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/recommendations/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/recommendations/popular')
      ]);

      const [recsData, profileData, popularData] = await Promise.all([
        recsRes.json(),
        profileRes.json(),
        popularRes.json()
      ]);

      // ✅ Fix: Handle nested data structure
      setData({
        recommendations: recsData.data?.recommendations || recsData.recommendations || [],
        profile: profileData.data?.profile || profileData.profile,
        popular: popularData.data?.recommendations || popularData.recommendations || []
      });
    } catch (error) {
      console.error('Failed to fetch AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 animate-pulse text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading AI insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/donor-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="text-purple-600" />
            AI-Powered Insights
          </h1>
          <p className="text-gray-600 mt-2">
            Personalized recommendations and analytics powered by machine learning
          </p>
        </div>

        <Tabs defaultValue="recommendations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommendations">
              <Sparkles className="h-4 w-4 mr-2" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="profile">
              <Users className="h-4 w-4 mr-2" />
              Your Profile
            </TabsTrigger>
            <TabsTrigger value="popular">
              <TrendingUp className="h-4 w-4 mr-2" />
              Popular NGOs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>NGOs Recommended For You</CardTitle>
                <p className="text-sm text-gray-600">
                  Based on your donation history, location, and preferences
                </p>
              </CardHeader>
              <CardContent>
                {data.recommendations.length > 0 ? (
                  <div className="grid gap-4">
                    {data.recommendations.map((ngo, idx) => (
                      <Card key={idx} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-lg font-bold">{ngo.name}</h3>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {ngo.location?.city || ngo.city || ngo.location?.address || 'Unknown'}
                              </p>
                            </div>
                            <Badge className="bg-green-600 text-white">
                              {(ngo.score * 100).toFixed(0)}% Match
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center p-3 bg-blue-50 rounded">
                              <Award className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                              <p className="text-sm font-medium">{ngo.trust_score}/5</p>
                              <p className="text-xs text-gray-600">Trust</p>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded">
                              <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                              <p className="text-sm font-medium">{ngo.impact_score}/5</p>
                              <p className="text-xs text-gray-600">Impact</p>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded">
                              <MapPin className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                              <p className="text-sm font-medium">
                                {ngo.distance ? `${ngo.distance.toFixed(1)}km` : 'N/A'}
                              </p>
                              <p className="text-xs text-gray-600">Distance</p>
                            </div>
                          </div>

                          {ngo.reason && (
                            <div className="bg-purple-50 p-3 rounded-md mb-3">
                              <p className="text-sm text-purple-900">
                                <strong>Why recommended:</strong> {ngo.reason}
                              </p>
                            </div>
                          )}

                          <Button 
                            className="w-full"
                            onClick={() => navigate(`/donor/browse-needs?ngo=${ngo.id}`)}
                          >
                            View Their Needs
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Brain className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Make a few donations to get personalized recommendations!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            {data.profile ? (
              <>
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardHeader>
                    <CardTitle>Your Donor Analytics</CardTitle>
                    <p className="text-sm text-gray-600">
                      AI-generated insights from your donation patterns
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-1">
                          {data.profile.donation_frequency || 0}
                        </div>
                        <div className="text-sm text-gray-600">Total Donations</div>
                      </div>

                      <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-1">
                          {data.profile.activity_level || 'New'}
                        </div>
                        <div className="text-sm text-gray-600">Activity Level</div>
                      </div>

                      <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {data.profile.avg_items_per_donation || 0}
                        </div>
                        <div className="text-sm text-gray-600">Avg Items</div>
                      </div>

                      <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                        <div className="text-2xl font-bold text-orange-600 mb-1">
                          {data.profile.preferred_categories?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Categories</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {data.profile.preferred_categories && data.profile.preferred_categories.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart className="h-5 w-5 text-purple-600" />
                        Your Donation Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {data.profile.preferred_categories.map((cat, idx) => (
                          <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">
                    Not enough data yet. Make a few donations to see your profile!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="popular" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top-Rated NGOs in Your Area</CardTitle>
                <p className="text-sm text-gray-600">
                  Most trusted and impactful organizations
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {data.popular.slice(0, 10).map((ngo, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-gray-400">#{idx + 1}</div>
                        <div>
                          <h4 className="font-semibold">{ngo.name}</h4>
                          <p className="text-sm text-gray-600">
                            {ngo.location?.city || ngo.city || ngo.location?.address || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Trust: {ngo.trust_score}/5</p>
                        <p className="text-sm text-gray-600">Impact: {ngo.impact_score}/5</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIInsights;
