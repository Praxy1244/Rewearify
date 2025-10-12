"""
Fraud detection model for SCDP donor authenticity prediction
Uses conservative thresholds to minimize false positives
"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
import joblib
import os

class FraudDetector:
    def __init__(self, model_type='logistic', conservative_threshold=0.8):
        """
        Initialize fraud detector
        
        Args:
            model_type: 'logistic', 'random_forest', or 'decision_tree'
            conservative_threshold: High threshold to minimize false positives
        """
        self.model_type = model_type
        self.conservative_threshold = conservative_threshold
        self.scaler = StandardScaler()
        self.feature_names = None
        
        if model_type == 'logistic':
            self.model = LogisticRegression(random_state=42, class_weight='balanced')
        elif model_type == 'random_forest':
            self.model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
        elif model_type == 'decision_tree':
            self.model = DecisionTreeClassifier(random_state=42, class_weight='balanced', max_depth=10)
        else:
            raise ValueError("model_type must be 'logistic', 'random_forest', or 'decision_tree'")
    
    def prepare_features(self, fraud_features_df):
        """Prepare features for training"""
        feature_columns = [
            'Donor_Reliability', 'Past_Donations', 'Avg_Quantity_Claimed',
            'Avg_Quantity_Received_Ratio', 'Avg_Fulfillment_Delay',
            'Num_Manual_Rejects', 'Num_Flagged', 'Feedback_Mean'
        ]
        
        self.feature_names = feature_columns
        X = fraud_features_df[feature_columns].copy()
        y = fraud_features_df['Is_Fake'].copy()
        
        # Handle missing values
        X = X.fillna({
            'Avg_Quantity_Received_Ratio': 0.0,
            'Avg_Fulfillment_Delay': 999,
            'Feedback_Mean': 2.5
        })
        
        return X, y
    
    def fit(self, fraud_features_df):
        """Train the fraud detection model"""
        X, y = self.prepare_features(fraud_features_df)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X_scaled, y)
        
        return self
    
    def predict_fraud_probability(self, donor_features):
        """Predict fraud probability for a donor"""
        if isinstance(donor_features, dict):
            # Convert single donor to DataFrame
            donor_df = pd.DataFrame([donor_features])
        else:
            donor_df = donor_features.copy()
        
        # Prepare features
        X = donor_df[self.feature_names].fillna({
            'Avg_Quantity_Received_Ratio': 0.0,
            'Avg_Fulfillment_Delay': 999,
            'Feedback_Mean': 2.5
        })
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Get probability of fraud (class 1)
        fraud_proba = self.model.predict_proba(X_scaled)[:, 1]
        
        return fraud_proba
    
    def predict_with_explanation(self, donor_features):
        """Predict fraud with human-readable explanation"""
        fraud_proba = self.predict_fraud_probability(donor_features)[0]
        
        # Conservative decision: flag only if probability > threshold
        is_flagged = fraud_proba > self.conservative_threshold
        risk_level = self._get_risk_level(fraud_proba)
        explanation = self._generate_explanation(donor_features, fraud_proba)
        
        return {
            'donor_id': donor_features.get('DonorID', 'Unknown'),
            'fraud_probability': fraud_proba,
            'is_flagged': is_flagged,
            'risk_level': risk_level,
            'explanation': explanation,
            'recommendation': 'Manual review required' if is_flagged else 'Auto-approve'
        }
    
    def _get_risk_level(self, fraud_proba):
        """Convert probability to risk level"""
        if fraud_proba < 0.3:
            return 'Low'
        elif fraud_proba < 0.6:
            return 'Medium'
        elif fraud_proba < 0.8:
            return 'High'
        else:
            return 'Very High'
    
    def _generate_explanation(self, donor_features, fraud_proba):
        """Generate human-readable explanation"""
        explanations = []
        
        # Check reliability score
        reliability = donor_features.get('Donor_Reliability', 0.5)
        if reliability < 0.4:
            explanations.append(f"Low reliability score ({reliability:.2f})")
        
        # Check fulfillment issues
        fulfillment_delay = donor_features.get('Avg_Fulfillment_Delay', 0)
        if fulfillment_delay > 30:
            explanations.append(f"Long average fulfillment delay ({fulfillment_delay:.1f} days)")
        
        # Check quantity mismatch
        quantity_ratio = donor_features.get('Avg_Quantity_Received_Ratio', 1.0)
        if quantity_ratio < 0.7:
            explanations.append(f"Low quantity delivery ratio ({quantity_ratio:.2f})")
        
        # Check manual rejects
        manual_rejects = donor_features.get('Num_Manual_Rejects', 0)
        if manual_rejects > 2:
            explanations.append(f"High number of manual rejections ({manual_rejects})")
        
        # Check feedback
        feedback_mean = donor_features.get('Feedback_Mean', 2.5)
        if feedback_mean < 2.5:
            explanations.append(f"Low average feedback rating ({feedback_mean:.1f}/5)")
        
        # Check flagged status
        if donor_features.get('Num_Flagged', 0) > 0:
            explanations.append("Previously flagged by system")
        
        if not explanations:
            explanations.append("No significant risk factors detected")
        
        return "; ".join(explanations)
    
    def get_feature_importance(self):
        """Get feature importance (for tree-based models)"""
        if hasattr(self.model, 'feature_importances_'):
            importance_df = pd.DataFrame({
                'feature': self.feature_names,
                'importance': self.model.feature_importances_
            }).sort_values('importance', ascending=False)
            return importance_df
        elif hasattr(self.model, 'coef_'):
            # For logistic regression, use absolute coefficients
            importance_df = pd.DataFrame({
                'feature': self.feature_names,
                'importance': np.abs(self.model.coef_[0])
            }).sort_values('importance', ascending=False)
            return importance_df
        else:
            return None
    
    def evaluate_model(self, fraud_features_df, test_size=0.2):
        """Evaluate model performance with cross-validation"""
        X, y = self.prepare_features(fraud_features_df)
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=test_size, random_state=42, stratify=y
        )
        
        # Train model
        self.model.fit(X_train, y_train)
        
        # Predictions
        y_pred = self.model.predict(X_test)
        y_proba = self.model.predict_proba(X_test)[:, 1]
        
        # Conservative predictions (high threshold)
        y_pred_conservative = (y_proba > self.conservative_threshold).astype(int)
        
        # Evaluation metrics
        results = {
            'classification_report': classification_report(y_test, y_pred),
            'classification_report_conservative': classification_report(y_test, y_pred_conservative),
            'roc_auc': roc_auc_score(y_test, y_proba),
            'confusion_matrix': confusion_matrix(y_test, y_pred),
            'confusion_matrix_conservative': confusion_matrix(y_test, y_pred_conservative),
            'cross_val_scores': cross_val_score(self.model, X_scaled, y, cv=5, scoring='roc_auc')
        }
        
        return results
    
    def batch_predict(self, fraud_features_df):
        """Predict fraud for multiple donors"""
        results = []
        
        for _, donor in fraud_features_df.iterrows():
            prediction = self.predict_with_explanation(donor.to_dict())
            results.append(prediction)
        
        return results
    
    def save_model(self, filepath):
        """Save the trained model"""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'model_type': self.model_type,
            'conservative_threshold': self.conservative_threshold
        }
        joblib.dump(model_data, filepath)
    
    def load_model(self, filepath):
        """Load a trained model"""
        model_data = joblib.load(filepath)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_names = model_data['feature_names']
        self.model_type = model_data['model_type']
        self.conservative_threshold = model_data['conservative_threshold']
        return self