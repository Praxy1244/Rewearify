import React, { useState } from 'react';
import { TrendingUp, Users, Package, Heart, Activity, Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { mockAnalytics, mockChartData } from '../../adminmock';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('6months');
  const { userStats, donationStats, matchStats, systemHealth } = mockAnalytics;
  const { userGrowth, donationTrends, categoryDistribution } = mockChartData;

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

  const MetricCard = ({ title, value, change, icon: Icon, color, progress }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {change && (
          <p className="text-xs text-green-600 mt-1 flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            {change}% vs last period
          </p>
        )}
        {progress !== undefined && (
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">{progress}% utilization</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Platform insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={userStats.totalUsers.toLocaleString()}
          change={userStats.userGrowth}
          icon={Users}
          color="bg-blue-500"
        />
        <MetricCard
          title="Total Donations"
          value={donationStats.totalDonations.toLocaleString()}
          change={donationStats.donationGrowth}
          icon={Package}
          color="bg-green-500"
        />
        <MetricCard
          title="Match Rate"
          value={`${matchStats.matchRate}%`}
          change={5.2}
          icon={Heart}
          color="bg-red-500"
          progress={matchStats.matchRate}
        />
        <MetricCard
          title="System Health"
          value={`${systemHealth.serverUptime}%`}
          change={0.1}
          icon={Activity}
          color="bg-purple-500"
          progress={systemHealth.serverUptime}
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <span>User Growth Trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                      name="Total Users"
                    />
                    <Area
                      type="monotone"
                      dataKey="donors"
                      stackId="2"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.6}
                      name="Donors"
                    />
                    <Area
                      type="monotone"
                      dataKey="ngos"
                      stackId="3"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.6}
                      name="NGOs"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-green-500" />
                  <span>Donation Categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Donation Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-green-500" />
                <span>Donation Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={donationTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="donations"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    name="Total Donations"
                  />
                  <Line
                    type="monotone"
                    dataKey="approved"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Approved"
                  />
                  <Line
                    type="monotone"
                    dataKey="rejected"
                    stroke="#EF4444"
                    strokeWidth={2}
                    name="Rejected"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Active Users</span>
                  <span className="font-bold">{userStats.activeUsers.toLocaleString()}</span>
                </div>
                <Progress value={(userStats.activeUsers / userStats.totalUsers) * 100} />
                <div className="flex justify-between items-center">
                  <span>New Users This Month</span>
                  <span className="font-bold text-green-600">+{userStats.newUsersThisMonth}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Growth Rate</span>
                  <span className="font-bold text-green-600">+{userStats.userGrowth}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="donors" fill="#10B981" name="Donors" />
                    <Bar dataKey="ngos" fill="#3B82F6" name="NGOs" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="donations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Donation Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Donations</span>
                  <span className="font-bold">{donationStats.totalDonations.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Approved</span>
                  <span className="font-bold text-green-600">{donationStats.approvedDonations.toLocaleString()}</span>
                </div>
                <Progress value={(donationStats.approvedDonations / donationStats.totalDonations) * 100} />
                <div className="flex justify-between items-center">
                  <span>Pending</span>
                  <span className="font-bold text-yellow-600">{donationStats.pendingDonations.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Rejected</span>
                  <span className="font-bold text-red-600">{donationStats.rejectedDonations.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Monthly Donation Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={donationTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="approved"
                      stackId="1"
                      stroke="#10B981"
                      fill="#10B981"
                      name="Approved"
                    />
                    <Area
                      type="monotone"
                      dataKey="rejected"
                      stackId="1"
                      stroke="#EF4444"
                      fill="#EF4444"
                      name="Rejected"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Platform Utilization</span>
                    <span className="text-sm text-gray-600">{systemHealth.platformUtilization}%</span>
                  </div>
                  <Progress value={systemHealth.platformUtilization} />
                  <span className="text-xs text-green-600 mt-1">Healthy</span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">AI System Performance</span>
                    <span className="text-sm text-gray-600">{systemHealth.aiSystemPerformance}%</span>
                  </div>
                  <Progress value={systemHealth.aiSystemPerformance} />
                  <span className="text-xs text-green-600 mt-1">Excellent</span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">User Satisfaction</span>
                    <span className="text-sm text-gray-600">{systemHealth.userSatisfaction}%</span>
                  </div>
                  <Progress value={systemHealth.userSatisfaction} />
                  <span className="text-xs text-green-600 mt-1">Very Good</span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Server Uptime</span>
                    <span className="text-sm text-gray-600">{systemHealth.serverUptime}%</span>
                  </div>
                  <Progress value={systemHealth.serverUptime} />
                  <span className="text-xs text-green-600 mt-1">Excellent</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Match Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {matchStats.matchRate}%
                  </div>
                  <p className="text-gray-600">Success Rate</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Total Matches</span>
                    <span className="font-bold">{matchStats.totalMatches.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Successful</span>
                    <span className="font-bold text-green-600">{matchStats.successfulMatches.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pending</span>
                    <span className="font-bold text-yellow-600">{matchStats.pendingMatches.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;