import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'generated', 'donations.csv')

def get_donor_trends():
    """
    Returns items that are currently being donated in high volume.
    """
    try:
        if not os.path.exists(DATA_PATH):
            return ["Winter Clothes", "School Supplies"] 

        df = pd.read_csv(DATA_PATH)
        
        # Get top 4 most common Subtypes
        trending = df['Subtype'].value_counts().head(4).index.tolist()
        return trending

    except Exception as e:
        print(f"Error in trends: {e}")
        return []