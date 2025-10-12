"""
Feature engineering utilities for SCDP AI models
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler, OneHotEncoder
from geopy.distance import geodesic
import math

class FeatureEngineer:
    def __init__(self):
        self.label_encoders = {}
        self.scalers = {}
        self.clothing_ontology = {
            'tops': ['shirt', 'jacket', 'dress'],
            'bottoms': ['pants'],
            'traditional': ['saree'],
            'accessories': ['footwear'],
            'bedding': ['blanket']
        }
    
    def create_clothing_similarity_matrix(self):
        """Create clothing type similarity matrix based on ontology"""
        all_types = []
        for category, types in self.clothing_ontology.items():
            all_types.extend(types)
        
        similarity_matrix = {}
        for type1 in all_types:
            similarity_matrix[type1] = {}
            for type2 in all_types:
                if type1 == type2:
                    similarity_matrix[type1][type2] = 1.0
                else:
                    # Check if they're in the same category
                    same_category = False
                    for category, types in self.clothing_ontology.items():
                        if type1 in types and type2 in types:
                            same_category = True
                            break
                    similarity_matrix[type1][type2] = 0.7 if same_category else 0.3
        
        return similarity_matrix
    
    def calculate_distance_km(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two points in kilometers"""
        try:
            return geodesic((lat1, lon1), (lat2, lon2)).kilometers
        except:
            # Fallback to haversine formula
            lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
            c = 2 * math.asin(math.sqrt(a))
            r = 6371  # Radius of earth in kilometers
            return c * r
    
    def prepare_matching_features(self, donations_df, ngos_df):
        """Prepare features for content-based matching"""
        matching_features = []
        similarity_matrix = self.create_clothing_similarity_matrix()
        
        for _, donation in donations_df.iterrows():
            for _, ngo in ngos_df.iterrows():
                # Calculate distance
                distance_km = self.calculate_distance_km(
                    donation['Latitude'], donation['Longitude'],
                    ngo['Latitude'], ngo['Longitude']
                )
                
                # Type similarity
                type_similarity = similarity_matrix.get(donation['Type'], {}).get(donation['Type'], 0.5)
                
                # Season match (binary)
                season_match = 1 if donation['Season'] == 'All' or donation['Season'] in ['Winter', 'Summer'] else 0
                
                # Urgency score
                urgency_score = 1 if ngo['Urgent_Need'] else 0.5
                
                # Capacity score (normalized)
                capacity_score = min(ngo['Capacity_per_week'] / 500.0, 1.0)  # Normalize to 0-1
                
                # Historical acceptance
                historical_acceptance = ngo.get('Acceptance_Rate', 0.5)
                
                # Proximity score (inverse of distance, normalized)
                proximity_score = 1 / (1 + distance_km / 100.0)  # Normalize by 100km
                
                feature = {
                    'DonationID': donation['DonationID'],
                    'NGO_ID': ngo['NGO_ID'],
                    'Distance_km': distance_km,
                    'Type_Similarity': type_similarity,
                    'Season_Match': season_match,
                    'Urgency_Score': urgency_score,
                    'Capacity_Score': capacity_score,
                    'Historical_Acceptance': historical_acceptance,
                    'Proximity_Score': proximity_score,
                    'Donation_Type': donation['Type'],
                    'Donation_Season': donation['Season'],
                    'NGO_Cause': ngo.get('Cause', 'General'),
                    'NGO_City': ngo['City'],
                    'Donation_City': donation['Location_City']
                }
                matching_features.append(feature)
        
        return pd.DataFrame(matching_features)
    
    def prepare_fraud_features(self, donors_df, donations_df, logs_df):
        """Prepare features for fraud detection"""
        # Ensure timestamps are datetime
        donations_df['Timestamp_Submitted'] = pd.to_datetime(donations_df['Timestamp_Submitted'], errors='coerce')
        donations_df['Timestamp_PickedUp'] = pd.to_datetime(donations_df['Timestamp_PickedUp'], errors='coerce')
        logs_df['Timestamp'] = pd.to_datetime(logs_df['Timestamp'], errors='coerce')
        
        fraud_features = []
        
        for _, donor in donors_df.iterrows():
            donor_donations = donations_df[donations_df['DonorID'] == donor['DonorID']]
            donor_logs = logs_df[logs_df['DonationID'].isin(donor_donations['DonationID'])]
            
            if len(donor_donations) == 0:
                continue
            
            total_donations = len(donor_donations)
            avg_quantity_claimed = donor_donations['Quantity'].mean()
            
            delivered_logs = donor_logs[donor_logs['State'] == 'delivered']
            if len(delivered_logs) > 0:
                total_claimed = donor_donations[donor_donations['DonationID'].isin(delivered_logs['DonationID'])]['Quantity'].sum()
                total_received = delivered_logs['Quantity_Received'].sum()
                avg_quantity_received_ratio = total_received / max(total_claimed, 1)
            else:
                avg_quantity_received_ratio = 0.0
            
            pickup_donations = donor_donations[donor_donations['Timestamp_PickedUp'].notna()]
            if len(pickup_donations) > 0:
                delays = []
                for _, donation in pickup_donations.iterrows():
                    delay = (donation['Timestamp_PickedUp'] - donation['Timestamp_Submitted']).days
                    delays.append(delay)
                avg_fulfillment_delay = np.mean(delays)
            else:
                avg_fulfillment_delay = 999
            
            num_manual_rejects = len(donor_donations[donor_donations['AdminDecision'].isin(['ManualRejected'])])
            
            feedback_logs = donor_logs[donor_logs['Feedback'].notna() & donor_logs['Feedback'].str.contains('Rating')]
            if len(feedback_logs) > 0:
                ratings = []
                for feedback in feedback_logs['Feedback']:
                    try:
                        rating = int(feedback.split('Rating: ')[1].split('/')[0])
                        ratings.append(rating)
                    except:
                        pass
                feedback_mean = np.mean(ratings) if ratings else 2.5
            else:
                feedback_mean = 2.5
            
            is_fake = (donor['Reliability_Score'] < 0.4) or donor['Flagged'] or (num_manual_rejects > 2)
            
            feature = {
                'DonorID': donor['DonorID'],
                'Donor_Reliability': donor['Reliability_Score'],
                'Past_Donations': total_donations,
                'Avg_Quantity_Claimed': avg_quantity_claimed,
                'Avg_Quantity_Received_Ratio': avg_quantity_received_ratio,
                'Avg_Fulfillment_Delay': avg_fulfillment_delay,
                'Num_Manual_Rejects': num_manual_rejects,
                'Num_Flagged': int(donor['Flagged']),
                'Feedback_Mean': feedback_mean,
                'Is_Fake': int(is_fake)
            }
            fraud_features.append(feature)
        
        return pd.DataFrame(fraud_features)
    
    def prepare_clustering_features(self, ngos_df, donations_df):
        """Prepare features for NGO clustering"""
        clustering_features = []
        
        for _, ngo in ngos_df.iterrows():
            ngo_donations = donations_df[donations_df['Matched_NGO_ID'] == ngo['NGO_ID']]
            
            clothing_types = ['shirt', 'jacket', 'saree', 'blanket', 'pants', 'dress', 'footwear']
            demand_vector = {}
            
            total_items = len(ngo_donations)
            for clothing_type in clothing_types:
                count = len(ngo_donations[ngo_donations['Type'] == clothing_type])
                demand_vector[f'Demand_{clothing_type}'] = count / max(total_items, 1)
            
            feature = {
                'NGO_ID': ngo['NGO_ID'],
                'Latitude': ngo['Latitude'],
                'Longitude': ngo['Longitude'],
                'Capacity_per_week': ngo['Capacity_per_week'],
                'Urgent_Need': int(ngo['Urgent_Need']),
                'Total_Matched_Donations': total_items,
                **demand_vector
            }
            clustering_features.append(feature)
        
        return pd.DataFrame(clustering_features)
    
    def prepare_timeseries_features(self, donations_df, ngos_df):
        """Prepare features for time series forecasting"""
        donations_df['Timestamp_Submitted'] = pd.to_datetime(donations_df['Timestamp_Submitted'], errors='coerce')
        donations_df['Year'] = donations_df['Timestamp_Submitted'].dt.year
        donations_df['Month'] = donations_df['Timestamp_Submitted'].dt.month
        donations_df['YearMonth'] = donations_df['Timestamp_Submitted'].dt.to_period('M')
        donations_df['YearMonth'] = donations_df['YearMonth'].dt.to_timestamp()  # Convert to datetime
        
        # Aggregate by city, type, and month
        city_type_monthly = donations_df.groupby(['Location_City', 'Type', 'YearMonth']).agg({
            'Quantity': 'sum',
            'DonationID': 'count'
        }).reset_index()
        city_type_monthly.columns = ['City', 'Type', 'YearMonth', 'Total_Quantity', 'Total_Donations']
        
        # Aggregate by NGO cluster (simplified - by city)
        ngo_monthly = donations_df[donations_df['Matched_NGO_ID'].notna()].groupby(['Location_City', 'YearMonth']).agg({
            'Quantity': 'sum',
            'DonationID': 'count'
        }).reset_index()
        ngo_monthly.columns = ['City', 'YearMonth', 'Total_Quantity', 'Total_Donations']
        
        return city_type_monthly, ngo_monthly
                          