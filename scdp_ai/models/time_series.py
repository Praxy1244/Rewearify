"""
Time series forecasting model for SCDP
Predicts seasonal demand/supply trends using Prophet
"""

import pandas as pd
import numpy as np
from prophet import Prophet
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

class TimeSeriesForecaster:
    def __init__(self, seasonality_mode='multiplicative'):
        """
        Initialize time series forecaster
        
        Args:
            seasonality_mode: 'additive' or 'multiplicative'
        """
        self.seasonality_mode = seasonality_mode
        self.models = {}  # Store multiple models for different series
        self.series_info = {}  # Store metadata about each series
    
    def prepare_prophet_data(self, timeseries_df, date_col, value_col, series_id_cols=None):
        """
        Prepare data for Prophet model
        
        Args:
            timeseries_df: DataFrame with time series data
            date_col: Name of date column
            value_col: Name of value column to forecast
            series_id_cols: List of columns that identify different series
        """
        prepared_data = {}
        
        if series_id_cols is None:
            # Single time series
            df = timeseries_df[[date_col, value_col]].copy()
            df.columns = ['ds', 'y']
            df['ds'] = pd.to_datetime(df['ds'])
            df = df.sort_values('ds').reset_index(drop=True)
            prepared_data['global'] = df
        else:
            # Multiple time series
            for series_values in timeseries_df[series_id_cols].drop_duplicates().values:
                # Create filter condition
                filter_condition = True
                series_name_parts = []
                for i, col in enumerate(series_id_cols):
                    filter_condition &= (timeseries_df[col] == series_values[i])
                    series_name_parts.append(str(series_values[i]))
                
                series_name = '_'.join(series_name_parts)
                
                # Extract series data
                series_data = timeseries_df[filter_condition][[date_col, value_col]].copy()
                series_data.columns = ['ds', 'y']
                series_data['ds'] = pd.to_datetime(series_data['ds'])
                series_data = series_data.sort_values('ds').reset_index(drop=True)
                
                if len(series_data) >= 10:  # Minimum data points for forecasting
                    prepared_data[series_name] = series_data
        
        return prepared_data
    
    def fit_city_type_models(self, city_type_monthly_df):
        """Fit Prophet models for city-type combinations"""
        # Prepare data for each city-type combination
        prepared_data = self.prepare_prophet_data(
            city_type_monthly_df, 
            'YearMonth', 
            'Total_Quantity',
            ['City', 'Type']
        )
        
        for series_name, series_data in prepared_data.items():
            try:
                # Create and fit Prophet model
                model = Prophet(
                    seasonality_mode=self.seasonality_mode,
                    yearly_seasonality=True,
                    weekly_seasonality=False,
                    daily_seasonality=False,
                    changepoint_prior_scale=0.05
                )
                
                # Add monthly seasonality
                model.add_seasonality(name='monthly', period=30.5, fourier_order=5)
                
                model.fit(series_data)
                
                self.models[f'city_type_{series_name}'] = model
                self.series_info[f'city_type_{series_name}'] = {
                    'type': 'city_type',
                    'series_name': series_name,
                    'data_points': len(series_data),
                    'date_range': (series_data['ds'].min(), series_data['ds'].max())
                }
                
            except Exception as e:
                print(f"Failed to fit model for {series_name}: {str(e)}")
        
        return self
    
    def fit_ngo_cluster_models(self, ngo_monthly_df):
        """Fit Prophet models for NGO clusters (by city)"""
        prepared_data = self.prepare_prophet_data(
            ngo_monthly_df,
            'YearMonth',
            'Total_Quantity',
            ['City']
        )
        
        for series_name, series_data in prepared_data.items():
            try:
                # Create and fit Prophet model
                model = Prophet(
                    seasonality_mode=self.seasonality_mode,
                    yearly_seasonality=True,
                    weekly_seasonality=False,
                    daily_seasonality=False,
                    changepoint_prior_scale=0.05
                )
                
                # Add monthly seasonality
                model.add_seasonality(name='monthly', period=30.5, fourier_order=5)
                
                model.fit(series_data)
                
                self.models[f'ngo_cluster_{series_name}'] = model
                self.series_info[f'ngo_cluster_{series_name}'] = {
                    'type': 'ngo_cluster',
                    'series_name': series_name,
                    'data_points': len(series_data),
                    'date_range': (series_data['ds'].min(), series_data['ds'].max())
                }
                
            except Exception as e:
                print(f"Failed to fit NGO cluster model for {series_name}: {str(e)}")
        
        return self
    
    def forecast(self, model_key, periods=12, freq='M'):
        """
        Generate forecast for a specific model
        
        Args:
            model_key: Key identifying the model
            periods: Number of periods to forecast
            freq: Frequency ('M' for monthly, 'D' for daily)
        """
        if model_key not in self.models:
            raise ValueError(f"Model {model_key} not found")
        
        model = self.models[model_key]
        
        # Create future dataframe
        future = model.make_future_dataframe(periods=periods, freq=freq)
        
        # Generate forecast
        forecast = model.predict(future)
        
        # Extract relevant columns
        forecast_result = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
        forecast_result.columns = ['date', 'forecast', 'forecast_lower', 'forecast_upper']
        
        # Add metadata
        forecast_result['model_key'] = model_key
        forecast_result['series_info'] = str(self.series_info[model_key])
        
        return forecast_result
    
    def forecast_all_models(self, periods=12, freq='M'):
        """Generate forecasts for all fitted models"""
        all_forecasts = {}
        
        for model_key in self.models.keys():
            try:
                forecast = self.forecast(model_key, periods, freq)
                all_forecasts[model_key] = forecast
            except Exception as e:
                print(f"Failed to generate forecast for {model_key}: {str(e)}")
        
        return all_forecasts
    
    def get_seasonal_patterns(self, model_key):
        """Extract seasonal patterns from a fitted model"""
        if model_key not in self.models:
            raise ValueError(f"Model {model_key} not found")
        
        model = self.models[model_key]
        
        # Create a year of future dates to extract seasonality
        future = pd.DataFrame({
            'ds': pd.date_range(start='2024-01-01', end='2024-12-31', freq='D')
        })
        
        # Get components
        forecast = model.predict(future)
        
        # Extract seasonal components
        seasonal_components = {}
        
        if 'yearly' in forecast.columns:
            seasonal_components['yearly'] = {
                'dates': forecast['ds'].tolist(),
                'values': forecast['yearly'].tolist()
            }
        
        if 'monthly' in forecast.columns:
            seasonal_components['monthly'] = {
                'dates': forecast['ds'].tolist(),
                'values': forecast['monthly'].tolist()
            }
        
        return seasonal_components
    
    def predict_demand_spike(self, model_key, threshold_percentile=90):
        """Predict when demand spikes might occur"""
        if model_key not in self.models:
            raise ValueError(f"Model {model_key} not found")
        
        # Generate 6-month forecast
        forecast = self.forecast(model_key, periods=6, freq='M')
        
        # Calculate threshold based on historical data
        threshold = np.percentile(forecast['forecast'], threshold_percentile)
        
        # Identify spike periods
        spikes = forecast[forecast['forecast'] > threshold].copy()
        
        spike_info = {
            'threshold': threshold,
            'spike_periods': spikes[['date', 'forecast']].to_dict('records'),
            'num_spikes': len(spikes),
            'model_key': model_key
        }
        
        return spike_info
    
    def evaluate_forecast_accuracy(self, model_key, test_data):
        """
        Evaluate forecast accuracy using test data
        
        Args:
            model_key: Model to evaluate
            test_data: DataFrame with columns ['ds', 'y'] for actual values
        """
        if model_key not in self.models:
            raise ValueError(f"Model {model_key} not found")
        
        model = self.models[model_key]
        
        # Generate forecast for test period
        forecast = model.predict(test_data[['ds']])
        
        # Calculate metrics
        actual = test_data['y'].values
        predicted = forecast['yhat'].values
        
        mae = np.mean(np.abs(actual - predicted))
        rmse = np.sqrt(np.mean((actual - predicted) ** 2))
        mape = np.mean(np.abs((actual - predicted) / actual)) * 100
        
        # Calculate coverage of prediction intervals
        lower_bound = forecast['yhat_lower'].values
        upper_bound = forecast['yhat_upper'].values
        coverage = np.mean((actual >= lower_bound) & (actual <= upper_bound)) * 100
        
        return {
            'mae': mae,
            'rmse': rmse,
            'mape': mape,
            'coverage_percentage': coverage,
            'num_predictions': len(actual)
        }
    
    def get_trend_analysis(self, model_key):
        """Analyze trends for a specific model"""
        if model_key not in self.models:
            raise ValueError(f"Model {model_key} not found")
        
        model = self.models[model_key]
        
        # Generate forecast to analyze trend
        future = model.make_future_dataframe(periods=12, freq='M')
        forecast = model.predict(future)
        
        # Calculate trend slope (simplified)
        trend_values = forecast['trend'].values
        time_points = np.arange(len(trend_values))
        
        # Linear regression to get slope
        slope = np.polyfit(time_points, trend_values, 1)[0]
        
        # Determine trend direction
        if slope > 0.1:
            trend_direction = 'Increasing'
        elif slope < -0.1:
            trend_direction = 'Decreasing'
        else:
            trend_direction = 'Stable'
        
        return {
            'trend_direction': trend_direction,
            'trend_slope': slope,
            'current_trend_value': trend_values[-1],
            'trend_change_percentage': ((trend_values[-1] - trend_values[0]) / trend_values[0]) * 100
        }
    
    def save_models(self, filepath):
        """Save all fitted models"""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        model_data = {
            'models': self.models,
            'series_info': self.series_info,
            'seasonality_mode': self.seasonality_mode
        }
        joblib.dump(model_data, filepath)
    
    def load_models(self, filepath):
        """Load fitted models"""
        model_data = joblib.load(filepath)
        self.models = model_data['models']
        self.series_info = model_data['series_info']
        self.seasonality_mode = model_data['seasonality_mode']
        return self
    
    def get_model_summary(self):
        """Get summary of all fitted models"""
        summary = {
            'total_models': len(self.models),
            'model_types': {},
            'models': []
        }
        
        for model_key, info in self.series_info.items():
            model_type = info['type']
            if model_type not in summary['model_types']:
                summary['model_types'][model_type] = 0
            summary['model_types'][model_type] += 1
            
            summary['models'].append({
                'model_key': model_key,
                'type': model_type,
                'series_name': info['series_name'],
                'data_points': info['data_points'],
                'date_range': info['date_range']
            })
        
        return summary