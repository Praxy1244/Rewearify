"""
NGO clustering model for SCDP
Groups NGOs by geography and behavioral patterns for logistics optimization
"""

import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN, KMeans
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, davies_bouldin_score
from sklearn.metrics.pairwise import haversine_distances
import joblib
import os
import math

class NGOClusterer:
    def __init__(self, geo_eps=0.1, min_samples=3, behavior_clusters=5):
        """
        Initialize NGO clusterer
        
        Args:
            geo_eps: DBSCAN epsilon for geographical clustering (in radians)
            min_samples: Minimum samples for DBSCAN
            behavior_clusters: Number of behavioral clusters for KMeans
        """
        self.geo_eps = geo_eps
        self.min_samples = min_samples
        self.behavior_clusters = behavior_clusters
        
        self.geo_clusterer = DBSCAN(eps=geo_eps, min_samples=min_samples, metric='haversine')
        self.behavior_clusterer = KMeans(n_clusters=behavior_clusters, random_state=42)
        self.scaler = StandardScaler()
        
        self.geo_labels_ = None
        self.behavior_labels_ = None
        self.feature_names = None
    
    def prepare_features(self, clustering_features_df):
        """Prepare features for clustering"""
        # Geographical features (convert to radians for haversine)
        geo_features = clustering_features_df[['Latitude', 'Longitude']].copy()
        geo_features_rad = np.radians(geo_features)
        
        # Behavioral features
        behavior_feature_cols = [
            'Capacity_per_week', 'Urgent_Need', 'Total_Matched_Donations',
            'Demand_shirt', 'Demand_jacket', 'Demand_saree', 'Demand_blanket',
            'Demand_pants', 'Demand_dress', 'Demand_footwear'
        ]
        
        behavior_features = clustering_features_df[behavior_feature_cols].copy()
        self.feature_names = behavior_feature_cols
        
        return geo_features_rad, behavior_features
    
    def fit(self, clustering_features_df):
        """Fit the clustering models"""
        geo_features_rad, behavior_features = self.prepare_features(clustering_features_df)
        
        # Geographical clustering with DBSCAN
        self.geo_labels_ = self.geo_clusterer.fit_predict(geo_features_rad)
        
        # Behavioral clustering with KMeans (within each geo cluster)
        behavior_features_scaled = self.scaler.fit_transform(behavior_features)
        
        # For simplicity, we'll do global behavioral clustering
        # In practice, you might want to cluster within each geographical cluster
        self.behavior_labels_ = self.behavior_clusterer.fit_predict(behavior_features_scaled)
        
        return self
    
    def predict_cluster(self, ngo_features):
        """Predict cluster for new NGO"""
        if isinstance(ngo_features, dict):
            ngo_df = pd.DataFrame([ngo_features])
        else:
            ngo_df = ngo_features.copy()
        
        # Geographical prediction (find nearest existing cluster)
        geo_coords = np.radians(ngo_df[['Latitude', 'Longitude']].values)
        
        # For DBSCAN, we need to find the nearest cluster center
        geo_cluster = self._predict_geo_cluster(geo_coords[0])
        
        # Behavioral prediction
        behavior_features = ngo_df[self.feature_names].values
        behavior_features_scaled = self.scaler.transform(behavior_features)
        behavior_cluster = self.behavior_clusterer.predict(behavior_features_scaled)[0]
        
        return {
            'geo_cluster': geo_cluster,
            'behavior_cluster': behavior_cluster,
            'combined_cluster': f"G{geo_cluster}_B{behavior_cluster}"
        }
    
    def _predict_geo_cluster(self, coords):
        """Predict geographical cluster for new coordinates"""
        # For DBSCAN, we'll assign to the nearest existing cluster
        # This is a simplified approach
        if hasattr(self.geo_clusterer, 'core_sample_indices_'):
            # Find nearest core sample
            core_samples = self.geo_clusterer.core_sample_indices_
            if len(core_samples) > 0:
                # This is a simplified approach - in practice you'd want more sophisticated logic
                return 0  # Default to first cluster
        return -1  # Noise cluster
    
    def get_cluster_summary(self, clustering_features_df):
        """Get summary statistics for each cluster"""
        if self.geo_labels_ is None or self.behavior_labels_ is None:
            raise ValueError("Model must be fitted before getting cluster summary")
        
        df = clustering_features_df.copy()
        df['Geo_Cluster'] = self.geo_labels_
        df['Behavior_Cluster'] = self.behavior_labels_
        df['Combined_Cluster'] = df['Geo_Cluster'].astype(str) + '_' + df['Behavior_Cluster'].astype(str)
        
        # Geographical cluster summary
        geo_summary = df.groupby('Geo_Cluster').agg({
            'Latitude': ['mean', 'std'],
            'Longitude': ['mean', 'std'],
            'NGO_ID': 'count',
            'Capacity_per_week': 'mean',
            'Total_Matched_Donations': 'sum'
        }).round(3)
        
        # Behavioral cluster summary
        behavior_summary = df.groupby('Behavior_Cluster').agg({
            'Capacity_per_week': ['mean', 'std'],
            'Urgent_Need': 'mean',
            'Total_Matched_Donations': ['mean', 'sum'],
            'Demand_shirt': 'mean',
            'Demand_jacket': 'mean',
            'Demand_saree': 'mean',
            'Demand_blanket': 'mean',
            'NGO_ID': 'count'
        }).round(3)
        
        return {
            'geo_summary': geo_summary,
            'behavior_summary': behavior_summary,
            'cluster_assignments': df[['NGO_ID', 'Geo_Cluster', 'Behavior_Cluster', 'Combined_Cluster']]
        }
    
    def calculate_cluster_distances(self, clustering_features_df):
        """Calculate distances between cluster centers"""
        if self.geo_labels_ is None:
            raise ValueError("Model must be fitted first")
        
        df = clustering_features_df.copy()
        df['Geo_Cluster'] = self.geo_labels_
        
        # Calculate geographical distances between cluster centers
        geo_centers = df.groupby('Geo_Cluster')[['Latitude', 'Longitude']].mean()
        
        distances = {}
        for i, (idx1, center1) in enumerate(geo_centers.iterrows()):
            for j, (idx2, center2) in enumerate(geo_centers.iterrows()):
                if i < j:  # Avoid duplicates
                    dist_km = self._calculate_distance_km(
                        center1['Latitude'], center1['Longitude'],
                        center2['Latitude'], center2['Longitude']
                    )
                    distances[f"Cluster_{idx1}_to_{idx2}"] = dist_km
        
        return distances
    
    def _calculate_distance_km(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two points in kilometers"""
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        r = 6371  # Radius of earth in kilometers
        return c * r
    
    def evaluate_clustering(self, clustering_features_df):
        """Evaluate clustering quality"""
        if self.geo_labels_ is None or self.behavior_labels_ is None:
            raise ValueError("Model must be fitted first")
        
        geo_features_rad, behavior_features = self.prepare_features(clustering_features_df)
        behavior_features_scaled = self.scaler.transform(behavior_features)
        
        results = {}
        
        # Geographical clustering evaluation
        if len(set(self.geo_labels_)) > 1:  # Need at least 2 clusters
            geo_silhouette = silhouette_score(geo_features_rad, self.geo_labels_)
            geo_db_score = davies_bouldin_score(geo_features_rad, self.geo_labels_)
            results['geo_silhouette'] = geo_silhouette
            results['geo_davies_bouldin'] = geo_db_score
        
        # Behavioral clustering evaluation
        if len(set(self.behavior_labels_)) > 1:
            behavior_silhouette = silhouette_score(behavior_features_scaled, self.behavior_labels_)
            behavior_db_score = davies_bouldin_score(behavior_features_scaled, self.behavior_labels_)
            results['behavior_silhouette'] = behavior_silhouette
            results['behavior_davies_bouldin'] = behavior_db_score
        
        # Cluster distribution
        results['geo_cluster_counts'] = pd.Series(self.geo_labels_).value_counts().to_dict()
        results['behavior_cluster_counts'] = pd.Series(self.behavior_labels_).value_counts().to_dict()
        
        return results
    
    def get_routing_optimization_data(self, clustering_features_df):
        """Get data for routing optimization within clusters"""
        if self.geo_labels_ is None:
            raise ValueError("Model must be fitted first")
        
        df = clustering_features_df.copy()
        df['Geo_Cluster'] = self.geo_labels_
        
        routing_data = []
        
        for cluster_id in df['Geo_Cluster'].unique():
            if cluster_id == -1:  # Skip noise points
                continue
                
            cluster_ngos = df[df['Geo_Cluster'] == cluster_id]
            
            # Calculate total capacity and demand for this cluster
            total_capacity = cluster_ngos['Capacity_per_week'].sum()
            total_matched = cluster_ngos['Total_Matched_Donations'].sum()
            
            # Calculate cluster center
            center_lat = cluster_ngos['Latitude'].mean()
            center_lon = cluster_ngos['Longitude'].mean()
            
            # Calculate cluster radius (max distance from center)
            max_distance = 0
            for _, ngo in cluster_ngos.iterrows():
                dist = self._calculate_distance_km(
                    center_lat, center_lon, ngo['Latitude'], ngo['Longitude']
                )
                max_distance = max(max_distance, dist)
            
            routing_data.append({
                'cluster_id': cluster_id,
                'num_ngos': len(cluster_ngos),
                'total_capacity': total_capacity,
                'total_matched_donations': total_matched,
                'center_latitude': center_lat,
                'center_longitude': center_lon,
                'cluster_radius_km': max_distance,
                'ngo_list': cluster_ngos['NGO_ID'].tolist()
            })
        
        return routing_data
    
    def save_model(self, filepath):
        """Save the trained clustering models"""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        model_data = {
            'geo_clusterer': self.geo_clusterer,
            'behavior_clusterer': self.behavior_clusterer,
            'scaler': self.scaler,
            'geo_labels_': self.geo_labels_,
            'behavior_labels_': self.behavior_labels_,
            'feature_names': self.feature_names,
            'geo_eps': self.geo_eps,
            'min_samples': self.min_samples,
            'behavior_clusters': self.behavior_clusters
        }
        joblib.dump(model_data, filepath)
    
    def load_model(self, filepath):
        """Load trained clustering models"""
        model_data = joblib.load(filepath)
        self.geo_clusterer = model_data['geo_clusterer']
        self.behavior_clusterer = model_data['behavior_clusterer']
        self.scaler = model_data['scaler']
        self.geo_labels_ = model_data['geo_labels_']
        self.behavior_labels_ = model_data['behavior_labels_']
        self.feature_names = model_data['feature_names']
        self.geo_eps = model_data['geo_eps']
        self.min_samples = model_data['min_samples']
        self.behavior_clusters = model_data['behavior_clusters']
        return self