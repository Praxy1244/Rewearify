"""
Simple Matching Service
Basic scoring-based matching for donations to NGOs
"""

from typing import Dict, List
import pandas as pd
import os

class MatchingService:
    def __init__(self):
        self.ngos_df = None
        self.load_ngos()
    
    def load_ngos(self):
        """Load NGO data from CSV"""
        try:
            from config import config
            ngos_path = os.path.join(config.DATA_DIR, "ngos.csv")
            if os.path.exists(ngos_path):
                self.ngos_df = pd.read_csv(ngos_path)
            else:
                # Use mock data if CSV doesn't exist
                self.ngos_df = pd.DataFrame([
                    {"ngo_id": "NGO001", "name": "Hope Foundation", "city": "Delhi", 
                     "categories_accepted": "outerwear,casual", "capacity": 100},
                    {"ngo_id": "NGO002", "name": "Helping Hands", "city": "Mumbai", 
                     "categories_accepted": "formal,casual", "capacity": 150},
                    {"ngo_id": "NGO003", "name": "Community Care", "city": "Bengaluru", 
                     "categories_accepted": "children,shoes", "capacity": 80}
                ])
        except Exception as e:
            print(f"Warning: Could not load NGOs: {e}")
            self.ngos_df = pd.DataFrame()
    
    def find_matches(
        self, 
        donation_id: str,
        category: str, 
        location: Dict[str, str], 
        quantity: int
    ) -> List[Dict]:
        """Find matching NGOs using simple scoring"""
        
        if self.ngos_df is None or len(self.ngos_df) == 0:
            return []
        
        matches = []
        donation_city = location.get('city', '')
        
        for _, ngo in self.ngos_df.iterrows():
            score = self._calculate_match_score(ngo, category, donation_city, quantity)
            
            if score > 0.3:  # Minimum threshold
                matches.append({
                    "ngo_id": ngo["ngo_id"],
                    "ngo_name": ngo["name"],
                    "match_score": round(score, 2),
                    "distance_km": 15,  # Mock distance
                    "explanation": self._generate_explanation(ngo, category, score)
                })
        
        # Sort by score
        matches.sort(key=lambda x: x["match_score"], reverse=True)
        
        return matches[:5]  # Top 5 matches
    
    def _calculate_match_score(self, ngo, category: str, city: str, quantity: int) -> float:
        """Calculate match score (0-1)"""
        score = 0.0
        
        # Category match (50% weight)
        if pd.notna(ngo.get("categories_accepted")):
            if category in str(ngo["categories_accepted"]).split(','):
                score += 0.5
        
        # Capacity match (30% weight)
        if pd.notna(ngo.get("capacity")):
            if quantity <= ngo["capacity"]:
                score += 0.3
            elif quantity <= ngo["capacity"] * 1.5:
                score += 0.15
        
        # Location match (20% weight)
        if pd.notna(ngo.get("city")) and city:
            if ngo["city"].lower() == city.lower():
                score += 0.3
        
        return min(score, 1.0)
    
    def _generate_explanation(self, ngo, category: str, score: float) -> str:
        """Generate human-readable explanation"""
        if score >= 0.7:
            return f"Excellent match: {ngo['name']} accepts {category} and has capacity"
        elif score >= 0.5:
            return f"Good match: {ngo['name']} accepts this category"
        else:
            return f"Potential match: {ngo['name']}"
