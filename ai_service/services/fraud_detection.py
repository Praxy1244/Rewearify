import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import pickle
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class FraudDetector:
    """Multi-model fraud detection system"""
    
    def __init__(self):
        self.models = {}
        self.scaler = StandardScaler()
        self.feature_names = [
            'DonorReliability', 'Past_Donations', 'Flagged', 'Feedback_mean',
            'Quantity', 'Condition_New', 'Proof_Provided', 'Fulfillment_Rate',
            'Avg_Quantity_Claimed', 'Avg_Quantity_Received_ratio',
            'Avg_Fulfillment_Delay', 'Num_ManualRejects'
        ]
        self.is_trained = False
    
    def load_data(self):
        """Load and prepare training data"""
        data_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data"
        )
        
        print("📂 Loading data for fraud detection...")
        self.donations_df = pd.read_csv(os.path.join(data_path, "donations.csv"))
        self.donors_df = pd.read_csv(os.path.join(data_path, "donors.csv"))
        self.logs_df = pd.read_csv(os.path.join(data_path, "donation_logs.csv"))
        
        print(f"✅ Loaded {len(self.donations_df)} donations")
        print(f"✅ Found {self.donations_df['IsFraud'].sum()} fraud cases "
              f"({self.donations_df['IsFraud'].mean()*100:.1f}%)")
    
    def prepare_features(self):
        """Extract features from data"""
        print("\n🔧 Extracting features...")
        
        features_list = []
        labels = []
        
        for idx, donation in self.donations_df.iterrows():
            # Get donor data
            donor = self.donors_df[
                self.donors_df['DonorID'] == donation['DonorID']
            ].iloc[0]
            
            # Simple feature extraction
            features = {
                'DonorReliability': donor.get('Reliability_Score', 0.8),
                'Past_Donations': donor.get('Past_Donations', 0),
                'Flagged': 1 if donor.get('Flagged', False) else 0,
                'Feedback_mean': donor.get('Last_Feedback', 4),
                'Quantity': donation.get('Quantity', 0),
                'Condition_New': 1 if donation.get('Condition_Donor') == 'New' else 0,
                'Proof_Provided': 1 if donation.get('Proof_Evidence') == 'Yes' else 0,
                'Fulfillment_Rate': 1.0,
                'Avg_Quantity_Claimed': donation.get('Quantity', 0),
                'Avg_Quantity_Received_ratio': 1.0,
                'Avg_Fulfillment_Delay': 5,
                'Num_ManualRejects': 1 if donation.get('AdminDecision') == 'Rejected' else 0
            }
            
            # Calculate fulfillment rate if donor has history
            if donor['Past_Donations'] > 0:
                donor_donations = self.donations_df[
                    self.donations_df['DonorID'] == donation['DonorID']
                ]
                fulfilled = donor_donations['Timestamp_Delivered'].notna().sum()
                total = len(donor_donations)
                features['Fulfillment_Rate'] = fulfilled / total if total > 0 else 1.0
                
                # Quantity received ratio
                completed = donor_donations[donor_donations['Timestamp_Delivered'].notna()]
                if len(completed) > 0:
                    # Check for quantity mismatches in condition
                    mismatch_count = (completed['Condition_Donor'] != completed['Condition_System']).sum()
                    features['Avg_Quantity_Received_ratio'] = 1.0 - (mismatch_count / len(completed) * 0.3)
            
            # Convert to feature vector
            feature_vector = [features.get(name, 0) for name in self.feature_names]
            features_list.append(feature_vector)
            labels.append(donation['IsFraud'])
            
            if (idx + 1) % 2000 == 0:
                print(f"   Processed {idx + 1}/{len(self.donations_df)} donations...")
        
        X = np.array(features_list)
        y = np.array(labels)
        
        print(f"✅ Feature extraction complete: {X.shape}")
        return X, y
    
    def train_models(self, X_train, X_test, y_train, y_test):
        """Train all three models"""
        print("\n🤖 Training fraud detection models...")
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # 1. Logistic Regression (Baseline)
        print("\n1️⃣ Training Logistic Regression (baseline)...")
        lr = LogisticRegression(
            random_state=42,
            max_iter=1000,
            class_weight='balanced'
        )
        lr.fit(X_train_scaled, y_train)
        self.models['logistic_regression'] = lr
        
        y_pred_lr = lr.predict(X_test_scaled)
        y_prob_lr = lr.predict_proba(X_test_scaled)[:, 1]
        
        print("\n   Logistic Regression Results:")
        print(classification_report(y_test, y_pred_lr, target_names=['Legitimate', 'Fraud']))
        print(f"   ROC-AUC: {roc_auc_score(y_test, y_prob_lr):.3f}")
        
        # 2. Random Forest (Accuracy)
        print("\n2️⃣ Training Random Forest (accuracy)...")
        rf = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=20,
            random_state=42,
            class_weight='balanced'
        )
        rf.fit(X_train, y_train)
        self.models['random_forest'] = rf
        
        y_pred_rf = rf.predict(X_test)
        y_prob_rf = rf.predict_proba(X_test)[:, 1]
        
        print("\n   Random Forest Results:")
        print(classification_report(y_test, y_pred_rf, target_names=['Legitimate', 'Fraud']))
        print(f"   ROC-AUC: {roc_auc_score(y_test, y_prob_rf):.3f}")
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': rf.feature_importances_
        }).sort_values('importance', ascending=False)
        print("\n   Top 5 Important Features:")
        print(feature_importance.head().to_string(index=False))
        
        # 3. Decision Tree (Explainability)
        print("\n3️⃣ Training Decision Tree (explainability)...")
        dt = DecisionTreeClassifier(
            max_depth=8,
            min_samples_split=30,
            min_samples_leaf=15,
            random_state=42,
            class_weight='balanced'
        )
        dt.fit(X_train, y_train)
        self.models['decision_tree'] = dt
        
        y_pred_dt = dt.predict(X_test)
        y_prob_dt = dt.predict_proba(X_test)[:, 1]
        
        print("\n   Decision Tree Results:")
        print(classification_report(y_test, y_pred_dt, target_names=['Legitimate', 'Fraud']))
        print(f"   ROC-AUC: {roc_auc_score(y_test, y_prob_dt):.3f}")
        
        self.is_trained = True
    
    def save_models(self):
        """Save trained models to disk"""
        models_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "models"
        )
        os.makedirs(models_path, exist_ok=True)
        
        print("\n💾 Saving models...")
        
        # Save each model
        for model_name, model in self.models.items():
            file_path = os.path.join(models_path, f"fraud_{model_name}.pkl")
            with open(file_path, 'wb') as f:
                pickle.dump(model, f)
            print(f"   ✅ Saved {model_name}")
        
        # Save scaler
        scaler_path = os.path.join(models_path, "fraud_scaler.pkl")
        with open(scaler_path, 'wb') as f:
            pickle.dump(self.scaler, f)
        print(f"   ✅ Saved scaler")
        
        print(f"\n📁 Models saved in: {models_path}")
    
    def load_models(self):
        """Load pre-trained models from disk"""
        models_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "models"
        )
        
        try:
            # Load models
            for model_name in ['logistic_regression', 'random_forest', 'decision_tree']:
                file_path = os.path.join(models_path, f"fraud_{model_name}.pkl")
                if os.path.exists(file_path):
                    with open(file_path, 'rb') as f:
                        self.models[model_name] = pickle.load(f)
            
            # Load scaler
            scaler_path = os.path.join(models_path, "fraud_scaler.pkl")
            if os.path.exists(scaler_path):
                with open(scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
            
            if self.models:
                self.is_trained = True
                print(f"✅ Loaded {len(self.models)} pre-trained fraud detection models")
                return True
        except Exception as e:
            print(f"⚠️ Could not load models: {e}")
            self.is_trained = False
            return False
    
    def predict(self, features_dict, model_name='random_forest', threshold=0.7):
        """Predict fraud probability for a donation"""
        if not self.is_trained:
            return {
                "error": "Models not trained yet",
                "is_suspicious": False,
                "confidence": 0.0
            }
        
        # Prepare feature vector
        feature_vector = np.array([
            features_dict.get(name, 0) for name in self.feature_names
        ]).reshape(1, -1)
        
        # Use selected model
        model = self.models.get(model_name, self.models['random_forest'])
        
        # Scale if using logistic regression
        if model_name == 'logistic_regression':
            feature_vector = self.scaler.transform(feature_vector)
        
        # Get prediction
        fraud_probability = model.predict_proba(feature_vector)[0][1]
        is_suspicious = fraud_probability >= threshold
        
        # Identify risk factors
        risk_factors = []
        if features_dict.get('DonorReliability', 1.0) < 0.6:
            risk_factors.append(f"Low donor reliability: {features_dict['DonorReliability']:.2f}")
        
        if features_dict.get('Flagged', 0) == 1:
            risk_factors.append("Donor previously flagged")
        
        if features_dict.get('Fulfillment_Rate', 1.0) < 0.5:
            risk_factors.append(f"Low fulfillment rate: {features_dict['Fulfillment_Rate']*100:.0f}%")
        
        if features_dict.get('Quantity', 0) > 50:
            risk_factors.append(f"Large quantity: {features_dict['Quantity']} items")
        
        if features_dict.get('Proof_Provided', 1) == 0:
            risk_factors.append("No proof provided")
        
        # Determine action
        if fraud_probability >= 0.85:
            action = "manual_review"
            action_detail = "High risk - Admin review required"
        elif fraud_probability >= threshold:
            action = "manual_review"
            action_detail = "Medium risk - Recommend verification"
        else:
            action = "auto_approve"
            action_detail = "Low risk - Can be auto-approved"
        
        return {
            "is_suspicious": bool(is_suspicious),
            "confidence": round(float(fraud_probability), 3),
            "risk_level": "high" if fraud_probability >= 0.85 else "medium" if fraud_probability >= threshold else "low",
            "risk_factors": risk_factors,
            "recommended_action": action,
            "action_detail": action_detail,
            "model_used": model_name,
            "threshold": threshold
        }


def train_fraud_models():
    """Main function to train all fraud detection models"""
    print("=" * 60)
    print("FRAUD DETECTION MODEL TRAINING")
    print("=" * 60)
    
    detector = FraudDetector()
    detector.load_data()
    
    # Prepare features
    X, y = detector.prepare_features()
    
    # Split data
    print("\n📊 Splitting data (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"   Training set: {len(X_train)} samples")
    print(f"   Test set: {len(X_test)} samples")
    print(f"   Fraud in test set: {y_test.sum()} ({y_test.mean()*100:.1f}%)")
    
    # Train models
    detector.train_models(X_train, X_test, y_train, y_test)
    
    # Save models
    detector.save_models()
    
    print("\n" + "=" * 60)
    print("✅ FRAUD DETECTION TRAINING COMPLETE!")
    print("=" * 60)
    
    return detector


if __name__ == "__main__":
    # Train models
    detector = train_fraud_models()
    
    # Test prediction
    print("\n" + "=" * 60)
    print("TESTING FRAUD DETECTION")
    print("=" * 60)
    
    # Test case 1: Legitimate donor
    print("\n✅ Test 1: Legitimate donor")
    legit_features = {
        'DonorReliability': 0.95,
        'Past_Donations': 5,
        'Flagged': 0,
        'Feedback_mean': 4.5,
        'Quantity': 10,
        'Condition_New': 0,
        'Proof_Provided': 1,
        'Fulfillment_Rate': 1.0,
        'Avg_Quantity_Claimed': 8,
        'Avg_Quantity_Received_ratio': 1.0,
        'Avg_Fulfillment_Delay': 5,
        'Num_ManualRejects': 0
    }
    
    result = detector.predict(legit_features)
    print(f"   Suspicious: {result['is_suspicious']}")
    print(f"   Confidence: {result['confidence']*100:.1f}%")
    print(f"   Risk Level: {result['risk_level']}")
    print(f"   Action: {result['action_detail']}")
    
    # Test case 2: Suspicious donor
    print("\n⚠️ Test 2: Suspicious donor")
    fraud_features = {
        'DonorReliability': 0.45,
        'Past_Donations': 8,
        'Flagged': 1,
        'Feedback_mean': 2.0,
        'Quantity': 75,
        'Condition_New': 1,
        'Proof_Provided': 0,
        'Fulfillment_Rate': 0.3,
        'Avg_Quantity_Claimed': 60,
        'Avg_Quantity_Received_ratio': 0.5,
        'Avg_Fulfillment_Delay': 15,
        'Num_ManualRejects': 3
    }
    
    result = detector.predict(fraud_features)
    print(f"   Suspicious: {result['is_suspicious']}")
    print(f"   Confidence: {result['confidence']*100:.1f}%")
    print(f"   Risk Level: {result['risk_level']}")
    print(f"   Risk Factors: {', '.join(result['risk_factors'][:3])}")
    print(f"   Action: {result['action_detail']}")
