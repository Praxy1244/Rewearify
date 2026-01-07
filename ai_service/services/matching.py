# ai_service/services/matching.py - ENHANCED VERSION
import pandas as pd
import numpy as np
from typing import List, Dict, Any
import os
import math
from datetime import datetime
from geopy.distance import geodesic


class DonationMatcher:
    """
    Enhanced matcher that supports:
    1. Finding NGOs for donations (legacy)
    2. Finding requests for donations (NEW)
    """
    
    def __init__(self, ngos_df=None):
        """
        Initialize matcher with optional NGO dataframe
        If ngos_df is provided, use it (from MongoDB)
        Otherwise, fall back to CSV loading
        """
        self.ngos_df = None
        self.donations_df = None
        
        if ngos_df is not None:
            # Use provided MongoDB data
            self.ngos_df = ngos_df.copy()
            self.ngos_df.columns = self.ngos_df.columns.str.lower()
            self._process_ngo_data()
        else:
            # Fall back to CSV loading
            self.load_data()

    def load_data(self):
        """Load NGO data from CSV (fallback method)"""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(os.path.dirname(current_dir))
        data_dir = os.path.join(root_dir, 'data')
        
        ngo_path = os.path.join(data_dir, 'ngos.csv')
        
        if os.path.exists(ngo_path):
            self.ngos_df = pd.read_csv(ngo_path)
            self.ngos_df.columns = self.ngos_df.columns.str.lower()
            self._process_ngo_data()
        else:
            print(f"⚠️ Warning: NGO file not found at {ngo_path}")
            self.ngos_df = pd.DataFrame()

    def _process_ngo_data(self):
        """Process NGO dataframe (common for both CSV and MongoDB)"""
        # Calculate trust_score if not present
        if 'trust_score' not in self.ngos_df.columns:
            print("📊 Calculating trust_score for NGOs...")
            self.ngos_df['trust_score'] = self._calculate_trust_score()
            print(f"✅ Trust scores calculated (range: {self.ngos_df['trust_score'].min():.1f}-{self.ngos_df['trust_score'].max():.1f})")
        
        # Generate accepted_clothing_types from special_focus if not present
        if 'accepted_clothing_types' not in self.ngos_df.columns:
            print("📊 Generating accepted_clothing_types from special_focus...")
            self.ngos_df['accepted_clothing_types'] = self._generate_accepted_types()
            print("✅ Accepted clothing types generated")
        
        # Add verified field if not present
        if 'verified' not in self.ngos_df.columns:
            self.ngos_df['verified'] = True
        
        # Add categories_accepted if not present (as list)
        if 'categories_accepted' not in self.ngos_df.columns:
            self.ngos_df['categories_accepted'] = self.ngos_df.apply(
                lambda row: self._parse_categories(row.get('special_focus', '')), axis=1
            )
        
        print(f"✅ Matcher loaded {len(self.ngos_df)} NGOs")

    def _calculate_trust_score(self):
        """
        Calculate trust score for NGOs based on:
        - Acceptance Rate (50 points)
        - Total Donations Received (up to 25 points)
        - Urgent Need penalty (-5 points if urgent)
        - Capacity bonus (up to 20 points)
        
        Returns: pandas Series with trust scores (0-100)
        """
        trust_scores = []
        
        for _, ngo in self.ngos_df.iterrows():
            score = 0.0
            
            # Acceptance rate component (50 points max)
            acceptance_rate = float(ngo.get('acceptance_rate', 0.8))
            score += acceptance_rate * 50
            
            # Donations received component (25 points max)
            total_donations = int(ngo.get('total_donations_received', 0))
            score += min(total_donations / 10, 25)
            
            # Capacity component (20 points max)
            capacity = int(ngo.get('capacity_per_week', 100))
            score += min(capacity / 20, 20)
            
            # Urgent need penalty
            urgent = ngo.get('urgent_need', False)
            if urgent == True or str(urgent).lower() == 'true':
                score -= 5
            
            # Ensure score is in valid range
            trust_scores.append(max(0, min(100, score)))
        
        return trust_scores
    
    def _generate_accepted_types(self):
        """
        Generate accepted_clothing_types string from special_focus field
        Converts: "Men's Wear, Women's Wear" -> "mens_wear,womens_wear,all"
        """
        accepted_types = []
        
        for _, ngo in self.ngos_df.iterrows():
            special_focus = str(ngo.get('special_focus', '')).lower()
            
            if 'all types' in special_focus or not special_focus:
                accepted_types.append('all')
            else:
                # Convert special focus to accepted types
                types = []
                if "men's wear" in special_focus or "men wear" in special_focus:
                    types.append("mens_wear")
                if "women's wear" in special_focus or "women wear" in special_focus:
                    types.append("womens_wear")
                if "kids wear" in special_focus or "kid's wear" in special_focus or "children" in special_focus:
                    types.append("kids_wear")
                if "winter wear" in special_focus or "seasonal" in special_focus:
                    types.append("winter_wear")
                if "accessories" in special_focus:
                    types.append("accessories")
                if "formal" in special_focus:
                    types.append("formal")
                
                # If no specific type found, accept all
                if not types:
                    types = ["all"]
                
                accepted_types.append(",".join(types))
        
        return accepted_types
    
    def _parse_categories(self, special_focus):
        """
        Parse categories from special_focus field
        Returns a list of categories
        """
        if not special_focus or pd.isna(special_focus):
            return []
        
        special_focus = str(special_focus).lower()
        categories = []
        
        if 'all types' in special_focus:
            return ['formal', 'casual', 'outerwear', 'children', 'traditional', 'activewear']
        
        if "men's wear" in special_focus or "men wear" in special_focus:
            categories.extend(['formal', 'casual', 'activewear'])
        if "women's wear" in special_focus or "women wear" in special_focus:
            categories.extend(['formal', 'casual', 'traditional'])
        if "kids wear" in special_focus or "children" in special_focus:
            categories.append('children')
        if "winter wear" in special_focus or "seasonal" in special_focus:
            categories.extend(['outerwear', 'seasonal'])
        if "accessories" in special_focus:
            categories.append('accessories')
        
        return list(set(categories))  # Remove duplicates
    
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
            return 9999

    # ==================== LEGACY: Find NGOs for Donation ====================
    
    def find_matches_for_donation(self, donation: Dict[str, Any], max_matches: int = 5, max_distance: float = 50.0) -> List[Dict[str, Any]]:
        """Find best NGO matches for a donation (LEGACY METHOD)"""
        if self.ngos_df is None or self.ngos_df.empty:
            return []

        matches = []
        
        d_lat = float(donation.get('latitude', 0))
        d_lon = float(donation.get('longitude', 0))
        d_type = str(donation.get('type', '')).lower()
        
        for _, ngo in self.ngos_df.iterrows():
            try:
                n_lat = ngo.get('latitude', 0)
                n_lon = ngo.get('longitude', 0)
                
                dist = self.calculate_distance(d_lat, d_lon, n_lat, n_lon)
                
                if max_distance and dist > max_distance:
                    continue
                
                score = 0
                
                if dist < 5: score += 40
                elif dist < 10: score += 30
                elif dist < 20: score += 20
                elif dist < 50: score += 10
                
                accepted = str(ngo.get('accepted_clothing_types', '')).lower()
                if d_type in accepted or 'all' in accepted:
                    score += 40
                
                trust = float(ngo.get('trust_score', 0))
                score += (trust / 100) * 20
                
                matches.append({
                    "ngo_id": str(ngo.get('_id', '')),
                    "ngo_name": ngo.get('name', 'Unknown'),
                    "match_score": float(score),
                    "match_percentage": float(score),
                    "distance": round(dist, 2),
                    "distance_km": round(dist, 2),
                    "location": {
                        "latitude": n_lat,
                        "longitude": n_lon,
                        "city": ngo.get('city', '')
                    },
                    "contact": ngo.get('contact', '')
                })
            except Exception as e:
                continue
                
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        return matches[:max_matches]

    # ==================== NEW: Find Requests for Donation ====================
    
    def find_matches_for_request(self, donation, requests, max_matches=5):
        """
        Find best REQUEST matches for a donation
        
        Args:
            donation: Dict with donation details
            requests: List of request dicts from MongoDB
            max_matches: Max number of matches to return
        
        Returns:
            List of matches with scores
        """
        matches = []
        
        # Extract donation info
        don_cat = donation.get('category', '').lower()
        don_subcat = donation.get('subcategory', '').lower()
        don_qty = donation.get('quantity', 0)
        don_condition = donation.get('condition', 'good').lower()
        don_coords = donation.get('location', {}).get('coordinates', {}).get('coordinates', [0, 0])
        
        for request in requests:
            # Skip if not active
            if request.get('status') != 'active':
                continue
            
            # Extract request info
            req_cat = request.get('category', '').lower()
            req_subcat = request.get('subcategory', '').lower()
            req_qty = request.get('quantity', 0)
            req_urgency = request.get('urgency', 'medium').lower()
            req_acceptable = [c.lower() for c in request.get('condition', {}).get('acceptable', [])]
            req_coords = request.get('location', {}).get('coordinates', {}).get('coordinates', [0, 0])
            req_needed_by = request.get('timeline', {}).get('neededBy')
            
            # Calculate component scores
            category_score = self._calculate_category_score(don_cat, req_cat, don_subcat, req_subcat)
            location_score = self._calculate_location_score(don_coords, req_coords)
            quantity_score = self._calculate_quantity_score(don_qty, req_qty)
            urgency_bonus = self._calculate_urgency_bonus(req_urgency, req_needed_by)
            condition_ok = self._check_condition(don_condition, req_acceptable)
            
            # Total score (0-100 scale)
            total_score = (
                category_score * 40 +  # 40% weight
                location_score * 30 +  # 30% weight
                quantity_score * 20 +  # 20% weight
                urgency_bonus * 10     # 10% weight
            )
            
            # Only include if condition is acceptable AND score >= 30
            if condition_ok and total_score >= 30:
                # Build reasons
                reasons = []
                if category_score >= 0.9:
                    reasons.append("Exact category match")
                elif category_score >= 0.6:
                    reasons.append("Similar category")
                
                if location_score >= 0.8:
                    reasons.append("Very close location")
                elif location_score >= 0.5:
                    reasons.append("Nearby location")
                
                if quantity_score >= 0.8:
                    reasons.append("Can fulfill request completely")
                elif quantity_score >= 0.5:
                    reasons.append("Can partially fulfill")
                
                if urgency_bonus >= 0.7:
                    reasons.append("High urgency")
                
                if condition_ok:
                    reasons.append("Condition acceptable")
                
                # Calculate actual distance
                try:
                    donor_point = (don_coords[1], don_coords[0])
                    request_point = (req_coords[1], req_coords[0])
                    distance_km = geodesic(donor_point, request_point).kilometers
                except:
                    distance_km = 0
                
                # Get requester info
                requester = request.get('requester', {})
                
                matches.append({
                    'request_id': str(request.get('_id', '')),
                    'request_title': request.get('title', 'Untitled Request'),
                    'ngo_name': requester.get('name', 'Unknown NGO'),
                    'ngo_id': str(requester.get('_id', '')),
                    'score': round(total_score, 1),
                    'distance_km': round(distance_km, 2),
                    'reasons': reasons,
                    'category': request.get('category', ''),
                    'quantity_needed': req_qty,
                    'urgency': request.get('urgency', 'medium'),
                    'needed_by': req_needed_by,
                    'location': {
                        'city': request.get('location', {}).get('city', ''),
                        'state': request.get('location', {}).get('state', '')
                    }
                })
        
        # Sort by score descending
        matches.sort(key=lambda x: x['score'], reverse=True)
        
        return matches[:max_matches]
    
    def _calculate_category_score(self, don_cat, req_cat, don_subcat, req_subcat):
        """Calculate category match score (0-1)"""
        score = 0.0
        
        # Exact category match
        if don_cat == req_cat:
            score += 0.7
        # Similar categories
        elif self._is_similar_category(don_cat, req_cat):
            score += 0.4
        
        # Subcategory match
        if don_subcat and req_subcat:
            if don_subcat == req_subcat:
                score += 0.3
            elif don_subcat in req_subcat or req_subcat in don_subcat:
                score += 0.15
        
        return min(score, 1.0)
    
    def _is_similar_category(self, cat1, cat2):
        """Check if categories are similar"""
        similar_groups = [
            {'outerwear', 'seasonal'},
            {'formal', 'professional'},
            {'casual', 'everyday'},
            {'children', 'kids'},
            {'household', 'linens'}
        ]
        
        for group in similar_groups:
            if cat1 in group and cat2 in group:
                return True
        return False
    
    def _calculate_location_score(self, don_coords, req_coords):
        """Calculate location proximity score (0-1)"""
        try:
            if not don_coords or not req_coords:
                return 0.5
            
            donor_point = (don_coords[1], don_coords[0])
            request_point = (req_coords[1], req_coords[0])
            distance = geodesic(donor_point, request_point).kilometers
            
            if distance <= 5:
                return 1.0
            elif distance <= 10:
                return 0.9
            elif distance <= 20:
                return 0.7
            elif distance <= 50:
                return 0.5
            else:
                return max(0.0, 0.5 - ((distance - 50) / 100))
        except:
            return 0.5
    
    def _calculate_quantity_score(self, don_qty, req_qty):
        """Calculate quantity match score (0-1)"""
        if don_qty >= req_qty:
            return 1.0
        else:
            ratio = don_qty / req_qty if req_qty > 0 else 0
            if ratio >= 0.5:
                return 0.8
            elif ratio >= 0.25:
                return 0.6
            else:
                return 0.3
    
    def _calculate_urgency_bonus(self, urgency, needed_by):
        """Calculate urgency bonus (0-1)"""
        urgency_map = {
            'critical': 1.0,
            'high': 0.8,
            'medium': 0.5,
            'low': 0.3
        }
        
        score = urgency_map.get(urgency, 0.5)
        
        # Add time pressure
        try:
            if needed_by:
                needed_date = datetime.fromisoformat(str(needed_by).replace('Z', '+00:00'))
                days_until = (needed_date - datetime.now()).days
                
                if days_until <= 7:
                    score = min(score + 0.2, 1.0)
                elif days_until <= 14:
                    score = min(score + 0.1, 1.0)
        except:
            pass
        
        return score
    
    def _check_condition(self, don_condition, acceptable_conditions):
        """Check if donation condition is acceptable"""
        if not acceptable_conditions:
            return True  # Accept any if not specified
        
        condition_rank = {
            'excellent': 4,
            'good': 3,
            'fair': 2,
            'poor': 1
        }
        
        don_rank = condition_rank.get(don_condition, 0)
        acceptable_ranks = [condition_rank.get(c, 0) for c in acceptable_conditions]
        
        return don_rank >= min(acceptable_ranks) if acceptable_ranks else True

    def get_recommendations_summary(self, matches):
        """Get summary text for matches"""
        if not matches:
            return {"text": "No matches found."}
        
        top = matches[0]
        
        return {
            "total_matches": len(matches),
            "top_match": top.get('ngo_name', top.get('request_title', 'Unknown')),
            "text": f"Found {len(matches)} matches. Top match: {top.get('ngo_name', top.get('request_title', 'Unknown'))} ({top.get('distance_km', 0)}km away)."
        }
