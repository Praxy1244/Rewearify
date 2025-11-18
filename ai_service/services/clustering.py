import pandas as pd
import os
from sklearn.cluster import KMeans

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NGO_DATA_PATH = os.path.join(BASE_DIR, 'data', 'generated', 'ngos.csv')

def get_ngo_clusters():
    """
    Groups NGOs into clusters based on Latitude/Longitude for optimized pickup.
    """
    try:
        if not os.path.exists(NGO_DATA_PATH):
            return []

        df = pd.read_csv(NGO_DATA_PATH)
        
        # Ensure we have lat/lon. If simulated data is missing these, this handles it safely.
        if 'Latitude' not in df.columns:
            return []

        # Use KMeans to create 3 geographic clusters
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        df['cluster'] = kmeans.fit_predict(df[['Latitude', 'Longitude']])
        
        # Format output for the UI
        clusters = []
        for cluster_id in range(3):
            ngos_in_cluster = df[df['cluster'] == cluster_id]
            
            clusters.append({
                "clusterId": cluster_id + 1,
                "regionName": f"Zone {cluster_id + 1} ({ngos_in_cluster.iloc[0]['City']})",
                "ngos": [{"name": row['Name'], "location": row['City']} for _, row in ngos_in_cluster.iterrows()]
            })
            
        return clusters

    except Exception as e:
        print(f"Error in clustering: {e}")
        return []