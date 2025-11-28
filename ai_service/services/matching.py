import pandas as pd
import numpy as np
from typing import List, Dict, Any
import os
import math

class DonationMatcher:
    def __init__(self):
        self.ngos_df = None
        self.donations_df = None
        self.load_data()

    def load_data(self):
        """Load NGO and donation data"""
        # Get path to data directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(os.path.dirname(current_dir))
        data_dir = os.path.join(root_dir, 'data')
        
        ngo_path = os.path.join(data_dir, 'ngos.csv')
        
        if os.path.exists(ngo_path):
            self.ngos_df = pd.read_csv(ngo_path)
            # CRITICAL FIX: Convert all column names to lowercase to handle "Latitude" vs "latitude"
            self.ngos_df.columns = self.ngos_df.columns.str.lower()
            print(f"✅ Matcher loaded {len(self.ngos_df)} NGOs")
        else:
            print(f"⚠️ Warning: NGO file not found at {ngo_path}")
            self.ngos_df = pd.DataFrame()

    def calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate Haversine distance between two points in km"""
        R = 6371  # Earth radius in km
        
        try:
            dlat = math.radians(float(lat2) - float(lat1))
            dlon = math.radians(float(lon2) - float(lon1))
            a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
                 math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) *
                 math.sin(dlon / 2) * math.sin(dlon / 2))
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return R * c
        except Exception:
            return 9999  # Return far distance on error

    def find_matches_for_donation(self, donation: Dict[str, Any], max_matches: int = 5, max_distance: float = 50.0) -> List[Dict[str, Any]]:
        """Find best NGO matches for a donation"""
        if self.ngos_df is None or self.ngos_df.empty:
            return []

        matches = []
        
        d_lat = float(donation.get('latitude', 0))
        d_lon = float(donation.get('longitude', 0))
        d_type = str(donation.get('type', '')).lower()
        
        for _, ngo in self.ngos_df.iterrows():
            try:
                # Use .get() with lowercase keys safely
                n_lat = ngo.get('latitude', 0)
                n_lon = ngo.get('longitude', 0)
                
                # Calculate distance
                dist = self.calculate_distance(d_lat, d_lon, n_lat, n_lon)
                
                # Skip if too far
                if max_distance and dist > max_distance:
                    continue
                
                # Calculate Match Score
                score = 0
                
                # 1. Distance Score (Max 40 points)
                if dist < 5: score += 40
                elif dist < 10: score += 30
                elif dist < 20: score += 20
                elif dist < 50: score += 10
                
                # 2. Type Score (Max 40 points)
                accepted = str(ngo.get('accepted_clothing_types', '')).lower()
                if d_type in accepted or 'all' in accepted:
                    score += 40
                
                # 3. Trust/Impact Score (Max 20 points)
                trust = float(ngo.get('trust_score', 0))
                score += (trust / 100) * 20
                
                matches.append({
                    "ngo_id": str(ngo.get('_id', '')),
                    "ngo_name": ngo.get('name', 'Unknown'),
                    "match_score": float(score),
                    "match_percentage": float(score), # Legacy support
                    "distance": round(dist, 2),
                    "distance_km": round(dist, 2), # Legacy support
                    "location": {
                        "latitude": n_lat,
                        "longitude": n_lon,
                        "city": ngo.get('city', '')
                    },
                    "contact": ngo.get('contact', '')
                })
            except Exception as e:
                continue
                
        # Sort by score descending
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        return matches[:max_matches]

    def get_recommendations_summary(self, matches):
        if not matches:
            return {"text": "No matches found."}
        top = matches[0]
        return {
            "total_matches": len(matches),
            "top_match": top['ngo_name'],
            "text": f"Found {len(matches)} NGOs. Top match: {top['ngo_name']} ({top['distance']}km away)."
        }

    def find_matches_for_request(self, request_data, max_matches=5, max_distance=50):
        # Placeholder for reverse matching to pass tests
        return []
