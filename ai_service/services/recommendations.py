import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime, timedelta
import json


class RecommendationEngine:
    def __init__(self, ngos_df, donations_df):
        """Initialize recommendation engine with NGO and donation data"""
        self.ngos_df = ngos_df
        self.donations_df = donations_df.copy()  # Make a copy to avoid modifying original
        
        # Normalize column names to match expected format
        self._normalize_donation_columns()
        
        self.ngo_features = None
        self.donor_profiles = None
    
    def _normalize_donation_columns(self):
        """Normalize donation dataframe column names to match expected format"""
        column_mapping = {
            'donor': 'donor_id',  # MongoDB field
            'DonorID': 'donor_id',
            'Type': 'category',
            'Condition_Donor': 'condition',
            'Matched_NGO_ID': 'matched_ngo',
            'Timestamp_Submitted': 'created_at',
            'Location_City': 'city',
            'Quantity': 'quantity',
        }
        
        # Rename columns if they exist
        for old_name, new_name in column_mapping.items():
            if old_name in self.donations_df.columns:
                self.donations_df.rename(columns={old_name: new_name}, inplace=True)
        
        print(f"📊 Normalized donation columns: {list(self.donations_df.columns[:8])}")
        
    def build_ngo_feature_matrix(self):
        """Build feature matrix for NGOs"""
        # Create feature vectors for each NGO
        features = []
        
        for _, ngo in self.ngos_df.iterrows():
            feature_vector = []
            
            # Focus areas (one-hot encoding)
            focus_areas = ['education', 'healthcare', 'poverty', 'disaster_relief', 
                          'environment', 'women_empowerment', 'child_welfare', 'elderly_care']
            for area in focus_areas:
                feature_vector.append(1 if area in ngo.get('focus_areas', []) else 0)
            
            # Operational scope
            scope_map = {'local': 1, 'state': 2, 'national': 3, 'international': 4}
            feature_vector.append(scope_map.get(ngo.get('operational_scope', 'local'), 1))
            
            # Cluster
            feature_vector.append(ngo.get('cluster', 0))
            
            # Trust score (normalized)
            feature_vector.append(ngo.get('trust_score', 50) / 100)
            
            # Impact score (normalized)
            feature_vector.append(ngo.get('impact_score', 50) / 100)
            
            # Years active (normalized to 0-1)
            feature_vector.append(min(ngo.get('years_active', 1) / 20, 1))
            
            features.append(feature_vector)
        
        self.ngo_features = np.array(features)
        return self.ngo_features
    
    def build_donor_profiles(self):
        """Build donor preference profiles from donation history"""
        donor_profiles = {}
        
        # Group donations by donor
        for donor_id in self.donations_df['donor_id'].unique():
            donor_donations = self.donations_df[self.donations_df['donor_id'] == donor_id]
            
            profile = {
                'total_donations': len(donor_donations),
                'categories': donor_donations['category'].value_counts().to_dict() if 'category' in donor_donations.columns else {},
                'preferred_locations': donor_donations['city'].value_counts().to_dict() if 'city' in donor_donations.columns else {},
                'avg_quantity': donor_donations['quantity'].mean() if 'quantity' in donor_donations.columns else 1,
                'total_quantity': donor_donations['quantity'].sum() if 'quantity' in donor_donations.columns else len(donor_donations),
                'conditions': donor_donations['condition'].value_counts().to_dict() if 'condition' in donor_donations.columns else {},
                'recent_activity': (datetime.now() - pd.to_datetime(donor_donations['created_at']).max()).days if 'created_at' in donor_donations.columns else 30,
                'donation_frequency': len(donor_donations) / max((datetime.now() - pd.to_datetime(donor_donations['created_at']).min()).days, 1) if 'created_at' in donor_donations.columns else 0.1
            }
            
            donor_profiles[str(donor_id)] = profile
        
        self.donor_profiles = donor_profiles
        return donor_profiles
    
    def get_collaborative_recommendations(self, donor_id, n=5):
        """Get recommendations based on similar donors (collaborative filtering)"""
        if donor_id not in self.donor_profiles:
            return []
        
        donor_profile = self.donor_profiles[donor_id]
        similar_donors = []
        
        # Find donors with similar donation patterns
        for other_donor_id, other_profile in self.donor_profiles.items():
            if other_donor_id == donor_id:
                continue
            
            # Calculate similarity score
            similarity = 0
            
            # Category similarity
            donor_cats = set(donor_profile['categories'].keys())
            other_cats = set(other_profile['categories'].keys())
            if donor_cats and other_cats:
                cat_similarity = len(donor_cats & other_cats) / len(donor_cats | other_cats)
                similarity += cat_similarity * 0.4
            
            # Location similarity
            donor_locs = set(donor_profile['preferred_locations'].keys())
            other_locs = set(other_profile['preferred_locations'].keys())
            if donor_locs and other_locs:
                loc_similarity = len(donor_locs & other_locs) / len(donor_locs | other_locs)
                similarity += loc_similarity * 0.3
            
            # Quantity similarity
            qty_diff = abs(donor_profile['avg_quantity'] - other_profile['avg_quantity'])
            qty_similarity = 1 / (1 + qty_diff / 10)
            similarity += qty_similarity * 0.3
            
            if similarity > 0.3:  # Threshold
                similar_donors.append((other_donor_id, similarity))
        
        # Sort by similarity
        similar_donors.sort(key=lambda x: x[1], reverse=True)
        
        # Get NGOs that similar donors donated to
        recommended_ngos = []
        for similar_donor_id, sim_score in similar_donors[:5]:
            similar_donor_donations = self.donations_df[
                self.donations_df['donor_id'] == similar_donor_id
            ]
            if 'matched_ngo' in similar_donor_donations.columns:
                for ngo_id in similar_donor_donations['matched_ngo'].dropna().unique():
                    if ngo_id not in recommended_ngos:
                        recommended_ngos.append(ngo_id)
        
        return recommended_ngos[:n]
    
    def get_content_based_recommendations(self, donor_id, n=5):
        """Get recommendations based on NGO attributes (content-based filtering)"""
        if donor_id not in self.donor_profiles:
            return self.get_popular_ngos(n)
        
        donor_profile = self.donor_profiles[donor_id]
        donor_donations = self.donations_df[self.donations_df['donor_id'] == donor_id]
        
        # Build ideal NGO profile from donor's history
        ideal_profile = np.zeros(self.ngo_features.shape[1])
        
        # Weight by recency (recent donations matter more)
        if 'matched_ngo' in donor_donations.columns and 'created_at' in donor_donations.columns:
            for _, donation in donor_donations.iterrows():
                ngo_id = donation.get('matched_ngo')
                if pd.notna(ngo_id):
                    ngo_idx = self.ngos_df[self.ngos_df['_id'] == ngo_id].index
                    if len(ngo_idx) > 0:
                        # Calculate recency weight (exponential decay)
                        days_ago = (datetime.now() - pd.to_datetime(donation['created_at'])).days
                        weight = np.exp(-days_ago / 90)  # 90-day half-life
                        ideal_profile += self.ngo_features[ngo_idx[0]] * weight
        
        if ideal_profile.sum() > 0:
            ideal_profile = ideal_profile / ideal_profile.sum()
        else:
            return self.get_popular_ngos(n)
        
        # Calculate similarity to all NGOs
        similarities = cosine_similarity([ideal_profile], self.ngo_features)[0]
        
        # Get top N NGOs
        top_indices = similarities.argsort()[-n:][::-1]
        recommended_ngo_ids = self.ngos_df.iloc[top_indices]['_id'].tolist()
        
        return recommended_ngo_ids
    
    def get_cluster_based_recommendations(self, donor_id, n=5):
        """Get recommendations based on NGO clusters"""
        donor_donations = self.donations_df[self.donations_df['donor_id'] == donor_id]
        
        if len(donor_donations) == 0 or 'matched_ngo' not in donor_donations.columns:
            return self.get_popular_ngos(n)
        
        # Find clusters donor has donated to
        donated_ngos = donor_donations['matched_ngo'].dropna().unique()
        clusters = []
        
        for ngo_id in donated_ngos:
            ngo = self.ngos_df[self.ngos_df['_id'] == ngo_id]
            if len(ngo) > 0:
                clusters.append(ngo.iloc[0].get('cluster', 0))
        
        if not clusters:
            return self.get_popular_ngos(n)
        
        # Most common cluster
        most_common_cluster = max(set(clusters), key=clusters.count)
        
        # Get NGOs from same cluster (excluding already donated)
        cluster_ngos = self.ngos_df[
            (self.ngos_df['cluster'] == most_common_cluster) &
            (~self.ngos_df['_id'].isin(donated_ngos))
        ]
        
        # Sort by trust and impact scores
        if 'trust_score' in cluster_ngos.columns and 'impact_score' in cluster_ngos.columns:
            cluster_ngos = cluster_ngos.sort_values(
                by=['trust_score', 'impact_score'], 
                ascending=False
            )
        
        return cluster_ngos.head(n)['_id'].tolist()
    
    def get_location_based_recommendations(self, donor_id, donor_location, n=5):
        """Get recommendations based on donor's location"""
        if 'city' not in self.ngos_df.columns:
            return self.get_popular_ngos(n)
            
        # Get NGOs near donor
        nearby_ngos = self.ngos_df[
            self.ngos_df['city'].str.lower() == donor_location.lower()
        ]
        
        # Sort by trust score
        if 'trust_score' in nearby_ngos.columns:
            nearby_ngos = nearby_ngos.sort_values(by='trust_score', ascending=False)
        
        return nearby_ngos.head(n)['_id'].tolist()
    
    def get_popular_ngos(self, n=5):
        """Get most popular NGOs (fallback)"""
        # Sort by trust and impact scores
        if 'trust_score' in self.ngos_df.columns and 'impact_score' in self.ngos_df.columns:
            popular = self.ngos_df.sort_values(
                by=['trust_score', 'impact_score'], 
                ascending=False
            )
        else:
            popular = self.ngos_df
            
        return popular.head(n)['_id'].tolist()
    
    def get_hybrid_recommendations(self, donor_id, donor_location=None, n=10, weights=None):
        """
        Hybrid recommendation combining all methods
        
        Args:
            donor_id: Donor ID
            donor_location: Donor's city
            n: Number of recommendations
            weights: Dict with weights for each method
        """
        if weights is None:
            weights = {
                'collaborative': 0.25,
                'content': 0.30,
                'cluster': 0.25,
                'location': 0.20
            }
        
        recommendations = {}
        
        # Get recommendations from each method
        collab_recs = self.get_collaborative_recommendations(donor_id, n)
        content_recs = self.get_content_based_recommendations(donor_id, n)
        cluster_recs = self.get_cluster_based_recommendations(donor_id, n)
        
        if donor_location:
            location_recs = self.get_location_based_recommendations(donor_id, donor_location, n)
        else:
            location_recs = []
        
        # Score each NGO
        for ngo_id in set(collab_recs + content_recs + cluster_recs + location_recs):
            score = 0
            
            if ngo_id in collab_recs:
                score += weights['collaborative'] * (1 - collab_recs.index(ngo_id) / max(len(collab_recs), 1))
            
            if ngo_id in content_recs:
                score += weights['content'] * (1 - content_recs.index(ngo_id) / max(len(content_recs), 1))
            
            if ngo_id in cluster_recs:
                score += weights['cluster'] * (1 - cluster_recs.index(ngo_id) / max(len(cluster_recs), 1))
            
            if ngo_id in location_recs:
                score += weights['location'] * (1 - location_recs.index(ngo_id) / max(len(location_recs), 1))
            
            recommendations[ngo_id] = score
        
        # If no recommendations, fall back to popular
        if not recommendations:
            popular_ids = self.get_popular_ngos(n)
            for idx, ngo_id in enumerate(popular_ids):
                recommendations[ngo_id] = 1 - (idx / max(len(popular_ids), 1))
        
        # Sort by score
        sorted_recs = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)
        
        # Get top N with details
        top_ngos = []
        for ngo_id, score in sorted_recs[:n]:
            ngo = self.ngos_df[self.ngos_df['_id'] == ngo_id]
            if len(ngo) > 0:
                ngo_data = ngo.iloc[0].to_dict()
                # Convert ObjectId to string
                if '_id' in ngo_data:
                    ngo_data['_id'] = str(ngo_data['_id'])
                ngo_data['recommendation_score'] = round(score, 3)
                ngo_data['recommendation_reason'] = self._get_recommendation_reason(
                    ngo_id, collab_recs, content_recs, cluster_recs, location_recs
                )
                top_ngos.append(ngo_data)
        
        return top_ngos
    
    def _get_recommendation_reason(self, ngo_id, collab, content, cluster, location):
        """Generate explanation for recommendation"""
        reasons = []
        
        if ngo_id in collab:
            reasons.append("Similar donors donated here")
        if ngo_id in content:
            reasons.append("Matches your donation pattern")
        if ngo_id in cluster:
            reasons.append("Similar to NGOs you've supported")
        if ngo_id in location:
            reasons.append("Located near you")
        
        return ", ".join(reasons) if reasons else "Highly rated NGO"


# Initialize with empty data (will be loaded in main.py)
recommendation_engine = None


def initialize_recommendation_engine(ngos_df, donations_df):
    """Initialize the recommendation engine with data"""
    global recommendation_engine
    recommendation_engine = RecommendationEngine(ngos_df, donations_df)
    recommendation_engine.build_ngo_feature_matrix()
    recommendation_engine.build_donor_profiles()
    return recommendation_engine
