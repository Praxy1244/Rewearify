import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Network,
  MapPin,
  Users,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Search,
  Filter,
  Download,
  AlertCircle,
  Activity,
  Layers,
  Target,
  Building2
} from 'lucide-react';

const NGOClustering = () => {
  const [clusters, setClusters] = useState({});
  const [allNgos, setAllNgos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    city: '',
    cause: '',
    minCapacity: '',
    urgentOnly: false
  });
  const [view, setView] = useState('overview'); // 'overview' | 'clusters' | 'ngos'

  useEffect(() => {
    fetchClusters();
    fetchStats();
  }, []);

  const buildAllNgos = (clusterObj) => {
    const list = [];
    Object.values(clusterObj).forEach((cluster) => {
      if (Array.isArray(cluster.ngos)) {
        list.push(...cluster.ngos);
      }
    });
    setAllNgos(list);
  };

  const fetchClusters = async (refresh = false) => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/clustering/clusters${
        refresh ? '?refresh=true' : ''
      }`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const clusterObj = response.data.data.clusters || {};
        setClusters(clusterObj);
        buildAllNgos(clusterObj);
      }
    } catch (err) {
      console.error('Error fetching clusters:', err);
      setError(err.response?.data?.message || 'Failed to load clusters');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/clustering/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('token');

      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/clustering/sync`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchClusters(true);
      await fetchStats();

      alert('Data synced successfully!');
    } catch (err) {
      console.error('Sync error:', err);
      alert('Failed to sync data');
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const params = new URLSearchParams();
      if (searchFilters.city) params.append('city', searchFilters.city);
      if (searchFilters.cause) params.append('cause', searchFilters.cause);
      if (searchFilters.minCapacity) params.append('minCapacity', searchFilters.minCapacity);
      if (searchFilters.urgentOnly) params.append('urgentOnly', 'true');

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/clustering/search?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const clusterObj = response.data.data.clusters || {};
        setClusters(clusterObj);
        buildAllNgos(clusterObj);
        setSelectedClusterId(null);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search clusters');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(clusters, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ngo-clusters-${new Date().toISOString()}.json`;
    link.click();
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

  const handleClickCluster = (clusterId) => {
    setSelectedClusterId(clusterId);
    setView('ngos');
  };

  const getVisibleNgos = () => {
    if (!selectedClusterId) {
      return allNgos;
    }
    const cluster = clusters[selectedClusterId];
    if (!cluster || !cluster.ngos) return [];
    return cluster.ngos;
  };

  if (loading && !Object.keys(clusters).length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clustering data...</p>
        </div>
      </div>
    );
  }

  const visibleNgos = getVisibleNgos();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Network className="w-10 h-10 text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-900">
                  NGO Clustering Analysis
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                AI-powered clustering of NGOs based on location and behavior
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Data'}
              </button>
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {['overview', 'clusters', 'ngos'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setView(tab);
                  if (tab === 'ngos') setSelectedClusterId(null);
                }}
                className={`px-4 py-2 font-semibold capitalize transition ${
                  view === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Statistics Overview */}
        {view === 'overview' && stats && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Layers className="w-8 h-8 opacity-80" />
                  <div className="text-3xl font-bold">{stats.total_clusters}</div>
                </div>
                <div className="text-blue-100 font-semibold">Total Clusters</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 opacity-80" />
                  <div className="text-3xl font-bold">{stats.total_ngos}</div>
                </div>
                <div className="text-purple-100 font-semibold">Total NGOs</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 opacity-80" />
                  <div className="text-3xl font-bold">
                    {stats.total_capacity && stats.total_capacity.toLocaleString()}
                  </div>
                </div>
                <div className="text-green-100 font-semibold">Total Capacity/Week</div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-8 h-8 opacity-80" />
                  <div className="text-3xl font-bold">{stats.urgent_needs}</div>
                </div>
                <div className="text-orange-100 font-semibold">Urgent Needs</div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Cluster Distribution
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Geographic Clusters:</span>
                    <span className="font-bold text-gray-900">
                      {stats.geographic_clusters}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg. Cluster Size:</span>
                    <span className="font-bold text-gray-900">
                      {stats.avg_cluster_size && stats.avg_cluster_size.toFixed(1)} NGOs
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Largest Cluster:</span>
                    <span className="font-bold text-gray-900">
                      {stats.largest_cluster && stats.largest_cluster.size} NGOs
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Smallest Cluster:</span>
                    <span className="font-bold text-gray-900">
                      {stats.smallest_cluster && stats.smallest_cluster.size} NGOs
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Cities Covered
                </h3>
                <div className="flex flex-wrap gap-2">
                  {stats.cities_covered &&
                    stats.cities_covered.slice(0, 15).map((city, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold"
                      >
                        {city}
                      </span>
                    ))}
                  {stats.cities_covered && stats.cities_covered.length > 15 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                      +{stats.cities_covered.length - 15} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clusters View */}
        {view === 'clusters' && (
          <div>
            {/* Search Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                Search & Filter
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="City"
                  value={searchFilters.city}
                  onChange={(e) =>
                    setSearchFilters({ ...searchFilters, city: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Cause"
                  value={searchFilters.cause}
                  onChange={(e) =>
                    setSearchFilters({ ...searchFilters, cause: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Min Capacity"
                  value={searchFilters.minCapacity}
                  onChange={(e) =>
                    setSearchFilters({ ...searchFilters, minCapacity: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={searchFilters.urgentOnly}
                      onChange={(e) =>
                        setSearchFilters({
                          ...searchFilters,
                          urgentOnly: e.target.checked
                        })
                      }
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Urgent Only</span>
                  </label>
                  <button
                    onClick={handleSearch}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Search className="w-4 h-4" />
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Cluster Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(clusters).map(([clusterId, cluster], index) => (
                <div
                  key={clusterId}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => handleClickCluster(clusterId)}
                >
                  <div className={`bg-gradient-to-r ${getClusterColor(index)} p-4 text-white`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        <span className="font-bold text-lg">{clusterId}</span>
                      </div>
                      {cluster.urgent_needs > 0 && (
                        <span className="px-2 py-1 bg-red-500 rounded-full text-xs font-bold">
                          {cluster.urgent_needs} Urgent
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm opacity-90">
                      <Users className="w-4 h-4" />
                      <span>{cluster.ngo_count} NGOs</span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Cities</div>
                        <div className="flex flex-wrap gap-1">
                          {cluster.cities &&
                            cluster.cities.slice(0, 3).map((city, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold"
                              >
                                {city}
                              </span>
                            ))}
                          {cluster.cities && cluster.cities.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{cluster.cities.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="text-xs text-green-700 font-semibold mb-1">
                            Avg Capacity
                          </div>
                          <div className="text-lg font-bold text-green-900">
                            {cluster.avg_capacity && cluster.avg_capacity.toFixed(0)}
                          </div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3">
                          <div className="text-xs text-purple-700 font-semibold mb-1">
                            Total Cap.
                          </div>
                          <div className="text-lg font-bold text-purple-900">
                            {cluster.total_capacity}
                          </div>
                        </div>
                      </div>

                      {cluster.causes && (
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Top Causes</div>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(cluster.causes)
                              .slice(0, 3)
                              .map(([cause, count], idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs"
                                >
                                  {cause} ({count})
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NGOs View */}
        {view === 'ngos' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-600" />
                {selectedClusterId ? `NGOs in ${selectedClusterId}` : 'All NGOs in Clusters'}
              </h3>
              {selectedClusterId && (
                <button
                  onClick={() => setSelectedClusterId(null)}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Show all NGOs
                </button>
              )}
            </div>

            {visibleNgos.length === 0 ? (
              <p className="text-sm text-gray-500">No NGOs found for this view.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleNgos.map((ngo) => (
                  <div
                    key={ngo._id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-gray-900">{ngo.name}</h4>
                      {ngo.urgentNeed && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                          URGENT
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {ngo.city}
                      </div>
                      <div>Capacity: {ngo.capacity} items/week</div>
                      <div>Cause: {ngo.cause}</div>
                      {ngo.specialFocus && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {ngo.specialFocus.map((focus, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                            >
                              {focus}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {Object.keys(clusters).length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Network className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No Clustering Data Available
            </h3>
            <p className="text-gray-600 mb-6">
              Sync NGO data to generate clusters
            </p>
            <button
              onClick={handleSync}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Sync Data Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NGOClustering;
