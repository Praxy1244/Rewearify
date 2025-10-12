"""
Test cases for Content-Based Matching model
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.matching import ContentBasedMatcher
from utils.feature_engineering import FeatureEngineer

class TestContentBasedMatcher:
    
    @pytest.fixture
    def sample_data(self):
        """Create sample data for testing"""
        # Sample donations
        donations_data = {
            'DonationID': ['DON001', 'DON002', 'DON003'],
            'Type': ['shirt', 'jacket', 'saree'],
            'Season': ['All', 'Winter', 'Summer'],
            'Latitude': [28.6139, 19.0760, 12.9716],
            'Longitude': [77.2090, 72.8777, 77.5946],
            'Location_City': ['Delhi', 'Mumbai', 'Bengaluru']
        }
        donations_df = pd.DataFrame(donations_data)
        
        # Sample NGOs
        ngos_data = {
            'NGO_ID': ['NGO001', 'NGO002', 'NGO003', 'NGO004'],
            'Latitude': [28.6000, 19.0000, 12.9000, 28.7000],
            'Longitude': [77.2000, 72.8000, 77.5000, 77.3000],
            'Urgent_Need': [True, False, True, False],
            'Capacity_per_week': [100, 200, 150, 80],
            'Acceptance_Rate': [0.95, 0.85, 0.90, 0.75],
            'City': ['Delhi', 'Mumbai', 'Bengaluru', 'Delhi']
        }
        ngos_df = pd.DataFrame(ngos_data)
        
        return donations_df, ngos_df
    
    @pytest.fixture
    def matcher_with_features(self, sample_data):
        """Create matcher with sample features"""
        donations_df, ngos_df = sample_data
        
        feature_engineer = FeatureEngineer()
        matching_features = feature_engineer.prepare_matching_features(donations_df, ngos_df)
        
        matcher = ContentBasedMatcher()
        matcher.fit(matching_features)
        
        return matcher, matching_features
    
    def test_matcher_initialization(self):
        """Test matcher initialization"""
        matcher = ContentBasedMatcher()
        
        assert matcher.weights is not None
        assert 'type_similarity' in matcher.weights
        assert 'proximity_score' in matcher.weights
        assert sum(matcher.weights.values()) == pytest.approx(1.0, rel=1e-2)
    
    def test_clothing_similarity_matrix(self):
        """Test clothing similarity matrix creation"""
        matcher = ContentBasedMatcher()
        similarity_matrix = matcher._create_clothing_similarity_matrix()
        
        assert 'shirt' in similarity_matrix
        assert 'jacket' in similarity_matrix
        
        # Same type should have similarity 1.0
        assert similarity_matrix['shirt']['shirt'] == 1.0
        
        # Different types should have similarity < 1.0
        assert similarity_matrix['shirt']['jacket'] < 1.0
    
    def test_match_score_calculation(self, matcher_with_features):
        """Test match score calculation"""
        matcher, matching_features = matcher_with_features
        
        # Get first donation-NGO pair
        first_match = matching_features.iloc[0]
        
        score = matcher.calculate_match_score(first_match)
        
        assert isinstance(score, float)
        assert 0 <= score <= 1
    
    def test_get_top_matches(self, matcher_with_features):
        """Test getting top matches for a donation"""
        matcher, matching_features = matcher_with_features
        
        donation_id = 'DON001'
        matches = matcher.get_top_matches(donation_id, matching_features, top_k=3)
        
        assert isinstance(matches, list)
        assert len(matches) <= 3
        
        if matches:
            # Check structure of match result
            match = matches[0]
            assert 'NGO_ID' in match
            assert 'Match_Score' in match
            assert 'Distance_km' in match
            assert 'Explanation' in match
            
            # Scores should be in descending order
            if len(matches) > 1:
                assert matches[0]['Match_Score'] >= matches[1]['Match_Score']
    
    def test_batch_matching(self, matcher_with_features):
        """Test batch matching functionality"""
        matcher, matching_features = matcher_with_features
        
        donation_ids = ['DON001', 'DON002']
        batch_results = matcher.batch_match(donation_ids, matching_features, top_k=2)
        
        assert isinstance(batch_results, dict)
        assert len(batch_results) == len(donation_ids)
        
        for donation_id in donation_ids:
            assert donation_id in batch_results
            assert isinstance(batch_results[donation_id], list)
    
    def test_explanation_generation(self, matcher_with_features):
        """Test explanation generation"""
        matcher, matching_features = matcher_with_features
        
        # Get a sample match
        first_match = matching_features.iloc[0]
        explanation = matcher._generate_explanation(first_match)
        
        assert isinstance(explanation, str)
        assert len(explanation) > 0
    
    def test_model_persistence(self, matcher_with_features, tmp_path):
        """Test model saving and loading"""
        matcher, _ = matcher_with_features
        
        # Save model
        model_path = tmp_path / "test_matcher.joblib"
        matcher.save_model(str(model_path))
        
        assert model_path.exists()
        
        # Load model
        new_matcher = ContentBasedMatcher()
        new_matcher.load_model(str(model_path))
        
        # Compare weights
        assert new_matcher.weights == matcher.weights
    
    def test_evaluation(self, matcher_with_features):
        """Test model evaluation"""
        matcher, matching_features = matcher_with_features
        
        evaluation_results = matcher.evaluate_matches(matching_features)
        
        assert 'total_donations' in evaluation_results
        assert 'coverage' in evaluation_results
        assert evaluation_results['total_donations'] > 0
        assert 0 <= evaluation_results['coverage'] <= 1

# Integration test
def test_end_to_end_matching():
    """Test complete matching pipeline"""
    # Create more comprehensive test data
    np.random.seed(42)
    
    # Generate test donations
    donations_data = {
        'DonationID': [f'DON{i:03d}' for i in range(1, 11)],
        'Type': np.random.choice(['shirt', 'jacket', 'saree'], 10),
        'Season': np.random.choice(['Winter', 'Summer', 'All'], 10),
        'Latitude': np.random.uniform(12, 29, 10),
        'Longitude': np.random.uniform(72, 78, 10),
        'Location_City': np.random.choice(['Delhi', 'Mumbai', 'Bengaluru'], 10)
    }
    donations_df = pd.DataFrame(donations_data)
    
    # Generate test NGOs
    ngos_data = {
        'NGO_ID': [f'NGO{i:03d}' for i in range(1, 6)],
        'Latitude': np.random.uniform(12, 29, 5),
        'Longitude': np.random.uniform(72, 78, 5),
        'Urgent_Need': np.random.choice([True, False], 5),
        'Capacity_per_week': np.random.randint(50, 300, 5),
        'Acceptance_Rate': np.random.uniform(0.7, 0.95, 5),
        'City': np.random.choice(['Delhi', 'Mumbai', 'Bengaluru'], 5),
        'Cause': np.random.choice(['Child_Welfare', 'Women_Empowerment', 'Education', 'Healthcare'], 5)
    }
    ngos_df = pd.DataFrame(ngos_data)
    
    # Run complete pipeline
    feature_engineer = FeatureEngineer()
    matching_features = feature_engineer.prepare_matching_features(donations_df, ngos_df)
    
    matcher = ContentBasedMatcher()
    matcher.fit(matching_features)
    
    # Test matching for all donations
    all_donation_ids = donations_df['DonationID'].tolist()
    batch_results = matcher.batch_match(all_donation_ids, matching_features, top_k=3)
    
    assert len(batch_results) == len(all_donation_ids)
    
    # Verify each donation has matches
    for donation_id, matches in batch_results.items():
        assert len(matches) > 0  # Should have at least one match
        
        # Verify match structure
        for match in matches:
            assert 'NGO_ID' in match
            assert 'Match_Score' in match
            assert match['Match_Score'] >= 0

if __name__ == "__main__":
    pytest.main([__file__])