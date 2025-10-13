import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { donationService, aiService } from '../../services';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  TrendingUp, 
  Target,
  Lightbulb,
  BarChart3,
  Calendar,
  Users,
  Package,
  Heart,
  Sparkles,
  Award,
  ArrowUp,
  ArrowDown,
  Info,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const DonorInsights = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, [user]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const [donationsResponse, insightsResponse] = await Promise.all([
        donationService.getUserDonations(user.id),
        aiService.getDonorInsights(user.id)
      ]);

      if (donationsResponse.success && insightsResponse.success) {
        const donations = donationsResponse.data.donations || [];
        const aiInsights = insightsResponse.data || {};
        
        // Process and combine data
        const processedInsights = {
          totalImpact: aiInsights.impactScore || 0,
          monthlyGrowth: aiInsights.monthlyGrowth || 0,
          demandMatch: aiInsights.demandMatchRate || 0,
          donations: donations,
          categoryPerformance: aiInsights.categoryPerformance || [],
          seasonalTrends: aiInsights.seasonalTrends || [],
          recommendations: aiInsights.recommendations || [],
          achievements: aiInsights.achievements || [],
          communityImpact: aiInsights.communityImpact || {},
          donationPatterns: aiInsights.donationPatterns || {}
        };
        
        setInsights(processedInsights);
      } else {
        setError('Failed to fetch insights data');
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError(err.message || 'Failed to fetch insights data');
      
      // Fallback to basic data structure
      setInsights({
        totalImpact: 0,
        monthlyGrowth: 0,
        demandMatch: 0,
        donations: [],
        categoryPerformance: [],
        seasonalTrends: [],
        recommendations: [],
        achievements: [],
        communityImpact: {},
        donationPatterns: {}
      });
      
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInsights();
    setRefreshing(false);
    toast.success('Insights refreshed');
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your insights...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !insights) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Insights</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchInsights} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Donation Insights</h1>
            <p className="text-gray-600 mt-2">AI-powered insights to maximize your impact</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{insights.totalImpact}</div>
              <div className="text-sm text-gray-600">Impact Score</div>
              <div className="flex items-center justify-center mt-2 text-xs">
                <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">+{insights.monthlyGrowth}% this month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{insights.demandMatch}%</div>
              <div className="text-sm text-gray-600">Demand Match Rate</div>
              <div className="text-xs text-gray-500 mt-2">
                {insights.demandMatch > 80 ? 'Excellent' : insights.demandMatch > 60 ? 'Good' : 'Needs improvement'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{insights.donations.length}</div>
              <div className="text-sm text-gray-600">Total Donations</div>
              <div className="text-xs text-gray-500 mt-2">
                {insights.donations.filter(d => d.status === 'approved').length} approved
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Heart className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {insights.communityImpact.familiesHelped || 0}
              </div>
              <div className="text-sm text-gray-600">Families Helped</div>
              <div className="text-xs text-gray-500 mt-2">Community impact</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
            <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Category Performance */}
            {insights.categoryPerformance.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Category Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.categoryPerformance.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium capitalize">{category.category}</h4>
                            {getTrendIcon(category.trend)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            You donated: {category.donated} • Local demand: {category.requested}
                          </div>
                          <div className="mt-2">
                            <Progress value={category.matchRate || 0} className="h-2" />
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-gray-900">{category.matchRate || 0}%</div>
                          <div className="text-xs text-gray-600">Match Rate</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No category data available yet</p>
                    <p className="text-sm text-gray-400 mt-2">Make more donations to see performance insights</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span>Community Impact</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Families Helped</span>
                      <span className="font-semibold">{insights.communityImpact.familiesHelped || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Organizations Reached</span>
                      <span className="font-semibold">{insights.communityImpact.organizationsReached || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Items Successfully Matched</span>
                      <span className="font-semibold">{insights.communityImpact.itemsMatched || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CO₂ Saved</span>
                      <span className="font-semibold text-green-600">{insights.communityImpact.co2Saved || '0'} kg</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <span>Donation Patterns</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Most Active Day</span>
                        <span className="text-sm font-medium">{insights.donationPatterns.mostActiveDay || 'N/A'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Best Performing Season</span>
                        <span className="text-sm font-medium">{insights.donationPatterns.bestSeason || 'N/A'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Average Response Time</span>
                        <span className="text-sm font-medium">{insights.donationPatterns.avgResponseTime || 'N/A'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Fastest Match</span>
                        <span className="text-sm font-medium text-green-600">{insights.donationPatterns.fastestMatch || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="mt-6">
            <div className="space-y-6">
              {insights.recommendations.length > 0 ? (
                insights.recommendations.map((rec, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                            <Badge className={getPriorityColor(rec.priority)}>
                              {rec.priority} priority
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-4">{rec.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-600">
                                <strong>Action:</strong> {rec.action}
                              </span>
                              <span className="text-sm text-green-600 font-medium">
                                {rec.impact}
                              </span>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                Learn More
                              </Button>
                              <Button size="sm">
                                Take Action
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations Yet</h3>
                    <p className="text-gray-600 mb-4">Make more donations to receive AI-powered recommendations</p>
                    <Button asChild>
                      <Link to="/donor/donate">Make a Donation</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="mt-6">
            <div className="space-y-6">
              {insights.seasonalTrends.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Seasonal Donation Efficiency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {insights.seasonalTrends.map((trend, index) => (
                        <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <div className="w-16 text-center">
                            <div className="font-semibold">{trend.period}</div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Donations: {trend.donations}</span>
                              <span>Demand: {trend.demand}</span>
                              <span>Efficiency: {trend.efficiency}%</span>
                            </div>
                            <Progress value={trend.efficiency} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Seasonal Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No trend data available yet</p>
                      <p className="text-sm text-gray-400 mt-2">Continue donating to build trend insights</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insights.achievements.length > 0 ? (
                insights.achievements.map((achievement) => (
                  <Card key={achievement.id} className={`${achievement.earned ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="text-4xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">{achievement.title}</h3>
                            {achievement.earned && <CheckCircle className="h-5 w-5 text-green-600" />}
                          </div>
                          <p className="text-gray-600 text-sm mt-1">{achievement.description}</p>
                          
                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{achievement.progress}%</span>
                            </div>
                            <Progress value={achievement.progress} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Achievements Yet</h3>
                      <p className="text-gray-600 mb-4">Start donating to unlock achievements and track your impact</p>
                      <Button asChild>
                        <Link to="/donor/donate">Make Your First Donation</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-2">Ready to donate again?</h3>
              <p className="text-green-100 mb-4">Your impact score could increase with your next donation.</p>
              <Button asChild variant="secondary">
                <Link to="/donor/donate">Start New Donation</Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-2">Share Your Impact</h3>
              <p className="text-blue-100 mb-4">Show friends how you're making a difference in the community.</p>
              <Button variant="secondary">
                Share Impact Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DonorInsights;