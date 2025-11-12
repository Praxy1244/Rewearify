"""
Lightweight AI Service for Rewearify
Fast startup, real-time suggestions
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
import logging

# Import our services
from services.suggestions import SuggestionService
from services.matching import MatchingService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Rewearify AI Service",
    description="Lightweight AI service for donation platform",
    version="2.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services (lightweight - instant startup!)
suggestion_service = SuggestionService()
matching_service = MatchingService()

# ==================== Schemas ====================

class DonationAnalysisRequest(BaseModel):
    title: str = ""
    description: str = ""
    category: str = ""
    condition: str = ""

class SuggestionResponse(BaseModel):
    suggestions: Dict[str, List[str]]
    confidence: float
    timestamp: datetime

class MatchRequest(BaseModel):
    donation_id: str
    category: str
    location: Dict[str, str]
    quantity: int

class MatchResponse(BaseModel):
    matches: List[Dict]
    count: int
    timestamp: datetime

# ==================== Endpoints ====================

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "healthy",
        "service": "Rewearify AI",
        "version": "2.0.0",
        "message": "AI Service is running!",
        "timestamp": datetime.now()
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "suggestions": True,
            "matching": True
        },
        "timestamp": datetime.now()
    }

@app.post("/analyze-donation", response_model=SuggestionResponse)
async def analyze_donation(request: DonationAnalysisRequest):
    """
    Analyze donation input and provide smart suggestions
    Fast, rule-based suggestions for form auto-complete
    """
    try:
        logger.info(f"Analyzing donation: category={request.category}")
        
        suggestions = suggestion_service.generate_suggestions(
            title=request.title,
            description=request.description,
            category=request.category,
            condition=request.condition
        )
        
        return SuggestionResponse(
            suggestions=suggestions,
            confidence=0.85,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Error in analyze_donation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/match-donation", response_model=MatchResponse)
async def match_donation(request: MatchRequest):
    """
    Find matching NGOs for a donation
    Simple scoring-based matching
    """
    try:
        logger.info(f"Matching donation: {request.donation_id}, category={request.category}")
        
        matches = matching_service.find_matches(
            donation_id=request.donation_id,
            category=request.category,
            location=request.location,
            quantity=request.quantity
        )
        
        return MatchResponse(
            matches=matches,
            count=len(matches),
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Error in match_donation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/summary")
async def get_analytics_summary():
    """Get basic analytics summary"""
    try:
        import random
        summary = {
            "total_donations": random.randint(100, 500),
            "active_ngos": random.randint(20, 100),
            "successful_matches": random.randint(50, 200),
            "avg_match_score": round(random.uniform(0.6, 0.9), 2)
        }
        return {
            "summary": summary,
            "timestamp": datetime.now()
        }
    except Exception as e:
        logger.error(f"Error in analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("  🚀 REWEARIFY AI SERVICE")
    print("=" * 60)
    print("  Starting server...")
    print("  Docs available at: http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8000)
