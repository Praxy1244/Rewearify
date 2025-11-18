import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Package, Heart, Clock, Download, Settings, Brain, ShieldAlert, Map as MapIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';

// Services
import { adminService } from '../../services'; // Your existing admin service
import aiService from '../../services/aiService'; // New AI Service

// AI Widgets
import { AnalyticsWidget, FraudAlertWidget, LogisticsClusterWidget } from '../AI';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // State
  const [dashboardData, setDashboardData] = useState({
    users: {},
    donations: {},
    requests: {},
    matches: {},
    systemHealth: {}
  });
  const [pendingDonations, setPendingDonations] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  
  // AI State
  const [aiForecast, setAiForecast] = useState([]);
  const [aiClusters, setAiClusters] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Parallel Data Fetching: Admin Data + AI Data
        const [
          statsResponse,
          donationsResponse,
          requestsResponse,
          forecastResponse,
          clustersResponse
        ] = await Promise.all([
          adminService.getDashboardData(),
          adminService.getAllDonations({ status: 'pending', limit: 10 }), // Fetch more to find flags
          adminService.getAllRequests({ status: 'pending', limit: 5 }),
          aiService.getForecast().catch(err => ({ data: { trendData: [] } })), // Graceful fail for AI
          aiService.getClusters().catch(err => ({ data: { clusters: [] } }))
        ]);

        // 1. Set Basic Stats
        if (statsResponse.success) setDashboardData(statsResponse.data);
        if (requestsResponse.success) setPendingRequests(requestsResponse.data.requests || []);

        // 2. Set Donations & Extract Fraud Alerts
        if (donationsResponse.success) {
          const allPending = donationsResponse.data.donations || [];
          setPendingDonations(allPending.slice(0, 5)); // Show top 5 in list

          // Filter for donations flagged by AI (isFlagged field from backend)
          const flagged = allPending.filter(d => d.isFlagged).map(d => ({
            id: d._id,
            reason: d.flagReason || "AI detected anomaly",
            riskScore: d.riskScore || 50,
            donor: d.donor?.name
          }));
          setFraudAlerts(flagged);
        }

        // 3. Set AI Data
        if (forecastResponse.data) setAiForecast(forecastResponse.data.trendData);
        if (clustersResponse.data) setAiClusters(clustersResponse.data.clusters);
        
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const { users = {}, donations = {}, matches = {}, systemHealth = {} } = dashboardData;

  // --- Helper Components ---
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

  const DonationCard = ({ donation }) => (
    <div className="flex items-center space-x-4 p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
      <img 
        src={donation.images?.[0]?.url || 'https://placehold.co/60x60/E2E8F0/4A5568?text=Img'} 
        alt={donation.title}
        className="w-12 h-12 rounded-lg object-cover"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900">{donation.title}</h4>
            {donation.isFlagged && (
                <Badge variant="destructive" className="h-5 text-[10px] px-1">
                    AI FLAGGED
                </Badge>
            )}
        </div>
        <p className="text-sm text-gray-600">by {donation.donor?.name || 'N/A'}</p>
      </div>
      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/donations/${donation._id}`)}>
        Review
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform Overview & AI-Powered Management</p>
        </div>
        <div className="flex space-x-3">
            <Button variant="outline" onClick={() => navigate('/admin/ai-settings')}>
                <Settings className="h-4 w-4 mr-2" /> Settings
            </Button>
            <Button onClick={() => navigate('/admin/reports')}>
                <Download className="h-4 w-4 mr-2" /> Export
            </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={users.total?.toLocaleString() || 0}
          change={`+${users.newThisMonth || 0} this month`}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Donations"
          value={donations.total?.toLocaleString() || 0}
          change={`+${donations.newThisWeek || 0} this week`}
          icon={Package}
          color="bg-green-500"
        />
        <StatCard
          title="Matches Made"
          value={matches.completed?.toLocaleString() || 0}
          change="AI Matching Active"
          icon={Heart}
          color="bg-red-500"
        />
        <StatCard
          title="Pending Review"
          value={donations.pending || 0}
          change={`${fraudAlerts.length} High Risk Items`}
          icon={Clock}
          color="bg-orange-500"
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="fraud">Security ({fraudAlerts.length})</TabsTrigger>
          <TabsTrigger value="logistics">Logistics</TabsTrigger>
        </TabsList>

        {/* 1. Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Donations List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-green-500" />
                  <span>Pending Donations</span>
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/donations')}>View All</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingDonations.length > 0 ? (
                  pendingDonations.map(d => <DonationCard key={d._id} donation={d} />)
                ) : (
                  <p className="text-center text-gray-500 py-4">No pending donations.</p>
                )}
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Brain className="h-5 w-5 text-purple-500" />
                        <span>System Health</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-2 text-sm">
                            <span>AI Model Accuracy</span>
                            <span className="text-green-600 font-medium">92%</span>
                        </div>
                        <Progress value={92} className="h-2" />
                    </div>
                    <div>
                        <div className="flex justify-between mb-2 text-sm">
                            <span>Platform Load</span>
                            <span className="text-blue-600 font-medium">{systemHealth.platformUtilization || 45}%</span>
                        </div>
                        <Progress value={systemHealth.platformUtilization || 45} className="h-2" />
                    </div>
                </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AnalyticsWidget data={aiForecast} />
                </div>
                <div>
                    <Card className="h-full border-l-4 border-l-indigo-500">
                        <CardHeader>
                            <CardTitle>AI Summary</CardTitle>
                            <CardDescription>Automated insights generated today</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-indigo-50 rounded-md text-sm text-indigo-800">
                                <strong>Trend Alert:</strong> High demand for "Winter Clothes" detected in North Zone.
                            </div>
                            <div className="p-3 bg-green-50 rounded-md text-sm text-green-800">
                                <strong>Matching:</strong> 85% of donations matched within 1 hour.
                            </div>
                        </CardContent>
                    </Card>
                </div>
             </div>
        </TabsContent>

        {/* 3. Fraud Detection Tab */}
        <TabsContent value="fraud" className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FraudAlertWidget 
                    alerts={fraudAlerts} 
                    onReview={(id) => navigate(`/admin/donations/${id}`)} 
                />
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                            Security Protocols
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">
                            The AI model flags donations with abnormally high quantities, new user accounts with high-value items, or description mismatches. 
                            Please review flagged items carefully before approval.
                        </p>
                    </CardContent>
                </Card>
             </div>
        </TabsContent>

        {/* 4. Logistics Tab */}
        <TabsContent value="logistics">
             <div className="h-[500px]">
                 <LogisticsClusterWidget clusters={aiClusters} />
             </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default AdminDashboard;