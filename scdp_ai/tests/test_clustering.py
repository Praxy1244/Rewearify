"""
Test cases for NGO Clustering model
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.clustering import NGOClusterer
from utils.feature_engineering import FeatureEngineer

class TestNGOClusterer:
    
    @pytest.fixture
    def sample_clustering_data(self):
        """Create sample clustering data"""
        np.random.seed(42)
        
        # Create NGO data with geographical clusters
        ngo_data = {
            'NGO_ID': [f'NGO{i:03d}' for i in range(1, 21)],
            'Latitude': [],
            'Longitude': [],
            'Capacity_per_week': np.random.randint(50, 300, 20),
            'Urgent_Need': np.random.choice([0, 1], 20),
            'Total_Matched_Donations': np.random.randint(0, 100, 20),
            'Demand_shirt': np.random.uniform(0, 0.5, 20),
            'Demand_jacket': np.random.uniform(0, 0.3, 20),
            'Demand_saree': np.random.uniform(0, 0.4, 20),
            'Demand_blanket': np.random.uniform(0, 0.3, 20),
            'Demand_pants': np.random.uniform(0, 0.3, 20),
            'Demand_dress': np.random.uniform(0, 0.2, 20),
            'Demand_footwear': np.random.uniform(0, 0.2, 20)
        }
        
        # Create geographical clusters
        # Cluster 1: Delhi area
        delhi_lats = np.random.normal(28.6, 0.1, 7)
        delhi_lons = np.random.normal(77.2, 0.1, 7)
        
        # Cluster 2: Mumbai area
        mumbai_lats = np.random.normal(19.0, 0.1, 7)
        mumbai_lons = np.random.normal(72.8, 0.1, 7)
        
        # Cluster 3: Bengaluru area
        bengaluru_lats = np.random.normal(12.9, 0.1, 6)
        bengaluru_lons = np.random.normal(77.6, 0.1, 6)
        
        all_lats = np.concatenate([delhi_lats, mumbai_lats, bengaluru_lats])
        all_lons = np.concatenate([delhi_lons, mumbai_lons, bengaluru_lons])
        
        ngo_data['Latitude'] = all_lats
        ngo_data['Longitude'] = all_lons
        
        return pd.DataFrame(ngo_data)
    
    @pytest.fixture
    def trained_clusterer(self, sample_clustering_data):
        """Create trained clusterer"""
        clusterer = NGOClusterer(geo_eps=0.1, min_samples=2, behavior_clusters=3)
        clusterer.fit(sample_clustering_data)
        return clusterer, sample_clustering_data
    
    def test_clusterer_initialization(self):
        """Test clusterer initialization"""
        clusterer = NGOClusterer()
        
        assert clusterer.geo_eps == 0.1
        assert clusterer.min_samples == 3
        assert clusterer.behavior_clusters == 5
        assert clusterer.geo_clusterer is not None
        assert clusterer.behavior_clusterer is not None
    
    def test_feature_preparation(self, sample_clustering_data):
        """Test feature preparation"""
        clusterer = NGOClusterer()
        geo_features, behavior_features = clusterer.prepare_features(sample_clustering_data)
        
        # Check geographical features
        assert geo_features.shape[1] == 2  # Lat, Lon
        assert geo_features.shape[0] == len(sample_clustering_data)
        
        # Check behavioral features
        expected_behavior_cols = [
            'Capacity_per_week', 'Urgent_Need', 'Total_Matched_Donations',
            'Demand_shirt', 'Demand_jacket', 'Demand_saree', 'Demand_blanket',
            'Demand_pants', 'Demand_dress', 'Demand_footwear'
        ]
        assert behavior_features.shape[1] == len(expected_behavior_cols)
        assert behavior_features.shape[0] == len(sample_clustering_data)
    
    def test_clustering_fit(self, sample_clustering_data):
        """Test clustering model fitting"""
        clusterer = NGOClusterer(geo_eps=0.2, min_samples=2, behavior_clusters=3)
        clusterer.fit(sample_clustering_data)
        
        assert clusterer.geo_labels_ is not None
        assert clusterer.behavior_labels_ is not None
        assert len(clusterer.geo_labels_) == len(sample_clustering_data)
        assert len(clusterer.behavior_labels_) == len(sample_clustering_data)
    
    def test_cluster_prediction(self, trained_clusterer):
        """Test cluster prediction for new NGO"""
        clusterer, _ = trained_clusterer
        
        # Test NGO from Delhi area
        new_ngo = {
            'NGO_ID': 'NGO999',
            'Latitude': 28.65,
            'Longitude': 77.25,
            'Capacity_per_week': 150,
            'Urgent_Need': 1,
            'Total_Matched_Donations': 50,
            'Demand_shirt': 0.3,
            'Demand_jacket': 0.2,
            'Demand_saree': 0.1,
            'Demand_blanket': 0.2,
            'Demand_pants': 0.1,
            'Demand_dress': 0.05,
            'Demand_footwear': 0.05
        }
        
        prediction = clusterer.predict_cluster(new_ngo)
        
        assert 'geo_cluster' in prediction
        assert 'behavior_cluster' in prediction
        assert 'combined_cluster' in prediction
        
        assert isinstance(prediction['geo_cluster'], (int, np.integer))
        assert isinstance(prediction['behavior_cluster'], (int, np.integer))
        assert isinstance(prediction['combined_cluster'], str)
    
    def test_cluster_summary(self, trained_clusterer):
        """Test cluster summary generation"""
        clusterer, data = trained_clusterer
        
        summary = clusterer.get_cluster_summary(data)
        
        assert 'geo_summary' in summary
        assert 'behavior_summary' in summary
        assert 'cluster_assignments' in summary
        
        # Check cluster assignments
        assignments = summary['cluster_assignments']
        assert 'NGO_ID' in assignments.columns
        assert 'Geo_Cluster' in assignments.columns
        assert 'Behavior_Cluster' in assignments.columns
        assert len(assignments) == len(data)
    
    def test_cluster_distances(self, trained_clusterer):
        """Test cluster distance calculations"""
        clusterer, data = trained_clusterer
        
        distances = clusterer.calculate_cluster_distances(data)
        
        assert isinstance(distances, dict)
        
        # All distances should be positive
        for cluster_pair, distance in distances.items():
            assert distance >= 0
            assert isinstance(distance, (int, float))
    
    def test_clustering_evaluation(self, trained_clusterer):
        """Test clustering evaluation metrics"""
        clusterer, data = trained_clusterer
        
        evaluation_results = clusterer.evaluate_clustering(data)
        
        # Check if silhouette scores are present (when applicable)
        if 'geo_silhouette' in evaluation_results:
            assert -1 <= evaluation_results['geo_silhouette'] <= 1
        
        if 'behavior_silhouette' in evaluation_results:
            assert -1 <= evaluation_results['behavior_silhouette'] <= 1
        
        # Check cluster distributions
        assert 'geo_cluster_counts' in evaluation_results
        assert 'behavior_cluster_counts' in evaluation_results
    
    def test_routing_optimization_data(self, trained_clusterer):
        """Test routing optimization data generation"""
        clusterer, data = trained_clusterer
        
        routing_data = clusterer.get_routing_optimization_data(data)
        
        assert isinstance(routing_data, list)
        
        for cluster_info in routing_data:
            assert 'cluster_id' in cluster_info
            assert 'num_ngos' in cluster_info
            assert 'total_capacity' in cluster_info
            assert 'center_latitude' in cluster_info
            assert 'center_longitude' in cluster_info
            assert 'cluster_radius_km' in cluster_info
            assert 'ngo_list' in cluster_info
            
            # Validate data types
            assert isinstance(cluster_info['num_ngos'], int)
            assert isinstance(cluster_info['total_capacity'], (int, float))
            assert isinstance(cluster_info['cluster_radius_km'], (int, float))
            assert isinstance(cluster_info['ngo_list'], list)
    
    def test_model_persistence(self, trained_clusterer, tmp_path):
        """Test model saving and loading"""
        clusterer, _ = trained_clusterer
        
        # Save model
        model_path = tmp_path / "test_clusterer.joblib"
        clusterer.save_model(str(model_path))
        
        assert model_path.exists()
        
        # Load model
        new_clusterer = NGOClusterer()
        new_clusterer.load_model(str(model_path))
        
        # Compare key attributes
        assert new_clusterer.geo_eps == clusterer.geo_eps
        assert new_clusterer.min_samples == clusterer.min_samples
        assert new_clusterer.behavior_clusters == clusterer.behavior_clusters
        
        # Compare cluster labels
        np.testing.assert_array_equal(new_clusterer.geo_labels_, clusterer.geo_labels_)
        np.testing.assert_array_equal(new_clusterer.behavior_labels_, clusterer.behavior_labels_)
    
    def test_distance_calculation(self):
        """Test distance calculation method"""
        clusterer = NGOClusterer()
        
        # Test known coordinates (Delhi to Mumbai approximately)
        delhi_lat, delhi_lon = 28.6139, 77.2090
        mumbai_lat, mumbai_lon = 19.0760, 72.8777
        
        distance = clusterer._calculate_distance_km(delhi_lat, delhi_lon, mumbai_lat, mumbai_lon)
        
        # Should be approximately 1150-1200 km
        assert 1100 <= distance <= 1300
    
    def test_empty_data_handling(self):
        """Test handling of empty or minimal data"""
        clusterer = NGOClusterer()
        
        # Test with minimal data
        minimal_data = pd.DataFrame({
            'NGO_ID': ['NGO001'],
            'Latitude': [28.6],
            'Longitude': [77.2],
            'Capacity_per_week': [100],
            'Urgent_Need': [0],
            'Total_Matched_Donations': [10],
            'Demand_shirt': [0.3],
            'Demand_jacket': [0.2],
            'Demand_saree': [0.1],
            'Demand_blanket': [0.2],
            'Demand_pants': [0.1],
            'Demand_dress': [0.05],
            'Demand_footwear': [0.05]
        })
        
        # Should not crash with minimal data
        try:
            clusterer.fit(minimal_data)
            # If it fits, labels should be created
            assert clusterer.geo_labels_ is not None
            assert clusterer.behavior_labels_ is not None
        except Exception as e:
            # It's acceptable if clustering fails with insufficient data
            assert "samples" in str(e).lower() or "cluster" in str(e).lower()

# Integration test
def test_end_to_end_clustering():
    """Test complete clustering pipeline"""
    np.random.seed(42)
    
    # Generate realistic NGO data with clear geographical clusters
    n_ngos = 50
    
    # Create three geographical regions
    regions = [
        {'name': 'North', 'lat_center': 28.6, 'lon_center': 77.2, 'count': 20},
        {'name': 'West', 'lat_center': 19.0, 'lon_center': 72.8, 'count': 20},
        {'name': 'South', 'lat_center': 12.9, 'lon_center': 77.6, 'count': 10}
    ]
    
    ngo_data = []
    ngo_id = 1
    
    for region in regions:
        for _ in range(region['count']):
            # Add some noise to coordinates
            lat = np.random.normal(region['lat_center'], 0.2)
            lon = np.random.normal(region['lon_center'], 0.2)
            
            # Create behavioral patterns
            if region['name'] == 'North':
                # North prefers winter clothing
                demand_jacket = np.random.uniform(0.3, 0.6)
                demand_blanket = np.random.uniform(0.2, 0.4)
            elif region['name'] == 'West':
                # West has diverse needs
                demand_jacket = np.random.uniform(0.1, 0.3)
                demand_blanket = np.random.uniform(0.1, 0.3)
            else:  # South
                # South prefers lighter clothing
                demand_jacket = np.random.uniform(0.0, 0.2)
                demand_blanket = np.random.uniform(0.0, 0.2)
            
            ngo = {
                'NGO_ID': f'NGO{ngo_id:03d}',
                'Latitude': lat,
                'Longitude': lon,
                'Capacity_per_week': np.random.randint(50, 300),
                'Urgent_Need': np.random.choice([0, 1]),
                'Total_Matched_Donations': np.random.randint(10, 200),
                'Demand_shirt': np.random.uniform(0.2, 0.5),
                'Demand_jacket': demand_jacket,
                'Demand_saree': np.random.uniform(0.1, 0.4),
                'Demand_blanket': demand_blanket,
                'Demand_pants': np.random.uniform(0.1, 0.3),
                'Demand_dress': np.random.uniform(0.0, 0.2),
                'Demand_footwear': np.random.uniform(0.0, 0.2)
            }
            ngo_data.append(ngo)
            ngo_id += 1
    
    clustering_df = pd.DataFrame(ngo_data)
    
    # Train clusterer
    clusterer = NGOClusterer(geo_eps=0.3, min_samples=3, behavior_clusters=4)
    clusterer.fit(clustering_df)
    
    # Evaluate clustering
    evaluation_results = clusterer.evaluate_clustering(clustering_df)
    
    # Should find reasonable number of clusters
    geo_clusters = len(evaluation_results['geo_cluster_counts'])
    behavior_clusters = len(evaluation_results['behavior_cluster_counts'])
    
    assert 2 <= geo_clusters <= 6  # Should find 2-6 geographical clusters
    assert behavior_clusters <= 4  # Should not exceed specified number
    
    # Test cluster summary
    summary = clusterer.get_cluster_summary(clustering_df)
    assert len(summary['cluster_assignments']) == n_ngos
    
    # Test routing optimization
    routing_data = clusterer.get_routing_optimization_data(clustering_df)
    assert len(routing_data) >= 1  # Should have at least one cluster
    
    # Test prediction for new NGO
    new_ngo = {
        'NGO_ID': 'NGO999',
        'Latitude': 28.7,  # Near Delhi
        'Longitude': 77.3,
        'Capacity_per_week': 150,
        'Urgent_Need': 0,
        'Total_Matched_Donations': 50,
        'Demand_shirt': 0.3,
        'Demand_jacket': 0.4,  # High winter demand
        'Demand_saree': 0.1,
        'Demand_blanket': 0.3,
        'Demand_pants': 0.2,
        'Demand_dress': 0.05,
        'Demand_footwear': 0.05
    }
    
    prediction = clusterer.predict_cluster(new_ngo)
    
    assert 'geo_cluster' in prediction
    assert 'behavior_cluster' in prediction
    assert prediction['combined_cluster'].startswith('G')

if __name__ == "__main__":
    pytest.main([__file__])