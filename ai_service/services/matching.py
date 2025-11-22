import pandas as pd
import numpy as np
from typing import List, Dict, Any
import sys
import os

# Add parent directory to path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.feature_engineering import (
    prepare_matching_features,
    haversine_distance
)

# Feature weights for matching score
WEIGHTS = {
    "type_similarity": 0.30,
    "season_match": 0.20,
    "proximity_score": 0.20,
    "urgency_score": 0.15,
    "capacity_score": 0.10,
    "historical_score": 0.05
}

class DonationMatcher:
    """Content-based filtering matcher for donations and NGOs"""
    
    def __init__(self):
        """Initialize matcher with data"""
        self.load_data()
    
    def load_data(self):
        """Load NGO and donation data"""
        data_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data"
        )
        
        try:
            self.ngos_df = pd.read_csv(os.path.join(data_path, "ngos.csv"))
            self.donations_df = pd.read_csv(os.path.join(data_path, "donations.csv"))
            self.donors_df = pd.read_csv(os.path.join(data_path, "donors.csv"))
            print(f"✅ Loaded {len(self.ngos_df)} NGOs and {len(self.donations_df)} donations")
        except Exception as e:
            print(f"⚠️ Warning: Could not load data files: {e}")
            # Create empty dataframes as fallback
            self.ngos_df = pd.DataFrame()
            self.donations_df = pd.DataFrame()
            self.donors_df = pd.DataFrame()
    
    def calculate_match_score(self, features: Dict[str, float]) -> float:
        """
        Calculate weighted match score from features.
        
        Args:
            features: Dictionary of feature scores
            
        Returns:
            Weighted score between 0 and 1
        """
        score = 0.0
        for feature, weight in WEIGHTS.items():
            score += features.get(feature, 0) * weight
        
        return round(score, 3)
    
    def explain_match(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Generate explanation for match score.
        
        Args:
            features: Dictionary of feature scores
            
        Returns:
            Dictionary with explanation details
        """
        explanations = []
        contributions = {}
        
        for feature, weight in WEIGHTS.items():
            feature_score = features.get(feature, 0)
            contribution = feature_score * weight
            contributions[feature] = round(contribution * 100, 1)
            
            # Generate human-readable explanation
            if feature == "type_similarity" and feature_score > 0.8:
                explanations.append(f"Perfect match for clothing type")
            elif feature == "season_match" and feature_score > 0.9:
                explanations.append(f"Ideal season match")
            elif feature == "proximity_score" and feature_score > 0.8:
                explanations.append(f"Very close location ({features.get('distance_km', 0):.1f} km)")
            elif feature == "urgency_score" and feature_score > 0.7:
                explanations.append(f"High urgency need")
            elif feature == "capacity_score" and feature_score > 0.8:
                explanations.append(f"NGO has optimal capacity")
            elif feature == "historical_score" and feature_score > 0.8:
                explanations.append(f"High acceptance track record")
        
        return {
            "reasons": explanations,
            "score_breakdown": contributions,
            "top_factors": sorted(
                contributions.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:3]
        }
    
    def find_matches_for_donation(
        self, 
        donation_data: Dict[str, Any],
        max_matches: int = 5,
        max_distance: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Find top NGO matches for a donation.
        
        Args:
            donation_data: Dictionary with donation details
            max_matches: Maximum number of matches to return
            max_distance: Maximum distance in km
            
        Returns:
            List of matched NGOs with scores and explanations
        """
        if self.ngos_df.empty:
            return []
        
        # Filter NGOs by distance first
        nearby_ngos = []
        for _, ngo in self.ngos_df.iterrows():
            distance = haversine_distance(
                donation_data.get("latitude", 0),
                donation_data.get("longitude", 0),
                ngo["Latitude"],
                ngo["Longitude"]
            )
            
            if distance <= max_distance:
                nearby_ngos.append(ngo)
        
        if len(nearby_ngos) == 0:
            return []
        
        # Calculate match scores for each nearby NGO
        matches = []
        for ngo in nearby_ngos:
            # Prepare donation dict in expected format
            donation_dict = {
                "DonationID": donation_data.get("donation_id", "NEW"),
                "Type": donation_data.get("type", ""),
                "Season": donation_data.get("season", "All Season"),
                "Quantity": donation_data.get("quantity", 0),
                "Latitude": donation_data.get("latitude", 0),
                "Longitude": donation_data.get("longitude", 0)
            }
            
            # Calculate features
            features = prepare_matching_features(donation_dict, ngo)
            
            # Calculate overall score
            score = self.calculate_match_score(features)
            
            # Generate explanation
            explanation = self.explain_match(features)
            
            matches.append({
                "ngo_id": ngo["NGO_ID"],
                "ngo_name": ngo["Name"],
                "city": ngo["City"],
                "cause": ngo["Cause"],
                "distance_km": features["distance_km"],
                "score": score,
                "match_percentage": round(score * 100, 1),
                "reasons": explanation["reasons"],
                "score_breakdown": explanation["score_breakdown"],
                "contact": ngo["Contact"],
                "urgent_need": bool(ngo["Urgent_Need"]),
                "capacity_per_week": int(ngo["Capacity_per_week"])
            })
        
        # Sort by score and return top matches
        matches.sort(key=lambda x: x["score"], reverse=True)
        return matches[:max_matches]
    
    def find_matches_for_request(
        self,
        request_data: Dict[str, Any],
        max_matches: int = 5,
        max_distance: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Find top donation matches for an NGO request.
        
        Args:
            request_data: Dictionary with request details
            max_matches: Maximum number of matches to return
            max_distance: Maximum distance in km
            
        Returns:
            List of matched donations with scores and explanations
        """
        if self.donations_df.empty:
            return []
        
        # Filter approved and available donations
        available_donations = self.donations_df[
            (self.donations_df["AdminDecision"] == "Approved") &
            (self.donations_df["Matched_NGO_ID"].isna())
        ]
        
        if len(available_donations) == 0:
            return []
        
        # Filter by distance
        nearby_donations = []
        for _, donation in available_donations.iterrows():
            distance = haversine_distance(
                request_data.get("latitude", 0),
                request_data.get("longitude", 0),
                donation["Latitude"],
                donation["Longitude"]
            )
            
            if distance <= max_distance:
                nearby_donations.append(donation)
        
        if len(nearby_donations) == 0:
            return []
        
        # Create a pseudo-NGO from request data
        pseudo_ngo = {
            "NGO_ID": request_data.get("ngo_id", "REQUEST_NGO"),
            "Name": request_data.get("ngo_name", "Requesting NGO"),
            "City": request_data.get("city", ""),
            "Latitude": request_data.get("latitude", 0),
            "Longitude": request_data.get("longitude", 0),
            "Special_Focus": request_data.get("type", "All types"),
            "Urgent_Need": request_data.get("urgency", "medium") in ["high", "critical"],
            "Capacity_per_week": request_data.get("capacity", 200),
            "Acceptance_Rate": 0.85
        }
        
        # Calculate match scores
        matches = []
        for donation in nearby_donations:
            features = prepare_matching_features(donation, pseudo_ngo)
            score = self.calculate_match_score(features)
            explanation = self.explain_match(features)
            
            matches.append({
                "donation_id": donation["DonationID"],
                "donor_id": donation["DonorID"],
                "type": donation["Type"],
                "subtype": donation["Subtype"],
                "condition": donation["Condition_System"],
                "quantity": int(donation["Quantity"]),
                "city": donation["Location_City"],
                "distance_km": features["distance_km"],
                "score": score,
                "match_percentage": round(score * 100, 1),
                "reasons": explanation["reasons"],
                "score_breakdown": explanation["score_breakdown"],
                "submitted_date": donation["Timestamp_Submitted"]
            })
        
        # Sort by score
        matches.sort(key=lambda x: x["score"], reverse=True)
        return matches[:max_matches]
    
    def get_recommendations_summary(self, matches: List[Dict]) -> Dict[str, Any]:
        """
        Generate summary statistics for recommendations.
        
        Args:
            matches: List of match dictionaries
            
        Returns:
            Summary statistics
        """
        if not matches:
            return {
                "total_matches": 0,
                "avg_score": 0,
                "best_match_score": 0,
                "avg_distance": 0
            }
        
        return {
            "total_matches": len(matches),
            "avg_score": round(np.mean([m["score"] for m in matches]), 3),
            "best_match_score": max([m["score"] for m in matches]),
            "avg_distance": round(np.mean([m["distance_km"] for m in matches]), 2),
            "score_range": {
                "excellent": len([m for m in matches if m["score"] >= 0.8]),
                "good": len([m for m in matches if 0.6 <= m["score"] < 0.8]),
                "fair": len([m for m in matches if m["score"] < 0.6])
            }
        }


# Legacy function for backward compatibility
def get_ngo_matches(donation_type: str, description: str) -> List[Dict]:
    """
    Legacy function - Simple matching based on type only.
    Use DonationMatcher class for full featured matching.
    """
    matcher = DonationMatcher()
    
    # Create simple donation data
    donation_data = {
        "type": donation_type,
        "description": description,
        "latitude": 19.0760,  # Default Mumbai
        "longitude": 72.8777,
        "quantity": 10,
        "season": "All Season"
    }
    
    matches = matcher.find_matches_for_donation(donation_data, max_matches=3)
    
    # Simplify for legacy format
    return [
        {
            "ngo_id": m["ngo_id"],
            "name": m["ngo_name"],
            "match_score": m["match_percentage"]
        }
        for m in matches
    ]


if __name__ == "__main__":
    # Test the matcher
    print("=" * 60)
    print("TESTING DONATION MATCHER")
    print("=" * 60)
    
    matcher = DonationMatcher()
    
    # Test donation matching
    print("\n📦 Test 1: Finding NGOs for a winter clothing donation")
    test_donation = {
        "donation_id": "TEST001",
        "type": "Winter Wear",
        "season": "Winter",
        "quantity": 25,
        "latitude": 19.0760,  # Mumbai
        "longitude": 72.8777,
        "description": "Winter jackets and sweaters"
    }
    
    matches = matcher.find_matches_for_donation(test_donation, max_matches=5)
    
    print(f"\n✅ Found {len(matches)} matches:\n")
    for i, match in enumerate(matches, 1):
        print(f"{i}. {match['ngo_name']}")
        print(f"   Score: {match['match_percentage']}% | Distance: {match['distance_km']} km")
        print(f"   Reasons: {', '.join(match['reasons'][:2])}")
        print(f"   Contact: {match['contact']}\n")
    
    # Test request matching
    print("\n📋 Test 2: Finding donations for an NGO request")
    test_request = {
        "ngo_id": "NGO0001",
        "ngo_name": "Children Education NGO",
        "type": "Kids Wear",
        "urgency": "high",
        "latitude": 28.7041,  # Delhi
        "longitude": 77.1025,
        "city": "Delhi",
        "capacity": 150
    }
    
    donation_matches = matcher.find_matches_for_request(test_request, max_matches=5)
    
    print(f"\n✅ Found {len(donation_matches)} donation matches:\n")
    for i, match in enumerate(donation_matches, 1):
        print(f"{i}. Donation {match['donation_id']}")
        print(f"   Type: {match['type']} - {match['subtype']}")
        print(f"   Score: {match['match_percentage']}% | Distance: {match['distance_km']} km")
        print(f"   Quantity: {match['quantity']} | Condition: {match['condition']}\n")
    
    # Summary
    summary = matcher.get_recommendations_summary(matches)
    print(f"\n📊 Matching Summary:")
    print(f"   Total matches: {summary['total_matches']}")
    print(f"   Average score: {summary['avg_score']}")
    print(f"   Best match: {summary['best_match_score']}")
    print(f"   Average distance: {summary['avg_distance']} km")
    print(f"   Quality: {summary['score_range']['excellent']} excellent, "
          f"{summary['score_range']['good']} good, {summary['score_range']['fair']} fair")
    
    print("\n" + "=" * 60)
    print("✅ MATCHING TEST COMPLETE!")
    print("=" * 60)
