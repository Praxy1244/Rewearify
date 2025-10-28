// src/components/DonorDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { 
  Plus, 
  Package, 
  Heart, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Users,
  Award,
  Recycle,
  Bell
} from 'lucide-react';
import AIPredictionWidget from '../AI/AIPredictionWidget';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';

const DonorDashboard = () => {
  const { user } = useAuth();
  const { 
    donations, 
    requests, 
    notifications, 
    loading,
    fetchUserDonations, 
    fetchUserRequests, 
    fetchNotifications 
  } = useApp();

  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setDashboardLoading(true);
        await Promise.all([
          fetchUserDonations(),
          fetchUserRequests(),
          fetchNotifications()
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setDashboardLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user, fetchUserDonations, fetchUserRequests, fetchNotifications]);

  // Filter data for current user
  const userDonations = donations || [];
  const userRequests = requests?.filter(r => 
    userDonations.some(d => d.id === r.donationId)
  ) || [];
  const userNotifications = notifications || [];

  const stats = {
    totalDonations: userDonations.length,
    approvedDonations: userDonations.filter(d => d.status === 'approved').length,
    pendingDonations: userDonations.filter(d => d.status === 'pending').length,
    activeRequests: userRequests.filter(r => r.status === 'pending').length,
    completedMatches: userRequests.filter(r => r.status === 'approved').length,
    impactScore: user.impactScore || 850
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (dashboardLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your impact dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.profilePicture} alt={user.name} />
              <AvatarFallback className="text-xl">{user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600 mt-1">
                Ready to make a difference in your community today?
              </p>
            </div>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link to="/donor/donate">
                <Plus className="h-5 w-5 mr-2" />
                New Donation
              </Link>
            </Button>
          </div>

          {/* Impact Summary */}
          <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white border-0 shadow-xl rounded-xl overflow-hidden">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Award className="h-6 w-6 mr-2" />
                Your Impact Dashboard
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                  <Package className="h-8 w-8 mx-auto mb-2 text-white" />
                  <div className="text-3xl font-bold">{stats.totalDonations}</div>
                  <div className="text-green-100">Total Donations</div>
                </div>
                <div className="text-center bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-white" />
                  <div className="text-3xl font-bold">{stats.completedMatches}</div>
                  <div className="text-green-100">Successful Matches</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.impactScore}</div>
                  <div className="text-green-100">Impact Score</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Award className="h-6 w-6 mr-2" />
                    <span className="text-lg font-semibold">Eco Champion</span>
                  </div>
                  <div className="text-green-100">Your Badge</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* AI Predictions */}
          <div className="mt-6">
            <AIPredictionWidget userId={user?.id} userType="donor" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Package className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.approvedDonations}</div>
                  <div className="text-sm text-gray-600">Active Donations</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.activeRequests}</div>
                  <div className="text-sm text-gray-600">Pending Requests</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">+15%</div>
                  <div className="text-sm text-gray-600">Impact Growth</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Donations */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <span>Recent Donations</span>
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/donor/my-donations">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userDonations.slice(0, 3).map((donation) => (
                    <div key={donation.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <img 
                        src={donation.images?.[0] || '/api/placeholder/64/64'} 
                        alt={donation.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{donation.title}</h4>
                        <p className="text-sm text-gray-600">{donation.quantity} items • {donation.category}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusIcon(donation.status)}
                          <Badge className={getStatusColor(donation.status)}>
                            {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {donation.aiAnalysis && (
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {Math.round(donation.aiAnalysis.categoryConfidence * 100)}%
                            </div>
                            <div className="text-xs text-gray-600">AI Match</div>
                          </div>
                        )}
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {userDonations.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">You haven't made any donations yet.</p>
                      <Button asChild>
                        <Link to="/donor/donate">Make Your First Donation</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Active Requests */}
            {userRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    <span>Incoming Requests</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{request.organization}</h4>
                          <p className="text-sm text-gray-600">
                            Requested {request.requestedQuantity} items from "{request.donationTitle}"
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className={`text-xs ${request.urgencyLevel === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {request.urgencyLevel} priority
                            </Badge>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            {Math.round(request.aiMatchScore * 100)}% Match
                          </div>
                          <Button variant="outline" size="sm" className="mt-2">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Impact Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Recycle className="h-5 w-5 text-green-600" />
                  <span>Monthly Impact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Donation Goal</span>
                    <span>{stats.totalDonations}/5</span>
                  </div>
                  <Progress value={(stats.totalDonations / 5) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Impact Score</span>
                    <span>{stats.impactScore}/1000</span>
                  </div>
                  <Progress value={(stats.impactScore / 1000) * 100} className="h-2" />
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-600">
                    You're 15% ahead of other donors this month! 🎉
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link to="/donor/donate">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Donation
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link to="/donor/my-donations">
                    <Package className="h-4 w-4 mr-2" />
                    Track My Donations
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link to="/donor/browseNeeds">
                    <Heart className="h-4 w-4 mr-2" />
                    Browse Community Needs
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Notifications Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  <span>Notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Bell className="h-4 w-4 mr-2" />
                      View Notifications
                      {userNotifications.filter(n => !n.read).length > 0 && (
                        <Badge className="ml-2 bg-red-500 text-white text-xs">
                          {userNotifications.filter(n => !n.read).length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80" align="start">
                    {userNotifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem key={notification.id} className="p-3">
                        <div className="flex items-start space-x-2">
                          <div className={`w-2 h-2 rounded-full mt-1 ${notification.read ? 'bg-gray-300' : 'bg-blue-500'}`}></div>
                          <div>
                            <p className="text-sm text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    {userNotifications.length === 0 && (
                      <DropdownMenuItem className="p-3 text-center text-gray-500">
                        No notifications yet
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="justify-center">
                      <Link to="/donor/notifications" className="text-sm text-green-600 hover:text-green-700">
                        View all notifications
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;