from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

# Import the services we just created
from services.suggestions import get_subtype_suggestions
from services.matching import get_ngo_matches
from services.fraud import check_fraud
from services.forecasting import get_donation_forecast
from services.clustering import get_ngo_clusters
from services.trends import get_donor_trends

app = FastAPI()

# --- Data Models (What the frontend sends us) ---
class DonationRequest(BaseModel):
    type: str
    subtype: Optional[str] = None
    quantity: int
    description: Optional[str] = ""
    id: Optional[str] = "new"

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"status": "AI Service is running"}

# Feature 1: Smart Suggestions
@app.get("/suggest")
def suggest_subtypes(type: str):
    return {"suggestions": get_subtype_suggestions(type)}

# Feature 2: NGO Matching
@app.post("/match")
def match_ngos(donation: DonationRequest):
    matches = get_ngo_matches(donation.type, donation.description)
    return {"matches": matches}

# Feature 3: Fraud Detection
@app.post("/fraud-check")
def fraud_check(donation: DonationRequest):
    result = check_fraud(donation.dict())
    return result

# Feature 4: Analytics
@app.get("/forecast")
def forecast():
    return {"trendData": get_donation_forecast()}

# Feature 5: Clustering
@app.get("/clusters")
def clusters():
    return {"clusters": get_ngo_clusters()}

# Feature 6: Trends
@app.get("/trends")
def trends():
    return {"trending": get_donor_trends()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)