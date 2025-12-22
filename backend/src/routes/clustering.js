/**
 * Clustering Routes
 * 
 * Enhanced API endpoints for NGO clustering functionality.
 * Provides data sync, cluster retrieval, and analysis features.
 */

import express from 'express';
import axios from 'axios';
import User from '../models/User.js';
import { ok, fail } from '../utils/response.js';
import { protect, restrictTo } from '../middleware/auth.js';
import NGODataSyncer from '../scripts/syncNGOData.js';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ==================== HELPER FUNCTIONS ====================

/**
 * Sync NGO data to CSV before clustering
 */
const syncNGOData = async () => {
  try {
    console.log('🔄 Auto-syncing NGO data...');
    const syncer = new NGODataSyncer();
    await syncer.sync();
    return { success: true };
  } catch (error) {
    console.error('❌ Auto-sync failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch cluster data from AI service
 */
const fetchClustersFromAI = async () => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/clusters`, {
      timeout: 30000
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ AI service error:', error.message);
    return { 
      success: false, 
      error: error.response?.data?.error || 'AI service unavailable',
      status: error.response?.status || 503
    };
  }
};

/**
 * Enrich cluster data with MongoDB NGO details
 */
const enrichClusterData = async (clusters) => {
  try {
    // Get all NGO IDs from clusters
    const allNGOIds = new Set();
    
    Object.values(clusters).forEach(cluster => {
      if (cluster.ngo_ids) {
        cluster.ngo_ids.forEach(id => allNGOIds.add(id));
      }
    });

    // Fetch NGO details from MongoDB
    const ngoDetails = await User.find({
      _id: { $in: Array.from(allNGOIds) },
      role: 'recipient'
    }).select('name email location organization recipientProfile statistics');

    // Create lookup map
    const ngoMap = {};
    ngoDetails.forEach(ngo => {
      ngoMap[ngo._id.toString()] = {
        _id: ngo._id,
        name: ngo.name,
        email: ngo.email,
        city: ngo.location?.city,
        organization: ngo.organization?.name,
        specialFocus: ngo.recipientProfile?.specialFocus,
        capacity: ngo.recipientProfile?.capacityPerWeek,
        urgentNeed: ngo.recipientProfile?.urgentNeed,
        cause: ngo.recipientProfile?.cause,
        totalDonations: ngo.statistics?.totalDonations || 0
      };
    });

    // Enrich clusters with NGO details
    const enrichedClusters = {};
    
    Object.entries(clusters).forEach(([key, cluster]) => {
      enrichedClusters[key] = {
        ...cluster,
        ngos: (cluster.ngo_ids || []).map(id => ngoMap[id]).filter(Boolean)
      };
    });

    return enrichedClusters;
  } catch (error) {
    console.error('❌ Error enriching cluster data:', error.message);
    throw error;
  }
};

// ==================== ROUTES ====================

/**
 * @desc    Get all NGO clusters
 * @route   GET /api/clustering/clusters
 * @access  Private (Admin)
 */
router.get('/clusters', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { refresh } = req.query;

    // Auto-sync data if refresh requested
    if (refresh === 'true') {
      console.log('🔄 Refresh requested - syncing NGO data...');
      const syncResult = await syncNGOData();
      
      if (!syncResult.success) {
        console.warn('⚠️ Sync failed, using existing data');
      }
    }

    // Fetch clusters from AI service
    const result = await fetchClustersFromAI();

    if (!result.success) {
      return fail(res, result.error, result.status);
    }

    // Enrich with MongoDB data
    const enrichedClusters = await enrichClusterData(result.data.clusters || result.data);

    return ok(res, {
      clusters: enrichedClusters,
      total_clusters: Object.keys(enrichedClusters).length,
      clustering_algorithm: result.data.clustering_algorithm || 'Two-Stage (DBSCAN + KMeans)',
      last_updated: new Date().toISOString()
    }, 'Clusters retrieved successfully');

  } catch (error) {
    console.error('❌ Clustering error:', error);
    return fail(res, 'Failed to get clusters', 500);
  }
});

/**
 * @desc    Get specific cluster details
 * @route   GET /api/clustering/clusters/:clusterId
 * @access  Private (Admin)
 */
router.get('/clusters/:clusterId', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { clusterId } = req.params;

    // Fetch all clusters
    const result = await fetchClustersFromAI();

    if (!result.success) {
      return fail(res, result.error, result.status);
    }

    const clusters = result.data.clusters || result.data;
    const cluster = clusters[clusterId];

    if (!cluster) {
      return fail(res, 'Cluster not found', 404);
    }

    // Enrich with MongoDB data
    const enrichedCluster = (await enrichClusterData({ [clusterId]: cluster }))[clusterId];

    return ok(res, enrichedCluster, 'Cluster details retrieved successfully');

  } catch (error) {
    console.error('❌ Cluster details error:', error);
    return fail(res, 'Failed to get cluster details', 500);
  }
});

/**
 * @desc    Trigger manual data sync
 * @route   POST /api/clustering/sync
 * @access  Private (Admin)
 */
router.post('/sync', protect, restrictTo('admin'), async (req, res) => {
  try {
    console.log('🔄 Manual sync triggered by:', req.user.email);

    const syncResult = await syncNGOData();

    if (syncResult.success) {
      return ok(res, {
        message: 'NGO data synced successfully',
        timestamp: new Date().toISOString()
      }, 'Data sync completed');
    } else {
      return fail(res, syncResult.error || 'Sync failed', 500);
    }

  } catch (error) {
    console.error('❌ Sync error:', error);
    return fail(res, 'Failed to sync data', 500);
  }
});

/**
 * @desc    Run clustering analysis
 * @route   POST /api/clustering/analyze
 * @access  Private (Admin)
 */
router.post('/analyze', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { eps_km = 25, min_samples = 3, n_behavioral_clusters = 3 } = req.body;

    console.log('🎯 Running clustering analysis...');
    console.log(`   Parameters: eps=${eps_km}km, min_samples=${min_samples}, behavioral_clusters=${n_behavioral_clusters}`);

    // Step 1: Sync data
    console.log('   Step 1: Syncing NGO data...');
    const syncResult = await syncNGOData();
    
    if (!syncResult.success) {
      console.warn('   ⚠️ Sync failed, using existing data');
    }

    // Step 2: Trigger clustering in AI service
    console.log('   Step 2: Running clustering algorithm...');
    const clusterResponse = await axios.post(`${AI_SERVICE_URL}/cluster`, {
      eps_km,
      min_samples,
      n_behavioral_clusters
    }, { timeout: 60000 });

    // Step 3: Fetch results
    console.log('   Step 3: Fetching results...');
    const result = await fetchClustersFromAI();

    if (!result.success) {
      return fail(res, result.error, result.status);
    }

    // Step 4: Enrich with MongoDB data
    console.log('   Step 4: Enriching with NGO details...');
    const enrichedClusters = await enrichClusterData(result.data.clusters || result.data);

    console.log('   ✅ Clustering analysis complete!');

    return ok(res, {
      clusters: enrichedClusters,
      total_clusters: Object.keys(enrichedClusters).length,
      parameters: { eps_km, min_samples, n_behavioral_clusters },
      timestamp: new Date().toISOString()
    }, 'Clustering analysis completed successfully');

  } catch (error) {
    console.error('❌ Clustering analysis error:', error);
    return fail(res, error.response?.data?.error || 'Failed to run clustering analysis', 500);
  }
});

/**
 * @desc    Get cluster statistics
 * @route   GET /api/clustering/stats
 * @access  Private (Admin)
 */
router.get('/stats', protect, restrictTo('admin'), async (req, res) => {
  try {
    // Fetch clusters
    const result = await fetchClustersFromAI();

    if (!result.success) {
      return fail(res, result.error, result.status);
    }

    const clusters = result.data.clusters || result.data;

    // Calculate statistics
    const stats = {
      total_clusters: Object.keys(clusters).length,
      total_ngos: 0,
      geographic_clusters: new Set(),
      behavioral_clusters: new Set(),
      avg_cluster_size: 0,
      largest_cluster: null,
      smallest_cluster: null,
      cities_covered: new Set(),
      total_capacity: 0,
      urgent_needs: 0
    };

    let clusterSizes = [];

    Object.entries(clusters).forEach(([key, cluster]) => {
      stats.total_ngos += cluster.ngo_count || 0;
      stats.geographic_clusters.add(cluster.geo_cluster);
      stats.behavioral_clusters.add(cluster.behavioral_cluster);
      stats.total_capacity += cluster.total_capacity || 0;
      stats.urgent_needs += cluster.urgent_needs || 0;
      
      clusterSizes.push(cluster.ngo_count || 0);
      
      if (cluster.cities) {
        cluster.cities.forEach(city => stats.cities_covered.add(city));
      }

      if (!stats.largest_cluster || cluster.ngo_count > stats.largest_cluster.size) {
        stats.largest_cluster = { id: key, size: cluster.ngo_count };
      }

      if (!stats.smallest_cluster || cluster.ngo_count < stats.smallest_cluster.size) {
        stats.smallest_cluster = { id: key, size: cluster.ngo_count };
      }
    });

    stats.avg_cluster_size = stats.total_ngos / stats.total_clusters || 0;
    stats.geographic_clusters = stats.geographic_clusters.size;
    stats.behavioral_clusters = stats.behavioral_clusters.size;
    stats.cities_covered = Array.from(stats.cities_covered);

    return ok(res, stats, 'Cluster statistics retrieved successfully');

  } catch (error) {
    console.error('❌ Stats error:', error);
    return fail(res, 'Failed to get cluster statistics', 500);
  }
});

/**
 * @desc    Search NGOs across clusters
 * @route   GET /api/clustering/search
 * @access  Private (Admin)
 */
router.get('/search', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { city, cause, minCapacity, urgentOnly } = req.query;

    // Fetch clusters
    const result = await fetchClustersFromAI();

    if (!result.success) {
      return fail(res, result.error, result.status);
    }

    const clusters = result.data.clusters || result.data;
    const enrichedClusters = await enrichClusterData(clusters);

    // Filter clusters
    const filteredClusters = {};

    Object.entries(enrichedClusters).forEach(([key, cluster]) => {
      let matches = true;

      if (city && !cluster.cities?.some(c => c.toLowerCase().includes(city.toLowerCase()))) {
        matches = false;
      }

      if (cause && cluster.causes && !Object.keys(cluster.causes).includes(cause)) {
        matches = false;
      }

      if (minCapacity && cluster.avg_capacity < parseInt(minCapacity)) {
        matches = false;
      }

      if (urgentOnly === 'true' && cluster.urgent_needs === 0) {
        matches = false;
      }

      if (matches) {
        filteredClusters[key] = cluster;
      }
    });

    return ok(res, {
      clusters: filteredClusters,
      total_results: Object.keys(filteredClusters).length,
      filters: { city, cause, minCapacity, urgentOnly }
    }, 'Search completed successfully');

  } catch (error) {
    console.error('❌ Search error:', error);
    return fail(res, 'Failed to search clusters', 500);
  }
});

export default router;
