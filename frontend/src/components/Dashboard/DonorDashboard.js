import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import AIRecommendationsWidget from './AIRecommendationsWidget';
import { 
  Plus, 
  Package, 
  Heart, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Gift,
  Users,
  BarChart3
} from 'lucide-react';

const DonorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalDonations: 0,
    activeDonations: 0,
    completedDonations: 0,
    totalImpact: 0
  });
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
  try {
    const token = localStorage.getItem('token');
    
    // Fetch donations first (this endpoint works - we saw it in Network tab)
    try {
      const donationsResponse = await fetch('http://localhost:5000/api/donations', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (donationsResponse.ok) {
        const donationsData = await donationsResponse.json();
        console.log('Donations data received:', donationsData);
        
        // Handle different response formats
        let allDonations = [];
        
        if (Array.isArray(donationsData)) {
          allDonations = donationsData;
        } else if (donationsData.donations && Array.isArray(donationsData.donations)) {
          allDonations = donationsData.donations;
        } else if (donationsData.data && Array.isArray(donationsData.data)) {
          allDonations = donationsData.data;
        }
        
        // Set recent donations (last 5)
        setRecentDonations(allDonations.slice(0, 5));
        
        // Calculate stats from the donations data
        const calculatedStats = {
          totalDonations: allDonations.length,
          activeDonations: allDonations.filter(d => 
            d.status === 'approved' || d.status === 'pending'
          ).length,
          completedDonations: allDonations.filter(d => 
            d.status === 'completed'
          ).length,
          totalImpact: allDonations.reduce((sum, d) => sum + (d.quantity || 0), 0)
        };
        
        setStats(calculatedStats);
        console.log('Calculated stats:', calculatedStats);
      } else {
        console.error('Failed to fetch donations:', donationsResponse.status);
      }
    } catch (err) {
      console.error('Error fetching donations:', err);
    }
    
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
  } finally {
    setLoading(false);
  }
};

  const getStatusBadge = (status) => {
    const badges = {
      pending: <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>,
      approved: <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>,
      rejected: <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>,
      completed: <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Completed</Badge>,
    };
    return badges[status] || <Badge>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'Donor'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your donations today.
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Donations Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Donations</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stats.totalDonations}
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Gift className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Donations Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Donations</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stats.activeDonations}
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <Package className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Completed Donations Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stats.completedDonations}
                      </p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <CheckCircle className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Impact Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">People Helped</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stats.totalImpact || 0}
                      </p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-full">
                      <Users className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="w-full h-auto py-6 flex flex-col items-center gap-2"
                    onClick={() => navigate('/donor/donate')}
                  >
                    <Plus className="h-6 w-6" />
                    <span>Create Donation</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full h-auto py-6 flex flex-col items-center gap-2"
                    onClick={() => navigate('/donor/my-donations')}
                  >
                    <Package className="h-6 w-6" />
                    <span>My Donations</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full h-auto py-6 flex flex-col items-center gap-2"
                    onClick={() => navigate('/donor/browseNeeds')}
                  >
                    <Heart className="h-6 w-6" />
                    <span>Browse Needs</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Donations */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Donations</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/donor/my-donations')}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentDonations.length > 0 ? (
                  <div className="space-y-4">
                    {recentDonations.map((donation, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                        onClick={() => navigate(`/donor/my-donations/${donation._id}`)}
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{donation.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {donation.category} • {donation.quantity} items
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(donation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          {getStatusBadge(donation.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No donations yet</p>
                    <Button 
                      className="mt-4"
                      onClick={() => navigate('/donor/donate')}
                    >
                      Create Your First Donation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar (1/3 width) */}
          <div className="space-y-6">
            {/* AI RECOMMENDATIONS WIDGET - THIS IS THE NEW ADDITION */}
            <AIRecommendationsWidget />

            {/* Impact Summary Card */}
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Your Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-4xl font-bold text-green-600 mb-1">
                      {stats.totalImpact || 0}
                    </div>
                    <div className="text-sm text-gray-600">Lives Touched</div>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-4xl font-bold text-blue-600 mb-1">
                      {stats.totalDonations * 3 || 0}
                    </div>
                    <div className="text-sm text-gray-600">Items Donated</div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/donor/ai-insights')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">💡 Donation Tip</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-800">
                  Clean and fold clothes before donation. Items in better condition 
                  have higher acceptance rates by NGOs!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;
