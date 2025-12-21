from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import sys

# Import only fraud detection
from services.fraud_detection import FraudDetector

# Setup paths
ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
sys.path.append(ROOT_DIR)

app = FastAPI(
    title="Rewearify AI Service - Fraud Detection",
    description="AI-powered fraud detection for donations",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global fraud detector
fraud_detector = None

@app.on_event("startup")
async def startup_event():
    """Load fraud detection models on startup"""
    global fraud_detector
    
    print("🚀 Initializing Fraud Detection Service...")
    
    try:
        fraud_detector = FraudDetector()
        fraud_detector.load_models()
        print("✅ Fraud detector loaded with 3 models")
        print("   - Logistic Regression")
        print("   - Random Forest (primary)")
        print("   - Decision Tree")
        print("\n✅ Service ready!")
        
    except Exception as e:
        print(f"❌ Error loading fraud detector: {e}")
        import traceback
        traceback.print_exc()


# --- Data Models ---

class FraudCheckRequest(BaseModel):
    donor_id: str
    donation_data: Dict[str, Any] = Field(..., description="Donation information")
    donor_data: Dict[str, Any] = Field(..., description="Donor information")
    model_name: str = Field(default="random_forest", description="Model to use")


# --- Endpoints ---

@app.get("/")
def read_root():
    """Health check"""
    return {
        "status": "running",
        "service": "Fraud Detection",
        "version": "1.0.0",
        "fraud_detector": "operational" if fraud_detector and fraud_detector.is_trained else "not_trained"
    }


@app.get("/health")
def health_check():
    """Detailed health check"""
    if not fraud_detector:
        return {
            "status": "error",
            "message": "Fraud detector not initialized"
        }
    
    return {
        "status": "healthy",
        "fraud_detector": {
            "loaded": fraud_detector is not None,
            "trained": fraud_detector.is_trained,
            "models": list(fraud_detector.models.keys()) if fraud_detector.is_trained else []
        }
    }


@app.post("/api/ai/check-fraud")
def check_fraud(request: FraudCheckRequest):
    """
    Check donation for fraud indicators using ML models
    
    Expected format:
    {
        "donor_id": "123",
        "donation_data": {
            "quantity": 5,
            "condition": "Good",
            "proof_provided": true
        },
        "donor_data": {
            "reliability_score": 0.9,
            "past_donations": 10,
            "flagged": false,
            "last_feedback": 4.5,
            "fulfillment_rate": 0.85,
            "avg_quantity_claimed": 8,
            "avg_quantity_received_ratio": 0.95,
            "avg_fulfillment_delay": 5,
            "num_manual_rejects": 0
        },
        "model_name": "random_forest"
    }
    """
    if not fraud_detector or not fraud_detector.is_trained:
        raise HTTPException(
            status_code=503, 
            detail="Fraud detection models not trained. Run training first."
        )
    
    try:
        print(f"\n🔍 Fraud check request for donor: {request.donor_id}")
        
        # Build feature vector (12 features)
        features = {
            'DonorReliability': request.donor_data.get('reliability_score', 0.8),
            'Past_Donations': request.donor_data.get('past_donations', 0),
            'Flagged': 1 if request.donor_data.get('flagged', False) else 0,
            'Feedback_mean': request.donor_data.get('last_feedback', 4.0),
            'Quantity': request.donation_data.get('quantity', 0),
            'Condition_New': 1 if request.donation_data.get('condition') == 'New' else 0,
            'Proof_Provided': 1 if request.donation_data.get('proof_provided', True) else 0,
            'Fulfillment_Rate': request.donor_data.get('fulfillment_rate', 1.0),
            'Avg_Quantity_Claimed': request.donor_data.get('avg_quantity_claimed', 0),
            'Avg_Quantity_Received_ratio': request.donor_data.get('avg_quantity_received_ratio', 1.0),
            'Avg_Fulfillment_Delay': request.donor_data.get('avg_fulfillment_delay', 5),
            'Num_ManualRejects': request.donor_data.get('num_manual_rejects', 0)
        }
        
        print(f"📊 Key features: Reliability={features['DonorReliability']:.2f}, "
              f"Quantity={features['Quantity']}, Past={features['Past_Donations']}")
        
        # Get prediction from model
        result = fraud_detector.predict(features, model_name=request.model_name)
        
        print(f"✅ Prediction: {result['risk_level']} risk, "
              f"confidence={result['confidence']*100:.1f}%, "
              f"suspicious={result['is_suspicious']}")
        
        return {
            "success": True,
            "donor_id": request.donor_id,
            "confidence": result['confidence'],
            "risk_level": result['risk_level'],
            "is_suspicious": result['is_suspicious'],
            "risk_factors": result.get('risk_factors', []),
            "recommended_action": result.get('recommended_action', 'review'),
            "model_used": request.model_name
        }
    
    except Exception as e:
        print(f"❌ Fraud detection error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Fraud detection error: {str(e)}")


# --- Run the app ---

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 Starting Rewearify Fraud Detection Service")
    print("="*60)
    print("\n📍 API Documentation: http://localhost:8000/docs")
    print("📍 Health Check: http://localhost:8000/health")
    print("\n🔥 Features:")
    print("   ✅ ML-based fraud detection")
    print("   ✅ 3 trained models (LR, RF, DT)")
    print("   ✅ 12-feature analysis")
    print("   ✅ Real-time risk scoring")
    print("\n" + "="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
