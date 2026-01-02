import React, { useMemo, useState } from 'react'; // Added useState
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext'; 
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'; // Import Dialog
import AIRecommendationsWidget from './AIRecommendationsWidget';
import TrackingTimeline from '../TrackingTimeline'; // Import the new component
import { 
  Plus, 
  Package, 
  Heart, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Gift,
  Users,
  BarChart3,
  Truck // Added Truck icon
} from 'lucide-react';

const DonorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { donations, loadingStates } = useApp();
  
  // 💡 NEW: State for tracking modal
  const [trackingDonation, setTrackingDonation] = useState(null);

  const { stats, recentDonations } = useMemo(() => {
    const userDonations = donations || []; 

    if (userDonations.length === 0) {
      return { 
        stats: {
          totalDonations: 0,
          pendingDonations: 0,
          activeDonations: 0,
          completedDonations: 0,
          totalImpact: 0
        }, 
        recentDonations: [] 
      };
    }
    
    const totalDonations = userDonations.length;
    const pendingDonations = userDonations.filter(d => d.status === 'pending').length;
    const activeDonations = userDonations.filter(d => 
      ['approved', 'matched', 'pickup_scheduled', 'in_transit'].includes(d.status)
    ).length;
    const completedDonations = userDonations.filter(d => d.status === 'completed').length;
    const totalImpact = userDonations.reduce((sum, d) => sum + (d.quantity || 0), 0);
    
    const sortedDonations = [...userDonations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return {
      stats: { totalDonations, pendingDonations, activeDonations, completedDonations, totalImpact },
      recentDonations: sortedDonations.slice(0, 5)
    };
  }, [donations]);

  const handleStatusCheck = (status) => {
    navigate(`/donor/my-donations?status=${status}`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>,
      approved: <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>,
      rejected: <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>,
      matched: <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Matched</Badge>,
      completed: <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Completed</Badge>,
      pickup_scheduled: <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">Scheduled</Badge>,
    };
    return badges[status] || <Badge>{status}</Badge>;
  };

  const isLoading = loadingStates.userDonations; 

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your donation history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'Donor'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your donations today.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card onClick={() => handleStatusCheck('all')} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Donations</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDonations}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full"><Gift className="h-6 w-6 text-blue-600" /></div>
                  </div>
                </CardContent>
              </Card>
              <Card onClick={() => handleStatusCheck('pending')} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Review</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingDonations}</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-full"><Clock className="h-6 w-6 text-yellow-600" /></div>
                  </div>
                </CardContent>
              </Card>
              <Card onClick={() => handleStatusCheck('approved')} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active / Matched</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeDonations}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full"><Package className="h-6 w-6 text-green-600" /></div>
                  </div>
                </CardContent>
              </Card>
              <Card onClick={() => handleStatusCheck('completed')} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedDonations}</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full"><CheckCircle className="h-6 w-6 text-purple-600" /></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Button className="w-full h-auto py-6 flex flex-col items-center gap-2" onClick={() => navigate('/donor/donate')}>
                    <Plus className="h-6 w-6" /><span>Create Donation</span>
                  </Button>
                  <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-2" onClick={() => navigate('/donor/my-donations')}>
                    <Package className="h-6 w-6" /><span>My Donations</span>
                  </Button>
                  <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-2" onClick={() => navigate('/donor/donation-requests')}>
                    <Users className="h-6 w-6" /><span>View Requests</span>
                  </Button>
                  <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-2" onClick={() => navigate('/donor/browseNeeds')}>
                    <Heart className="h-6 w-6" /><span>Browse Needs</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Donations */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Donations</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/donor/my-donations')}>View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentDonations.length > 0 ? (
                  <div className="space-y-4">
                    {recentDonations.map((donation) => (
                      <div key={donation._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                        <div className="flex-1" onClick={() => navigate(`/donor/donations/${donation._id}`)}>
                          <h4 className="font-semibold text-gray-900">{donation.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{donation.category} • {donation.quantity} items</p>
                          <p className="text-xs text-gray-500 mt-1"><Clock className="h-3 w-3 inline mr-1" />{new Date(donation.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* 💡 NEW: Track Button */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrackingDonation(donation);
                            }}
                            title="Track Donation"
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                          {getStatusBadge(donation.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" /><p>No donations yet</p>
                    <Button className="mt-4" onClick={() => navigate('/donor/donate')}>Create Your First Donation</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <AIRecommendationsWidget />
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader><CardTitle className="flex items-center gap-2 text-green-900"><TrendingUp className="h-5 w-5 text-green-600" />Your Impact</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-4xl font-bold text-green-600 mb-1">{stats.totalImpact || 0}</div>
                    <div className="text-sm text-gray-600">Total Items Donated</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-4xl font-bold text-blue-600 mb-1">{stats.totalImpact * 3 || 0}</div>
                    <div className="text-sm text-gray-600">Estimated Lives Touched</div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/donor/ai-insights')}><BarChart3 className="h-4 w-4 mr-2" />View Analytics</Button>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader><CardTitle className="text-blue-900">💡 Donation Tip</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-blue-800">Clean and fold clothes before donation. Items in better condition have higher acceptance rates by NGOs!</p></CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 💡 NEW: Tracking Modal */}
      <Dialog open={!!trackingDonation} onOpenChange={(open) => !open && setTrackingDonation(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Track Donation
            </DialogTitle>
          </DialogHeader>
          {trackingDonation && (
            <div className="mt-4">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">{trackingDonation.title}</h4>
                <p className="text-sm text-gray-500">ID: {trackingDonation._id}</p>
              </div>
              <TrackingTimeline status={trackingDonation.status} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DonorDashboard;