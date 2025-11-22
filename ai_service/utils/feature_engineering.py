import pandas as pd
import numpy as np
from math import radians, cos, sin, asin, sqrt
from datetime import datetime

# Clothing type ontology (similar types grouped together)
CLOTHING_ONTOLOGY = {
    "Men's Wear": {"Shirts", "Trousers", "Kurtas", "Jackets", "Sweaters", "Jeans"},
    "Women's Wear": {"Sarees", "Salwar Kameez", "Kurtis", "Tops", "Jeans", "Shawls"},
    "Kids Wear": {"T-Shirts", "Shorts", "Frocks", "School Uniforms", "Sweaters"},
    "Winter Wear": {"Jackets", "Sweaters", "Shawls", "Blankets", "Mufflers"},
    "Footwear": {"Shoes", "Sandals", "Slippers"},
    "Accessories": {"Bags", "Belts", "Scarves", "Caps"}
}

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees).
    Returns distance in kilometers.
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    
    return c * r

def calculate_type_similarity(donation_type, ngo_focus):
    """
    Calculate similarity between donation type and NGO focus.
    Returns score between 0 and 1.
    """
    # If NGO accepts all types
    if "All types" in ngo_focus or "all" in ngo_focus.lower():
        return 0.8
    
    # Parse NGO focus areas
    ngo_types = [t.strip() for t in ngo_focus.split(",")]
    
    # Exact match
    if donation_type in ngo_types:
        return 1.0
    
    # Check ontology for related types
    donation_category = get_category(donation_type)
    for ngo_type in ngo_types:
        ngo_category = get_category(ngo_type)
        if donation_category == ngo_category:
            return 0.9
    
    # Check if NGO focuses on broad category
    if donation_type in ngo_focus:
        return 0.95
    
    return 0.3

def get_category(clothing_type):
    """Get the category for a clothing type"""
    for category, types in CLOTHING_ONTOLOGY.items():
        if clothing_type in types or clothing_type == category:
            return category
    return "Other"

def calculate_season_match(donation_season, current_month):
    """
    Calculate season match score based on current month.
    Returns score between 0 and 1.
    """
    # Determine current season
    if current_month in [2, 3, 4, 5]:
        current_season = "Summer"
    elif current_month in [6, 7, 8, 9]:
        current_season = "Monsoon"
    else:
        current_season = "Winter"
    
    # All season items always match
    if donation_season == "All Season":
        return 1.0
    
    # Exact season match
    if donation_season == current_season:
        return 1.0
    
    # Adjacent season (e.g., Winter items in early Monsoon)
    season_order = ["Summer", "Monsoon", "Winter"]
    try:
        don_idx = season_order.index(donation_season)
        cur_idx = season_order.index(current_season)
        if abs(don_idx - cur_idx) == 1:
            return 0.7
    except ValueError:
        pass
    
    return 0.4

def calculate_proximity_score(distance_km, max_distance=50):
    """
    Calculate proximity score based on distance.
    Returns score between 0 and 1.
    """
    if distance_km <= 5:
        return 1.0
    elif distance_km <= 15:
        return 0.9
    elif distance_km <= max_distance:
        return 1.0 - (distance_km / max_distance) * 0.5
    else:
        return 0.2

def calculate_urgency_score(ngo_urgent, donation_quantity, request_urgency=None):
    """
    Calculate urgency match score.
    Returns score between 0 and 1.
    """
    score = 0.5  # Base score
    
    # NGO has urgent need
    if ngo_urgent:
        score += 0.3
    
    # Large quantity donation
    if donation_quantity > 20:
        score += 0.2
    
    # Request urgency (if matching request)
    if request_urgency:
        urgency_map = {"critical": 1.0, "high": 0.8, "medium": 0.5, "low": 0.3}
        score += urgency_map.get(request_urgency, 0.3)
    
    return min(score, 1.0)

def calculate_capacity_score(ngo_capacity, donation_quantity):
    """
    Calculate if NGO has capacity to handle donation.
    Returns score between 0 and 1.
    """
    # Perfect fit: donation is 10-30% of capacity
    optimal_ratio = donation_quantity / ngo_capacity
    
    if 0.1 <= optimal_ratio <= 0.3:
        return 1.0
    elif optimal_ratio < 0.1:
        return 0.8  # Too small, but manageable
    elif optimal_ratio <= 0.5:
        return 0.9
    elif optimal_ratio <= 0.8:
        return 0.7
    else:
        return 0.5  # Too large, might overwhelm

def calculate_historical_score(ngo_acceptance_rate):
    """
    Calculate score based on NGO's historical acceptance rate.
    Returns score between 0 and 1.
    """
    return ngo_acceptance_rate

def calculate_donor_reliability(donor_data, donation_logs):
    """
    Calculate donor reliability score based on history.
    Returns score between 0 and 1 and list of risk factors.
    """
    donor_id = donor_data["DonorID"]
    
    # Get donor's past donations
    donor_donations = donation_logs[donation_logs["DonorID"] == donor_id]
    
    if len(donor_donations) == 0:
        return 0.8, []  # New donor, neutral score
    
    risk_factors = []
    score = 1.0
    
    # Check fulfillment rate
    total = len(donor_donations)
    fulfilled = len(donor_donations[donor_donations["Timestamp_Delivered"].notna()])
    fulfillment_rate = fulfilled / total if total > 0 else 0
    
    if fulfillment_rate < 0.5:
        score -= 0.3
        risk_factors.append(f"Low fulfillment rate: {fulfillment_rate*100:.0f}%")
    elif fulfillment_rate < 0.7:
        score -= 0.15
    
    # Check quantity mismatch pattern
    completed = donor_donations[donor_donations["Timestamp_Delivered"].notna()]
    if len(completed) > 0:
        completed_logs = donation_logs[donation_logs["DonationID"].isin(completed["DonationID"])]
        delivered_logs = completed_logs[completed_logs["State"] == "delivered"]
        
        if len(delivered_logs) > 0:
            mismatches = delivered_logs[delivered_logs["Quantity_Received"] < delivered_logs["Quantity"]].shape[0]
            mismatch_rate = mismatches / len(delivered_logs)
            
            if mismatch_rate > 0.5:
                score -= 0.4
                risk_factors.append(f"High quantity mismatch rate: {mismatch_rate*100:.0f}%")
            elif mismatch_rate > 0.3:
                score -= 0.2
    
    # Check flagged status
    if donor_data.get("Flagged", False):
        score -= 0.3
        risk_factors.append("Donor previously flagged")
    
    # Check low feedback scores
    if donor_data.get("Last_Feedback", 5) < 3:
        score -= 0.2
        risk_factors.append(f"Low feedback score: {donor_data['Last_Feedback']}/5")
    
    return max(score, 0.0), risk_factors

def extract_fraud_features(donor_data, donation_data, donation_logs):
    """
    Extract features for fraud detection model.
    Returns dictionary of features.
    """
    donor_id = donor_data["DonorID"]
    
    # Get all donations by this donor from the main donations dataframe
    # We need to pass the donations_df separately
    
    features = {}
    
    # Donor features
    features["DonorReliability"] = donor_data.get("Reliability_Score", 0.8)
    features["Past_Donations"] = donor_data.get("Past_Donations", 0)
    features["Flagged"] = 1 if donor_data.get("Flagged", False) else 0
    features["Feedback_mean"] = donor_data.get("Last_Feedback", 4)
    
    # Donation features
    features["Quantity"] = donation_data.get("Quantity", 0)
    features["Condition_New"] = 1 if donation_data.get("Condition_Donor") == "New" else 0
    features["Proof_Provided"] = 1 if donation_data.get("Proof_Evidence") == "Yes" else 0
    
    # Historical patterns - calculate from donation_logs if available
    if not donation_logs.empty and "DonationID" in donation_logs.columns:
        # Get this donor's past donation IDs from logs
        donor_donation_ids = donation_logs[
            donation_logs["State"].isin(["submitted", "approved"])
        ]["DonationID"].unique()
        
        # Filter logs for this donor's donations
        donor_logs = donation_logs[donation_logs["DonationID"].isin(donor_donation_ids)]
        
        if len(donor_logs) > 0:
            # Fulfillment rate
            total_donations = len(donor_logs[donor_logs["State"] == "submitted"])
            fulfilled = len(donor_logs[donor_logs["State"] == "delivered"])
            features["Fulfillment_Rate"] = fulfilled / total_donations if total_donations > 0 else 1.0
            
            # Average quantity claimed
            submitted_logs = donor_logs[donor_logs["State"] == "submitted"]
            if len(submitted_logs) > 0:
                # We need to join with donations to get quantity
                features["Avg_Quantity_Claimed"] = donation_data.get("Quantity", 0)
            else:
                features["Avg_Quantity_Claimed"] = 0
            
            # Quantity received ratio
            delivered_logs = donor_logs[donor_logs["State"] == "delivered"]
            if len(delivered_logs) > 0 and "Quantity_Received" in delivered_logs.columns:
                avg_received = delivered_logs["Quantity_Received"].mean()
                avg_claimed = donation_data.get("Quantity", 1)
                features["Avg_Quantity_Received_ratio"] = avg_received / avg_claimed if avg_claimed > 0 else 1.0
            else:
                features["Avg_Quantity_Received_ratio"] = 1.0
            
            # Average fulfillment delay
            delivered = donor_logs[donor_logs["State"] == "delivered"]
            if len(delivered) > 0:
                # Calculate average delay (for now use default)
                features["Avg_Fulfillment_Delay"] = 5  # Default 5 days
            else:
                features["Avg_Fulfillment_Delay"] = 0
            
            # Manual rejects
            rejected = donor_logs[donor_logs["State"] == "rejected"]
            features["Num_ManualRejects"] = len(rejected)
        else:
            # No history
            features["Fulfillment_Rate"] = 1.0
            features["Avg_Quantity_Claimed"] = 0
            features["Avg_Quantity_Received_ratio"] = 1.0
            features["Avg_Fulfillment_Delay"] = 0
            features["Num_ManualRejects"] = 0
    else:
        # No logs available, use defaults
        features["Fulfillment_Rate"] = 1.0
        features["Avg_Quantity_Claimed"] = 0
        features["Avg_Quantity_Received_ratio"] = 1.0
        features["Avg_Fulfillment_Delay"] = 0
        features["Num_ManualRejects"] = 0
    
    return features


def prepare_matching_features(donation, ngo, current_date=None):
    """
    Prepare all features for matching algorithm.
    Returns dictionary of features and scores.
    """
    if current_date is None:
        current_date = datetime.now()
    
    # Calculate distance
    distance = haversine_distance(
        donation["Latitude"], donation["Longitude"],
        ngo["Latitude"], ngo["Longitude"]
    )
    
    features = {
        "donation_id": donation.get("DonationID"),
        "ngo_id": ngo["NGO_ID"],
        "distance_km": round(distance, 2),
        "type_similarity": calculate_type_similarity(
            donation["Type"], 
            ngo["Special_Focus"]
        ),
        "season_match": calculate_season_match(
            donation["Season"], 
            current_date.month
        ),
        "proximity_score": calculate_proximity_score(distance),
        "urgency_score": calculate_urgency_score(
            ngo["Urgent_Need"],
            donation["Quantity"]
        ),
        "capacity_score": calculate_capacity_score(
            ngo["Capacity_per_week"],
            donation["Quantity"]
        ),
        "historical_score": calculate_historical_score(
            ngo["Acceptance_Rate"]
        )
    }
    
    return features

print("✅ Feature engineering utilities loaded successfully!")
