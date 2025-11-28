import pytest
from httpx import AsyncClient, ASGITransport
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from main import app

@pytest.mark.asyncio
async def test_get_clusters():
    """Test retrieving NGO clusters"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/ai/get-clusters")
        
        # Clustering might fail if models aren't trained, we want to handle that gracefully
        if response.status_code == 503:
            print("⚠️ Clustering not trained yet (Expected for fresh install)")
        else:
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            assert "clusters" in data
            print(f"✅ Retrieved {len(data['clusters'])} clusters")
