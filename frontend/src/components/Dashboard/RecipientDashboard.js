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
  Search, 
  Package, 
  Heart, 
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Users,
  Building,
  Truck,
  Calendar
} from 'lucide-react';

const RecipientDashboard = () => {
  const { user } = useAuth();
  const { 
    donations, 
    requests, 
    notifications, 
    loading,
    fetchAvailableDonations, 
    fetchUserRequests, 
    fetchNotifications 
  } = useApp();

  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setDashboardLoading(true);
        await Promise.all([
          fetchAvailableDonations(),
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
  }, [user, fetchAvailableDonations, fetchUserRequests, fetchNotifications]);

  // Filter data for current user
  const userRequests = requests || [];
  const availableDonations = donations?.filter(d => d.status === 'approved') || [];
  const userNotifications = notifications || [];

  const stats = {
    totalRequests: userRequests.length,
    approvedRequests: userRequests.filter(r => r.status === 'approved').length,
    pendingRequests: userRequests.filter(r => r.status === 'pending').length,
    availableItems: availableDonations.length,
    peopleHelped: user.receivedCount || 8
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

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (dashboardLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
                {user.organization} • {user.location}
              </p>
            </div>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link to="/recipient/browseItems">
                <Search className="h-5 w-5 mr-2" />
                Browse Available Items
              </Link>
            </Button>
          </div>

          {/* Impact Summary */}
          <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.totalRequests}</div>
                  <div className="text-blue-100">Total Requests</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.approvedRequests}</div>
                  <div className="text-blue-100">Items Received</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.peopleHelped}</div>
                  <div className="text-blue-100">People Helped</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Building className="h-6 w-6 mr-2" />
                    <span className="text-lg font-semibold">Verified NGO</span>
                  </div>
                  <div className="text-blue-100">Organization Status</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.availableItems}</div>
                  <div className="text-sm text-gray-600">Available Items</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</div>
                  <div className="text-sm text-gray-600">Pending Requests</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.approvedRequests}</div>
                  <div className="text-sm text-gray-600">Approved Items</div>
                </CardContent>
              </Card>
            </div>

            {/* My Requests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  <span>My Recent Requests</span>
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/recipient/my-requests">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userRequests.slice(0, 3).map((request) => {
                    const donation = availableDonations.find(d => d.id === request.donationId);
                    return (
                      <div key={request.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <img 
                          src={donation?.images?.[0] || '/api/placeholder/64/64'} 
                          alt={request.donationTitle}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{request.donationTitle}</h4>
                          <p className="text-sm text-gray-600">
                            Requested {request.requestedQuantity} items • Sizes: {request.requestedSizes?.join(', ')}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusIcon(request.status)}
                            <Badge className={getStatusColor(request.status)}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                            <Badge className={getUrgencyColor(request.urgencyLevel)}>
                              {request.urgencyLevel} priority
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-blue-600">
                            {Math.round(request.aiMatchScore * 100)}% Match
                          </div>
                          {request.status === 'approved' && request.expectedDelivery && (
                            <div className="text-xs text-gray-600 mt-1">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              Due: {request.expectedDelivery}
                            </div>
                          )}
                          <Button variant="ghost" size="sm" className="mt-1">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {userRequests.length === 0 && (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">You haven't made any requests yet.</p>
                      <Button asChild>
                        <Link to="/recipient/browseItems">Browse Available Donations</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Featured Available Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <span>Recommended For You</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableDonations.slice(0, 4).map((donation) => (
                    <div key={donation.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <img 
                        src={donation.images?.[0] || '/api/placeholder/400/200'} 
                        alt={donation.title}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-4">
                        <h4 className="font-medium text-gray-900 mb-1">{donation.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {donation.quantity} items • {donation.category}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className="text-xs bg-green-100 text-green-800">
                              {donation.condition}
                            </Badge>
                            <span className="text-xs text-gray-500">{donation.location}</span>
                          </div>
                          <Button size="sm" variant="outline">
                            Request
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {availableDonations.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No items available at the moment.</p>
                    <p className="text-sm text-gray-500">Check back later for new donations!</p>
                  </div>
                )}

                <div className="mt-4 text-center">
                  <Button variant="outline" asChild>
                    <Link to="/recipient/browseItems">View More Items</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Request Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <span>Monthly Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Items Received</span>
                    <span>{stats.approvedRequests}/10</span>
                  </div>
                  <Progress value={(stats.approvedRequests / 10) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>People Helped</span>
                    <span>{stats.peopleHelped}/20</span>
                  </div>
                  <Progress value={(stats.peopleHelped / 20) * 100} className="h-2" />
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-600">
                    Great progress! You've helped {stats.peopleHelped} people this month. 👏
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
                  <Link to="/recipient/browseItems">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Items
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link to="/recipient/my-requests">
                    <Heart className="h-4 w-4 mr-2" />
                    Track My Requests
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link to="/recipient/organizations">
                    <Building className="h-4 w-4 mr-2" />
                    Partner Organizations
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userNotifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className={`w-2 h-2 rounded-full mt-2 ${notification.read ? 'bg-gray-300' : 'bg-blue-500'}`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      </div>
                    </div>
                  ))}
                  {userNotifications.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No notifications yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Organization Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-purple-600" />
                  <span>Organization</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.organization}</div>
                    <div className="text-xs text-gray-600">{user.location}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      Verified
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      Active Partner
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to="/recipient/RecipientProfile">
                      Update Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipientDashboard;