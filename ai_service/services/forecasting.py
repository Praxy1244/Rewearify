import pandas as pd
import numpy as np
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.seasonal import seasonal_decompose
import pickle
import os
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class DemandForecaster:
    """Time-series forecasting for donation demand/supply using statsmodels"""
    
    def __init__(self):
        self.models = {}
        self.is_trained = False
        self.load_data()
    
    def load_data(self):
        """Load donation data for forecasting"""
        data_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data"
        )
        
        print("📂 Loading data for forecasting...")
        self.donations_df = pd.read_csv(os.path.join(data_path, "donations.csv"))
        print(f"✅ Loaded {len(self.donations_df)} donations")
    
    def prepare_time_series(self, clothing_type=None, city=None):
        """Prepare time-series data for forecasting"""
        df = self.donations_df.copy()
        
        if clothing_type:
            df = df[df['Type'] == clothing_type]
        if city:
            df = df[df['Location_City'] == city]
        
        if len(df) < 10:
            return None
        
        df['date'] = pd.to_datetime(df['Timestamp_Submitted'])
        
        # Aggregate by day
        daily_counts = df.groupby(df['date'].dt.date).size().reset_index()
        daily_counts.columns = ['date', 'count']
        daily_counts['date'] = pd.to_datetime(daily_counts['date'])
        daily_counts = daily_counts.set_index('date')
        
        # Fill missing dates with 0
        date_range = pd.date_range(daily_counts.index.min(), daily_counts.index.max(), freq='D')
        daily_counts = daily_counts.reindex(date_range, fill_value=0)
        
        return daily_counts
    
    def train_model(self, clothing_type='Winter Wear', city='Mumbai'):
        """Train Exponential Smoothing model"""
        print(f"\n🤖 Training forecasting model for {clothing_type} in {city}...")
        
        ts_data = self.prepare_time_series(clothing_type, city)
        
        if ts_data is None or len(ts_data) < 30:
            print(f"⚠️ Not enough data ({len(ts_data) if ts_data is not None else 0} days). Need at least 30 days.")
            return None
        
        try:
            # Use Exponential Smoothing with trend and seasonality
            model = ExponentialSmoothing(
                ts_data['count'],
                seasonal_periods=7,  # Weekly seasonality
                trend='add',
                seasonal='add',
                initialization_method='estimated'
            )
            
            fitted_model = model.fit(optimized=True)
            
            model_key = f"{clothing_type}_{city}"
            self.models[model_key] = {
                'model': fitted_model,
                'training_data': ts_data,
                'trained_at': datetime.now()
            }
            
            print(f"✅ Model trained successfully ({len(ts_data)} data points)")
            return fitted_model
            
        except Exception as e:
            print(f"⚠️ Could not train model: {str(e)}")
            return None
    
    def forecast(self, clothing_type='Winter Wear', city='Mumbai', periods=30):
        """Generate forecast for next 'periods' days"""
        model_key = f"{clothing_type}_{city}"
        
        if model_key not in self.models:
            model = self.train_model(clothing_type, city)
            if model is None:
                return None
        
        model_info = self.models[model_key]
        fitted_model = model_info['model']
        
        # Forecast
        forecast_values = fitted_model.forecast(steps=periods)
        
        # Create result dataframe
        last_date = model_info['training_data'].index.max()
        future_dates = pd.date_range(last_date + timedelta(days=1), periods=periods, freq='D')
        
        # Ensure non-negative predictions
        forecast_values = np.maximum(forecast_values, 0)
        
        # Calculate confidence intervals (simple approach)
        std = model_info['training_data']['count'].std()
        lower_bound = np.maximum(forecast_values - 1.96 * std, 0)
        upper_bound = forecast_values + 1.96 * std
        
        result = pd.DataFrame({
            'date': future_dates,
            'predicted_demand': forecast_values.values,
            'lower_bound': lower_bound,
            'upper_bound': upper_bound
        })
        
        return result
    
    def get_seasonal_trends(self, clothing_type='Winter Wear'):
        """Analyze seasonal trends"""
        print(f"\n📊 Analyzing seasonal trends for {clothing_type}...")
        
        df = self.donations_df[self.donations_df['Type'] == clothing_type].copy()
        
        if len(df) == 0:
            return None
        
        df['date'] = pd.to_datetime(df['Timestamp_Submitted'])
        df['month'] = df['date'].dt.month
        df['month_name'] = df['date'].dt.strftime('%B')
        
        monthly_counts = df.groupby(['month', 'month_name']).size().reset_index(name='count')
        monthly_counts = monthly_counts.sort_values('month')
        
        peak_months = monthly_counts.nlargest(3, 'count')
        
        result = {
            'clothing_type': clothing_type,
            'monthly_counts': monthly_counts.set_index('month_name')['count'].to_dict(),
            'peak_months': peak_months.set_index('month_name')['count'].to_dict(),
            'average_monthly': float(monthly_counts['count'].mean()),
            'total_donations': len(df),
            'trend': 'increasing' if len(df) > 100 and df.tail(100)['month'].mean() > df.head(100)['month'].mean() else 'stable'
        }
        
        return result
    
    def detect_supply_gap(self, forecast_data, current_supply):
        """Detect supply-demand gaps"""
        if forecast_data is None or len(forecast_data) == 0:
            return None
        
        total_predicted_demand = forecast_data['predicted_demand'].sum()
        gap = current_supply - total_predicted_demand
        gap_percentage = (gap / total_predicted_demand * 100) if total_predicted_demand > 0 else 0
        
        return {
            'predicted_demand': int(total_predicted_demand),
            'current_supply': current_supply,
            'gap': int(gap),
            'gap_percentage': round(gap_percentage, 2),
            'status': 'surplus' if gap > 0 else 'shortage',
            'urgency': 'high' if abs(gap_percentage) > 30 else ('medium' if abs(gap_percentage) > 15 else 'low'),
            'recommendation': self._get_recommendation(gap, gap_percentage)
        }
    
    def _get_recommendation(self, gap, gap_percentage):
        """Generate recommendation based on gap analysis"""
        if gap > 0:
            if gap_percentage > 30:
                return "Significant surplus. Consider outreach campaigns or storing for future."
            elif gap_percentage > 15:
                return "Moderate surplus. Maintain current donation levels."
            else:
                return "Balanced supply. Good donation-demand alignment."
        else:
            if abs(gap_percentage) > 30:
                return "Critical shortage. Launch urgent donation drives immediately."
            elif abs(gap_percentage) > 15:
                return "Moderate shortage. Increase donor outreach efforts."
            else:
                return "Minor shortage. Monitor and encourage donations."
    
    def get_forecast_summary(self, clothing_type='Winter Wear', city='Mumbai', periods=30):
        """Get complete forecast summary"""
        forecast = self.forecast(clothing_type, city, periods)
        
        if forecast is None:
            return None
        
        avg_daily_demand = forecast['predicted_demand'].mean()
        peak_day = forecast.loc[forecast['predicted_demand'].idxmax()]
        low_day = forecast['predicted_demand'].idxmin()
        
        return {
            'clothing_type': clothing_type,
            'city': city,
            'forecast_period_days': periods,
            'total_predicted_demand': int(forecast['predicted_demand'].sum()),
            'avg_daily_demand': round(float(avg_daily_demand), 2),
            'peak_demand': {
                'date': str(peak_day['date'].date()),
                'quantity': int(peak_day['predicted_demand'])
            },
            'lowest_demand': {
                'date': str(forecast.loc[low_day, 'date'].date()),
                'quantity': int(forecast.loc[low_day, 'predicted_demand'])
            },
            'forecast_data': forecast.to_dict('records')
        }
    
    def save_models(self):
        """Save trained models"""
        models_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "models"
        )
        os.makedirs(models_path, exist_ok=True)
        
        print("\n💾 Saving forecasting models...")
        
        for model_key, model_info in self.models.items():
            file_path = os.path.join(models_path, f"forecast_{model_key}.pkl")
            with open(file_path, 'wb') as f:
                pickle.dump(model_info['model'], f)
            print(f"   ✅ Saved {model_key}")
        
        print(f"\n📁 Models saved in: {models_path}")


def train_forecasting_models():
    """Main function to train forecasting models"""
    print("=" * 60)
    print("TIME-SERIES FORECASTING MODEL TRAINING")
    print("=" * 60)
    
    forecaster = DemandForecaster()
    
    categories = ['Winter Wear', "Men's Wear", "Women's Wear", "Kids Wear"]
    cities = ['Mumbai', 'Delhi', 'Bengaluru']
    
    trained_count = 0
    for category in categories:
        for city in cities:
            model = forecaster.train_model(category, city)
            if model is not None:
                trained_count += 1
    
    forecaster.is_trained = True
    forecaster.save_models()
    
    # Test forecast
    print("\n" + "=" * 60)
    print("TESTING FORECAST")
    print("=" * 60)
    
    summary = forecaster.get_forecast_summary('Winter Wear', 'Mumbai', periods=30)
    
    if summary:
        print(f"\n📈 30-Day Forecast for Winter Wear in Mumbai:")
        print(f"   Total Predicted Demand: {summary['total_predicted_demand']} items")
        print(f"   Avg Daily Demand: {summary['avg_daily_demand']} items/day")
        print(f"   Peak Day: {summary['peak_demand']['date']} ({summary['peak_demand']['quantity']} items)")
        
        gap_analysis = forecaster.detect_supply_gap(
            pd.DataFrame(summary['forecast_data']),
            current_supply=500
        )
        
        if gap_analysis:
            print(f"\n📊 Supply-Demand Gap Analysis:")
            print(f"   Status: {gap_analysis['status'].upper()}")
            print(f"   Gap: {gap_analysis['gap']} items ({gap_analysis['gap_percentage']}%)")
            print(f"   Urgency: {gap_analysis['urgency'].upper()}")
            print(f"   Recommendation: {gap_analysis['recommendation']}")
        
        trends = forecaster.get_seasonal_trends('Winter Wear')
        if trends:
            print(f"\n📊 Seasonal Trends:")
            print(f"   Total Donations: {trends['total_donations']}")
            print(f"   Average Monthly: {trends['average_monthly']:.1f}")
            print(f"   Peak Months: {list(trends['peak_months'].keys())}")
    
    print("\n" + "=" * 60)
    print(f"✅ FORECASTING COMPLETE! ({trained_count} models trained)")
    print("=" * 60)
    
    return forecaster


if __name__ == "__main__":
    try:
        forecaster = train_forecasting_models()
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
