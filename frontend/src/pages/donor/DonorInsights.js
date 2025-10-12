import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
  CheckCircle
} from 'lucide-react';
import { mockDonations, mockRequests, mockRecommendations } from '../../mock';

const DonorInsights = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate insights data
  const userDonations = mockDonations.filter(d => d.donorId === user.id);
  const userRequests = mockRequests.filter(r => 
    userDonations.some(d => d.id === r.donationId)
  );

  const insights = {
    totalImpact: 850,
    monthlyGrowth: 15,
    demandMatch: 92,
    categoryPerformance: [
      { category: 'Outerwear', donated: 5, requested: 8, match: 95, trend: 'up' },
      { category: 'Formal', donated: 8, requested: 6, match: 78, trend: 'stable' },
      { category: 'Casual', donated: 3, requested: 12, match: 85, trend: 'up' },
      { category: 'Children', donated: 1, requested: 15, match: 98, trend: 'up' }
    ],
    seasonalTrends: [
      { month: 'Oct', donations: 2, demand: 8, efficiency: 75 },
      { month: 'Nov', donations: 5, demand: 12, efficiency: 85 },
      { month: 'Dec', donations: 3, demand: 6, efficiency: 90 },
      { month: 'Jan', donations: 1, demand: 4, efficiency: 60 }
    ],
    recommendations: [
      {
        type: 'demand_opportunity',
        title: 'High Demand for Children\'s Winter Clothes',
        description: 'There\'s 15x more demand than supply for children\'s winter clothing in your area.',
        action: 'Consider donating children\'s winter items',
        priority: 'high',
        impact: '+40 impact points'
      },
      {
        type: 'timing_optimization',
        title: 'Best Time to Donate',
        description: 'Donations made on weekends have 25% higher matching rates.',
        action: 'Schedule your next donation for this weekend',
        priority: 'medium',
        impact: '+15% match rate'
      },
      {
        type: 'category_suggestion',
        title: 'Professional Attire Needed',
        description: 'Job training programs in your area need business clothing.',
        action: 'Donate professional/formal wear',
        priority: 'medium',
        impact: 'Help 3-5 job seekers'
      }
    ],
    achievements: [
      { 
        id: 1,
        title: 'Eco Champion',
        description: 'Saved 2.3 tons of CO₂',
        icon: '🌍',
        earned: true,
        progress: 100
      },
      {
        id: 2,
        title: 'Community Helper',
        description: 'Helped 10+ families',
        icon: '❤️',
        earned: true,
        progress: 100
      },
      {
        id: 3,
        title: 'Consistency King',
        description: 'Donate for 3 months straight',
        icon: '🔥',
        earned: false,
        progress: 67
      },
      {
        id: 4,
        title: 'AI Partner',
        description: 'Use AI features 10 times',
        icon: '🤖',
        earned: false,
        progress: 80
      }
    ]
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Donation Insights</h1>
          <p className="text-gray-600 mt-2">AI-powered insights to maximize your impact</p>
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
              <div className="text-xs text-gray-500 mt-2">Above average</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Sparkles className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">95%</div>
              <div className="text-sm text-gray-600">AI Accuracy</div>
              <div className="text-xs text-gray-500 mt-2">Excellent</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">3.2x</div>
              <div className="text-sm text-gray-600">Impact Multiplier</div>
              <div className="text-xs text-gray-500 mt-2">vs. average donor</div>
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
                          <h4 className="font-medium">{category.category}</h4>
                          {getTrendIcon(category.trend)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          You donated: {category.donated} • Local demand: {category.requested}
                        </div>
                        <div className="mt-2">
                          <Progress value={category.match} className="h-2" />
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-gray-900">{category.match}%</div>
                        <div className="text-xs text-gray-600">Match Rate</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                      <span className="font-semibold">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Organizations Reached</span>
                      <span className="font-semibold">4</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Items Successfully Matched</span>
                      <span className="font-semibold">15</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CO₂ Saved</span>
                      <span className="font-semibold text-green-600">2.3 tons</span>
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
                        <span className="text-sm font-medium">Saturday</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Best Performing Season</span>
                        <span className="text-sm font-medium">Winter</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Average Response Time</span>
                        <span className="text-sm font-medium">2.3 days</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Fastest Match</span>
                        <span className="text-sm font-medium text-green-600">4 hours</span>
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
              {insights.recommendations.map((rec, index) => (
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
              ))}
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Seasonal Donation Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.seasonalTrends.map((month, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="w-16 text-center">
                          <div className="font-semibold">{month.month}</div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Donations: {month.donations}</span>
                            <span>Demand: {month.demand}</span>
                            <span>Efficiency: {month.efficiency}%</span>
                          </div>
                          <Progress value={month.efficiency} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Market Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">High Demand Categories</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Children's Clothing</span>
                          <span className="text-red-600 font-medium">Very High</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Winter Coats</span>
                          <span className="text-orange-600 font-medium">High</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Professional Wear</span>
                          <span className="text-yellow-600 font-medium">Medium</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Best Donation Times</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Weekend</span>
                          <span className="text-green-600 font-medium">95% Match Rate</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Morning (9-11 AM)</span>
                          <span className="text-green-600 font-medium">88% Match Rate</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Season Start</span>
                          <span className="text-blue-600 font-medium">92% Match Rate</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insights.achievements.map((achievement) => (
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
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-2">Ready to donate again?</h3>
              <p className="text-green-100 mb-4">Your impact score could increase by 15% with your next donation.</p>
              <Button asChild variant="secondary">
                <Link to="/donate">Start New Donation</Link>
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