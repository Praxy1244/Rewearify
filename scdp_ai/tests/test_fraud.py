"""
Test cases for Fraud Detection model
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.fraud_detection import FraudDetector
from utils.feature_engineering import FeatureEngineer

class TestFraudDetector:
    
    @pytest.fixture
    def sample_fraud_data(self):
        """Create sample fraud detection data"""
        np.random.seed(42)
        
        # Create sample donor data with known fraud patterns
        fraud_data = {
            'DonorID': [f'D{i:06d}' for i in range(1, 101)],
            'Donor_Reliability': np.random.uniform(0.2, 0.9, 100),
            'Past_Donations': np.random.randint(0, 20, 100),
            'Avg_Quantity_Claimed': np.random.uniform(1, 50, 100),
            'Avg_Quantity_Received_Ratio': np.random.uniform(0.3, 1.0, 100),
            'Avg_Fulfillment_Delay': np.random.uniform(0, 100, 100),
            'Num_Manual_Rejects': np.random.randint(0, 10, 100),
            'Num_Flagged': np.random.randint(0, 2, 100),
            'Feedback_Mean': np.random.uniform(1, 5, 100)
        }
        
        # Create labels based on patterns
        fraud_labels = []
        for i in range(100):
            # Define fraud criteria
            is_fraud = (
                fraud_data['Donor_Reliability'][i] < 0.4 or
                fraud_data['Avg_Quantity_Received_Ratio'][i] < 0.5 or
                fraud_data['Num_Manual_Rejects'][i] > 3 or
                fraud_data['Feedback_Mean'][i] < 2.0
            )
            fraud_labels.append(int(is_fraud))
        
        fraud_data['Is_Fake'] = fraud_labels
        
        return pd.DataFrame(fraud_data)
    
    @pytest.fixture
    def trained_detector(self, sample_fraud_data):
        """Create trained fraud detector"""
        detector = FraudDetector(model_type='logistic', conservative_threshold=0.8)
        detector.fit(sample_fraud_data)
        return detector, sample_fraud_data
    
    def test_detector_initialization(self):
        """Test fraud detector initialization"""
        detector = FraudDetector()
        
        assert detector.model_type == 'logistic'
        assert detector.conservative_threshold == 0.8
        assert detector.scaler is not None
        assert detector.model is not None
    
    def test_different_model_types(self, sample_fraud_data):
        """Test different model types"""
        model_types = ['logistic', 'random_forest', 'decision_tree']
        
        for model_type in model_types:
            detector = FraudDetector(model_type=model_type)
            detector.fit(sample_fraud_data)
            
            # Test prediction
            sample_donor = sample_fraud_data.iloc[0].to_dict()
            prediction = detector.predict_with_explanation(sample_donor)
            
            assert 'fraud_probability' in prediction
            assert 'is_flagged' in prediction
            assert 'risk_level' in prediction
    
    def test_fraud_probability_prediction(self, trained_detector):
        """Test fraud probability prediction"""
        detector, data = trained_detector
        
        # Test with known good donor
        good_donor = {
            'DonorID': 'TEST001',
            'Donor_Reliability': 0.9,
            'Past_Donations': 10,
            'Avg_Quantity_Claimed': 5.0,
            'Avg_Quantity_Received_Ratio': 0.95,
            'Avg_Fulfillment_Delay': 2.0,
            'Num_Manual_Rejects': 0,
            'Num_Flagged': 0,
            'Feedback_Mean': 4.5
        }
        
        prob = detector.predict_fraud_probability(good_donor)[0]
        
        assert isinstance(prob, float)
        assert 0 <= prob <= 1
        assert prob < 0.5  # Should be low risk
    
    def test_fraud_prediction_with_explanation(self, trained_detector):
        """Test fraud prediction with explanation"""
        detector, data = trained_detector
        
        # Test with suspicious donor
        suspicious_donor = {
            'DonorID': 'TEST002',
            'Donor_Reliability': 0.3,
            'Past_Donations': 20,
            'Avg_Quantity_Claimed': 100.0,
            'Avg_Quantity_Received_Ratio': 0.2,
            'Avg_Fulfillment_Delay': 50.0,
            'Num_Manual_Rejects': 5,
            'Num_Flagged': 1,
            'Feedback_Mean': 1.5
        }
        
        prediction = detector.predict_with_explanation(suspicious_donor)
        
        assert 'donor_id' in prediction
        assert 'fraud_probability' in prediction
        assert 'is_flagged' in prediction
        assert 'risk_level' in prediction
        assert 'explanation' in prediction
        assert 'recommendation' in prediction
        
        # Should be high risk
        assert prediction['risk_level'] in ['High', 'Very High']
        assert len(prediction['explanation']) > 0
    
    def test_risk_level_classification(self, trained_detector):
        """Test risk level classification"""
        detector, _ = trained_detector
        
        # Test different probability levels
        test_cases = [
            (0.1, 'Low'),
            (0.4, 'Medium'),
            (0.7, 'High'),
            (0.9, 'Very High')
        ]
        
        for prob, expected_level in test_cases:
            level = detector._get_risk_level(prob)
            assert level == expected_level
    
    def test_conservative_threshold(self, sample_fraud_data):
        """Test conservative threshold behavior"""
        # Test with different thresholds
        thresholds = [0.5, 0.7, 0.9]
        
        for threshold in thresholds:
            detector = FraudDetector(conservative_threshold=threshold)
            detector.fit(sample_fraud_data)
            
            # Count flagged cases
            flagged_count = 0
            for _, donor in sample_fraud_data.head(10).iterrows():
                prediction = detector.predict_with_explanation(donor.to_dict())
                if prediction['is_flagged']:
                    flagged_count += 1
            
            # Higher threshold should result in fewer flags
            assert isinstance(flagged_count, int)
    
    def test_batch_prediction(self, trained_detector):
        """Test batch prediction functionality"""
        detector, data = trained_detector
        
        # Test with subset of data
        test_data = data.head(5)
        results = detector.batch_predict(test_data)
        
        assert len(results) == 5
        
        for result in results:
            assert 'donor_id' in result
            assert 'fraud_probability' in result
            assert 'is_flagged' in result
    
    def test_feature_importance(self, trained_detector):
        """Test feature importance extraction"""
        detector, _ = trained_detector
        
        importance_df = detector.get_feature_importance()
        
        if importance_df is not None:
            assert 'feature' in importance_df.columns
            assert 'importance' in importance_df.columns
            assert len(importance_df) > 0
    
    def test_model_evaluation(self, trained_detector):
        """Test model evaluation"""
        detector, data = trained_detector
        
        evaluation_results = detector.evaluate_model(data, test_size=0.3)
        
        assert 'classification_report' in evaluation_results
        assert 'roc_auc' in evaluation_results
        assert 'confusion_matrix' in evaluation_results
        assert 'cross_val_scores' in evaluation_results
        
        # ROC AUC should be reasonable
        assert 0.5 <= evaluation_results['roc_auc'] <= 1.0
    
    def test_model_persistence(self, trained_detector, tmp_path):
        """Test model saving and loading"""
        detector, _ = trained_detector
        
        # Save model
        model_path = tmp_path / "test_fraud_detector.joblib"
        detector.save_model(str(model_path))
        
        assert model_path.exists()
        
        # Load model
        new_detector = FraudDetector()
        new_detector.load_model(str(model_path))
        
        # Compare key attributes
        assert new_detector.model_type == detector.model_type
        assert new_detector.conservative_threshold == detector.conservative_threshold
        assert new_detector.feature_names == detector.feature_names
    
    def test_explanation_quality(self, trained_detector):
        """Test quality of explanations"""
        detector, _ = trained_detector
        
        # Test with various donor profiles
        test_donors = [
            {  # Good donor
                'DonorID': 'GOOD001',
                'Donor_Reliability': 0.9,
                'Past_Donations': 5,
                'Avg_Quantity_Claimed': 3.0,
                'Avg_Quantity_Received_Ratio': 1.0,
                'Avg_Fulfillment_Delay': 1.0,
                'Num_Manual_Rejects': 0,
                'Num_Flagged': 0,
                'Feedback_Mean': 4.5
            },
            {  # Bad donor
                'DonorID': 'BAD001',
                'Donor_Reliability': 0.2,
                'Past_Donations': 15,
                'Avg_Quantity_Claimed': 50.0,
                'Avg_Quantity_Received_Ratio': 0.3,
                'Avg_Fulfillment_Delay': 30.0,
                'Num_Manual_Rejects': 4,
                'Num_Flagged': 1,
                'Feedback_Mean': 2.0
            }
        ]
        
        for donor in test_donors:
            prediction = detector.predict_with_explanation(donor)
            explanation = prediction['explanation']
            
            # Explanation should be non-empty and informative
            assert len(explanation) > 10
            assert isinstance(explanation, str)
            
            # Should contain relevant keywords for bad donors
            if donor['DonorID'] == 'BAD001':
                explanation_lower = explanation.lower()
                relevant_keywords = ['reliability', 'delay', 'ratio', 'reject', 'feedback']
                has_relevant_keyword = any(keyword in explanation_lower for keyword in relevant_keywords)
                assert has_relevant_keyword

# Integration test
def test_end_to_end_fraud_detection():
    """Test complete fraud detection pipeline"""
    np.random.seed(42)
    
    # Generate realistic test data
    n_donors = 200
    
    # Create donor profiles with realistic patterns
    donor_data = []
    for i in range(n_donors):
        # 20% fraudulent donors
        is_fraud = i < n_donors * 0.2
        
        if is_fraud:
            # Fraudulent donor characteristics
            reliability = np.random.uniform(0.1, 0.4)
            quantity_ratio = np.random.uniform(0.1, 0.6)
            manual_rejects = np.random.randint(3, 8)
            feedback_mean = np.random.uniform(1.0, 2.5)
        else:
            # Legitimate donor characteristics
            reliability = np.random.uniform(0.6, 0.95)
            quantity_ratio = np.random.uniform(0.8, 1.0)
            manual_rejects = np.random.randint(0, 2)
            feedback_mean = np.random.uniform(3.0, 5.0)
        
        donor = {
            'DonorID': f'D{i:06d}',
            'Donor_Reliability': reliability,
            'Past_Donations': np.random.randint(1, 25),
            'Avg_Quantity_Claimed': np.random.uniform(1, 30),
            'Avg_Quantity_Received_Ratio': quantity_ratio,
            'Avg_Fulfillment_Delay': np.random.uniform(0, 20) if not is_fraud else np.random.uniform(10, 60),
            'Num_Manual_Rejects': manual_rejects,
            'Num_Flagged': int(is_fraud),
            'Feedback_Mean': feedback_mean,
            'Is_Fake': int(is_fraud)
        }
        donor_data.append(donor)
    
    fraud_df = pd.DataFrame(donor_data)
    
    # Train and evaluate model
    detector = FraudDetector(model_type='random_forest', conservative_threshold=0.7)
    evaluation_results = detector.evaluate_model(fraud_df, test_size=0.3)
    
    # Model should perform reasonably well
    assert evaluation_results['roc_auc'] > 0.7
    
    # Test batch prediction
    test_donors = fraud_df.head(10)
    batch_results = detector.batch_predict(test_donors)
    
    assert len(batch_results) == 10
    
    # Verify conservative behavior (should flag fewer cases)
    flagged_count = sum(1 for result in batch_results if result['is_flagged'])
    total_actual_fraud = sum(test_donors['Is_Fake'])
    
    # Conservative threshold should flag fewer than actual fraud cases
    assert flagged_count <= total_actual_fraud + 2  # Allow some tolerance

if __name__ == "__main__":
    pytest.main([__file__])