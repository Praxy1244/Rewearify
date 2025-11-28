import pytest
from httpx import AsyncClient, ASGITransport
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from main import app

@pytest.mark.asyncio
async def test_match_donations_endpoint():
    """Test donation matching with valid data"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        donation_data = {
            "donation_id": "TEST001",
            "type": "Winter Wear",
            "season": "Winter",
            "quantity": 20,
            "latitude": 19.0760,
            "longitude": 72.8777,
            "description": "Warm jackets for winter",
            "max_distance": 50
        }
        
        response = await client.post("/api/ai/match-donations", json=donation_data)
        
        # Print error details if failed
        if response.status_code != 200:
            print(f"\n❌ Status: {response.status_code}")
            print(f"Error: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "matches" in data
        print(f"✅ Found {data['total_matches']} NGO matches!")

@pytest.mark.asyncio
async def test_match_donations_no_matches():
    """Test donation matching with impossible criteria"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        donation_data = {
            "type": "Rare Item",
            "season": "All Season",
            "quantity": 1,
            "latitude": 0.0,
            "longitude": 0.0,
            "max_distance": 1
        }
        
        response = await client.post("/api/ai/match-donations", json=donation_data)
        
        # Print error details if failed
        if response.status_code != 200:
            print(f"\n❌ Status: {response.status_code}")
            print(f"Error: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("✅ Handled no-match scenario correctly!")
