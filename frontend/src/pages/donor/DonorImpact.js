import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  Leaf,
  Heart,
  Users,
  Award,
  Calendar,
  MapPin,
  Share2,
  Download,
  Globe,
  Recycle,
  TreePine,
  Building,
  Star,
  TrendingUp,
  Clock,
  Target
} from 'lucide-react';

const DonorImpact = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('all-time');

  const impactData = {
    'all-time': {
      itemsDonated: 17,
      familiesHelped: 12,
      co2Saved: 2.3,
      organizationsReached: 4,
      impactScore: 850,
      rank: 'Top 5%',
      streak: 3,
      stories: [
        {
          id: 1,
          recipient: 'Maria Garcia',
          organization: 'Hope Community Center',
          item: 'Winter Coat Collection',
          story: 'Thanks to your donation, I was able to keep my children warm during the harsh winter. The coats you donated were perfect for them.',
          date: '2024-01-15',
          impact: 'Helped 3 children stay warm',
          photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face'
        },
        {
          id: 2,
          recipient: 'James Wilson',
          organization: 'Career Success Center',
          item: 'Business Attire Set',
          story: 'Your professional clothing donation helped me land my first job interview in months. I got the job and can now support my family.',
          date: '2024-02-03',
          impact: 'Helped secure employment',
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
        }
      ],
      milestones: [
        { achieved: true, title: 'First Donation', date: '2024-01-15', icon: '🎯' },
        { achieved: true, title: '10 Items Donated', date: '2024-02-20', icon: '📦' },
        { achieved: true, title: 'Helped 10 Families', date: '2024-03-10', icon: '❤️' },
        { achieved: false, title: 'Sustainability Champion', date: null, icon: '🌍', progress: 75 }
      ]
    },
    'this-year': {
      itemsDonated: 17,
      familiesHelped: 12,
      co2Saved: 2.3,
      organizationsReached: 4,
      impactScore: 850,
      rank: 'Top 5%',
      streak: 3
    },
    'this-month': {
      itemsDonated: 2,
      familiesHelped: 3,
      co2Saved: 0.3,
      organizationsReached: 2,
      impactScore: 120,
      rank: 'Top 10%',
      streak: 1
    }
  };

  const currentData = impactData[timeRange];

  const environmentalImpact = {
    waterSaved: 2340, // liters
    energySaved: 156, // kWh
    landfillDiverted: 8.5, // kg
    textileWastePrevented: 17 // items
  };

  const communityStats = [
    { 
      title: 'Local Impact Radius',
      value: '25 km',
      description: 'Your donations have reached families within 25km of your location',
      icon: <MapPin className="h-6 w-6 text-blue-600" />
    },
    {
      title: 'Response Time',
      value: '2.3 days',
      description: 'Average time for your donations to be matched with recipients',
      icon: <Clock className="h-6 w-6 text-green-600" />
    },
    {
      title: 'Match Success Rate',
      value: '94%',
      description: 'Percentage of your donations that found recipients',
      icon: <Target className="h-6 w-6 text-purple-600" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Impact Story</h1>
            <p className="text-gray-600 mt-2">See the real difference you're making in the community</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-time">All Time</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Impact Hero Section */}
        <Card className="mb-8 bg-gradient-to-r from-green-500 to-blue-500 text-white border-0">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold">{currentData.itemsDonated}</div>
                <div className="text-green-100 mt-1">Items Donated</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">{currentData.familiesHelped}</div>
                <div className="text-green-100 mt-1">Families Helped</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">{currentData.co2Saved}T</div>
                <div className="text-green-100 mt-1">CO₂ Saved</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">{currentData.impactScore}</div>
                <div className="text-green-100 mt-1">Impact Score</div>
                <Badge className="mt-2 bg-white/20 text-white border-white/30">
                  {currentData.rank} of donors
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Environmental Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Leaf className="h-6 w-6 text-green-600" />
                <span>Environmental Impact</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Globe className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{environmentalImpact.waterSaved}L</div>
                    <div className="text-sm text-gray-600">Water Saved</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <TreePine className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{environmentalImpact.energySaved}</div>
                    <div className="text-sm text-gray-600">kWh Energy Saved</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Textile Waste Prevented</span>
                    <span className="font-semibold">{environmentalImpact.textileWastePrevented} items</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Landfill Diverted</span>
                    <span className="font-semibold">{environmentalImpact.landfillDiverted} kg</span>
                  </div>
                </div>

                <div className="p-4 bg-green-100 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Recycle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Circular Economy Contribution</span>
                  </div>
                  <p className="text-sm text-green-700">
                    By donating instead of discarding, you've extended the lifecycle of {environmentalImpact.textileWastePrevented} clothing items, 
                    contributing to a more sustainable fashion ecosystem.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-blue-600" />
                <span>Community Reach</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {communityStats.map((stat, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                      {stat.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900">{stat.title}</h4>
                        <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                      </div>
                      <p className="text-sm text-gray-600">{stat.description}</p>
                    </div>
                  </div>
                ))}

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Partner Organizations</span>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    Your donations have reached {currentData.organizationsReached} verified organizations in your community.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">Hope Community Center</Badge>
                    <Badge variant="outline" className="text-xs">Career Success Center</Badge>
                    <Badge variant="outline" className="text-xs">Family Aid Network</Badge>
                    <Badge variant="outline" className="text-xs">+{currentData.organizationsReached - 3} more</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Stories */}
        {timeRange === 'all-time' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-6 w-6 text-red-600" />
                <span>Impact Stories</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {currentData.stories.map((story) => (
                  <div key={story.id} className="border rounded-lg p-6 bg-gray-50">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={story.photo} alt={story.recipient} />
                        <AvatarFallback>{story.recipient.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{story.recipient}</h4>
                            <p className="text-sm text-gray-600">{story.organization} • {story.date}</p>
                          </div>
                          <Badge variant="secondary">{story.item}</Badge>
                        </div>
                        <blockquote className="text-gray-700 italic mb-3">
                          "{story.story}"
                        </blockquote>
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
                            ))}
                          </div>
                          <span className="text-sm text-green-600 font-medium">{story.impact}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Milestones & Achievements */}
        {timeRange === 'all-time' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-6 w-6 text-yellow-600" />
                <span>Milestones & Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentData.milestones.map((milestone, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center space-x-4 p-4 rounded-lg border ${
                      milestone.achieved ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="text-3xl">{milestone.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                      {milestone.achieved ? (
                        <p className="text-sm text-gray-600">Achieved on {milestone.date}</p>
                      ) : (
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="text-gray-600">{milestone.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${milestone.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-white" />
              <h3 className="text-xl font-bold mb-2">Keep Growing Your Impact</h3>
              <p className="text-purple-100 mb-4">
                Your next donation could help you reach the Sustainability Champion milestone!
              </p>
              <Button asChild variant="secondary">
                <Link to="/donate">Donate Now</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-teal-500 text-white">
            <CardContent className="p-6 text-center">
              <Share2 className="h-12 w-12 mx-auto mb-4 text-white" />
              <h3 className="text-xl font-bold mb-2">Inspire Others</h3>
              <p className="text-blue-100 mb-4">
                Share your impact story to inspire friends and family to start giving.
              </p>
              <Button variant="secondary">
                Share Your Story
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DonorImpact;