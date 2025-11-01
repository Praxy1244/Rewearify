/* eslint-env browser */
import React from 'react';
import { Users, Package, Heart, Clock, Download, Settings, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { adminService } from '../../services';
import { AIInsightsCard, FraudDetectionWidget, MatchingWidget } from '../AI';
import { useNavigate } from 'react-router-dom';
// --- FIX 1: Remove mock data import ---
// import { mockDonations, mockRequests } from '../../adminmock.js'; 

const AdminDashboard = () => {
  // --- FIX 2: Add state for live data ---
  const [dashboardData, setDashboardData] = React.useState({
    users: {},
    donations: {},
    requests: {},
    matches: {},
    systemHealth: {}
  });
  const [pendingDonations, setPendingDonations] = React.useState([]);
  const [pendingRequests, setPendingRequests] = React.useState([]);
  
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const navigate = useNavigate();
  
  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // --- FIX 3: Fetch all data concurrently ---
        const [
          statsResponse,
          donationsResponse,
          requestsResponse
        ] = await Promise.all([
          adminService.getDashboardData(),
          adminService.getAllDonations({ status: 'pending', limit: 5 }),
          adminService.getAllRequests({ status: 'pending', limit: 5 })
        ]);

        if (statsResponse.success) {
          setDashboardData(statsResponse.data);
        } else {
          throw new Error(statsResponse.message || 'Failed to load dashboard stats');
        }

        if (donationsResponse.success) {
          setPendingDonations(donationsResponse.data.donations || []);
        } else {
          throw new Error(donationsResponse.message || 'Failed to load pending donations');
        }
        
        if (requestsResponse.success) {
          setPendingRequests(requestsResponse.data.requests || []);
        } else {
          throw new Error(requestsResponse.message || 'Failed to load pending requests');
        }
        
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Use safe defaults for stats
  const { users = {}, donations = {}, requests = {}, matches = {}, systemHealth = {} } = dashboardData;

  // --- FIX 4: Update Card components to use REAL data properties ---

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        <p className="text-xs text-green-600 mt-1">{change}</p>
      </CardContent>
    </Card>
  );

  // This component now uses real donation properties
  const DonationCard = ({ donation }) => (
    <div className="flex items-center space-x-4 p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
      <img 
        src={donation.images?.[0]?.url || 'https://placehold.co/60x60/E2E8F0/4A5568?text=Img'} 
        alt={donation.title}
        className="w-12 h-12 rounded-lg object-cover"
      />
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{donation.title}</h4>
        <p className="text-sm text-gray-600">by {donation.donor?.name || 'N/A'}</p>
        <div className="flex items-center space-x-2 mt-1">
          <Badge variant={'secondary'} className="text-xs">
            {donation.status}
          </Badge>
          <span className="text-xs text-gray-500">{new Date(donation.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex space-x-2">
        {donation.status === 'pending' && (
          <>
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/donations')}>
              Review
            </Button>
          </>
        )}
      </div>
    </div>
  );

  // This component now uses real request properties
  const RequestCard = ({ request }) => (
    <div className="flex items-center space-x-4 p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
        <Package className="h-6 w-6 text-blue-600" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{request.title}</h4>
        <p className="text-sm text-gray-600">by {request.requester?.organization?.name || request.requester?.name || 'N/A'}</p>
        <div className="flex items-center space-x-2 mt-1">
          <Badge variant={'secondary'} className="text-xs">
            {request.status}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {request.urgency} priority
          </Badge>
        </div>
      </div>
      <div className="flex space-x-2">
         <Button size="sm" variant="outline">
            Review
          </Button>
      </div>
    </div>
  );
  // --- END OF FIX 4 ---


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-2 bg-red-100 text-red-800 hover:bg-red-200"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform Overview & AI-Powered Management</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            className="flex items-center space-x-2"
            onClick={() => navigate('/ai/insights')}
          >
            <Brain className="h-4 w-4" />
            <span>AI Insights</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export Data</span>
          </Button>
          <Button className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={users.total?.toLocaleString() || 0}
          change={`+${users.newThisMonth || 0} from last month`}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Donations"
          value={donations.total?.toLocaleString() || 0}
          change={`+${donations.newThisWeek || 0} from last week`}
          icon={Package}
          color="bg-green-500"
        />
        <StatCard
          title="Successful Matches"
          value={matches.completed?.toLocaleString() || 0}
          change={`+${matches.newThisWeek || 0} from last week`}
          icon={Heart}
          color="bg-red-500"
        />
        <StatCard
          title="Pending Approvals"
          value={donations.pending || 0}
          change="Requires immediate attention"
          icon={Clock}
          color="bg-orange-500"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Donations */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-green-500" />
                  <span>Pending Donations</span>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/donations')}>View All</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* --- FIX 5: Use real data --- */}
                {pendingDonations.length > 0 ? (
                  pendingDonations.map(donation => (
                    <DonationCard key={donation._id} donation={donation} />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No pending donations. Great job!</p>
                )}
              </CardContent>
            </Card>

            {/* Pending Requests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>Pending Requests</span>
                </CardTitle>
                <Button variant="outline" size="sm">View All</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* --- FIX 6: Use real data --- */}
                {pendingRequests.length > 0 ? (
                  pendingRequests.map(request => (
                    <RequestCard key={request._id} request={request} />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No pending requests.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-purple-500" />
                <span>System Health</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Platform Utilization</span>
                    <span className="text-sm text-gray-600">{systemHealth.platformUtilization}%</span>
                  </div>
                  <Progress value={systemHealth.platformUtilization} className="h-2" />
                  <span className="text-xs text-green-600 mt-1">Healthy</span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">AI System Performance</span>
                    <span className="text-sm text-gray-600">{systemHealth.aiSystemPerformance}%</span>
                  </div>
                  <Progress value={systemHealth.aiSystemPerformance} className="h-2" />
                  <span className="text-xs text-green-600 mt-1">Excellent</span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">User Satisfaction</span>
                    <span className="text-sm text-gray-600">{systemHealth.userSatisfaction}%</span>
                  </div>
                  <Progress value={systemHealth.userSatisfaction} className="h-2" />
                  <span className="text-xs text-green-600 mt-1">Very Good</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          {/* AI Insights Integration */}
          <AIInsightsCard userRole="admin" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FraudDetectionWidget showBatchResults={true} />
            <MatchingWidget showTopMatches={true} />
          </div>
        </TabsContent>

        <TabsContent value="donations">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">Navigate to Manage Donations page for detailed view</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">Navigate to Manage Users page for detailed view</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">Navigate to Analytics page for detailed view</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;