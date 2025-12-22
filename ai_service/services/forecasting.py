import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import warnings
warnings.filterwarnings('ignore')

class DemandForecaster:
    """Time-series forecasting with mock data fallback"""
    
    def __init__(self):
        self.models = {}
        self.is_trained = False
    
    def _generate_mock_forecast(self, clothing_type, city, periods):
        """Generate mock forecast when real data isn't available"""
        print(f"📊 Generating mock forecast for {clothing_type} in {city}")
        
        # Base demand varies by clothing type
        base_demands = {
            'winter_wear': 55,
            'summer_wear': 45,
            'ethnic_wear': 40,
            'kids_wear': 50,
            'formal_wear': 35,
            'activewear': 42,
            'traditional': 38,
            'casual': 48,
            'seasonal': 52
        }
        
        base_demand = base_demands.get(clothing_type, 45)
        
        # Generate forecasted demands with realistic variation
        forecasted_demands = []
        current_date = datetime.now()
        
        for day in range(periods):
            # Add day-of-week effect (weekends have more donations)
            day_of_week = (current_date + timedelta(days=day)).weekday()
            weekend_boost = 1.3 if day_of_week in [5, 6] else 1.0
            
            # Add random variation
            variation = random.uniform(0.7, 1.4)
            
            # Add seasonal trend
            seasonal_factor = 1 + (0.2 * np.sin(day / 7))
            
            demand = int(base_demand * variation * weekend_boost * seasonal_factor)
            demand = max(demand, 10)  # Minimum 10
            
            forecasted_demands.append({
                'date': (current_date + timedelta(days=day)).strftime('%Y-%m-%d'),
                'predicted_demand': demand,
                'confidence_interval': {
                    'lower': int(demand * 0.75),
                    'upper': int(demand * 1.25)
                }
            })
        
        return forecasted_demands
    
    def forecast(self, clothing_type='winter_wear', city='Bangalore', periods=30):
        """Generate forecast - returns mock data for now"""
        print(f"📈 Forecast request: {clothing_type} in {city}")
        
        forecasted_demands = self._generate_mock_forecast(clothing_type, city, periods)
        
        return {
            'clothing_type': clothing_type,
            'city': city,
            'periods': periods,
            'forecasted_demands': forecasted_demands,
            'total_predicted': sum(d['predicted_demand'] for d in forecasted_demands),
            'model_info': {
                'algorithm': 'Exponential Smoothing (Mock Data)',
                'confidence_score': random.randint(82, 92),
                'training_samples': 500,  # Mock value
                'last_updated': datetime.now().isoformat()
            }
        }
    
    def get_seasonal_trends(self, clothing_type='winter_wear'):
        """Analyze seasonal trends - mock data"""
        print(f"📊 Seasonal trends request: {clothing_type}")
        
        # Generate seasonal patterns based on clothing type
        if 'winter' in clothing_type.lower():
            patterns = {
                'winter': 450,
                'autumn': 380,
                'monsoon': 200,
                'summer': 150
            }
            peak_season = 'winter'
            low_season = 'summer'
        elif 'summer' in clothing_type.lower():
            patterns = {
                'summer': 420,
                'monsoon': 320,
                'autumn': 280,
                'winter': 180
            }
            peak_season = 'summer'
            low_season = 'winter'
        else:
            patterns = {
                'winter': 320,
                'summer': 340,
                'monsoon': 310,
                'autumn': 330
            }
            peak_season = 'summer'
            low_season = 'monsoon'
        
        return {
            'clothing_type': clothing_type,
            'seasonal_patterns': patterns,
            'peak_season': peak_season,
            'low_season': low_season,
            'total_demand': sum(patterns.values()),
            'confidence': random.randint(85, 95)
        }
    
    def analyze_supply_gap(self, clothing_type, city, current_supply, periods=30):
        """Analyze supply-demand gap"""
        print(f"⚖️ Supply gap analysis: {clothing_type} in {city}")
        
        # Get forecast
        forecast_data = self.forecast(clothing_type, city, periods)
        
        total_demand = forecast_data['total_predicted']
        gap = total_demand - current_supply
        gap_percentage = (gap / total_demand * 100) if total_demand > 0 else 0
        
        return {
            'clothing_type': clothing_type,
            'city': city,
            'current_supply': current_supply,
            'forecasted_demands': forecast_data['forecasted_demands'],
            'total_forecasted_demand': total_demand,
            'gap': gap,
            'gap_status': 'shortage' if gap > 0 else 'surplus',
            'gap_percentage': round(gap_percentage, 2),
            'urgency': 'high' if abs(gap_percentage) > 30 else ('medium' if abs(gap_percentage) > 15 else 'low'),
            'recommendation': self._get_recommendation(gap, gap_percentage)
        }
    
    def _get_recommendation(self, gap, gap_percentage):
        """Generate recommendation based on gap"""
        if gap > 0:
            if gap_percentage > 30:
                return f"Critical: Need {abs(gap)} more items urgently"
            elif gap_percentage > 15:
                return f"Moderate: Need {abs(gap)} more items"
            else:
                return "Minor shortage - increase donor outreach"
        else:
            if abs(gap_percentage) > 30:
                return f"Large surplus of {abs(gap)} items available"
            else:
                return "Supply meets demand well"
    
    def get_forecast_categories(self):
        """Get available categories and cities"""
        return {
            'categories': [
                'winter_wear',
                'summer_wear',
                'ethnic_wear',
                'kids_wear',
                'formal_wear',
                'activewear',
                'traditional',
                'casual',
                'seasonal'
            ],
            'cities': [
                'Bangalore',
                'Mumbai',
                'Delhi',
                'Chennai',
                'Kolkata',
                'Hyderabad',
                'Pune',
                'Mysuru',
                'Ahmedabad',
                'Jaipur'
            ]
        }


# Global instance
forecaster = DemandForecaster()


def train_forecasting_models():
    """Initialize forecaster"""
    print("✅ Forecasting service initialized with mock data")
    return forecaster
