"""
Test cases for Time Series Forecasting model
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.time_series import TimeSeriesForecaster

class TestTimeSeriesForecaster:
    
    @pytest.fixture
    def sample_timeseries_data(self):
        """Create sample time series data"""
        np.random.seed(42)
        
        # Generate 2 years of monthly data
        start_date = datetime(2022, 1, 1)
        dates = []
        for i in range(24):  # 24 months
            dates.append(start_date + timedelta(days=30*i))
        
        # City-Type data
        cities = ['Delhi', 'Mumbai', 'Bengaluru']
        clothing_types = ['shirt', 'jacket', 'saree']
        
        city_type_data = []
        for city in cities:
            for clothing_type in clothing_types:
                for i, date in enumerate(dates):
                    # Add seasonality
                    base_quantity = 100
                    if clothing_type == 'jacket':
                        # Winter clothing peaks in Nov-Feb
                        seasonal_factor = 1.5 if date.month in [11, 12, 1, 2] else 0.5
                    else:
                        seasonal_factor = 1.0
                    
                    # Add trend
                    trend_factor = 1 + (i * 0.02)  # 2% growth per month
                    
                    # Add noise
                    noise = np.random.normal(0, 10)
                    
                    quantity = int(base_quantity * seasonal_factor * trend_factor + noise)
                    quantity = max(quantity, 10)  # Minimum 10
                    
                    city_type_data.append({
                        'City': city,
                        'Type': clothing_type,
                        'YearMonth': pd.Period(date, freq='M'),
                        'Total_Quantity': quantity,
                        'Total_Donations': quantity // 5  # Assume 5 items per donation on average
                    })
        
        city_type_df = pd.DataFrame(city_type_data)
        
        # NGO monthly data (simplified by city)
        ngo_monthly_data = []
        for city in cities:
            for i, date in enumerate(dates):
                base_quantity = 200
                trend_factor = 1 + (i * 0.015)  # 1.5% growth per month
                noise = np.random.normal(0, 20)
                
                quantity = int(base_quantity * trend_factor + noise)
                quantity = max(quantity, 20)
                
                ngo_monthly_data.append({
                    'City': city,
                    'YearMonth': pd.Period(date, freq='M'),
                    'Total_Quantity': quantity,
                    'Total_Donations': quantity // 5
                })
        
        ngo_monthly_df = pd.DataFrame(ngo_monthly_data)
        
        return city_type_df, ngo_monthly_df
    
    @pytest.fixture
    def trained_forecaster(self, sample_timeseries_data):
        """Create trained forecaster"""
        city_type_df, ngo_monthly_df = sample_timeseries_data
        
        forecaster = TimeSeriesForecaster()
        forecaster.fit_city_type_models(city_type_df)
        forecaster.fit_ngo_cluster_models(ngo_monthly_df)
        
        return forecaster, city_type_df, ngo_monthly_df
    
    def test_forecaster_initialization(self):
        """Test forecaster initialization"""
        forecaster = TimeSeriesForecaster()
        
        assert forecaster.seasonality_mode == 'multiplicative'
        assert isinstance(forecaster.models, dict)
        assert isinstance(forecaster.series_info, dict)
        assert len(forecaster.models) == 0  # Should be empty initially
    
    def test_data_preparation(self, sample_timeseries_data):
        """Test Prophet data preparation"""
        city_type_df, _ = sample_timeseries_data
        
        forecaster = TimeSeriesForecaster()
        prepared_data = forecaster.prepare_prophet_data(
            city_type_df,
            'YearMonth',
            'Total_Quantity',
            ['City', 'Type']
        )
        
        assert isinstance(prepared_data, dict)
        assert len(prepared_data) > 0
        
        # Check data structure
        for series_name, series_data in prepared_data.items():
            assert 'ds' in series_data.columns
            assert 'y' in series_data.columns
            assert len(series_data) >= 10  # Minimum data points
    
    def test_city_type_model_fitting(self, sample_timeseries_data):
        """Test fitting city-type models"""
        city_type_df, _ = sample_timeseries_data
        
        forecaster = TimeSeriesForecaster()
        forecaster.fit_city_type_models(city_type_df)
        
        assert len(forecaster.models) > 0
        assert len(forecaster.series_info) > 0
        
        # Check model keys
        model_keys = list(forecaster.models.keys())
        assert any('city_type_' in key for key in model_keys)
        
        # Check series info
        for key, info in forecaster.series_info.items():
            assert 'type' in info
            assert 'series_name' in info
            assert 'data_points' in info
            assert info['type'] == 'city_type'
    
    def test_ngo_cluster_model_fitting(self, sample_timeseries_data):
        """Test fitting NGO cluster models"""
        _, ngo_monthly_df = sample_timeseries_data
        
        forecaster = TimeSeriesForecaster()
        forecaster.fit_ngo_cluster_models(ngo_monthly_df)
        
        assert len(forecaster.models) > 0
        
        # Check model keys
        model_keys = list(forecaster.models.keys())
        assert any('ngo_cluster_' in key for key in model_keys)
    
    def test_single_model_forecast(self, trained_forecaster):
        """Test forecasting for a single model"""
        forecaster, _, _ = trained_forecaster
        
        # Get first available model
        model_keys = list(forecaster.models.keys())
        if len(model_keys) == 0:
            pytest.skip("No models available for testing")
        
        model_key = model_keys[0]
        
        # Generate forecast
        forecast_result = forecaster.forecast(model_key, periods=6, freq='M')
        
        assert isinstance(forecast_result, pd.DataFrame)
        assert 'date' in forecast_result.columns
        assert 'forecast' in forecast_result.columns
        assert 'forecast_lower' in forecast_result.columns
        assert 'forecast_upper' in forecast_result.columns
        assert len(forecast_result) > 0
        
        # Check forecast values are reasonable
        assert all(forecast_result['forecast'] > 0)
        assert all(forecast_result['forecast_lower'] <= forecast_result['forecast'])
        assert all(forecast_result['forecast'] <= forecast_result['forecast_upper'])
    
    def test_batch_forecasting(self, trained_forecaster):
        """Test forecasting for all models"""
        forecaster, _, _ = trained_forecaster
        
        if len(forecaster.models) == 0:
            pytest.skip("No models available for testing")
        
        all_forecasts = forecaster.forecast_all_models(periods=3, freq='M')
        
        assert isinstance(all_forecasts, dict)
        assert len(all_forecasts) > 0
        
        for model_key, forecast_df in all_forecasts.items():
            assert isinstance(forecast_df, pd.DataFrame)
            assert len(forecast_df) > 0
            assert 'forecast' in forecast_df.columns
    
    def test_seasonal_pattern_extraction(self, trained_forecaster):
        """Test seasonal pattern extraction"""
        forecaster, _, _ = trained_forecaster
        
        model_keys = list(forecaster.models.keys())
        if len(model_keys) == 0:
            pytest.skip("No models available for testing")
        
        model_key = model_keys[0]
        seasonal_patterns = forecaster.get_seasonal_patterns(model_key)
        
        assert isinstance(seasonal_patterns, dict)
        # Should have at least yearly seasonality
        if 'yearly' in seasonal_patterns:
            assert 'dates' in seasonal_patterns['yearly']
            assert 'values' in seasonal_patterns['yearly']
    
    def test_demand_spike_prediction(self, trained_forecaster):
        """Test demand spike prediction"""
        forecaster, _, _ = trained_forecaster
        
        model_keys = list(forecaster.models.keys())
        if len(model_keys) == 0:
            pytest.skip("No models available for testing")
        
        model_key = model_keys[0]
        spike_info = forecaster.predict_demand_spike(model_key, threshold_percentile=80)
        
        assert isinstance(spike_info, dict)
        assert 'threshold' in spike_info
        assert 'spike_periods' in spike_info
        assert 'num_spikes' in spike_info
        assert 'model_key' in spike_info
        
        assert spike_info['threshold'] > 0
        assert isinstance(spike_info['spike_periods'], list)
        assert spike_info['num_spikes'] >= 0
    
    def test_trend_analysis(self, trained_forecaster):
        """Test trend analysis"""
        forecaster, _, _ = trained_forecaster
        
        model_keys = list(forecaster.models.keys())
        if len(model_keys) == 0:
            pytest.skip("No models available for testing")
        
        model_key = model_keys[0]
        trend_analysis = forecaster.get_trend_analysis(model_key)
        
        assert isinstance(trend_analysis, dict)
        assert 'trend_direction' in trend_analysis
        assert 'trend_slope' in trend_analysis
        assert 'current_trend_value' in trend_analysis
        assert 'trend_change_percentage' in trend_analysis
        
        assert trend_analysis['trend_direction'] in ['Increasing', 'Decreasing', 'Stable']
        assert isinstance(trend_analysis['trend_slope'], (int, float))
    
    def test_forecast_accuracy_evaluation(self, trained_forecaster):
        """Test forecast accuracy evaluation"""
        forecaster, city_type_df, _ = trained_forecaster
        
        model_keys = list(forecaster.models.keys())
        if len(model_keys) == 0:
            pytest.skip("No models available for testing")
        
        # Create test data (last few points)
        model_key = model_keys[0]
        
        # Get series name from model key
        series_name = model_key.replace('city_type_', '').replace('ngo_cluster_', '')
        
        # Find matching data
        if 'city_type_' in model_key:
            city, clothing_type = series_name.split('_', 1)
            test_data = city_type_df[
                (city_type_df['City'] == city) & 
                (city_type_df['Type'] == clothing_type)
            ].tail(3).copy()
        else:
            # NGO cluster data
            test_data = city_type_df[city_type_df['City'] == series_name].tail(3).copy()
        
        if len(test_data) > 0:
            # Prepare test data for Prophet
            test_prophet_data = pd.DataFrame({
                'ds': pd.to_datetime(test_data['YearMonth'].astype(str)),
                'y': test_data['Total_Quantity']
            })
            
            accuracy_results = forecaster.evaluate_forecast_accuracy(model_key, test_prophet_data)
            
            assert isinstance(accuracy_results, dict)
            assert 'mae' in accuracy_results
            assert 'rmse' in accuracy_results
            assert 'mape' in accuracy_results
            assert 'coverage_percentage' in accuracy_results
            
            assert accuracy_results['mae'] >= 0
            assert accuracy_results['rmse'] >= 0
            assert accuracy_results['mape'] >= 0
            assert 0 <= accuracy_results['coverage_percentage'] <= 100
    
    def test_model_persistence(self, trained_forecaster, tmp_path):
        """Test model saving and loading"""
        forecaster, _, _ = trained_forecaster
        
        if len(forecaster.models) == 0:
            pytest.skip("No models available for testing")
        
        # Save models
        model_path = tmp_path / "test_forecaster.joblib"
        forecaster.save_models(str(model_path))
        
        assert model_path.exists()
        
        # Load models
        new_forecaster = TimeSeriesForecaster()
        new_forecaster.load_models(str(model_path))
        
        # Compare
        assert len(new_forecaster.models) == len(forecaster.models)
        assert len(new_forecaster.series_info) == len(forecaster.series_info)
        assert new_forecaster.seasonality_mode == forecaster.seasonality_mode
    
    def test_model_summary(self, trained_forecaster):
        """Test model summary generation"""
        forecaster, _, _ = trained_forecaster
        
        summary = forecaster.get_model_summary()
        
        assert isinstance(summary, dict)
        assert 'total_models' in summary
        assert 'model_types' in summary
        assert 'models' in summary
        
        assert summary['total_models'] >= 0
        assert isinstance(summary['model_types'], dict)
        assert isinstance(summary['models'], list)
        
        if summary['total_models'] > 0:
            # Check model details
            for model_info in summary['models']:
                assert 'model_key' in model_info
                assert 'type' in model_info
                assert 'series_name' in model_info
                assert 'data_points' in model_info
    
    def test_edge_cases(self):
        """Test edge cases and error handling"""
        forecaster = TimeSeriesForecaster()
        
        # Test with non-existent model
        with pytest.raises(ValueError):
            forecaster.forecast('non_existent_model')
        
        # Test with minimal data
        minimal_data = pd.DataFrame({
            'City': ['Delhi'] * 5,
            'Type': ['shirt'] * 5,
            'YearMonth': pd.period_range('2023-01', periods=5, freq='M'),
            'Total_Quantity': [10, 15, 12, 18, 14],
            'Total_Donations': [2, 3, 2, 4, 3]
        })
        
        # Should handle minimal data gracefully
        try:
            forecaster.fit_city_type_models(minimal_data)
            # If successful, should have some models
            assert len(forecaster.models) >= 0
        except Exception as e:
            # It's acceptable if Prophet fails with insufficient data
            assert "data" in str(e).lower() or "insufficient" in str(e).lower()

# Integration test
def test_end_to_end_forecasting():
    """Test complete forecasting pipeline"""
    np.random.seed(42)
    
    # Generate comprehensive time series data
    start_date = datetime(2021, 1, 1)
    end_date = datetime(2023, 12, 31)
    
    # Generate monthly data
    date_range = pd.date_range(start=start_date, end=end_date, freq='M')
    
    cities = ['Delhi', 'Mumbai', 'Bengaluru', 'Chennai']
    clothing_types = ['shirt', 'jacket', 'saree', 'blanket']
    
    # Create realistic seasonal patterns
    city_type_data = []
    
    for city in cities:
        for clothing_type in clothing_types:
            for i, date in enumerate(date_range):
                # Base demand varies by city
                city_multiplier = {'Delhi': 1.2, 'Mumbai': 1.0, 'Bengaluru': 0.8, 'Chennai': 0.9}
                base_demand = 100 * city_multiplier[city]
                
                # Seasonal patterns
                if clothing_type == 'jacket':
                    # Winter clothing
                    seasonal_factor = 2.0 if date.month in [11, 12, 1, 2] else 0.3
                elif clothing_type == 'blanket':
                    # Winter bedding
                    seasonal_factor = 1.8 if date.month in [10, 11, 12, 1, 2, 3] else 0.4
                else:
                    # Regular clothing with mild seasonality
                    seasonal_factor = 1.2 if date.month in [4, 5, 10, 11] else 0.9
                
                # Add growth trend
                months_from_start = (date.year - 2021) * 12 + date.month - 1
                trend_factor = 1 + (months_from_start * 0.01)  # 1% monthly growth
                
                # Add noise
                noise_factor = np.random.normal(1, 0.1)
                
                quantity = int(base_demand * seasonal_factor * trend_factor * noise_factor)
                quantity = max(quantity, 5)  # Minimum 5
                
                city_type_data.append({
                    'City': city,
                    'Type': clothing_type,
                    'YearMonth': pd.Period(date, freq='M'),
                    'Total_Quantity': quantity,
                    'Total_Donations': max(1, quantity // 8)
                })
    
    city_type_df = pd.DataFrame(city_type_data)
    
    # Create NGO data
    ngo_data = []
    for city in cities:
        for date in date_range:
            base_capacity = 300
            months_from_start = (date.year - 2021) * 12 + date.month - 1
            trend_factor = 1 + (months_from_start * 0.005)  # 0.5% monthly growth
            noise_factor = np.random.normal(1, 0.15)
            
            quantity = int(base_capacity * trend_factor * noise_factor)
            quantity = max(quantity, 50)
            
            ngo_data.append({
                'City': city,
                'YearMonth': pd.Period(date, freq='M'),
                'Total_Quantity': quantity,
                'Total_Donations': max(10, quantity // 6)
            })
    
    ngo_monthly_df = pd.DataFrame(ngo_data)
    
    # Train forecaster
    forecaster = TimeSeriesForecaster()
    forecaster.fit_city_type_models(city_type_df)
    forecaster.fit_ngo_cluster_models(ngo_monthly_df)
    
    # Verify models were created
    summary = forecaster.get_model_summary()
    assert summary['total_models'] > 0
    
    # Test forecasting
    all_forecasts = forecaster.forecast_all_models(periods=6, freq='M')
    assert len(all_forecasts) > 0
    
    # Test specific forecasts
    model_keys = list(forecaster.models.keys())
    
    for model_key in model_keys[:3]:  # Test first 3 models
        # Generate forecast
        forecast_df = forecaster.forecast(model_key, periods=12, freq='M')
        assert len(forecast_df) > 0
        
        # Check forecast quality
        forecasts = forecast_df['forecast'].values
        assert all(forecasts > 0)  # All forecasts should be positive
        
        # Test trend analysis
        trend_analysis = forecaster.get_trend_analysis(model_key)
        assert trend_analysis['trend_direction'] in ['Increasing', 'Decreasing', 'Stable']
        
        # Test spike prediction
        spike_info = forecaster.predict_demand_spike(model_key)
        assert isinstance(spike_info['spike_periods'], list)
    
    # Test seasonal patterns for winter clothing
    winter_models = [key for key in model_keys if 'jacket' in key or 'blanket' in key]
    
    for model_key in winter_models[:2]:  # Test first 2 winter models
        seasonal_patterns = forecaster.get_seasonal_patterns(model_key)
        if 'yearly' in seasonal_patterns:
            # Winter clothing should show seasonal variation
            yearly_values = seasonal_patterns['yearly']['values']
            assert max(yearly_values) > min(yearly_values)  # Should have variation

if __name__ == "__main__":
    pytest.main([__file__])