import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN, KMeans
from sklearn.preprocessing import StandardScaler
from math import radians, cos, sin, asin, sqrt
import pickle
import os

class NGOClusterer:
    """Two-stage NGO clustering: Geographic + Behavioral"""
    
    def __init__(self):
        self.geo_clusters = None
        self.behavioral_clusters = {}
        self.cluster_stats = {}
        self.scaler = StandardScaler()
        self.is_trained = False
    
    def load_data(self):
        """Load NGO data"""
        data_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data"
        )
        
        print("📂 Loading NGO data for clustering...")
        self.ngos_df = pd.read_csv(os.path.join(data_path, "ngos.csv"))
        print(f"✅ Loaded {len(self.ngos_df)} NGOs")
    
    def haversine_distance_matrix(self, coords):
        """
        Calculate pairwise haversine distances between coordinates.
        Returns distance matrix in kilometers.
        """
        n = len(coords)
        dist_matrix = np.zeros((n, n))
        
        for i in range(n):
            for j in range(i+1, n):
                lat1, lon1 = radians(coords[i][0]), radians(coords[i][1])
                lat2, lon2 = radians(coords[j][0]), radians(coords[j][1])
                
                dlat = lat2 - lat1
                dlon = lon2 - lon1
                
                a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                c = 2 * asin(sqrt(a))
                
                distance = 6371 * c  # Earth radius in km
                dist_matrix[i][j] = distance
                dist_matrix[j][i] = distance
        
        return dist_matrix
    
    def create_demand_vector(self, special_focus):
        """
        Create demand vector from NGO's special focus.
        Returns vector representing clothing type preferences.
        """
        clothing_types = [
            "Men's Wear", "Women's Wear", "Kids Wear", 
            "Winter Wear", "Footwear", "Accessories"
        ]
        
        # Initialize vector
        vector = np.zeros(len(clothing_types))
        
        # Handle "All types"
        if "All types" in special_focus or "all" in special_focus.lower():
            return np.ones(len(clothing_types)) / len(clothing_types)
        
        # Count matches
        focus_lower = special_focus.lower()
        for idx, cloth_type in enumerate(clothing_types):
            if cloth_type.lower() in focus_lower:
                vector[idx] = 1
        
        # Normalize
        total = vector.sum()
        if total > 0:
            vector = vector / total
        else:
            # If no match, assume all types
            vector = np.ones(len(clothing_types)) / len(clothing_types)
        
        return vector
    
    def stage1_geographic_clustering(self, eps_km=25, min_samples=3):
        """
        Stage 1: Geographic clustering using DBSCAN with haversine distance.
        
        Args:
            eps_km: Maximum distance in km for points to be neighbors
            min_samples: Minimum NGOs to form a cluster
        """
        print("\n🌍 Stage 1: Geographic Clustering (DBSCAN)")
        print(f"   Parameters: eps={eps_km}km, min_samples={min_samples}")
        
        # Extract coordinates
        coords = self.ngos_df[['Latitude', 'Longitude']].values
        
        # Calculate distance matrix
        print("   Calculating haversine distances...")
        dist_matrix = self.haversine_distance_matrix(coords)
        
        # Apply DBSCAN
        dbscan = DBSCAN(eps=eps_km, min_samples=min_samples, metric='precomputed')
        geo_labels = dbscan.fit_predict(dist_matrix)
        
        self.ngos_df['GeoCluster'] = geo_labels
        
        # Stats
        n_clusters = len(set(geo_labels)) - (1 if -1 in geo_labels else 0)
        n_noise = list(geo_labels).count(-1)
        
        print(f"   ✅ Found {n_clusters} geographic clusters")
        print(f"   📍 {n_noise} NGOs marked as noise (isolated locations)")
        
        return geo_labels
    
    def stage2_behavioral_clustering(self, n_clusters=3):
        """
        Stage 2: Behavioral clustering within each geographic cluster.
        Uses KMeans on demand vectors and capacity.
        
        Args:
            n_clusters: Number of behavioral clusters per geo-cluster
        """
        print("\n🎯 Stage 2: Behavioral Clustering (KMeans)")
        
        # Process each geographic cluster
        geo_cluster_ids = self.ngos_df['GeoCluster'].unique()
        geo_cluster_ids = [c for c in geo_cluster_ids if c != -1]  # Exclude noise
        
        for geo_id in geo_cluster_ids:
            # Get NGOs in this geographic cluster
            geo_ngos = self.ngos_df[self.ngos_df['GeoCluster'] == geo_id].copy()
            
            if len(geo_ngos) < n_clusters:
                # Too few NGOs, assign all to one behavioral cluster
                self.ngos_df.loc[geo_ngos.index, 'BehavioralCluster'] = 0
                continue
            
            # Create feature matrix
            features = []
            for _, ngo in geo_ngos.iterrows():
                # Demand vector (6 dimensions)
                demand_vec = self.create_demand_vector(ngo['Special_Focus'])
                
                # Add capacity (normalized)
                capacity_norm = ngo['Capacity_per_week'] / 500.0
                
                # Add urgency
                urgency = 1 if ngo['Urgent_Need'] else 0
                
                # Combine features
                feature_vec = np.concatenate([demand_vec, [capacity_norm, urgency]])
                features.append(feature_vec)
            
            X = np.array(features)
            
            # Apply KMeans
            kmeans = KMeans(n_clusters=min(n_clusters, len(geo_ngos)), random_state=42)
            behavioral_labels = kmeans.fit_predict(X)
            
            # Store behavioral cluster labels
            self.ngos_df.loc[geo_ngos.index, 'BehavioralCluster'] = behavioral_labels
            
            # Store cluster centers for this geo cluster
            self.behavioral_clusters[geo_id] = {
                'centers': kmeans.cluster_centers_,
                'n_ngos': len(geo_ngos)
            }
        
        # Handle noise points
        noise_ngos = self.ngos_df[self.ngos_df['GeoCluster'] == -1]
        if len(noise_ngos) > 0:
            self.ngos_df.loc[noise_ngos.index, 'BehavioralCluster'] = 0
        
        print(f"   ✅ Behavioral clustering complete")
    
    def create_cluster_profiles(self):
        """Create detailed profiles for each cluster"""
        print("\n📊 Creating cluster profiles...")
        
        self.cluster_stats = {}
        
        # Group by both geo and behavioral cluster
        for geo_id in self.ngos_df['GeoCluster'].unique():
            if geo_id == -1:
                continue
            
            geo_ngos = self.ngos_df[self.ngos_df['GeoCluster'] == geo_id]
            
            for behav_id in geo_ngos['BehavioralCluster'].unique():
                cluster_ngos = geo_ngos[geo_ngos['BehavioralCluster'] == behav_id]
                
                # Calculate statistics
                cluster_key = f"G{geo_id}_B{behav_id}"
                
                # ✨ NEW: Include NGO IDs
                ngo_ids = cluster_ngos['NGO_ID'].tolist()
                
                self.cluster_stats[cluster_key] = {
                    'geo_cluster': int(geo_id),
                    'behavioral_cluster': int(behav_id),
                    'ngo_count': len(cluster_ngos),
                    'ngo_ids': ngo_ids,  # ✨ NEW: Add NGO IDs for backend enrichment
                    'cities': cluster_ngos['City'].unique().tolist(),
                    'avg_capacity': float(cluster_ngos['Capacity_per_week'].mean()),
                    'total_capacity': int(cluster_ngos['Capacity_per_week'].sum()),
                    'urgent_needs': int(cluster_ngos['Urgent_Need'].sum()),
                    'causes': cluster_ngos['Cause'].value_counts().to_dict(),
                    'center_lat': float(cluster_ngos['Latitude'].mean()),
                    'center_lon': float(cluster_ngos['Longitude'].mean()),
                    'acceptance_rate_avg': float(cluster_ngos['Acceptance_Rate'].mean())
                }
        
        print(f"   ✅ Created profiles for {len(self.cluster_stats)} clusters")
    
    def save_clustering(self):
        """Save clustering results"""
        output_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data"
        )
        
        print("\n💾 Saving clustering results...")
        
        # Save NGO assignments
        output_file = os.path.join(output_path, "ngo_clusters.csv")
        self.ngos_df.to_csv(output_file, index=False)
        print(f"   ✅ Saved NGO cluster assignments to ngo_clusters.csv")
        
        # Save cluster stats
        models_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "models"
        )
        os.makedirs(models_path, exist_ok=True)
        
        stats_file = os.path.join(models_path, "cluster_stats.pkl")
        with open(stats_file, 'wb') as f:
            pickle.dump(self.cluster_stats, f)
        print(f"   ✅ Saved cluster statistics")
        
        self.is_trained = True
    
    def load_clustering(self):
        """Load pre-computed clustering results"""
        data_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data"
        )
        
        try:
            clusters_file = os.path.join(data_path, "ngo_clusters.csv")
            if os.path.exists(clusters_file):
                self.ngos_df = pd.read_csv(clusters_file)
                
                # Load cluster stats
                models_path = os.path.join(
                    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    "models"
                )
                stats_file = os.path.join(models_path, "cluster_stats.pkl")
                
                if os.path.exists(stats_file):
                    with open(stats_file, 'rb') as f:
                        self.cluster_stats = pickle.load(f)
                
                self.is_trained = True
                print(f"✅ Loaded clustering results for {len(self.ngos_df)} NGOs")
                return True
        except Exception as e:
            print(f"⚠️ Could not load clustering: {e}")
            self.is_trained = False
            return False
    
    def get_cluster_info(self, cluster_key=None):
        """Get information about clusters"""
        if not self.is_trained:
            return {"error": "Clustering not performed yet"}
        
        if cluster_key:
            return self.cluster_stats.get(cluster_key, {"error": "Cluster not found"})
        else:
            return self.cluster_stats
    
    def get_ngos_in_cluster(self, geo_cluster, behavioral_cluster=None):
        """Get NGOs in a specific cluster"""
        if not self.is_trained:
            return []
        
        result = self.ngos_df[self.ngos_df['GeoCluster'] == geo_cluster]
        
        if behavioral_cluster is not None:
            result = result[result['BehavioralCluster'] == behavioral_cluster]
        
        return result.to_dict('records')


def perform_clustering():
    """Main function to perform NGO clustering"""
    print("=" * 60)
    print("NGO CLUSTERING")
    print("=" * 60)
    
    clusterer = NGOClusterer()
    clusterer.load_data()
    
    # Stage 1: Geographic clustering
    clusterer.stage1_geographic_clustering(eps_km=25, min_samples=3)
    
    # Stage 2: Behavioral clustering
    clusterer.stage2_behavioral_clustering(n_clusters=3)
    
    # Create cluster profiles
    clusterer.create_cluster_profiles()
    
    # Save results
    clusterer.save_clustering()
    
    print("\n" + "=" * 60)
    print("✅ NGO CLUSTERING COMPLETE!")
    print("=" * 60)
    
    # Display summary
    print("\n📊 CLUSTER SUMMARY:")
    for cluster_key, stats in list(clusterer.cluster_stats.items())[:5]:
        print(f"\n   Cluster {cluster_key}:")
        print(f"   - NGOs: {stats['ngo_count']}")
        print(f"   - Cities: {', '.join(stats['cities'][:3])}")
        print(f"   - Total capacity: {stats['total_capacity']} items/week")
        print(f"   - Urgent needs: {stats['urgent_needs']}")
    
    if len(clusterer.cluster_stats) > 5:
        print(f"\n   ... and {len(clusterer.cluster_stats) - 5} more clusters")
    
    return clusterer


if __name__ == "__main__":
    clusterer = perform_clustering()
    
    # Test cluster retrieval
    print("\n" + "=" * 60)
    print("TESTING CLUSTER RETRIEVAL")
    print("=" * 60)
    
    # Get first cluster info
    first_cluster = list(clusterer.cluster_stats.keys())[0]
    print(f"\n📍 Details for {first_cluster}:")
    info = clusterer.get_cluster_info(first_cluster)
    print(f"   Cities: {', '.join(info['cities'])}")
    print(f"   NGO count: {info['ngo_count']}")
    print(f"   Average capacity: {info['avg_capacity']:.0f} items/week")
    print(f"   Main causes: {list(info['causes'].keys())[:3]}")
