from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import sys
import pandas as pd
import pickle

# Import services
from services.fraud_detection import FraudDetector
from services.suggestions import generate_smart_suggestions
from services.matching import DonationMatcher
from services.recommendations import initialize_recommendation_engine
from services.forcasting_mongo import forecaster  # ✅ Import the global forecaster instance

# Setup paths
ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
sys.path.append(ROOT_DIR)

app = FastAPI(
    title="Rewearify AI Service",
    description="AI-powered fraud detection, smart suggestions, NGO matching, clustering, and recommendations",
    version="6.1.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global services
fraud_detector = None
matcher = None
recommender = None
# forecaster is now imported globally
cluster_stats = None

@app.on_event("startup")
async def startup_event():
    """Load AI services on startup"""
    global fraud_detector, matcher, recommender, cluster_stats
    
    print("🚀 Initializing AI Services...")
    
    try:
        # Initialize fraud detector
        fraud_detector = FraudDetector()
        fraud_detector.load_models()
        print("✅ Fraud detector loaded with 3 models")
        
        # Smart suggestions is rule-based
        print("✅ Smart suggestions service ready")
        
        # Initialize NGO matcher
        matcher = DonationMatcher()
        print(f"✅ NGO Matcher loaded")
        
        # Forecaster is already initialized globally
        print("✅ Demand forecaster ready (mock data)")
        
        # Initialize recommendation engine
        try:
            data_path = os.path.join(ROOT_DIR, "data")
            ngos_df = pd.read_csv(os.path.join(data_path, "ngos.csv"))
            donations_df = pd.read_csv(os.path.join(data_path, "donations.csv"))
            
            recommender = initialize_recommendation_engine(ngos_df, donations_df)
            print(f"✅ Recommendation engine loaded")
        except Exception as rec_error:
            print(f"⚠️ Recommendation engine failed to load: {rec_error}")
            recommender = None
        
        # Load clustering data
        try:
            models_path = os.path.join(ROOT_DIR, "ai_service", "models")
            cluster_stats_path = os.path.join(models_path, "cluster_stats.pkl")
            
            if os.path.exists(cluster_stats_path):
                with open(cluster_stats_path, 'rb') as f:
                    cluster_stats = pickle.load(f)
                print(f"✅ Clustering data loaded: {len(cluster_stats)} clusters")
            else:
                print("⚠️ No clustering data found. Run clustering.py first.")
                cluster_stats = {}
        except Exception as cluster_error:
            print(f"⚠️ Clustering data failed to load: {cluster_error}")
            cluster_stats = {}
        
        print("\n✅ All services ready!")
        
    except Exception as e:
        print(f"❌ Error loading core services: {e}")
        import traceback
        traceback.print_exc()

# --- Data Models ---

class FraudCheckRequest(BaseModel):
    donor_id: str
    donation_data: Dict[str, Any]
    donor_data: Dict[str, Any]
    model_name: str = Field(default="random_forest")

class SmartSuggestionRequest(BaseModel):
    category: str
    condition: str
    title: Optional[str] = ""
    description: Optional[str] = ""
    mode: Optional[str] = "donation"

class DonationMatchRequest(BaseModel):
    donation_id: Optional[str] = "NEW"
    type: str
    season: str = "All Season"
    quantity: int = Field(..., gt=0)
    latitude: float
    longitude: float
    description: Optional[str] = ""
    max_distance: Optional[int] = 50

class RequestMatchRequest(BaseModel):
    requestId: str
    category: str
    quantity: int = Field(..., gt=0)
    urgency: str = "medium"
    latitude: float
    longitude: float
    description: Optional[str] = ""
    max_distance: Optional[int] = 50
    maxMatches: Optional[int] = 5

class MatchingRequest(BaseModel):
    donation: dict
    requests: list

class ForecastRequest(BaseModel):
    clothing_type: str
    city: str
    periods: Optional[int] = 30

class SupplyGapRequest(BaseModel):
    clothing_type: str
    city: str
    current_supply: int
    periods: Optional[int] = 30

class HybridRecommendationRequest(BaseModel):
    donor_id: str
    location: Optional[str] = None
    limit: Optional[int] = 10

# --- Root & Health Endpoints ---

@app.get("/")
def read_root():
    return {
        "status": "running",
        "service": "Rewearify AI",
        "version": "6.1.0",
        "services": {
            "fraud_detection": "operational" if fraud_detector and fraud_detector.is_trained else "not_trained",
            "smart_suggestions": "operational",
            "ngo_matching": "operational" if matcher else "unavailable",
            "request_matching": "operational" if matcher else "unavailable",
            "forecasting": "operational",  # ✅ Always operational now
            "recommendations": "operational" if recommender else "unavailable",
            "clustering": "operational" if cluster_stats else "unavailable"
        },
        "endpoints": {
            "fraud_check": "/api/ai/check-fraud",
            "smart_suggestions": "/analyze-donation",
            "ngo_matching": "/api/ai/match-donations",
            "request_matching": "/match-requests",
            "forecasting": "/forecast",
            "seasonal_trends": "/seasonal-trends/{clothing_type}",
            "supply_gap": "/supply-gap",
            "forecast_categories": "/forecast-categories",
            "recommendations_hybrid": "/recommendations/hybrid",
            "clustering": "/clusters"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "fraud_detector": {
            "loaded": fraud_detector is not None,
            "trained": fraud_detector.is_trained if fraud_detector else False
        },
        "smart_suggestions": {
            "loaded": True,
            "status": "operational"
        },
        "matcher": {
            "loaded": matcher is not None,
            "status": "operational" if matcher else "unavailable"
        },
        "forecaster": {
            "loaded": True,
            "status": "operational",
            "mode": "mock_data"
        },
        "recommender": {
            "loaded": recommender is not None,
            "donors_profiled": len(recommender.donor_profiles) if recommender else 0
        },
        "clustering": {
            "loaded": cluster_stats is not None,
            "total_clusters": len(cluster_stats) if cluster_stats else 0
        }
    }

# ==================== CLUSTERING ENDPOINTS ====================

@app.get("/clusters")
def get_clusters():
    """Get all NGO clusters"""
    if cluster_stats is None or len(cluster_stats) == 0:
        raise HTTPException(
            status_code=503, 
            detail="Clustering data not available. Run clustering.py first."
        )
    
    try:
        print(f"\n📊 Fetching {len(cluster_stats)} clusters")
        
        return {
            "success": True,
            "clusters": cluster_stats,
            "total_clusters": len(cluster_stats),
            "clustering_algorithm": "Two-Stage (DBSCAN + KMeans)"
        }
    
    except Exception as e:
        print(f"❌ Clustering error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Clustering error: {str(e)}")

@app.get("/clusters/{cluster_id}")
def get_cluster_details(cluster_id: str):
    """Get details for a specific cluster"""
    if cluster_stats is None or len(cluster_stats) == 0:
        raise HTTPException(
            status_code=503, 
            detail="Clustering data not available. Run clustering.py first."
        )
    
    if cluster_id not in cluster_stats:
        raise HTTPException(
            status_code=404,
            detail=f"Cluster '{cluster_id}' not found"
        )
    
    try:
        print(f"\n🎯 Fetching details for cluster: {cluster_id}")
        
        return {
            "success": True,
            "cluster": cluster_stats[cluster_id]
        }
    
    except Exception as e:
        print(f"❌ Cluster details error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# ==================== FRAUD DETECTION ====================

@app.post("/api/ai/check-fraud")
def check_fraud(request: FraudCheckRequest):
    """Check donation for fraud indicators using ML models"""
    if not fraud_detector or not fraud_detector.is_trained:
        raise HTTPException(status_code=503, detail="Fraud detection models not trained")
    
    try:
        print(f"\n🔍 Fraud check request for donor: {request.donor_id}")
        
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
        
        result = fraud_detector.predict(features, model_name=request.model_name)
        
        print(f"✅ Prediction: {result['risk_level']} risk")
        
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
        raise HTTPException(status_code=500, detail=f"Fraud detection error: {str(e)}")

# ==================== SMART SUGGESTIONS ====================

def _generate_suggestions(request: SmartSuggestionRequest):
    try:
        print(f"\n💡 Smart suggestions [{request.mode}]: {request.category}, {request.condition}")
        
        suggestions = generate_smart_suggestions(
            category=request.category,
            condition=request.condition,
            context=f"{request.title} {request.description}".strip(),
            mode=request.mode
        )
        
        print(f"✅ Generated {len(suggestions['titles'])} suggestions")
        
        return {
            "success": True,
            "data": {
                "suggestions": suggestions
            }
        }
    
    except Exception as e:
        print(f"❌ Smart suggestions error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/ai/analyze-donation")
def analyze_donation_full(request: SmartSuggestionRequest):
    return _generate_suggestions(request)

@app.post("/analyze-donation")
def analyze_donation_short(request: SmartSuggestionRequest):
    return _generate_suggestions(request)

# ==================== NGO MATCHING ====================

@app.post("/api/ai/match-donations")
def match_donations(request: DonationMatchRequest):
    """Find NGOs that can ACCEPT this specific donation"""
    if not matcher:
        raise HTTPException(status_code=503, detail="Matching service not available")
    
    try:
        print(f"\n🎯 Donation matching: {request.type} at ({request.latitude}, {request.longitude})")
        
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
        
        print(f"✅ Found {len(matches)} matches")
        
        return {
            "success": True,
            "donation_id": request.donation_id,
            "total_matches": len(matches),
            "matches": matches,
            "summary": summary
        }
    
    except Exception as e:
        print(f"❌ Matching error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Matching error: {str(e)}")

# ==================== REQUEST MATCHING ====================

@app.post("/match-requests")
async def match_requests(data: MatchingRequest):
    """Find best REQUEST matches for a donation"""
    if not matcher:
        raise HTTPException(status_code=503, detail="Matching service not available")
    
    try:
        print(f"\n🔍 Finding request matches for donation: {data.donation.get('title', 'Untitled')}")
        
        matches = matcher.find_matches_for_request(
            donation=data.donation,
            requests=data.requests,
            max_matches=5
        )
        
        print(f"✅ Found {len(matches)} matches")
        
        return {
            "success": True,
            "data": {
                "matches": matches,
                "total_matches": len(matches)
            }
        }
    
    except Exception as e:
        print(f"❌ Matching error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Matching failed: {str(e)}")

@app.post("/find-matches")
def find_donation_matches(request: RequestMatchRequest):
    """DEPRECATED: Use /match-requests instead"""
    return {
        "success": False,
        "message": "This endpoint is deprecated. Use /match-requests with full donation and request data.",
        "requestId": request.requestId,
        "matches": []
    }

# ==================== FORECASTING ENDPOINTS ====================

@app.post("/forecast")
def get_forecast(request: ForecastRequest):
    """Get demand forecast for specific category and city"""
    try:
        print(f"\n📈 Forecast request: {request.clothing_type} in {request.city}")
        
        result = forecaster.forecast(
            clothing_type=request.clothing_type,
            city=request.city,
            periods=request.periods
        )
        
        print(f"✅ Forecast generated successfully")
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        print(f"❌ Forecasting error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")


@app.get("/seasonal-trends/{clothing_type}")
def get_seasonal_trends(clothing_type: str):
    """Get seasonal trends for a clothing category"""
    try:
        print(f"\n📊 Seasonal trends request: {clothing_type}")
        
        trends = forecaster.get_seasonal_trends(clothing_type)
        
        return {
            "success": True,
            "data": trends
        }
        
    except Exception as e:
        print(f"❌ Trends error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Trends error: {str(e)}")

@app.post("/supply-gap")
def analyze_supply_gap(request: SupplyGapRequest):
    """Analyze supply-demand gap"""
    try:
        print(f"\n⚖️ Supply gap analysis: {request.clothing_type} in {request.city}")
        
        gap_analysis = forecaster.analyze_supply_gap(
            clothing_type=request.clothing_type,
            city=request.city,
            current_supply=request.current_supply,
            periods=request.periods
        )
        
        return {
            "success": True,
            "data": gap_analysis
        }
        
    except Exception as e:
        print(f"❌ Supply gap error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Supply gap error: {str(e)}")

@app.get("/forecast-categories")
def get_forecast_categories():
    """Get available categories and cities for forecasting"""
    try:
        result = forecaster.get_forecast_categories()
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        print(f"❌ Categories error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# ==================== RECOMMENDATIONS ====================

@app.post("/recommendations/hybrid")
def get_hybrid_recommendations(request: HybridRecommendationRequest):
    """Get personalized NGO recommendations for a donor"""
    
    if not recommender:
        try:
            if matcher and hasattr(matcher, 'ngos_df') and not matcher.ngos_df.empty:
                ngos = matcher.ngos_df.sort_values(by='trust_score', ascending=False).head(request.limit)
                recommendations = []
                for _, ngo in ngos.iterrows():
                    recommendations.append({
                        '_id': ngo['_id'],
                        'name': ngo['name'],
                        'city': ngo.get('city', 'Unknown'),
                        'trust_score': ngo.get('trust_score', 75),
                        'recommendation_score': 0.8,
                        'recommendation_reason': 'Highly rated NGO'
                    })
                
                return {
                    "success": True,
                    "data": {
                        "recommendations": recommendations,
                        "count": len(recommendations),
                        "method": "fallback_popular"
                    }
                }
        except Exception as e:
            pass
        
        raise HTTPException(status_code=503, detail="Recommendation unavailable")
    
    try:
        recommendations = recommender.get_hybrid_recommendations(
            donor_id=request.donor_id,
            donor_location=request.location,
            n=request.limit
        )
        
        return {
            "success": True,
            "data": {
                "recommendations": recommendations,
                "count": len(recommendations),
                "method": "hybrid"
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/recommendations/popular")
def get_popular_ngos(limit: int = 10):
    """Get most popular/highly-rated NGOs"""
    
    if not matcher or not hasattr(matcher, 'ngos_df') or matcher.ngos_df.empty:
        return {
            "success": False,
            "message": "No NGO data available"
        }
    
    try:
        ngos = matcher.ngos_df.sort_values(by='trust_score', ascending=False).head(limit)
        
        popular_ngos = []
        for _, ngo in ngos.iterrows():
            popular_ngos.append({
                '_id': ngo['_id'],
                'name': ngo['name'],
                'city': ngo.get('city', 'Unknown'),
                'trust_score': ngo.get('trust_score', 75),
                'recommendation_score': 0.85,
                'recommendation_reason': 'Highly rated and trusted'
            })
        
        return {
            "success": True,
            "data": {
                "recommendations": popular_ngos,
                "count": len(popular_ngos)
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# ==================== RUN THE APP ====================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 Starting Rewearify AI Service v6.1")
    print("="*60)
    print("\n📍 API Documentation: http://localhost:8000/docs")
    print("📍 Health Check: http://localhost:8000/health")
    print("\n🔥 Available Services:")
    print("   ✅ Fraud Detection - /api/ai/check-fraud")
    print("   ✅ Smart Suggestions - /analyze-donation")
    print("   ✅ NGO Matching - /api/ai/match-donations")
    print("   ✅ Request Matching - /match-requests")
    print("   ✅ Demand Forecasting - /forecast (NEW: Mock Data)")
    print("   ✅ Seasonal Trends - /seasonal-trends/{type}")
    print("   ✅ Supply Gap Analysis - /supply-gap")
    print("   ✅ Forecast Categories - /forecast-categories")
    print("   ✅ NGO Recommendations - /recommendations/hybrid")
    print("   ✅ NGO Clustering - /clusters")
    print("\n" + "="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
