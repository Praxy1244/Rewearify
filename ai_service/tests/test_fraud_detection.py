import pytest
from httpx import AsyncClient, ASGITransport
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from main import app

@pytest.mark.asyncio
async def test_fraud_check_clean_donation():
    """Test a clean donation (should be low risk)"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "donor_id": "DONOR123",
            "donation_data": {
                "quantity": 5,
                "condition": "New",
                "proof_provided": True
            },
            "donor_data": {
                "reliability_score": 0.95,
                "past_donations": 10,
                "flagged": False,
                "last_feedback": 5,
                "fulfillment_rate": 1.0,
                "avg_quantity_claimed": 5,
                "avg_quantity_received_ratio": 1.0,
                "avg_fulfillment_delay": 2,
                "num_manual_rejects": 0
            },
            "model_name": "random_forest"
        }
        
        response = await client.post("/api/ai/check-fraud", json=payload)
        
        # Debug info
        if response.status_code != 200:
            print(f"\n❌ Error: {response.json()}")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["risk_level"] == "low"
        assert data["is_suspicious"] == False
        print(f"✅ Clean donation test passed! Risk Level: {data['risk_level']}")

@pytest.mark.asyncio
async def test_fraud_check_suspicious_donation():
    """Test a suspicious donation (should be high/medium risk)"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "donor_id": "BAD_ACTOR_99",
            "donation_data": {
                "quantity": 500,  # Suspiciously high
                "condition": "Poor",
                "proof_provided": False
            },
            "donor_data": {
                "reliability_score": 0.1,
                "past_donations": 0,
                "flagged": True,
                "last_feedback": 1,
                "fulfillment_rate": 0.2,
                "avg_quantity_claimed": 50,
                "avg_quantity_received_ratio": 0.1,
                "avg_fulfillment_delay": 30,
                "num_manual_rejects": 5
            },
            "model_name": "random_forest"
        }
        
        response = await client.post("/api/ai/check-fraud", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Either medium or high risk is acceptable for this test data
        assert data["risk_level"] in ["medium", "high"]
        assert data["is_suspicious"] == True
        print(f"✅ Suspicious donation test passed! Risk Level: {data['risk_level']}")
