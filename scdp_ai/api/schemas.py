"""
Pydantic schemas for SCDP AI API
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

# Create a base model with protected_namespaces configuration
class CustomBaseModel(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

# Request schemas
class DonationMatchRequest(CustomBaseModel):
    donation_id: str = Field(..., description="Unique donation ID")
    top_k: int = Field(default=5, description="Number of top matches to return")

class BatchMatchRequest(CustomBaseModel):
    donation_ids: List[str] = Field(..., description="List of donation IDs")
    top_k: int = Field(default=3, description="Number of top matches per donation")

class FraudPredictionRequest(CustomBaseModel):
    donor_id: str = Field(..., description="Donor ID to analyze")
    donor_reliability: float = Field(..., description="Current reliability score")
    past_donations: int = Field(..., description="Number of past donations")
    avg_quantity_claimed: float = Field(..., description="Average quantity claimed")
    avg_quantity_received_ratio: float = Field(..., description="Ratio of received to claimed")
    avg_fulfillment_delay: float = Field(..., description="Average delay in days")
    num_manual_rejects: int = Field(..., description="Number of manual rejections")
    num_flagged: int = Field(..., description="Number of times flagged")
    feedback_mean: float = Field(..., description="Average feedback rating")

class NGOClusterRequest(CustomBaseModel):
    ngo_id: str = Field(..., description="NGO ID")
    latitude: float = Field(..., description="NGO latitude")
    longitude: float = Field(..., description="NGO longitude")
    capacity_per_week: int = Field(..., description="Weekly capacity")
    urgent_need: bool = Field(..., description="Has urgent need")
    demand_shirt: float = Field(default=0.0, description="Demand for shirts")
    demand_jacket: float = Field(default=0.0, description="Demand for jackets")
    demand_saree: float = Field(default=0.0, description="Demand for sarees")
    demand_blanket: float = Field(default=0.0, description="Demand for blankets")
    demand_pants: float = Field(default=0.0, description="Demand for pants")
    demand_dress: float = Field(default=0.0, description="Demand for dresses")
    demand_footwear: float = Field(default=0.0, description="Demand for footwear")

class ForecastRequest(CustomBaseModel):
    model_key: str = Field(..., description="Model identifier (e.g., city_type_Delhi_shirt)")
    periods: int = Field(default=12, description="Number of periods to forecast")
    frequency: str = Field(default="M", description="Forecast frequency (M=monthly, D=daily)")

# Response schemas
class MatchResult(CustomBaseModel):
    ngo_id: str
    match_score: float
    distance_km: float
    explanation: str

class DonationMatchResponse(CustomBaseModel):
    donation_id: str
    matches: List[MatchResult]
    timestamp: datetime

class BatchMatchResponse(CustomBaseModel):
    results: Dict[str, List[MatchResult]]
    total_donations: int
    timestamp: datetime

class FraudPredictionResponse(CustomBaseModel):
    donor_id: str
    fraud_probability: float
    is_flagged: bool
    risk_level: str
    explanation: str
    recommendation: str
    timestamp: datetime

class ClusterPredictionResponse(CustomBaseModel):
    ngo_id: str
    geo_cluster: int
    behavior_cluster: int
    combined_cluster: str
    timestamp: datetime

class ForecastPoint(CustomBaseModel):
    date: str
    forecast: float
    forecast_lower: float
    forecast_upper: float

class ForecastResponse(CustomBaseModel):
    model_key: str
    forecast_points: List[ForecastPoint]
    periods: int
    timestamp: datetime

class ProcessAnalytics(CustomBaseModel):
    total_donations: int
    state_distribution: Dict[str, int]
    avg_processing_times: Dict[str, Dict[str, float]]
    bottleneck_analysis: Dict[str, int]
    completion_rate: float
    stuck_donations: int

class HealthResponse(CustomBaseModel):
    status: str
    timestamp: datetime
    models_loaded: Dict[str, bool]
    version: str = "1.0.0"

class ErrorResponse(CustomBaseModel):
    error: str
    detail: str
    timestamp: datetime