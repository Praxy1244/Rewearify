import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
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
  RefreshCw,
  Network,
  MapPin,
  Layers,
  Target,
  Building2,
  BarChart3
} from 'lucide-react';
import { adminService } from '../../services';
import { toast } from 'sonner';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [clusters, setClusters] = useState({});
  const [clusterStats, setClusterStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clusterLoading, setClusterLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
    fetchClusteringData();
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

  const fetchClusteringData = async () => {
    try {
      setClusterLoading(true);
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      // Fetch clusters and stats in parallel
      const [clustersRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/clustering/clusters`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/clustering/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (clustersRes.data.success) {
        setClusters(clustersRes.data.data.clusters || {});
      }

      if (statsRes.data.success) {
        setClusterStats(statsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching clustering data:', err);
      // Don't show error toast - clustering is optional
    } finally {
      setClusterLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAnalytics(), fetchClusteringData()]);
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  const handleSyncClusters = async () => {
    try {
      toast.loading('Syncing NGO data...', { id: 'sync' });
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      await axios.post(
        `${API_URL}/api/clustering/sync`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchClusteringData();
      toast.success('NGO data synced successfully', { id: 'sync' });
    } catch (err) {
      console.error('Sync error:', err);
      toast.error('Failed to sync data', { id: 'sync' });
    }
  };

  const handleExport = () => {
    const exportData = {
      analytics,
      clusters,
      clusterStats,
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rewearify-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success('Analytics data exported');
  };

  const getClusterColor = (index) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-blue-500',
      'from-yellow-500 to-orange-500'
    ];
    return colors[index % colors.length];
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

  // Fallback data structure
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

      {/* Tabs for different analytics sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="clustering">
            <Network className="h-4 w-4 mr-2" />
            NGO Clustering
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
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
        </TabsContent>

        {/* NGO Clustering Tab */}
        <TabsContent value="clustering" className="space-y-6 mt-6">
          {clusterLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading clustering data...</p>
              </div>
            </div>
          ) : clusterStats ? (
            <>
              {/* Clustering Stats Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Network className="h-6 w-6 text-blue-600" />
                    NGO Clustering Analysis
                  </h2>
                  <p className="text-gray-600 mt-1">AI-powered geographic and behavioral clustering</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSyncClusters}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync NGO Data
                </Button>
              </div>

              {/* Clustering Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-100">Total Clusters</p>
                        <p className="text-3xl font-bold">{clusterStats.total_clusters}</p>
                      </div>
                      <Layers className="h-8 w-8 opacity-80" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-100">Total NGOs</p>
                        <p className="text-3xl font-bold">{clusterStats.total_ngos}</p>
                      </div>
                      <Building2 className="h-8 w-8 opacity-80" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-100">Total Capacity</p>
                        <p className="text-3xl font-bold">
                          {clusterStats.total_capacity ? clusterStats.total_capacity.toLocaleString() : 0}
                        </p>
                        <p className="text-xs text-green-100 mt-1">items/week</p>
                      </div>
                      <TrendingUp className="h-8 w-8 opacity-80" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-100">Urgent Needs</p>
                        <p className="text-3xl font-bold">{clusterStats.urgent_needs}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 opacity-80" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cluster Distribution Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Cluster Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Geographic Clusters:</span>
                      <Badge className="bg-blue-100 text-blue-800 font-bold">
                        {clusterStats.geographic_clusters}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Behavioral Clusters:</span>
                      <Badge className="bg-purple-100 text-purple-800 font-bold">
                        {clusterStats.behavioral_clusters}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg. Cluster Size:</span>
                      <span className="font-bold text-gray-900">
                        {clusterStats.avg_cluster_size ? clusterStats.avg_cluster_size.toFixed(1) : 0} NGOs
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Largest Cluster:</span>
                      <span className="font-bold text-gray-900">
                        {clusterStats.largest_cluster ? clusterStats.largest_cluster.size : 0} NGOs
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Smallest Cluster:</span>
                      <span className="font-bold text-gray-900">
                        {clusterStats.smallest_cluster ? clusterStats.smallest_cluster.size : 0} NGOs
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-600" />
                      Geographic Coverage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3">
                      <div className="text-sm text-gray-600 mb-2">Cities Covered:</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {clusterStats.cities_covered ? clusterStats.cities_covered.length : 0}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {clusterStats.cities_covered &&
                        clusterStats.cities_covered.slice(0, 12).map((city, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            {city}
                          </Badge>
                        ))}
                      {clusterStats.cities_covered && clusterStats.cities_covered.length > 12 && (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700">
                          +{clusterStats.cities_covered.length - 12} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cluster Cards Preview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      Cluster Overview
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = '/admin/clustering'}
                    >
                      View Full Analysis
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(clusters).slice(0, 6).map(([clusterId, cluster], index) => (
                      <div
                        key={clusterId}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => window.location.href = '/admin/clustering'}
                      >
                        <div className={`bg-gradient-to-r ${getClusterColor(index)} p-3 text-white`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">{clusterId}</span>
                            {cluster.urgent_needs > 0 && (
                              <Badge className="bg-red-500 text-white text-xs">
                                {cluster.urgent_needs} Urgent
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs mt-1 opacity-90">
                            <Users className="w-3 h-3" />
                            <span>{cluster.ngo_count} NGOs</span>
                          </div>
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="w-3 h-3" />
                            <span>{cluster.cities ? cluster.cities.slice(0, 2).join(', ') : 'N/A'}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-green-50 rounded p-2">
                              <div className="text-green-700 font-semibold">Capacity</div>
                              <div className="text-green-900 font-bold">
                                {cluster.total_capacity || 0}
                              </div>
                            </div>
                            <div className="bg-purple-50 rounded p-2">
                              <div className="text-purple-700 font-semibold">Avg</div>
                              <div className="text-purple-900 font-bold">
                                {cluster.avg_capacity ? cluster.avg_capacity.toFixed(0) : 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {Object.keys(clusters).length > 6 && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-500">
                        Showing 6 of {Object.keys(clusters).length} clusters
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Network className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Clustering Data Available
                </h3>
                <p className="text-gray-600 mb-6">
                  Sync NGO data to generate clustering analysis
                </p>
                <Button onClick={handleSyncClusters}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Data Now
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {safeAnalytics.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {safeAnalytics.recentActivity.slice(0, 15).map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
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
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
