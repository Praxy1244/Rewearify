from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import sys
import pandas as pd


# Import services
from services.fraud_detection import FraudDetector
from services.suggestions import generate_smart_suggestions
from services.matching import DonationMatcher
from services.recommendations import initialize_recommendation_engine
from services.forecasting import DemandForecaster


# Setup paths
ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
sys.path.append(ROOT_DIR)


app = FastAPI(
    title="Rewearify AI Service",
    description="AI-powered fraud detection, smart suggestions, NGO matching, and recommendations",
    version="5.0.0"
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
forecaster = None


@app.on_event("startup")
async def startup_event():
    """Load AI services on startup"""
    global fraud_detector, matcher, recommender, forecaster
    
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
        
        # Initialize forecaster
        try:
            forecaster = DemandForecaster()
            forecaster.is_trained = True
            print("✅ Demand forecaster loaded")
        except Exception as forecast_error:
            print(f"⚠️ Forecaster failed to load: {forecast_error}")
            forecaster = None
        
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
    mode: Optional[str] = "donation"  # ✅ "donation" or "request"


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
    """NEW: For donation-request matching"""
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
        "version": "5.0.0",
        "services": {
            "fraud_detection": "operational" if fraud_detector and fraud_detector.is_trained else "not_trained",
            "smart_suggestions": "operational",
            "ngo_matching": "operational" if matcher else "unavailable",
            "request_matching": "operational" if matcher else "unavailable",
            "forecasting": "operational" if forecaster else "unavailable",
            "recommendations": "operational" if recommender else "unavailable"
        },
        "endpoints": {
            "fraud_check": "/api/ai/check-fraud",
            "smart_suggestions": "/analyze-donation",
            "ngo_matching": "/api/ai/match-donations",
            "request_matching": "/match-requests",
            "forecasting": "/forecast",
            "recommendations_hybrid": "/recommendations/hybrid"
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
            "loaded": forecaster is not None,
            "models_trained": len(forecaster.models) if forecaster else 0
        },
        "recommender": {
            "loaded": recommender is not None,
            "donors_profiled": len(recommender.donor_profiles) if recommender else 0
        }
    }


# --- Fraud Detection ---


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


# --- Smart Suggestions ---


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


# --- NGO Matching (Donation-Specific) ---


@app.post("/api/ai/match-donations")
def match_donations(request: DonationMatchRequest):
    """Find NGOs that can ACCEPT this specific donation (LEGACY)"""
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


# ==================== NEW: DONATION-REQUEST MATCHING ====================


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


# --- Placeholder for Old Endpoint (backward compatibility) ---


@app.post("/find-matches")
def find_donation_matches(request: RequestMatchRequest):
    """DEPRECATED: Use /match-requests instead"""
    return {
        "success": False,
        "message": "This endpoint is deprecated. Use /match-requests with full donation and request data.",
        "requestId": request.requestId,
        "matches": []
    }


# --- Forecasting Endpoints ---


@app.post("/forecast")
def get_forecast(request: ForecastRequest):
    """Get demand forecast for specific category and city"""
    if not forecaster:
        raise HTTPException(status_code=503, detail="Forecasting service not available")
    
    try:
        print(f"\n📈 Forecast request: {request.clothing_type} in {request.city}")
        
        summary = forecaster.get_forecast_summary(
            clothing_type=request.clothing_type,
            city=request.city,
            periods=request.periods
        )
        
        if not summary:
            return {
                "success": False,
                "error": "Insufficient data for forecast",
                "message": f"Not enough historical data for {request.clothing_type} in {request.city}"
            }
        
        print(f"✅ Forecast generated: {summary['total_predicted_demand']} items over {request.periods} days")
        
        return {
            "success": True,
            "data": summary
        }
        
    except Exception as e:
        print(f"❌ Forecasting error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")


@app.get("/seasonal-trends/{clothing_type}")
def get_seasonal_trends(clothing_type: str):
    """Get seasonal trends for a clothing category"""
    if not forecaster:
        raise HTTPException(status_code=503, detail="Forecasting service not available")
    
    try:
        print(f"\n📊 Seasonal trends request: {clothing_type}")
        
        trends = forecaster.get_seasonal_trends(clothing_type)
        
        if not trends:
            return {
                "success": False,
                "error": "No data available",
                "message": f"No historical data for {clothing_type}"
            }
        
        print(f"✅ Trends generated: {trends['total_donations']} total donations")
        
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
    if not forecaster:
        raise HTTPException(status_code=503, detail="Forecasting service not available")
    
    try:
        print(f"\n⚖️ Supply gap analysis: {request.clothing_type} in {request.city}")
        
        # Get forecast first
        forecast = forecaster.forecast(
            clothing_type=request.clothing_type,
            city=request.city,
            periods=request.periods
        )
        
        if forecast is None:
            return {
                "success": False,
                "error": "Cannot generate forecast",
                "message": f"Insufficient data for {request.clothing_type} in {request.city}"
            }
        
        # Analyze gap
        gap_analysis = forecaster.detect_supply_gap(forecast, request.current_supply)
        
        print(f"✅ Gap analysis: {gap_analysis['status']} ({gap_analysis['gap']} items)")
        
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
    return {
        "success": True,
        "data": {
            "categories": ["Winter Wear", "Men's Wear", "Women's Wear", "Kids Wear"],
            "cities": ["Mumbai", "Delhi", "Bengaluru"]
        }
    }


# --- NGO Recommendations (User Profile-Based) ---


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


# --- Run the app ---


if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 Starting Rewearify AI Service v5.0")
    print("="*60)
    print("\n📍 API Documentation: http://localhost:8000/docs")
    print("📍 Health Check: http://localhost:8000/health")
    print("\n🔥 Available Services:")
    print("   ✅ Fraud Detection - /api/ai/check-fraud")
    print("   ✅ Smart Suggestions - /analyze-donation")
    print("   ✅ NGO Matching - /api/ai/match-donations")
    print("   ✅ Request Matching - /match-requests (NEW)")
    print("   ✅ Demand Forecasting - /forecast")
    print("   ✅ Seasonal Trends - /seasonal-trends/{type}")
    print("   ✅ Supply Gap Analysis - /supply-gap")
    print("   ✅ NGO Recommendations - /recommendations/hybrid")
    print("\n" + "="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
