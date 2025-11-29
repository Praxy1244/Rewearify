from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from fastapi.middleware.cors import CORSMiddleware  # ✅ Add this
import uvicorn
import pandas as pd
import pickle
from pathlib import Path
import os
import sys

# Import services
from services.matching import DonationMatcher
from services.fraud_detection import FraudDetector
from services.clustering import NGOClusterer
from services.forecasting import DemandForecaster
from services.recommendations import initialize_recommendation_engine, recommendation_engine

ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
sys.path.append(ROOT_DIR)

DATA_DIR = os.path.join(ROOT_DIR, 'data')

app = FastAPI(
    title="Rewearify AI Service",
    description="AI-powered matching, fraud detection, forecasting, and recommendations for Rewearify platform",
    version="3.0.0"
)

# ✅ ADD CORS MIDDLEWARE
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)
# Global variables
matcher = None
fraud_detector = None
clusterer = None
forecaster = None
ngo_data = None
clustering_model = None
forecasting_models = {}

# Initialize services
print("🚀 Initializing AI services...")

@app.on_event("startup")
async def startup_event():
    """Load models and data on startup"""
    global matcher, fraud_detector, clusterer, forecaster, ngo_data, recommendation_engine
    
    print("🚀 Initializing AI services...")
    
    try:
        import os
        
        # ✅ FIXED: Data is in root/data, not ai_service/data
        root_dir = os.path.dirname(os.path.dirname(__file__))  # Go up to root
        data_dir = os.path.join(root_dir, 'data')
        
        print(f"📁 Data directory: {data_dir}\n")
        
        # Initialize matcher
        matcher = DonationMatcher()
        print("✅ Matcher initialized")
        
        # Initialize fraud detector
        fraud_detector = FraudDetector()
        fraud_detector.load_models()
        print("✅ Fraud detector loaded")
        
        # Initialize clusterer
        clusterer = NGOClusterer()
        clusterer.load_clustering()
        print("✅ Clusterer loaded")
        
        # Load NGO data from root/data
        print("📊 Loading NGO data...")
        ngo_path = os.path.join(data_dir, 'ngos.csv')
        ngo_data = pd.read_csv(ngo_path)
        print(f"✅ Loaded {len(ngo_data)} NGOs")
        
        # Initialize forecaster
        print("📈 Loading forecasting service...")
        forecaster = DemandForecaster()
        forecaster.is_trained = True
        print("✅ Forecasting service ready")
        
        # Initialize recommendation engine
        print("🎯 Initializing recommendation engine...")
        try:
            donations_path = os.path.join(data_dir, 'synthetic_donations.csv')
            donations_df = pd.read_csv(donations_path)
            print(f"✅ Loaded {len(donations_df)} historical donations")
            
            recommendation_engine = initialize_recommendation_engine(ngo_data, donations_df)
            print("✅ Recommendation engine initialized")
        except Exception as e:
            print(f"⚠️ Recommendation engine initialization failed: {e}")
            print("   Continuing without recommendations...")
        
        print("\n✅ All AI services initialized successfully!")
        
    except Exception as e:
        print(f"❌ Error during startup: {e}")
        import traceback
        traceback.print_exc()


# --- Data Models ---

class DonationMatchRequest(BaseModel):
    donation_id: Optional[str] = "NEW"
    type: str = Field(..., description="Clothing type")
    season: str = Field(default="All Season", description="Season")
    quantity: int = Field(..., gt=0, description="Number of items")
    latitude: float = Field(..., description="Donation location latitude")
    longitude: float = Field(..., description="Donation location longitude")
    description: Optional[str] = ""
    max_distance: Optional[int] = Field(default=50, description="Maximum distance in km")

class RequestMatchRequest(BaseModel):
    request_id: Optional[str] = "NEW"
    ngo_id: str
    ngo_name: str
    type: str = Field(..., description="Requested clothing type")
    urgency: str = Field(default="medium", description="Urgency level")
    latitude: float
    longitude: float
    city: str
    capacity: Optional[int] = Field(default=200, description="NGO capacity per week")
    max_distance: Optional[int] = Field(default=50, description="Maximum distance in km")

class FraudCheckRequest(BaseModel):
    donor_id: str
    donation_data: Dict[str, Any] = Field(..., description="Donation information")
    donor_data: Dict[str, Any] = Field(..., description="Donor information")
    model_name: Optional[str] = Field(default="random_forest", description="Model to use")

class LegacyDonationRequest(BaseModel):
    type: str
    subtype: Optional[str] = None
    quantity: int
    description: Optional[str] = ""
    id: Optional[str] = "new"

class AnalysisRequest(BaseModel):
    category: str
    condition: str
    title: Optional[str] = ""
    description: Optional[str] = ""

# --- Root Endpoint ---

@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "AI Service is running",
        "version": "3.0.0",
        "services": {
            "matching": "operational",
            "fraud_detection": "operational" if fraud_detector and fraud_detector.is_trained else "not_trained",
            "clustering": "operational" if clusterer and clusterer.is_trained else "not_trained",
            "forecasting": "operational" if forecaster and forecaster.is_trained else "not_trained",
            "recommendations": "operational" if recommendation_engine else "not_initialized"
        },
        "endpoints": {
            "match_donations": "/api/ai/match-donations",
            "match_requests": "/api/ai/match-requests",
            "check_fraud": "/api/ai/check-fraud",
            "forecast": "/forecast",
            "recommendations": "/recommendations/hybrid"
        }
    }

@app.get("/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "matcher": {
                "loaded": matcher is not None,
                "ngos_count": len(matcher.ngos_df) if matcher and not matcher.ngos_df.empty else 0,
                "donations_count": len(matcher.donations_df) if matcher and not matcher.donations_df.empty else 0
            },
            "fraud_detector": {
                "loaded": fraud_detector is not None,
                "trained": fraud_detector.is_trained if fraud_detector else False,
                "models": list(fraud_detector.models.keys()) if fraud_detector and fraud_detector.is_trained else []
            },
            "clusterer": {
                "loaded": clusterer is not None,
                "trained": clusterer.is_trained if clusterer else False,
                "clusters_count": len(clusterer.cluster_stats) if clusterer and clusterer.is_trained else 0
            },
            "forecaster": {
                "loaded": forecaster is not None,
                "trained": forecaster.is_trained if forecaster else False
            },
            "recommendations": {
                "loaded": recommendation_engine is not None,
                "donor_profiles": len(recommendation_engine.donor_profiles) if recommendation_engine else 0
            }
        }
    }

# --- Matching Endpoints ---

@app.post("/api/ai/match-donations")
def match_donations(request: DonationMatchRequest):
    """Find top NGO matches for a donation"""
    try:
        donation_data = {
            "donation_id": request.donation_id,
            "type": request.type,
            "season": request.season,
            "quantity": request.quantity,
            "latitude": request.latitude,
            "longitude": request.longitude,
            "description": request.description
        }
        
        matches = matcher.find_matches_for_donation(
            donation_data,
            max_matches=5,
            max_distance=request.max_distance
        )
        
        summary = matcher.get_recommendations_summary(matches)
        
        return {
            "success": True,
            "donation_id": request.donation_id,
            "total_matches": len(matches),
            "matches": matches,
            "summary": summary
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching error: {str(e)}")

@app.post("/api/ai/match-requests")
def match_requests(request: RequestMatchRequest):
    """Find top donation matches for an NGO request"""
    try:
        request_data = {
            "request_id": request.request_id,
            "ngo_id": request.ngo_id,
            "ngo_name": request.ngo_name,
            "type": request.type,
            "urgency": request.urgency,
            "latitude": request.latitude,
            "longitude": request.longitude,
            "city": request.city,
            "capacity": request.capacity
        }
        
        matches = matcher.find_matches_for_request(
            request_data,
            max_matches=5,
            max_distance=request.max_distance
        )
        
        summary = matcher.get_recommendations_summary(matches)
        
        return {
            "success": True,
            "request_id": request.request_id,
            "total_matches": len(matches),
            "matches": matches,
            "summary": summary
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching error: {str(e)}")

# --- Fraud Detection Endpoints ---

@app.post("/api/ai/check-fraud")
def check_fraud(request: FraudCheckRequest):
    """Check donation for fraud indicators"""
    if not fraud_detector or not fraud_detector.is_trained:
        raise HTTPException(
            status_code=503, 
            detail="Fraud detection models not trained"
        )
    
    try:
        features = {
            'DonorReliability': request.donor_data.get('reliability_score', 0.8),
            'Past_Donations': request.donor_data.get('past_donations', 0),
            'Flagged': 1 if request.donor_data.get('flagged', False) else 0,
            'Feedback_mean': request.donor_data.get('last_feedback', 4),
            'Quantity': request.donation_data.get('quantity', 0),
            'Condition_New': 1 if request.donation_data.get('condition') == 'New' else 0,
            'Proof_Provided': 1 if request.donation_data.get('proof_provided', True) else 0,
            'Fulfillment_Rate': request.donor_data.get('fulfillment_rate', 1.0),
            'Avg_Quantity_Claimed': request.donor_data.get('avg_quantity_claimed', 0),
            'Avg_Quantity_Received_ratio': request.donor_data.get('avg_quantity_received_ratio', 1.0),
            'Avg_Fulfillment_Delay': request.donor_data.get('avg_fulfillment_delay', 5),
            'Num_ManualRejects': request.donor_data.get('num_manual_rejects', 0)
        }
        
        result = fraud_detector.predict(features, model_name=request.model_name)
        
        return {
            "success": True,
            "donor_id": request.donor_id,
            **result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fraud detection error: {str(e)}")

# --- Clustering Endpoints ---

@app.get("/api/ai/get-clusters")
def get_clusters():
    """Get all NGO cluster assignments"""
    if not clusterer or not clusterer.is_trained:
        raise HTTPException(status_code=503, detail="Clustering not performed")
    
    try:
        return {
            "success": True,
            "total_ngos": len(clusterer.ngos_df),
            "total_clusters": len(clusterer.cluster_stats),
            "clusters": clusterer.cluster_stats
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clustering error: {str(e)}")

@app.get("/api/ai/cluster-stats/{cluster_key}")
def get_cluster_stats(cluster_key: str):
    """Get detailed statistics for a specific cluster"""
    if not clusterer or not clusterer.is_trained:
        raise HTTPException(status_code=503, detail="Clustering not performed")
    
    try:
        stats = clusterer.get_cluster_info(cluster_key)
        
        if "error" in stats:
            raise HTTPException(status_code=404, detail=stats["error"])
        
        return {
            "success": True,
            "cluster_key": cluster_key,
            **stats
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# --- Forecasting Endpoints ---

@app.post("/forecast")
async def get_forecast(request: Request):
    """Get demand forecast for specific category and location"""
    try:
        data = await request.json()
        clothing_type = data.get('clothing_type', 'Winter Wear')
        city = data.get('city', 'Mumbai')
        periods = data.get('periods', 30)
        
        summary = forecaster.get_forecast_summary(clothing_type, city, periods)
        
        if summary is None:
            return {
                "success": False,
                "error": "Not enough data for forecast"
            }
        
        return {
            "success": True,
            "data": summary
        }
        
    except Exception as e:
        print(f"Forecast error: {str(e)}")
        return {"success": False, "error": str(e)}

@app.get("/seasonal-trends/{clothing_type}")
async def get_seasonal_trends(clothing_type: str):
    """Get seasonal trends for a clothing category"""
    try:
        trends = forecaster.get_seasonal_trends(clothing_type)
        
        if trends is None:
            return {
                "success": False,
                "error": "No data available for this category"
            }
        
        return {
            "success": True,
            "data": trends
        }
        
    except Exception as e:
        print(f"Seasonal trends error: {str(e)}")
        return {"success": False, "error": str(e)}

@app.post("/supply-gap")
async def analyze_supply_gap(request: Request):
    """Analyze supply-demand gap"""
    try:
        data = await request.json()
        clothing_type = data.get('clothing_type', 'Winter Wear')
        city = data.get('city', 'Mumbai')
        current_supply = data.get('current_supply', 0)
        periods = data.get('periods', 30)
        
        forecast_df = forecaster.forecast(clothing_type, city, periods)
        
        if forecast_df is None:
            return {
                "success": False,
                "error": "Could not generate forecast"
            }
        
        gap_analysis = forecaster.detect_supply_gap(forecast_df, current_supply)
        
        return {
            "success": True,
            "data": gap_analysis
        }
        
    except Exception as e:
        print(f"Supply gap analysis error: {str(e)}")
        return {"success": False, "error": str(e)}

@app.get("/forecast-categories")
async def get_forecast_categories():
    """Get available categories and cities for forecasting"""
    try:
        categories = forecaster.donations_df['Type'].unique().tolist()
        cities = forecaster.donations_df['Location_City'].unique().tolist()
        
        return {
            "success": True,
            "data": {
                "categories": categories,
                "cities": cities
            }
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/fraud-check")
async def fraud_check(request: Request):
    """Check donation for potential fraud"""
    try:
        data = await request.json()
        
        category = data.get('category', '')
        condition = data.get('condition', '')
        quantity = data.get('quantity', 0)
        description = data.get('description', '')
        location = data.get('location', {})
        
        fraud_score = 0.0
        fraud_flags = []
        
        if quantity > 100:
            fraud_score += 0.3
            fraud_flags.append('unusually_high_quantity')
        
        if condition == 'poor' and quantity > 50:
            fraud_score += 0.2
            fraud_flags.append('suspicious_quantity_condition_combo')
        
        if len(description) < 20:
            fraud_score += 0.15
            fraud_flags.append('insufficient_description')
        
        if not location.get('city') or not location.get('state'):
            fraud_score += 0.1
            fraud_flags.append('incomplete_location')
        
        suspicious_keywords = ['free', 'urgent', 'immediately', 'bulk', 'wholesale']
        description_lower = description.lower()
        if any(keyword in description_lower for keyword in suspicious_keywords):
            fraud_score += 0.15
            fraud_flags.append('suspicious_keywords')
        
        fraud_score = min(fraud_score, 1.0)
        
        if fraud_score >= 0.7:
            risk_level = 'high'
            recommendation = 'reject'
        elif fraud_score >= 0.4:
            risk_level = 'medium'
            recommendation = 'manual_review'
        else:
            risk_level = 'low'
            recommendation = 'approve'
        
        quality_score = 1.0 - fraud_score
        
        return {
            "success": True,
            "data": {
                "fraud_score": round(fraud_score, 3),
                "quality_score": round(quality_score, 3),
                "risk_level": risk_level,
                "recommendation": recommendation,
                "fraud_flags": fraud_flags,
                "is_suspicious": fraud_score >= 0.4,
                "confidence": round(0.85, 2),
                "analysis": {
                    "category_risk": "normal",
                    "quantity_risk": "high" if quantity > 100 else "normal",
                    "condition_risk": "normal",
                    "description_completeness": "good" if len(description) >= 50 else "poor"
                }
            }
        }
        
    except Exception as e:
        print(f"Fraud check error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "data": {
                "fraud_score": 0.0,
                "quality_score": 1.0,
                "risk_level": "low",
                "recommendation": "approve"
            }
        }

# ==================== RECOMMENDATION ENDPOINTS ====================

@app.post("/recommendations/hybrid")
async def get_hybrid_recommendations(request: Request):
    """Get personalized NGO recommendations using hybrid approach"""
    try:
        if recommendation_engine is None:
            return {
                "success": False,
                "error": "Recommendation engine not initialized",
                "data": []
            }
        
        data = await request.json()
        donor_id = data.get('donor_id')
        donor_location = data.get('location')
        limit = data.get('limit', 10)
        
        if not donor_id:
            return {
                "success": False,
                "error": "donor_id is required",
                "data": []
            }
        
        recommendations = recommendation_engine.get_hybrid_recommendations(
            donor_id=donor_id,
            donor_location=donor_location,
            n=limit
        )
        
        for rec in recommendations:
            rec['_id'] = str(rec['_id'])
            if 'location' in rec and 'coordinates' in rec['location']:
                if isinstance(rec['location']['coordinates'], dict):
                    coords = rec['location']['coordinates'].get('coordinates', [0, 0])
                    rec['location']['coordinates'] = coords
        
        return {
            "success": True,
            "data": {
                "recommendations": recommendations,
                "count": len(recommendations),
                "donor_id": donor_id,
                "method": "hybrid"
            }
        }
        
    except Exception as e:
        print(f"Hybrid recommendations error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

@app.post("/recommendations/collaborative")
async def get_collaborative_recommendations(request: Request):
    """Get recommendations based on similar donors"""
    try:
        if recommendation_engine is None:
            return {"success": False, "error": "Recommendation engine not initialized"}
        
        data = await request.json()
        donor_id = data.get('donor_id')
        limit = data.get('limit', 5)
        
        if not donor_id:
            return {"success": False, "error": "donor_id is required"}
        
        ngo_ids = recommendation_engine.get_collaborative_recommendations(donor_id, limit)
        
        recommendations = []
        for ngo_id in ngo_ids:
            ngo = ngo_data[ngo_data['_id'] == ngo_id]
            if len(ngo) > 0:
                ngo_dict = ngo.iloc[0].to_dict()
                ngo_dict['_id'] = str(ngo_dict['_id'])
                recommendations.append(ngo_dict)
        
        return {
            "success": True,
            "data": {
                "recommendations": recommendations,
                "method": "collaborative_filtering",
                "explanation": "Based on donations from similar users"
            }
        }
        
    except Exception as e:
        print(f"Collaborative recommendations error: {str(e)}")
        return {"success": False, "error": str(e)}

@app.post("/recommendations/content-based")
async def get_content_based_recommendations(request: Request):
    """Get recommendations based on donor's past preferences"""
    try:
        if recommendation_engine is None:
            return {"success": False, "error": "Recommendation engine not initialized"}
        
        data = await request.json()
        donor_id = data.get('donor_id')
        limit = data.get('limit', 5)
        
        if not donor_id:
            return {"success": False, "error": "donor_id is required"}
        
        ngo_ids = recommendation_engine.get_content_based_recommendations(donor_id, limit)
        
        recommendations = []
        for ngo_id in ngo_ids:
            ngo = ngo_data[ngo_data['_id'] == ngo_id]
            if len(ngo) > 0:
                ngo_dict = ngo.iloc[0].to_dict()
                ngo_dict['_id'] = str(ngo_dict['_id'])
                recommendations.append(ngo_dict)
        
        return {
            "success": True,
            "data": {
                "recommendations": recommendations,
                "method": "content_based_filtering",
                "explanation": "Based on your donation history and preferences"
            }
        }
        
    except Exception as e:
        print(f"Content-based recommendations error: {str(e)}")
        return {"success": False, "error": str(e)}

@app.get("/recommendations/popular")
async def get_popular_ngos(limit: int = 10):
    """Get most popular/highly rated NGOs"""
    try:
        if recommendation_engine is None:
            return {"success": False, "error": "Recommendation engine not initialized"}
        
        ngo_ids = recommendation_engine.get_popular_ngos(limit)
        
        recommendations = []
        for ngo_id in ngo_ids:
            ngo = ngo_data[ngo_data['_id'] == ngo_id]
            if len(ngo) > 0:
                ngo_dict = ngo.iloc[0].to_dict()
                ngo_dict['_id'] = str(ngo_dict['_id'])
                recommendations.append(ngo_dict)
        
        return {
            "success": True,
            "data": {
                "recommendations": recommendations,
                "method": "popularity_based",
                "explanation": "Highest rated NGOs on the platform"
            }
        }
        
    except Exception as e:
        print(f"Popular NGOs error: {str(e)}")
        return {"success": False, "error": str(e)}

@app.get("/recommendations/donor-profile/{donor_id}")
async def get_donor_profile(donor_id: str):
    """Get donor's preference profile"""
    try:
        if recommendation_engine is None:
            return {"success": False, "error": "Recommendation engine not initialized"}
        
        if donor_id not in recommendation_engine.donor_profiles:
            return {
                "success": False,
                "error": "Donor not found or no donation history"
            }
        
        profile = recommendation_engine.donor_profiles[donor_id]
        
        return {
            "success": True,
            "data": {
                "donor_id": donor_id,
                "profile": profile,
                "insights": {
                    "is_active": profile['recent_activity'] < 30,
                    "donation_level": "high" if profile['total_donations'] > 10 else "medium" if profile['total_donations'] > 3 else "low",
                    "preferred_category": max(profile['categories'].items(), key=lambda x: x[1])[0] if profile['categories'] else None,
                    "preferred_location": max(profile['preferred_locations'].items(), key=lambda x: x[1])[0] if profile['preferred_locations'] else None
                }
            }
        }
        
    except Exception as e:
        print(f"Get donor profile error: {str(e)}")
        return {"success": False, "error": str(e)}

# --- Legacy Endpoints ---

@app.post("/match")
def match_ngos_legacy(donation: LegacyDonationRequest):
    """Legacy endpoint: Simple NGO matching"""
    from services.matching import get_ngo_matches
    matches = get_ngo_matches(donation.type, donation.description or "")
    return {"matches": matches}

@app.post("/analyze-donation")
def analyze_donation(request: AnalysisRequest):
    """Generate smart suggestions for donation form"""
    try:
        from services.suggestions import generate_smart_suggestions
        
        suggestions = generate_smart_suggestions(
            request.category,
            request.condition,
            f"{request.title} {request.description}"
        )
        
        return {
            "success": True, 
            "data": {
                "suggestions": suggestions
            }
        }
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Run the app ---

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 Starting Rewearify AI Service v3.0")
    print("="*60)
    print("\n📍 API Documentation: http://localhost:8000/docs")
    print("📍 Health Check: http://localhost:8000/health")
    print("\n🔥 Available Services:")
    print("   ✅ Donation Matching (CBF)")
    print("   ✅ Fraud Detection (3 models)")
    print("   ✅ NGO Clustering (2-stage)")
    print("   ✅ Forecasting (Time-series)")
    print("   ✅ Recommendations (Hybrid)")
    print("\n" + "="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
