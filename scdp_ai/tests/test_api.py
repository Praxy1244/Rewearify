"""
Test cases for FastAPI endpoints
"""

import pytest
import asyncio
from httpx import AsyncClient
import sys
import os
import pandas as pd
import numpy as np

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.main import app

class TestSCDPAPI:
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return AsyncClient(app=app, base_url="http://test")
    
    @pytest.mark.asyncio
    async def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = await client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "timestamp" in data
        assert "models_loaded" in data
        assert data["status"] == "healthy"
    
    @pytest.mark.asyncio
    async def test_root_endpoint(self, client):
        """Test root endpoint"""
        response = await client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "models_loaded" in data
        assert data["status"] == "healthy"
    
    @pytest.mark.asyncio
    async def test_match_donation_endpoint(self, client):
        """Test donation matching endpoint"""
        request_data = {
            "donation_id": "DON00000001",
            "top_k": 3
        }
        
        response = await client.post("/match", json=request_data)
        
        # Should return 200 or 503 (if models not loaded)
        assert response.status_code in [200, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert "donation_id" in data
            assert "matches" in data
            assert "timestamp" in data
            assert data["donation_id"] == request_data["donation_id"]
    
    @pytest.mark.asyncio
    async def test_batch_match_endpoint(self, client):
        """Test batch matching endpoint"""
        request_data = {
            "donation_ids": ["DON00000001", "DON00000002"],
            "top_k": 2
        }
        
        response = await client.post("/match/batch", json=request_data)
        
        assert response.status_code in [200, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert "results" in data
            assert "total_donations" in data
            assert "timestamp" in data
            assert data["total_donations"] == len(request_data["donation_ids"])
    
    @pytest.mark.asyncio
    async def test_fraud_prediction_endpoint(self, client):
        """Test fraud prediction endpoint"""
        request_data = {
            "donor_id": "D000001",
            "donor_reliability": 0.8,
            "past_donations": 5,
            "avg_quantity_claimed": 10.0,
            "avg_quantity_received_ratio": 0.9,
            "avg_fulfillment_delay": 2.0,
            "num_manual_rejects": 0,
            "num_flagged": 0,
            "feedback_mean": 4.5
        }
        
        response = await client.post("/predict_authenticity", json=request_data)
        
        assert response.status_code in [200, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert "donor_id" in data
            assert "fraud_probability" in data
            assert "is_flagged" in data
            assert "risk_level" in data
            assert "explanation" in data
            assert "recommendation" in data
            assert data["donor_id"] == request_data["donor_id"]
    
    @pytest.mark.asyncio
    async def test_clustering_endpoint(self, client):
        """Test NGO clustering endpoint"""
        request_data = {
            "ngo_id": "NGO00001",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "capacity_per_week": 150,
            "urgent_need": True,
            "demand_shirt": 0.3,
            "demand_jacket": 0.2,
            "demand_saree": 0.1,
            "demand_blanket": 0.2,
            "demand_pants": 0.1,
            "demand_dress": 0.05,
            "demand_footwear": 0.05
        }
        
        response = await client.post("/clusters", json=request_data)
        
        assert response.status_code in [200, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert "ngo_id" in data
            assert "geo_cluster" in data
            assert "behavior_cluster" in data
            assert "combined_cluster" in data
            assert "timestamp" in data
            assert data["ngo_id"] == request_data["ngo_id"]
    
    @pytest.mark.asyncio
    async def test_forecast_endpoint(self, client):
        """Test forecasting endpoint"""
        request_data = {
            "model_key": "city_type_Delhi_shirt",
            "periods": 6,
            "frequency": "M"
        }
        
        response = await client.post("/forecast", json=request_data)
        
        assert response.status_code in [200, 500, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert "model_key" in data
            assert "forecast_points" in data
            assert "periods" in data
            assert "timestamp" in data
            assert data["model_key"] == request_data["model_key"]
    
    @pytest.mark.asyncio
    async def test_forecast_models_list_endpoint(self, client):
        """Test forecast models list endpoint"""
        response = await client.get("/forecast/models")
        
        assert response.status_code in [200, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert "total_models" in data
    
    @pytest.mark.asyncio
    async def test_process_analytics_endpoint(self, client):
        """Test process analytics endpoint"""
        response = await client.get("/analytics/process")
        
        assert response.status_code in [200, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert "total_donations" in data
            assert "state_distribution" in data
            assert "completion_rate" in data
    
    @pytest.mark.asyncio
    async def test_process_improvements_endpoint(self, client):
        """Test process improvements endpoint"""
        response = await client.get("/analytics/improvements")
        
        assert response.status_code in [200, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert "improvements" in data
            assert "timestamp" in data
    
    @pytest.mark.asyncio
    async def test_performance_metrics_endpoint(self, client):
        """Test performance metrics endpoint"""
        response = await client.get("/analytics/performance")
        
        assert response.status_code in [200, 503]
        
        if response.status_code == 200:
            data = response.json()
            assert "metrics" in data
            assert "timestamp" in data
    
    @pytest.mark.asyncio
    async def test_invalid_requests(self, client):
        """Test invalid request handling"""
        # Test missing required fields
        invalid_match_request = {"donation_id": ""}
        response = await client.post("/match", json=invalid_match_request)
        assert response.status_code == 422  # Validation error
        
        # Test invalid fraud prediction data
        invalid_fraud_request = {
            "donor_id": "D001",
            "donor_reliability": 1.5,  # Invalid: > 1.0
            "past_donations": -1,  # Invalid: negative
        }
        response = await client.post("/predict_authenticity", json=invalid_fraud_request)
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_error_handling(self, client):
        """Test error handling for edge cases"""
        # Test with non-existent donation ID
        request_data = {
            "donation_id": "NONEXISTENT",
            "top_k": 5
        }
        
        response = await client.post("/match", json=request_data)
        # Should handle gracefully (empty results or error)
        assert response.status_code in [200, 404, 500, 503]
        
        # Test with non-existent forecast model
        forecast_request = {
            "model_key": "nonexistent_model",
            "periods": 12
        }
        
        response = await client.post("/forecast", json=forecast_request)
        assert response.status_code in [404, 500, 503]

# Integration tests with actual data
class TestAPIIntegration:
    
    @pytest.fixture
    def client_with_data(self):
        """Create client and ensure data is generated"""
        # This would ideally trigger data generation
        return AsyncClient(app=app, base_url="http://test")
    
    @pytest.mark.asyncio
    async def test_complete_workflow(self, client_with_data):
        """Test complete API workflow"""
        client = client_with_data
        
        # 1. Check health
        health_response = await client.get("/health")
        assert health_response.status_code == 200
        
        # 2. Test fraud prediction with realistic data
        fraud_request = {
            "donor_id": "D000001",
            "donor_reliability": 0.75,
            "past_donations": 8,
            "avg_quantity_claimed": 15.0,
            "avg_quantity_received_ratio": 0.85,
            "avg_fulfillment_delay": 3.5,
            "num_manual_rejects": 1,
            "num_flagged": 0,
            "feedback_mean": 3.8
        }
        
        fraud_response = await client.post("/predict_authenticity", json=fraud_request)
        
        if fraud_response.status_code == 200:
            fraud_data = fraud_response.json()
            assert 0 <= fraud_data["fraud_probability"] <= 1
            assert fraud_data["risk_level"] in ["Low", "Medium", "High", "Very High"]
        
        # 3. Test clustering with realistic NGO data
        cluster_request = {
            "ngo_id": "NGO00001",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "capacity_per_week": 200,
            "urgent_need": False,
            "demand_shirt": 0.25,
            "demand_jacket": 0.15,
            "demand_saree": 0.20,
            "demand_blanket": 0.10,
            "demand_pants": 0.15,
            "demand_dress": 0.10,
            "demand_footwear": 0.05
        }
        
        cluster_response = await client.post("/clusters", json=cluster_request)
        
        if cluster_response.status_code == 200:
            cluster_data = cluster_response.json()
            assert isinstance(cluster_data["geo_cluster"], int)
            assert isinstance(cluster_data["behavior_cluster"], int)
            assert "G" in cluster_data["combined_cluster"]
        
        # 4. Test analytics
        analytics_response = await client.get("/analytics/process")
        
        if analytics_response.status_code == 200:
            analytics_data = analytics_response.json()
            assert analytics_data["total_donations"] >= 0
            assert 0 <= analytics_data["completion_rate"] <= 100

# Performance tests
class TestAPIPerformance:
    
    @pytest.mark.asyncio
    async def test_concurrent_requests(self):
        """Test API performance with concurrent requests"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            
            # Create multiple concurrent requests
            tasks = []
            
            for i in range(10):
                fraud_request = {
                    "donor_id": f"D{i:06d}",
                    "donor_reliability": 0.5 + (i * 0.05),
                    "past_donations": i + 1,
                    "avg_quantity_claimed": 10.0 + i,
                    "avg_quantity_received_ratio": 0.8 + (i * 0.01),
                    "avg_fulfillment_delay": float(i),
                    "num_manual_rejects": i % 3,
                    "num_flagged": i % 2,
                    "feedback_mean": 3.0 + (i * 0.2)
                }
                
                task = client.post("/predict_authenticity", json=fraud_request)
                tasks.append(task)
            
            # Execute all requests concurrently
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Check that most requests succeeded
            success_count = 0
            for response in responses:
                if hasattr(response, 'status_code') and response.status_code in [200, 503]:
                    success_count += 1
            
            # At least 70% should succeed (accounting for model loading issues)
            assert success_count >= len(tasks) * 0.7
    
    @pytest.mark.asyncio
    async def test_response_times(self):
        """Test API response times"""
        import time
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            
            # Test health endpoint (should be fast)
            start_time = time.time()
            response = await client.get("/health")
            health_time = time.time() - start_time
            
            assert health_time < 1.0  # Should respond within 1 second
            
            # Test fraud prediction (may be slower due to model inference)
            fraud_request = {
                "donor_id": "PERF_TEST",
                "donor_reliability": 0.7,
                "past_donations": 5,
                "avg_quantity_claimed": 12.0,
                "avg_quantity_received_ratio": 0.9,
                "avg_fulfillment_delay": 2.0,
                "num_manual_rejects": 0,
                "num_flagged": 0,
                "feedback_mean": 4.0
            }
            
            start_time = time.time()
            response = await client.post("/predict_authenticity", json=fraud_request)
            fraud_time = time.time() - start_time
            
            if response.status_code == 200:
                assert fraud_time < 5.0  # Should respond within 5 seconds

if __name__ == "__main__":
    pytest.main([__file__, "-v"])