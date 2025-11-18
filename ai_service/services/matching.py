import pandas as pd
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NGO_DATA_PATH = os.path.join(BASE_DIR, 'data', 'generated', 'ngos.csv')

def get_ngo_matches(donation_category, donation_description):
    """
    Finds NGOs that match the donation category and description using cosine similarity.
    """
    try:
        if not os.path.exists(NGO_DATA_PATH):
            return []

        df_ngos = pd.read_csv(NGO_DATA_PATH)

        # 1. Hard Filter: Only NGOs that accept this category (if column exists)
        if 'Requirements' in df_ngos.columns:
            matches = df_ngos[df_ngos['Requirements'].str.contains(donation_category, case=False, na=False)].copy()
        else:
            matches = df_ngos.copy()

        if matches.empty:
            return []

        # 2. AI Scoring: If description is provided, rank by text similarity
        if donation_description:
            # Create a list of texts: [Donation Desc, NGO_1 Mission, NGO_2 Mission...]
            corpus = [donation_description] + matches['Mission'].fillna('').tolist()
            
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(corpus)
            
            # Calculate similarity of Donation (index 0) vs all NGOs (index 1 to end)
            cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
            
            # Add score to dataframe
            matches['match_score'] = cosine_sim
            
            # Sort by score
            matches = matches.sort_values(by='match_score', ascending=False)
            matches['match_reason'] = "High alignment with NGO mission."
        else:
            matches['match_reason'] = "Accepts " + donation_category

        # Format results for UI
        results = []
        for _, row in matches.head(3).iterrows():
            results.append({
                "id": row.get('NGO_ID', 'Unknown'),
                "name": row.get('Name', 'Unknown NGO'),
                "location": f"{row.get('City', '')}, {row.get('State', '')}",
                "match_reason": row['match_reason']
            })
            
        return results

    except Exception as e:
        print(f"Error in matching: {e}")
        return []