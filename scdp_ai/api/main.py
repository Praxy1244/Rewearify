"""
FastAPI main application for SCDP AI services
Provides endpoints for matching, fraud detection, clustering, and forecasting
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import pandas as pd
import numpy as np
import os
import sys
import logging

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.schemas import *
from models.matching import ContentBasedMatcher
from models.fraud_detection import FraudDetector 
from models.clustering import NGOClusterer
from models.time_series import TimeSeriesForecaster
from models.fsm import FSMAnalyzer
from utils.feature_engineering import FeatureEngineer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SCDP AI Services",
    description="AI services for Sustainable Clothing Donation Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for models and data
models = {
    'matcher': None,
    'fraud_detector': None,
    'clusterer': None,
    'forecaster': None,
    'fsm_analyzer': None
}

feature_engineer = None
data_cache = {
    'matching_features': None,
    'fraud_features': None,
    'clustering_features': None,
    'timeseries_data': None,
    'logs_data': None
}

@app.on_event("startup")
async def startup_event():
    """Initialize models and load data on startup"""
    global models, feature_engineer, data_cache
    
    logger.info("Starting SCDP AI Services...")
    
    try:
        # Initialize feature engineer
        feature_engineer = FeatureEngineer()
        
        # Load data
        data_dir = "C:/Users/Lenovo/Major/scdp_ai/data/generated"
        if os.path.exists(data_dir):
            logger.info("Loading data...")
            
            donors_df = pd.read_csv(f"{data_dir}/donors.csv")
            ngos_df = pd.read_csv(f"{data_dir}/ngos.csv")
            donations_df = pd.read_csv(f"{data_dir}/donations.csv")
            logs_df = pd.read_csv(f"{data_dir}/donation_logs.csv")
            
            # Prepare features
            logger.info("Preparing features...")
            try:
                matching_features = feature_engineer.prepare_matching_features(donations_df, ngos_df)
            except Exception as e:
                logger.error(f"Error preparing matching features: {str(e)}")
                matching_features = pd.DataFrame()
            
            try:
                fraud_features = feature_engineer.prepare_fraud_features(donors_df, donations_df, logs_df)
            except Exception as e:
                logger.error(f"Error preparing fraud features: {str(e)}")
                fraud_features = pd.DataFrame()
            
            try:
                clustering_features = feature_engineer.prepare_clustering_features(ngos_df, donations_df)
            except Exception as e:
                logger.error(f"Error preparing clustering features: {str(e)}")
                clustering_features = pd.DataFrame()
            
            try:
                city_type_monthly, ngo_monthly = feature_engineer.prepare_timeseries_features(donations_df, ngos_df)
            except Exception as e:
                logger.error(f"Error preparing timeseries features: {str(e)}")
                city_type_monthly, ngo_monthly = pd.DataFrame(), pd.DataFrame()
            
            # Cache data
            data_cache['matching_features'] = matching_features
            data_cache['fraud_features'] = fraud_features
            data_cache['clustering_features'] = clustering_features
            data_cache['timeseries_data'] = (city_type_monthly, ngo_monthly)
            data_cache['logs_data'] = logs_df
            
            # Initialize and train models
            logger.info("Training models...")
            
            # Content-based matcher
            models['matcher'] = ContentBasedMatcher()
            try:
                if not matching_features.empty:
                    models['matcher'].fit(matching_features)
            except Exception as e:
                logger.error(f"Error training matcher model: {str(e)}")
            
            # Fraud detector
            models['fraud_detector'] = FraudDetector(model_type='random_forest')
            try:
                if not fraud_features.empty:
                    models['fraud_detector'].fit(fraud_features)
            except Exception as e:
                logger.error(f"Error training fraud detector: {str(e)}")
            
            # NGO clusterer
            models['clusterer'] = NGOClusterer()
            try:
                if not clustering_features.empty:
                    models['clusterer'].fit(clustering_features)
            except Exception as e:
                logger.error(f"Error training clusterer: {str(e)}")
            
            # Time series forecaster
            models['forecaster'] = TimeSeriesForecaster()
            try:
                if not city_type_monthly.empty and 'ds' in city_type_monthly.columns:
                    city_type_monthly['ds'] = pd.to_datetime(city_type_monthly['ds'])
                    models['forecaster'].fit_city_type_models(city_type_monthly)
            except Exception as e:
                logger.error(f"Error fitting city type models: {str(e)}")
            
            try:
                if not ngo_monthly.empty and 'ds' in ngo_monthly.columns:
                    ngo_monthly['ds'] = pd.to_datetime(ngo_monthly['ds'])
                    models['forecaster'].fit_ngo_cluster_models(ngo_monthly)
            except Exception as e:
                logger.error(f"Error fitting NGO cluster models: {str(e)}")
            
            # FSM analyzer
            models['fsm_analyzer'] = FSMAnalyzer()
            try:
                models['fsm_analyzer'].create_fsm_from_logs(logs_df)
            except Exception as e:
                logger.error(f"Error creating FSM: {str(e)}")
            
            logger.info("All models initialized successfully!")
            
        else:
            logger.warning(f"Data directory {data_dir} not found. Models will not be pre-trained.")
            # Initialize empty models
            models['matcher'] = ContentBasedMatcher()
            models['fraud_detector'] = FraudDetector()
            models['clusterer'] = NGOClusterer()
            models['forecaster'] = TimeSeriesForecaster()
            models['fsm_analyzer'] = FSMAnalyzer()
            
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        # Fallback to empty models
        models['matcher'] = ContentBasedMatcher()
        models['fraud_detector'] = FraudDetector()
        models['clusterer'] = NGOClusterer()
        models['forecaster'] = TimeSeriesForecaster()
        models['fsm_analyzer'] = FSMAnalyzer()

# -------------------- Dependency Functions -------------------- #
def get_matcher():
    if models['matcher'] is None:
        raise HTTPException(status_code=503, detail="Matcher model not available")
    return models['matcher']

def get_fraud_detector():
    if models['fraud_detector'] is None:
        raise HTTPException(status_code=503, detail="Fraud detector model not available")
    return models['fraud_detector']

def get_clusterer():
    if models['clusterer'] is None:
        raise HTTPException(status_code=503, detail="Clusterer model not available")
    return models['clusterer']

def get_forecaster():
    if models['forecaster'] is None:
        raise HTTPException(status_code=503, detail="Forecaster model not available")
    return models['forecaster']

def get_fsm_analyzer():
    if models['fsm_analyzer'] is None:
        raise HTTPException(status_code=503, detail="FSM analyzer not available")
    return models['fsm_analyzer']

# -------------------- Endpoints -------------------- #


@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint with health check"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        models_loaded={
            'matcher': models['matcher'] is not None,
            'fraud_detector': models['fraud_detector'] is not None,
            'clusterer': models['clusterer'] is not None,
            'forecaster': models['forecaster'] is not None,
            'fsm_analyzer': models['fsm_analyzer'] is not None
        }
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        models_loaded={
            'matcher': models['matcher'] is not None,
            'fraud_detector': models['fraud_detector'] is not None,
            'clusterer': models['clusterer'] is not None,
            'forecaster': models['forecaster'] is not None,
            'fsm_analyzer': models['fsm_analyzer'] is not None
        }
    )

@app.post("/match", response_model=DonationMatchResponse)
async def match_donation(
    request: DonationMatchRequest,
    matcher: ContentBasedMatcher = Depends(get_matcher)
):
    """Get NGO matches for a donation"""
    try:
        if data_cache['matching_features'] is None:
            raise HTTPException(status_code=503, detail="Matching features not available")
        
        matches = matcher.get_top_matches(
            request.donation_id,
            data_cache['matching_features'],
            request.top_k
        )
        
        match_results = [
            MatchResult(
                ngo_id=match['NGO_ID'],
                match_score=match['Match_Score'],
                distance_km=match['Distance_km'],
                explanation=match['Explanation']
            )
            for match in matches
        ]
        
        return DonationMatchResponse(
            donation_id=request.donation_id,
            matches=match_results,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Error in match_donation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/match/batch", response_model=BatchMatchResponse)
async def batch_match_donations(
    request: BatchMatchRequest,
    matcher: ContentBasedMatcher = Depends(get_matcher)
):
    """Get NGO matches for multiple donations"""
    try:
        if data_cache['matching_features'] is None:
            raise HTTPException(status_code=503, detail="Matching features not available")
        
        batch_results = matcher.batch_match(
            request.donation_ids,
            data_cache['matching_features'],
            request.top_k
        )
        
        formatted_results = {}
        for donation_id, matches in batch_results.items():
            formatted_results[donation_id] = [
                MatchResult(
                    ngo_id=match['NGO_ID'],
                    match_score=match['Match_Score'],
                    distance_km=match['Distance_km'],
                    explanation=match['Explanation']
                )
                for match in matches
            ]
        
        return BatchMatchResponse(
            results=formatted_results,
            total_donations=len(request.donation_ids),
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Error in batch_match_donations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict_authenticity", response_model=FraudPredictionResponse)
async def predict_donor_authenticity(
    request: FraudPredictionRequest,
    fraud_detector: FraudDetector = Depends(get_fraud_detector)
):
    """Predict donor authenticity (fraud detection)"""
    try:
        donor_features = {
            'DonorID': request.donor_id,
            'Donor_Reliability': request.donor_reliability,
            'Past_Donations': request.past_donations,
            'Avg_Quantity_Claimed': request.avg_quantity_claimed,
            'Avg_Quantity_Received_Ratio': request.avg_quantity_received_ratio,
            'Avg_Fulfillment_Delay': request.avg_fulfillment_delay,
            'Num_Manual_Rejects': request.num_manual_rejects,
            'Num_Flagged': request.num_flagged,
            'Feedback_Mean': request.feedback_mean
        }
        
        prediction = fraud_detector.predict_with_explanation(donor_features)
        
        return FraudPredictionResponse(
            donor_id=prediction['donor_id'],
            fraud_probability=prediction['fraud_probability'],
            is_flagged=prediction['is_flagged'],
            risk_level=prediction['risk_level'],
            explanation=prediction['explanation'],
            recommendation=prediction['recommendation'],
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Error in predict_donor_authenticity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/clusters", response_model=ClusterPredictionResponse)
async def predict_ngo_cluster(
    request: NGOClusterRequest,
    clusterer: NGOClusterer = Depends(get_clusterer)
):
    """Predict cluster assignment for an NGO"""
    try:
        ngo_features = {
            'NGO_ID': request.ngo_id,
            'Latitude': request.latitude,
            'Longitude': request.longitude,
            'Capacity_per_week': request.capacity_per_week,
            'Urgent_Need': int(request.urgent_need),
            'Total_Matched_Donations': 0,  # Default for new NGO
            'Demand_shirt': request.demand_shirt,
            'Demand_jacket': request.demand_jacket,
            'Demand_saree': request.demand_saree,
            'Demand_blanket': request.demand_blanket,
            'Demand_pants': request.demand_pants,
            'Demand_dress': request.demand_dress,
            'Demand_footwear': request.demand_footwear
        }
        
        cluster_prediction = clusterer.predict_cluster(ngo_features)
        
        return ClusterPredictionResponse(
            ngo_id=request.ngo_id,
            geo_cluster=cluster_prediction['geo_cluster'],
            behavior_cluster=cluster_prediction['behavior_cluster'],
            combined_cluster=cluster_prediction['combined_cluster'],
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Error in predict_ngo_cluster: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/forecast", response_model=ForecastResponse)
async def generate_forecast(
    request: ForecastRequest,
    forecaster: TimeSeriesForecaster = Depends(get_forecaster)
):
    """Generate time series forecast"""
    try:
        forecast_df = forecaster.forecast(
            request.model_key,
            request.periods,
            request.frequency
        )
        
        forecast_points = [
            ForecastPoint(
                date=row['date'].isoformat() if hasattr(row['date'], 'isoformat') else str(row['date']),
                forecast=row['forecast'],
                forecast_lower=row['forecast_lower'],
                forecast_upper=row['forecast_upper']
            )
            for _, row in forecast_df.iterrows()
        ]
        
        return ForecastResponse(
            model_key=request.model_key,
            forecast_points=forecast_points,
            periods=request.periods,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Error in generate_forecast: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/forecast/models")
async def list_forecast_models(
    forecaster: TimeSeriesForecaster = Depends(get_forecaster)
):
    """List available forecast models"""
    try:
        model_summary = forecaster.get_model_summary()
        return model_summary
        
    except Exception as e:
        logger.error(f"Error in list_forecast_models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/process", response_model=ProcessAnalytics)
async def get_process_analytics(
    fsm_analyzer: FSMAnalyzer = Depends(get_fsm_analyzer)
):
    """Get process analytics from FSM data"""
    try:
        analytics = fsm_analyzer.get_process_analytics()
        
        return ProcessAnalytics(
            total_donations=analytics['total_donations'],
            state_distribution=analytics['state_distribution'],
            avg_processing_times=analytics['avg_processing_times'],
            bottleneck_analysis=analytics['bottleneck_analysis'],
            completion_rate=analytics['completion_rate'],
            stuck_donations=analytics['stuck_donations']
        )
        
    except Exception as e:
        logger.error(f"Error in get_process_analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/improvements")
async def get_process_improvements(
    fsm_analyzer: FSMAnalyzer = Depends(get_fsm_analyzer)
):
    """Get process improvement recommendations"""
    try:
        improvements = fsm_analyzer.identify_process_improvements()
        return {"improvements": improvements, "timestamp": datetime.now()}
        
    except Exception as e:
        logger.error(f"Error in get_process_improvements: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/performance")
async def get_performance_metrics(
    fsm_analyzer: FSMAnalyzer = Depends(get_fsm_analyzer)
):
    """Get key performance metrics"""
    try:
        metrics = fsm_analyzer.get_performance_metrics()
        return {"metrics": metrics, "timestamp": datetime.now()}
        
    except Exception as e:
        logger.error(f"Error in get_performance_metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)