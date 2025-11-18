import pandas as pd
import os

# Path to your data
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'generated', 'donations.csv')

def get_subtype_suggestions(category: str):
    """
    Returns the top 5 most common subtypes for a given category 
    based on historical donation data.
    """
    try:
        # Load data
        if not os.path.exists(DATA_PATH):
            return ["No data available"]
            
        df = pd.read_csv(DATA_PATH)
        
        # Filter by the selected category (case insensitive)
        filtered = df[df['Type'].str.lower() == category.lower()]
        
        if filtered.empty:
            return []

        # Count frequencies of 'Subtype' and take top 5
        top_subtypes = filtered['Subtype'].value_counts().head(5).index.tolist()
        
        return top_subtypes
    except Exception as e:
        print(f"Error in suggestions: {e}")
        return []