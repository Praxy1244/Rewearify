import pytest
from httpx import AsyncClient, ASGITransport
import sys
import os

# Add parent directory to path to import main
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app

@pytest.mark.asyncio
async def test_root_endpoint():
    """Test the root health check endpoint"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "AI Service is running"
        assert "version" in data
        print("✅ Root endpoint test passed!")

@pytest.mark.asyncio
async def test_health_endpoint():
    """Test the detailed health check endpoint"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "services" in data
        print("✅ Health endpoint test passed!")

@pytest.mark.asyncio
async def test_service_availability():
    """Test that key services are loaded"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        data = response.json()
        services = data["services"]
        
        # Check if services are at least initialized
        assert "matcher" in services
        assert "fraud_detector" in services
        assert "forecaster" in services
        print("✅ Services availability test passed!")
