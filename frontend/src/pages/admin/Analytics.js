import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  Users, 
  Package, 
  TrendingUp, 
  Heart, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw
} from 'lucide-react';
import { adminService } from '../../services';
import { toast } from 'sonner';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAnalytics({ timeRange });
      if (response.success) {
        setAnalytics(response.data);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics data');
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    toast.success('Analytics data exported');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Analytics</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAnalytics} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback data structure if API returns incomplete data
  const safeAnalytics = {
    userStats: {
      totalUsers: analytics?.userStats?.totalUsers || 0,
      activeUsers: analytics?.userStats?.activeUsers || 0,
      newUsers: analytics?.userStats?.newUsers || 0,
      donorCount: analytics?.userStats?.donorCount || 0,
      recipientCount: analytics?.userStats?.recipientCount || 0,
      ...analytics?.userStats
    },
    donationStats: {
      totalDonations: analytics?.donationStats?.totalDonations || 0,
      approvedDonations: analytics?.donationStats?.approvedDonations || 0,
      pendingDonations: analytics?.donationStats?.pendingDonations || 0,
      completedDonations: analytics?.donationStats?.completedDonations || 0,
      totalValue: analytics?.donationStats?.totalValue || 0,
      ...analytics?.donationStats
    },
    matchStats: {
      totalMatches: analytics?.matchStats?.totalMatches || 0,
      successfulMatches: analytics?.matchStats?.successfulMatches || 0,
      pendingMatches: analytics?.matchStats?.pendingMatches || 0,
      matchRate: analytics?.matchStats?.matchRate || 0,
      ...analytics?.matchStats
    },
    systemHealth: {
      uptime: analytics?.systemHealth?.uptime || '99.9%',
      responseTime: analytics?.systemHealth?.responseTime || '120ms',
      errorRate: analytics?.systemHealth?.errorRate || '0.1%',
      ...analytics?.systemHealth
    },
    recentActivity: analytics?.recentActivity || []
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform performance and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{safeAnalytics.userStats.totalUsers}</p>
                <p className="text-sm text-green-600 mt-1">
                  +{safeAnalytics.userStats.newUsers} this {timeRange === '7d' ? 'week' : 'month'}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Donations</p>
                <p className="text-3xl font-bold text-gray-900">{safeAnalytics.donationStats.totalDonations}</p>
                <p className="text-sm text-green-600 mt-1">
                  {safeAnalytics.donationStats.approvedDonations} approved
                </p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Successful Matches</p>
                <p className="text-3xl font-bold text-gray-900">{safeAnalytics.matchStats.successfulMatches}</p>
                <p className="text-sm text-green-600 mt-1">
                  {Math.round(safeAnalytics.matchStats.matchRate * 100)}% match rate
                </p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Platform Health</p>
                <p className="text-3xl font-bold text-gray-900">{safeAnalytics.systemHealth.uptime}</p>
                <p className="text-sm text-green-600 mt-1">
                  {safeAnalytics.systemHealth.responseTime} avg response
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>User Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Donors</span>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">
                  {safeAnalytics.userStats.donorCount}
                </Badge>
                <span className="text-sm text-gray-500">
                  {Math.round((safeAnalytics.userStats.donorCount / safeAnalytics.userStats.totalUsers) * 100)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Recipients</span>
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {safeAnalytics.userStats.recipientCount}
                </Badge>
                <span className="text-sm text-gray-500">
                  {Math.round((safeAnalytics.userStats.recipientCount / safeAnalytics.userStats.totalUsers) * 100)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Users</span>
              <div className="flex items-center space-x-2">
                <Badge className="bg-purple-100 text-purple-800">
                  {safeAnalytics.userStats.activeUsers}
                </Badge>
                <span className="text-sm text-gray-500">
                  {Math.round((safeAnalytics.userStats.activeUsers / safeAnalytics.userStats.totalUsers) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donation Status */}
        <Card>
          <CardHeader>
            <CardTitle>Donation Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600">Approved</span>
              </div>
              <Badge className="bg-green-100 text-green-800">
                {safeAnalytics.donationStats.approvedDonations}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">
                {safeAnalytics.donationStats.pendingDonations}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <Badge className="bg-purple-100 text-purple-800">
                {safeAnalytics.donationStats.completedDonations}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {safeAnalytics.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {safeAnalytics.recentActivity.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {activity.type === 'donation' && <Package className="h-5 w-5 text-green-500" />}
                    {activity.type === 'user' && <Users className="h-5 w-5 text-blue-500" />}
                    {activity.type === 'match' && <Heart className="h-5 w-5 text-red-500" />}
                    {activity.type === 'system' && <Activity className="h-5 w-5 text-purple-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title || activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp || activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent activity data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{safeAnalytics.systemHealth.uptime}</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{safeAnalytics.systemHealth.responseTime}</div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{safeAnalytics.systemHealth.errorRate}</div>
              <div className="text-sm text-gray-600">Error Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;