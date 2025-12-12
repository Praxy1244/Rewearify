import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { Spinner } from '../ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Search, 
  Package, 
  Heart, 
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Building,
  Truck,
  Calendar,
  TrendingUp,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

// --- AI Feature Imports ---
import { RequestSuggestions } from '../AI/RequestSuggestions';
import { getDonorTrends } from '../../services/aiService';
import { requestService } from '../../services'; // Import requestService

const RecipientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { 
    allDonations,
    userRequests,
    notifications, 
    loadingStates,
    fetchAvailableDonations,
    fetchUserRequests,
    fetchNotifications
  } = useApp();
  
  const [dashboardLoading, setDashboardLoading] = useState(true);
  
  // --- AI State ---
  const [trends, setTrends] = useState([]);
  
  // --- Request Modal State ---
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: '', 
    quantity: 1,
    urgency: 'medium',
    justification: '',
    deliveryAddress: ''
  });

  const [submitting, setSubmitting] = useState(false);

  // Main Dashboard Data Fetch
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setDashboardLoading(true);
        await Promise.all([
          fetchAvailableDonations({ status: 'approved' }),
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

  // --- AI Feature: Fetch Trends (Independent Effect) ---

useEffect(() => {
  const loadTrends = async () => {
    try {
      console.log('🔍 Fetching trends...');
      const apiResponse = await getDonorTrends(); // ✅ Changed variable name
      console.log('📊 Trends response:', apiResponse);
      
      // ✅ FIXED: Handle nested data structure
      if (apiResponse.success && apiResponse.data) {
        // The actual trends might be in apiResponse.data.data or apiResponse.data.trending
        const dataObj = apiResponse.data;
        
        // Check if data has a nested data or trending property
        const trendsData = dataObj.data?.trending || 
                          dataObj.data?.trends || 
                          dataObj.trending || 
                          dataObj.trends || 
                          [];
        
        if (Array.isArray(trendsData) && trendsData.length > 0) {
          console.log('✅ Setting trends:', trendsData);
          setTrends(trendsData);
        } else {
          console.log('⚠️ No trends array found, using fallback');
          // Fallback to mock data
          setTrends([
            { category: "Winter Wear", demand: 85, trend: "up" },
            { category: "School Supplies", demand: 72, trend: "up" },
            { category: "Food Items", demand: 68, trend: "stable" }
          ]);
        }
      } else {
        console.log('⚠️ No data in response');
        // Use fallback
        setTrends([
          { category: "Winter Wear", demand: 85, trend: "up" },
          { category: "School Supplies", demand: 72, trend: "up" }
        ]);
      }
    } catch (err) {
      console.error('❌ Trends error:', err);
      console.log("AI Trends service unavailable - using fallback");
      // Fallback on error
      setTrends([
        { category: "Winter Wear", demand: 85, trend: "up" },
        { category: "School Supplies", demand: 72, trend: "up" }
      ]);
    }
  };
  loadTrends();
}, []);




  // --- Request Modal Functions ---
  const openRequestModal = (donation) => {
    setSelectedDonation(donation);
    setRequestForm({
      title: `Request for ${donation.title}`,
      quantity: 1,
      urgency: 'medium',
      justification: '',
      deliveryAddress: user.location?.address || ''
    });
    setRequestModalOpen(true);
  };

const handleRequestSubmit = async (e) => {
  e.preventDefault();
  
  if (!selectedDonation) {
    toast.error('No donation selected');
    return;
  }
  
  if (!user?._id) {
    toast.error('User not logged in');
    return;
  }
  
  try {
    setSubmitting(true);
    
    // ✅ FIXED: Match CreateRequest payload structure (same as BrowseItems)
    const requestPayload = {
      title: requestForm.title.trim(),
      description: requestForm.justification.trim(),
      category: selectedDonation.category,
      subcategory: selectedDonation.subcategory || 'Other', // ✅ ADD subcategory
      urgency: requestForm.urgency,
      quantity: parseInt(requestForm.quantity),
      
      // ✅ ADD sizes (optional, default to Various)
      sizes: selectedDonation.sizes || [{ size: 'Various', quantity: parseInt(requestForm.quantity) }],
      
      // ✅ ADD condition preferences
      condition: {
        acceptable: [selectedDonation.condition || 'good', 'fair'],
        minimum: 'fair'
      },
      
      beneficiaries: {
        count: parseInt(requestForm.quantity),
        ageGroup: 'mixed',
        gender: 'mixed'
      },
      
      location: {
        address: requestForm.deliveryAddress || user.location?.address || 'Not specified',
        city: user.location?.city || 'Not specified',
        state: user.location?.state || 'Not specified',
        country: user.location?.country || 'India',
        coordinates: user.location?.coordinates || {
          type: 'Point',
          coordinates: [0, 0]
        }
      },
      
      timeline: {
        neededBy: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        flexible: true
      },
      
      // ✅ ADD logistics
      logistics: {
        canPickup: true,
        pickupRadius: 25,
        needsDelivery: false,
        hasTransport: false
      },
      
      // ✅ OPTIONAL: Link to donation (if backend supports it)
      relatedDonation: selectedDonation._id
    };
    
    console.log('📦 Dashboard - Submitting request payload:', requestPayload);
    
    const response = await requestService.createRequest(requestPayload);
    
    if (response.success) {
      toast.success('Request submitted successfully! 🎉');
      setRequestModalOpen(false);
      setSelectedDonation(null);
      setRequestForm({
        title: '',
        quantity: 1,
        urgency: 'medium',
        justification: '',
        deliveryAddress: ''
      });
      
      // Refresh requests
      await fetchUserRequests();
    } else {
      throw new Error(response.message || 'Failed to submit request');
    }
  } catch (error) {
    console.error('❌ Dashboard - Error submitting request:', error);
    
    let errorMsg = error.message || 'Failed to submit request.';
    
    if (error.errors && Array.isArray(error.errors)) {
      error.errors.forEach(err => {
        toast.error(`${err.field}: ${err.message}`);
      });
    } else if (error.response?.data?.message) {
      errorMsg = error.response.data.message;
    } else if (error.data?.message) {
      errorMsg = error.data.message;
    }
    
    toast.error(errorMsg);
  } finally {
    setSubmitting(false);
  }
};

  const availableDonations = allDonations || [];
  const myRequests = userRequests || [];
  const myNotifications = notifications || [];

  const stats = {
    totalRequests: myRequests.length,
    approvedRequests: myRequests.filter(r => r.status === 'approved').length,
    pendingRequests: myRequests.filter(r => r.status === 'pending').length,
    availableItems: availableDonations.length,
    peopleHelped: user?.stats?.peopleHelped || 8
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

  const isLoading = dashboardLoading || loadingStates.userRequests || loadingStates.donations;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-2 text-lg">Loading your dashboard...</span>
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
              <AvatarImage src={user.profile?.profilePicture?.url} alt={user.name} />
              <AvatarFallback className="text-xl">{user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600 mt-1">
                {user.organization?.name || 'Your Organization'} • {user.location?.address || 'Your Location'}
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
                    <span className="text-lg font-semibold">
                      {user.organization?.verified ? "Verified NGO" : "Pending Verification"}
                    </span>
                  </div>
                  <div className="text-blue-100">Organization Status</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Left Column) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Stats Cards */}
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

            {/* My Requests List */}
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
                  {myRequests.slice(0, 3).map((request) => {
                    const donation = availableDonations.find(d => d._id === request.donation) || request.donation;
                    return (
                      <div key={request._id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <img 
                          src={donation?.images?.[0]?.url || 'https://placehold.co/64x64/e2e8f0/64748b?text=Img'} 
                          alt={donation?.title || 'Donation'}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{request.title || 'Requested Item'}</h4>
                          <p className="text-sm text-gray-600">
                            Requested {request.quantity} items
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusIcon(request.status)}
                            <Badge className={getStatusColor(request.status)}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                            {request.urgency && (
                              <Badge className={getUrgencyColor(request.urgency)}>
                                {request.urgency} priority
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {request.status === 'approved' && request.expectedDelivery && (
                            <div className="text-xs text-gray-600 mt-1">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              Due: {new Date(request.expectedDelivery).toLocaleDateString()}
                            </div>
                          )}
                          <Button variant="ghost" size="sm" className="mt-1" asChild>
                            <Link to={`/requests/${request._id}`}><Eye className="h-4 w-4" /></Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {myRequests.length === 0 && (
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
                    <div key={donation._id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <img 
                        src={donation.images?.[0]?.url || 'https://placehold.co/400x200/e2e8f0/64748b?text=Img'} 
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
                            <span className="text-xs text-gray-500">{donation.location?.city}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openRequestModal(donation)}
                          >
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

          {/* Sidebar Area (Right Column) */}
          <div className="space-y-6">

            {/* AI FEATURE: Smart Insights Widget */}
            {trends.length > 0 && (
              <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-emerald-800 text-lg">
                        <TrendingUp className="w-5 h-5" />
                        Smart Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-emerald-700 mb-3 font-medium">
                        High supply items available now:
                    </p>
                    <RequestSuggestions 
                        suggestions={trends} 
                        onSelect={(item) => navigate(`/recipient/browseItems?search=${item}`)} 
                    />
                </CardContent>
              </Card>
            )}

            {/* Monthly Progress */}
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
                <Button 
  onClick={() => navigate('/recipient/create-request')}
  className="bg-green-600 hover:bg-green-700"
>
  <Plus className="h-5 w-5 mr-2" />
  Create Request
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
                  {myNotifications.slice(0, 3).map((notification) => (
                    <div key={notification._id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className={`w-2 h-2 rounded-full mt-2 ${notification.status === 'read' ? 'bg-gray-300' : 'bg-blue-500'}`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      </div>
                    </div>
                  ))}
                  {myNotifications.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No notifications yet</p>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                  <Link to="/notifications">View All Notifications</Link>
                </Button>
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
                    <div className="text-sm font-medium text-gray-900">{user.organization?.name || 'Your Organization'}</div>
                    <div className="text-xs text-gray-600">{user.location?.address}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {user.organization?.verified ? "Verified" : "Not Verified"}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      Active Partner
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to="/recipient/profile">
                      Update Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Item</DialogTitle>
            <DialogDescription>
              Submit a request for: <strong>{selectedDonation?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Request Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder={`Request for ${selectedDonation?.title || 'item'}`}
                value={requestForm.title}
                onChange={(e) => setRequestForm({...requestForm, title: e.target.value})}
                required
                minLength={5}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                5-200 characters describing your request
              </p>
            </div>

            <div>
              <Label htmlFor="quantity">Quantity Needed *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedDonation?.quantity || 999}
                value={requestForm.quantity}
                onChange={(e) => setRequestForm({...requestForm, quantity: e.target.value})}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Available: {selectedDonation?.quantity || 0}
              </p>
            </div>

            <div>
              <Label htmlFor="urgency">Urgency Level *</Label>
              <Select 
                value={requestForm.urgency}
                onValueChange={(value) => setRequestForm({...requestForm, urgency: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Can wait</SelectItem>
                  <SelectItem value="medium">Medium - Needed soon</SelectItem>
                  <SelectItem value="high">High - Urgent need</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="justification">Justification/Reason *</Label>
              <Textarea
                id="justification"
                placeholder="Explain why you need this item and how it will be used..."
                value={requestForm.justification}
                onChange={(e) => setRequestForm({...requestForm, justification: e.target.value})}
                required
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="deliveryAddress">Delivery Address</Label>
              <Input
                id="deliveryAddress"
                placeholder={user.location?.address || "Enter delivery address"}
                value={requestForm.deliveryAddress}
                onChange={(e) => setRequestForm({...requestForm, deliveryAddress: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to use your organization address
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setRequestModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecipientDashboard;