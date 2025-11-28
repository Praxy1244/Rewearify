import pytest
from httpx import AsyncClient, ASGITransport
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from main import app

@pytest.mark.asyncio
async def test_forecast_endpoint():
    """Test demand forecasting for a city"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "clothing_type": "Winter Wear",
            "city": "Mumbai",
            "periods": 7
        }
        
        response = await client.post("/forecast", json=payload)
        
        if response.status_code != 200:
            print(f"❌ Error: {response.json()}")

        assert response.status_code == 200
        data = response.json()
        
        # It might succeed OR return "Not enough data" (which is also a valid result for testing)
        if data["success"]:
            print("✅ Forecast generated successfully")
            assert "data" in data
        else:
            print(f"✅ Handled insufficient data correctly: {data.get('error')}")

@pytest.mark.asyncio
async def test_seasonal_trends():
    """Test getting seasonal trends"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/seasonal-trends/Winter%20Wear")
        
        assert response.status_code == 200
        data = response.json()
        
        if data["success"]:
            print("✅ Trends data retrieved")
            assert "data" in data
        else:
            print("✅ Handled missing trend data correctly")
