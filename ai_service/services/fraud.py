import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def check_fraud(donation_data):
    """
    Analyzes a single donation for fraud risk.
    Returns: { "is_flagged": bool, "reason": str, "risk_score": int }
    """
    qty = int(donation_data.get('quantity', 0))
    item_type = donation_data.get('type', '')
    
    # Rule 1: High Quantity Anomaly
    if qty > 50:
        return {
            "id": donation_data.get('id', 'Unknown'),
            "is_flagged": True,
            "reason": f"Unusually high quantity ({qty}) for personal donor.",
            "risk_score": 85
        }
    
    # Rule 2: Suspicious Item Type
    risky_items = ['Electronics', 'Cash', 'Jewelry']
    if item_type in risky_items:
        return {
            "id": donation_data.get('id', 'Unknown'),
            "is_flagged": True,
            "reason": f"High-risk category '{item_type}' requires manual verification.",
            "risk_score": 60
        }

    # Default: Safe
    return {
        "id": donation_data.get('id', 'Unknown'),
        "is_flagged": False,
        "reason": "Standard donation.",
        "risk_score": 10
    }