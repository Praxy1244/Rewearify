import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { 
  TrendingUp, Package, Heart, Users, Award, 
  Sparkles, Calendar, Target, Zap, ArrowLeft
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { donationService } from '../../services';
import aiService from '../../services/aiService';
import { toast } from 'sonner';

const ImpactAnalytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalItems: 0,
    ngosHelped: 0,
    peopleImpacted: 0
  });
  const [impactData, setImpactData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch user's donations
      const donationsResponse = await donationService.getUserDonations(user._id);
      
      if (donationsResponse.success) {
        const donations = donationsResponse.data || [];
        
        // Calculate stats
        const totalItems = donations.reduce((sum, d) => sum + (d.quantity || 0), 0);
        const completedDonations = donations.filter(d => d.status === 'completed');
        const uniqueNGOs = new Set(completedDonations.map(d => d.matchedNGO).filter(Boolean));
        
        setStats({
          totalDonations: donations.length,
          totalItems: totalItems,
          ngosHelped: uniqueNGOs.size,
          peopleImpacted: totalItems * 3
        });

        checkAchievements(donations.length, totalItems);
      }

      // Fetch AI impact data
      const impactResponse = await aiService.getUserImpactAnalytics(user._id);
      setImpactData(impactResponse);

      // Fetch trends
      const trendsResponse = await aiService.getDonationTrends(user._id);
      setTrends(trendsResponse);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const checkAchievements = (totalDonations, totalItems) => {
    const newAchievements = [];

    if (totalDonations >= 1) {
      newAchievements.push({
        id: 'first-donation',
        title: 'First Step',
        description: 'Made your first donation',
        icon: '🎉',
        unlocked: true
      });
    }

    if (totalDonations >= 5) {
      newAchievements.push({
        id: 'frequent-donor',
        title: 'Frequent Donor',
        description: 'Made 5+ donations',
        icon: '⭐',
        unlocked: true
      });
    }

    if (totalItems >= 50) {
      newAchievements.push({
        id: 'generous-heart',
        title: 'Generous Heart',
        description: 'Donated 50+ items',
        icon: '❤️',
        unlocked: true
      });
    }

    if (totalDonations >= 10) {
      newAchievements.push({
        id: 'super-donor',
        title: 'Super Donor',
        description: 'Made 10+ donations',
        icon: '🏆',
        unlocked: true
      });
    }

    if (totalDonations < 20) {
      newAchievements.push({
        id: 'champion',
        title: 'Champion Donor',
        description: 'Make 20 donations',
        icon: '👑',
        unlocked: false,
        progress: totalDonations,
        goal: 20
      });
    }

    setAchievements(newAchievements);
  };

  const getImpactLevel = (score) => {
    if (score >= 90) return { level: 'Exceptional', color: 'text-purple-600', bgColor: 'bg-purple-100' };
    if (score >= 75) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 60) return { level: 'Great', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    return { level: 'Good', color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your impact analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  const impactLevel = impactData ? getImpactLevel(impactData.impactScore) : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/donor-dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Impact Dashboard</h1>
        <p className="text-gray-600">See the difference you're making in the community</p>
      </div>

      {/* AI Impact Score Card */}
      {impactData && (
        <Card className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI Impact Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-blue-600">
                    {impactData.impactScore}
                  </span>
                  <span className="text-xl text-gray-600">/100</span>
                </div>
                <Badge className={`${impactLevel.bgColor} ${impactLevel.color} mt-2`}>
                  {impactLevel.level} Impact
                </Badge>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">
                    {impactData.trend === 'up' ? '+12%' : 'Stable'}
                  </span>
                </div>
                <span className="text-sm text-gray-600">vs last month</span>
              </div>
            </div>
            <Progress value={impactData.impactScore} className="h-2" />
            <p className="text-sm text-gray-600 mt-4">
              Your donations have positively impacted an estimated{' '}
              <span className="font-semibold text-blue-600">
                {stats.peopleImpacted} people
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Donations</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalDonations}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Items Donated</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalItems}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">NGOs Helped</p>
                <p className="text-3xl font-bold text-gray-900">{stats.ngosHelped}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">People Impacted</p>
                <p className="text-3xl font-bold text-gray-900">{stats.peopleImpacted}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights & Recommendations */}
      {impactData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {impactData.insights.map((insight, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-yellow-50 rounded-lg">
                    <span className="text-yellow-600 flex-shrink-0">💡</span>
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {impactData.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-600 flex-shrink-0">🎯</span>
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 text-center ${
                    achievement.unlocked
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="text-4xl mb-2">{achievement.icon}</div>
                  <h4 className="font-semibold text-sm mb-1">{achievement.title}</h4>
                  <p className="text-xs text-gray-600">{achievement.description}</p>
                  {!achievement.unlocked && achievement.progress && (
                    <div className="mt-2">
                      <Progress 
                        value={(achievement.progress / achievement.goal) * 100} 
                        className="h-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {achievement.progress}/{achievement.goal}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Donation Trends Chart */}
      {trends && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Donation Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trends.labels.map((month, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{month}</span>
                    <span className="text-gray-600">
                      {trends.donations[idx]} donations • {trends.items[idx]} items
                    </span>
                  </div>
                  <Progress value={(trends.donations[idx] / 10) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImpactAnalytics;
