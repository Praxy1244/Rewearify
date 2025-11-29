import pandas as pd
import os
import random

# Path to your data
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'generated', 'donations.csv')

def get_subtype_suggestions(category: str):
    """Returns the top 5 most common subtypes for a given category."""
    try:
        if not os.path.exists(DATA_PATH):
            return []
        df = pd.read_csv(DATA_PATH)
        filtered = df[df['Type'].str.lower() == category.lower()]
        if filtered.empty:
            return []
        return filtered['Subtype'].value_counts().head(5).index.tolist()
    except Exception as e:
        print(f"Error in suggestions: {e}")
        return []

def generate_smart_suggestions(category: str, condition: str, context: str = ""):
    """
    Generates 'generative-style' smart titles, descriptions, and tags.
    Uses randomization to feel less hardcoded.
    """
    
    # 1. Get Dynamic Subtypes
    subtypes = get_subtype_suggestions(category)
    if not subtypes:
        # Extensive Fallbacks
        defaults = {
            'outerwear': ['Winter Jacket', 'Trench Coat', 'Windbreaker', 'Fleece'],
            'formal': ['Business Suit', 'Evening Gown', 'Blazer', 'Formal Shirt'],
            'casual': ['Graphic Tee', 'Denim Jeans', 'Casual Shirt', 'Summer Shorts'],
            'shoes': ['Running Shoes', 'Leather Boots', 'Sneakers', 'Sandals'],
            'accessories': ['Leather Belt', 'Silk Scarf', 'Handbag', 'Wool Hat'],
            'children': ['School Uniform', 'Kids Jacket', 'Baby Onesie', 'Toddler Set']
        }
        subtypes = defaults.get(category.lower(), ['Item', 'Bundle', 'Set'])

    # 2. "Generative" Title Templates
    # We randomly mix adjectives and structures
    adjectives = {
        'excellent': ['Pristine', 'Like New', 'Mint Condition', 'Barely Worn'],
        'good': ['Gently Used', 'Well Kept', 'Nice', 'Good Quality'],
        'fair': ['Loved', 'Usable', 'Vintage', 'Worn']
    }
    
    adj = random.choice(adjectives.get(condition.lower(), ['']))
    main_subtype = subtypes[0] if subtypes else "Item"
    
    titles = [
        f"{adj} {main_subtype} - {category.title()}",
        f"{category.title()} Bundle: {', '.join(subtypes[:2])}",
        f"Free {main_subtype} for Donation ({condition.title()})",
        f"{main_subtype} in {condition.title()} Condition"
    ]
    
    # 3. "Generative" Description Templates
    # Constructing paragraphs dynamically
    intro = [
        f"I am donating this {category.lower()} item to help someone in need.",
        f"Offering a {condition.lower()} condition {category.lower()} item.",
        f"Clearing out my closet! found this {main_subtype}."
    ]
    
    details = [
        f"It has been well taken care of and is in {condition.lower()} shape.",
        "Ideally looking for a local NGO pickup.",
        f"Includes {', '.join(subtypes[:2])}."
    ]
    
    call_to_action = [
        "Hope it finds a good home.",
        "Please message for pickup details.",
        "Available for immediate collection."
    ]
    
    descriptions = []
    for _ in range(3):
        # Randomly assemble sentences
        desc = f"{random.choice(intro)} {random.choice(details)} {random.choice(call_to_action)}"
        descriptions.append(desc)

    # 4. Smart Contextual Tags
    tags = [category.title(), condition.title(), "Donation"]
    
    if "winter" in category.lower() or "coat" in str(subtypes).lower():
        tags.extend(["Winter Ready", "Warm"])
    if "school" in str(subtypes).lower() or category == 'children':
        tags.extend(["Back to School", "Kids"])
    if condition == "excellent":
        tags.append("High Quality")
    if "business" in str(subtypes).lower() or category == 'formal':
        tags.append("Interview Ready")
        
    return {
        "titles": titles,
        "descriptions": descriptions,
        "subcategories": subtypes,
        "tags": list(set(tags)) # Remove duplicates
    }