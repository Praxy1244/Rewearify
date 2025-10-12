"""
Content-Based Filtering (CBF) matching model for SCDP
Matches donations to NGOs based on multiple criteria
"""

import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import joblib
import os

class ContentBasedMatcher:
    def __init__(self):
        self.scaler = StandardScaler()
        self.weights = {
            'type_similarity': 0.25,
            'season_match': 0.15,
            'proximity_score': 0.20,
            'urgency_score': 0.15,
            'capacity_score': 0.10,
            'historical_acceptance': 0.15
        }
        self.clothing_similarity_matrix = None
        
    def fit(self, matching_features_df):
        """Train the matching model"""
        # Create clothing similarity matrix
        self.clothing_similarity_matrix = self._create_clothing_similarity_matrix()
        
        # Prepare numerical features for scaling
        numerical_features = [
            'Distance_km', 'Type_Similarity', 'Season_Match', 
            'Urgency_Score', 'Capacity_Score', 'Historical_Acceptance', 'Proximity_Score'
        ]
        
        self.scaler.fit(matching_features_df[numerical_features])
        
        return self
    
    def _create_clothing_similarity_matrix(self):
        """Create clothing type similarity matrix"""
        clothing_ontology = {
            'tops': ['shirt', 'jacket', 'dress'],
            'bottoms': ['pants'],
            'traditional': ['saree'],
            'accessories': ['footwear'],
            'bedding': ['blanket']
        }
        
        all_types = []
        for category, types in clothing_ontology.items():
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
                    for category, types in clothing_ontology.items():
                        if type1 in types and type2 in types:
                            same_category = True
                            break
                    similarity_matrix[type1][type2] = 0.7 if same_category else 0.3
        
        return similarity_matrix
    
    def calculate_match_score(self, donation_features):
        """Calculate weighted match score for a donation-NGO pair"""
        score = (
            self.weights['type_similarity'] * donation_features['Type_Similarity'] +
            self.weights['season_match'] * donation_features['Season_Match'] +
            self.weights['proximity_score'] * donation_features['Proximity_Score'] +
            self.weights['urgency_score'] * donation_features['Urgency_Score'] +
            self.weights['capacity_score'] * donation_features['Capacity_Score'] +
            self.weights['historical_acceptance'] * donation_features['Historical_Acceptance']
        )
        return score
    
    def get_top_matches(self, donation_id, matching_features_df, top_k=5):
        """Get top K NGO matches for a donation"""
        donation_matches = matching_features_df[matching_features_df['DonationID'] == donation_id].copy()
        
        if len(donation_matches) == 0:
            return []
        
        # Calculate match scores
        donation_matches['Match_Score'] = donation_matches.apply(self.calculate_match_score, axis=1)
        
        # Sort by score and return top K
        top_matches = donation_matches.nlargest(top_k, 'Match_Score')
        
        results = []
        for _, match in top_matches.iterrows():
            result = {
                'NGO_ID': match['NGO_ID'],
                'Match_Score': match['Match_Score'],
                'Distance_km': match['Distance_km'],
                'Explanation': self._generate_explanation(match)
            }
            results.append(result)
        
        return results
    
    def _generate_explanation(self, match):
        """Generate human-readable explanation for the match"""
        explanations = []
        
        if match['Type_Similarity'] > 0.8:
            explanations.append("Perfect clothing type match")
        elif match['Type_Similarity'] > 0.6:
            explanations.append("Good clothing type compatibility")
        
        if match['Season_Match'] == 1:
            explanations.append("Seasonal need alignment")
        
        if match['Distance_km'] < 10:
            explanations.append("Very close proximity")
        elif match['Distance_km'] < 50:
            explanations.append("Reasonable distance")
        
        if match['Urgency_Score'] == 1:
            explanations.append("NGO has urgent need")
        
        if match['Historical_Acceptance'] > 0.9:
            explanations.append("High NGO acceptance rate")
        
        return "; ".join(explanations) if explanations else "Standard match criteria met"
    
    def batch_match(self, donation_ids, matching_features_df, top_k=3):
        """Get matches for multiple donations"""
        results = {}
        for donation_id in donation_ids:
            results[donation_id] = self.get_top_matches(donation_id, matching_features_df, top_k)
        return results
    
    def save_model(self, filepath):
        """Save the trained model"""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        model_data = {
            'scaler': self.scaler,
            'weights': self.weights,
            'clothing_similarity_matrix': self.clothing_similarity_matrix
        }
        joblib.dump(model_data, filepath)
    
    def load_model(self, filepath):
        """Load a trained model"""
        model_data = joblib.load(filepath)
        self.scaler = model_data['scaler']
        self.weights = model_data['weights']
        self.clothing_similarity_matrix = model_data['clothing_similarity_matrix']
        return self
    
    def evaluate_matches(self, test_features_df, ground_truth_matches=None):
        """Evaluate matching performance"""
        # For synthetic evaluation, we'll use distance and acceptance rate as proxy for "good match"
        results = {
            'total_donations': len(test_features_df['DonationID'].unique()),
            'avg_top1_distance': 0,
            'avg_top1_acceptance_rate': 0,
            'coverage': 0
        }
        
        donation_ids = test_features_df['DonationID'].unique()
        top1_distances = []
        top1_acceptance_rates = []
        covered_donations = 0
        
        for donation_id in donation_ids:
            matches = self.get_top_matches(donation_id, test_features_df, top_k=1)
            if matches:
                covered_donations += 1
                # Get the actual features for this match
                match_features = test_features_df[
                    (test_features_df['DonationID'] == donation_id) & 
                    (test_features_df['NGO_ID'] == matches[0]['NGO_ID'])
                ].iloc[0]
                
                top1_distances.append(match_features['Distance_km'])
                top1_acceptance_rates.append(match_features['Historical_Acceptance'])
        
        if top1_distances:
            results['avg_top1_distance'] = np.mean(top1_distances)
            results['avg_top1_acceptance_rate'] = np.mean(top1_acceptance_rates)
        
        results['coverage'] = covered_donations / len(donation_ids)
        
        return results