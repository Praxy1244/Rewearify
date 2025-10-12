/* eslint-env browser */
import React from 'react';
import { Users, Package, Heart, Clock, Download, Settings, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { mockDonations, mockRequests, mockAnalytics } from '../../adminmock';
import { AIInsightsCard, FraudDetectionWidget, MatchingWidget } from '../AI';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { userStats, donationStats, matchStats, systemHealth } = mockAnalytics;
  const navigate = useNavigate();

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

  const DonationCard = ({ donation, type }) => (
    <div className="flex items-center space-x-4 p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
      <img 
        src={donation.images?.[0] || 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=60&h=60&fit=crop'} 
        alt={donation.itemType}
        className="w-12 h-12 rounded-lg object-cover"
      />
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{donation.itemType}</h4>
        <p className="text-sm text-gray-600">by {donation.donorName}</p>
        <div className="flex items-center space-x-2 mt-1">
          <Badge variant={donation.status === 'pending' ? 'secondary' : 'default'} className="text-xs">
            {donation.status}
          </Badge>
          <span className="text-xs text-gray-500">{donation.dateSubmitted}</span>
        </div>
      </div>
      <div className="flex space-x-2">
        {donation.status === 'pending' && (
          <>
            <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
              Approve
            </Button>
            <Button size="sm" variant="outline">
              Review
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const RequestCard = ({ request }) => (
    <div className="flex items-center space-x-4 p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
        <Package className="h-6 w-6 text-blue-600" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{request.ngoName}</h4>
        <p className="text-sm text-gray-600">{request.description}</p>
        <div className="flex items-center space-x-2 mt-1">
          <Badge variant={request.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
            {request.status}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {request.priority} priority
          </Badge>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
          Approve
        </Button>
        <Button size="sm" variant="outline">
          Review
        </Button>
      </div>
    </div>
  );

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
          value={userStats.totalUsers.toLocaleString()}
          change="+12% from last month"
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Donations"
          value={donationStats.totalDonations.toLocaleString()}
          change="+8% from last month"
          icon={Package}
          color="bg-green-500"
        />
        <StatCard
          title="AI Matches"
          value={matchStats.successfulMatches.toLocaleString()}
          change="+15% from last month"
          icon={Heart}
          color="bg-red-500"
        />
        <StatCard
          title="Pending Approvals"
          value={donationStats.pendingDonations}
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
                <Button variant="outline" size="sm">Filter</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockDonations.filter(d => d.status === 'pending').slice(0, 2).map(donation => (
                  <DonationCard key={donation.id} donation={donation} type="donation" />
                ))}
              </CardContent>
            </Card>

            {/* Pending Requests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>Pending Requests</span>
                </CardTitle>
                <Button variant="outline" size="sm">Filter</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockRequests.filter(r => r.status === 'pending').map(request => (
                  <RequestCard key={request.id} request={request} />
                ))}
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