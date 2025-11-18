import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'generated', 'donations.csv')

def get_donation_forecast():
    """
    Aggregates historical data to predict needs.
    """
    try:
        if not os.path.exists(DATA_PATH):
            return []

        df = pd.read_csv(DATA_PATH)
        
        # Count items by category
        counts = df['Type'].value_counts(normalize=True) * 100
        
        # Format for Recharts graph
        data = []
        colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b']
        
        for i, (category, percentage) in enumerate(counts.head(5).items()):
            data.append({
                "category": category,
                "demand": round(percentage, 1),
                "color": colors[i % len(colors)]
            })
            
        return data

    except Exception as e:
        print(f"Error in forecasting: {e}")
        return []