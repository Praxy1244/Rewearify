# ai_service/services/suggestions.py (ENHANCED VERSION)

import pandas as pd
import os
import random
import re
from difflib import SequenceMatcher
from collections import Counter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'generated', 'donations.csv')

# ==================== CONFIGURATION ====================

# Comprehensive template database
TEMPLATES = {
    "outerwear": {
        "excellent": {
            "titles": [
                "Like-New {subcategory} Collection",
                "Premium Quality {subcategory}s - Excellent Condition",
                "{subcategory} Bundle - Barely Worn",
                "High-End {subcategory}s for Donation"
            ],
            "descriptions": [
                "These {subcategory}s are in excellent condition, barely worn and well-maintained. Perfect for families needing quality winter wear. All items have been cleaned and are ready for immediate use.",
                "Premium quality {subcategory}s that look almost new. Ideal for families seeking high-quality outerwear. No visible wear or damage, all zippers and buttons functional.",
                "Clean, fresh {subcategory}s in mint condition. These items were well-cared for and have plenty of life left. Ready to provide warmth and comfort to those in need."
            ],
            "keywords": ["premium", "like-new", "barely worn", "mint condition", "high-quality"]
        },
        "good": {
            "titles": [
                "Quality {subcategory} Donation",
                "Well-Maintained {subcategory}s - Good Condition",
                "Gently Used {subcategory} Set",
                "{subcategory} Collection for Families"
            ],
            "descriptions": [
                "These {subcategory}s are in good condition with minor signs of wear. Still very functional and comfortable for everyday use. All items have been cleaned.",
                "Well-cared-for {subcategory}s perfect for daily wear by families in need. Some minor wear but lots of life remaining.",
                "Gently used {subcategory}s with plenty of warmth left. Suitable for anyone needing quality outerwear without breaking the bank."
            ],
            "keywords": ["quality", "well-maintained", "gently used", "functional", "comfortable"]
        },
        "fair": {
            "titles": [
                "Functional {subcategory} Donation",
                "Used {subcategory}s - Fair Condition",
                "Affordable {subcategory} Bundle",
                "Warm {subcategory}s for Those in Need"
            ],
            "descriptions": [
                "These {subcategory}s show signs of use but are still functional and warm. Perfect for emergency situations or temporary needs.",
                "Well-loved {subcategory}s that still have life left in them. May show wear but all essential features work properly.",
                "Used {subcategory}s suitable for anyone facing urgent winter needs. Clean and ready to provide basic warmth."
            ],
            "keywords": ["functional", "affordable", "basic", "emergency", "temporary"]
        }
    },
    "formal": {
        "excellent": {
            "titles": [
                "Professional {subcategory} - Interview Ready",
                "Like-New Business {subcategory}s",
                "Executive {subcategory} Collection",
                "Premium Formal {subcategory}s"
            ],
            "descriptions": [
                "Professional {subcategory}s in excellent condition, perfect for job interviews and business settings. Barely worn, professionally cleaned, and ready to make a great impression.",
                "High-quality business attire ideal for job seekers and working professionals. These {subcategory}s look almost new and will help you present your best self.",
                "Premium formal wear in mint condition. Perfect for anyone entering the workforce or needing professional clothing for important occasions."
            ],
            "keywords": ["professional", "interview-ready", "business", "executive", "career"]
        },
        "good": {
            "titles": [
                "Quality {subcategory} for Work",
                "Professional {subcategory}s - Good Condition",
                "Office-Ready {subcategory} Donation",
                "Business {subcategory} Bundle"
            ],
            "descriptions": [
                "Quality {subcategory}s suitable for office environments and professional settings. Some minor wear but still present well.",
                "Professional attire in good condition, perfect for daily office wear. Well-maintained and cleaned, ready for immediate use.",
                "Business appropriate {subcategory}s that will serve job seekers and professionals well. Functional and presentable."
            ],
            "keywords": ["professional", "office-ready", "business", "work-appropriate", "presentable"]
        },
        "fair": {
            "titles": [
                "Basic {subcategory} for Work",
                "Used Professional {subcategory}s",
                "Affordable Business {subcategory}s",
                "Functional Formal {subcategory}s"
            ],
            "descriptions": [
                "Used {subcategory}s suitable for basic professional needs. Shows wear but still functional for work environments.",
                "Affordable formal wear for anyone needing professional clothing on a budget. Clean and ready to use.",
                "Well-loved {subcategory}s that can still serve in professional settings. Perfect for temporary or entry-level positions."
            ],
            "keywords": ["basic", "affordable", "functional", "entry-level", "budget"]
        }
    },
    "casual": {
        "excellent": {
            "titles": [
                "Like-New Casual {subcategory}s",
                "Premium {subcategory} Collection",
                "Barely Worn {subcategory} Bundle",
                "Fresh {subcategory}s - Excellent Condition"
            ],
            "descriptions": [
                "These casual {subcategory}s are in excellent condition with no visible wear. Perfect for everyday use by families needing quality clothing.",
                "High-quality casual wear that looks almost new. Comfortable, clean, and ready for daily activities.",
                "Premium casual {subcategory}s ideal for anyone seeking comfortable, stylish everyday wear. Barely used and well-maintained."
            ],
            "keywords": ["comfortable", "everyday", "casual", "fresh", "stylish"]
        },
        "good": {
            "titles": [
                "Quality Casual {subcategory}s",
                "Comfortable {subcategory} Donation",
                "Everyday {subcategory} Bundle",
                "Gently Used {subcategory}s"
            ],
            "descriptions": [
                "Comfortable casual {subcategory}s in good condition. Perfect for everyday wear with minor signs of use.",
                "Quality everyday clothing suitable for families. Well-maintained and clean, ready for daily activities.",
                "Gently used {subcategory}s with lots of life left. Comfortable and practical for casual settings."
            ],
            "keywords": ["comfortable", "everyday", "practical", "casual", "versatile"]
        },
        "fair": {
            "titles": [
                "Basic Casual {subcategory}s",
                "Used {subcategory} Donation",
                "Everyday {subcategory}s - Fair Condition",
                "Functional Casual Wear"
            ],
            "descriptions": [
                "Used casual {subcategory}s suitable for everyday needs. Shows wear but still functional and comfortable.",
                "Basic everyday clothing for anyone needing casual wear. Clean and ready to use.",
                "Well-loved {subcategory}s perfect for home use or casual activities. Functional despite visible wear."
            ],
            "keywords": ["basic", "everyday", "functional", "casual", "practical"]
        }
    },
    "children": {
        "excellent": {
            "titles": [
                "Like-New Children's {subcategory}s",
                "Premium Kids {subcategory} Bundle",
                "Barely Worn {subcategory}s for Kids",
                "Fresh Children's {subcategory} Collection"
            ],
            "descriptions": [
                "These children's {subcategory}s are in excellent condition, barely worn due to rapid growth. Perfect for growing families needing quality kids' clothing.",
                "High-quality children's wear that looks almost new. Kids grow fast, so these items have plenty of life left in them.",
                "Premium kids' {subcategory}s in mint condition. Ideal for families with young children or schools needing uniforms."
            ],
            "keywords": ["kids", "children", "school", "growing", "youth"]
        },
        "good": {
            "titles": [
                "Quality Children's {subcategory}s",
                "Kids {subcategory} Bundle - Good Condition",
                "Gently Used {subcategory}s for Children",
                "Family-Friendly Kids {subcategory}s"
            ],
            "descriptions": [
                "Quality children's {subcategory}s in good condition. Perfect for everyday use by growing kids. Some minor wear but very functional.",
                "Well-maintained kids' clothing suitable for families. Clean and ready for active children.",
                "Gently used {subcategory}s with lots of wear time left. Great for schools, daycares, or families with multiple children."
            ],
            "keywords": ["kids", "children", "family", "school", "daycare"]
        },
        "fair": {
            "titles": [
                "Used Children's {subcategory}s",
                "Basic Kids {subcategory} Donation",
                "Functional {subcategory}s for Children",
                "Affordable Kids Clothing Bundle"
            ],
            "descriptions": [
                "Used children's {subcategory}s showing signs of active play. Still functional for everyday kids' activities.",
                "Basic kids' clothing for families in need. Clean and suitable for play and daily wear.",
                "Well-loved {subcategory}s perfect for active children. Some visible wear but still very usable."
            ],
            "keywords": ["kids", "basic", "play", "active", "affordable"]
        }
    },
    "accessories": {
        "excellent": {
            "titles": [
                "Premium {subcategory} Collection",
                "Like-New {subcategory}s - Designer Quality",
                "High-End {subcategory} Donation",
                "Luxury {subcategory}s - Excellent Condition"
            ],
            "descriptions": [
                "Premium quality {subcategory}s in excellent condition. These accessories can complete any outfit and make a lasting impression.",
                "High-end {subcategory}s that look brand new. Perfect for job seekers needing professional accessories or anyone wanting quality items.",
                "Designer-quality {subcategory}s in mint condition. A small touch that can make a big difference in someone's confidence."
            ],
            "keywords": ["premium", "designer", "luxury", "professional", "quality"]
        },
        "good": {
            "titles": [
                "Quality {subcategory}s",
                "Stylish {subcategory} Donation",
                "Functional {subcategory}s - Good Condition",
                "Everyday {subcategory} Bundle"
            ],
            "descriptions": [
                "Quality {subcategory}s in good condition. Perfect for completing outfits and adding personal style.",
                "Functional {subcategory}s suitable for daily use. Some minor wear but still very presentable.",
                "Stylish {subcategory}s that can enhance any wardrobe. Clean and ready to use."
            ],
            "keywords": ["quality", "stylish", "functional", "everyday", "practical"]
        },
        "fair": {
            "titles": [
                "Used {subcategory}s",
                "Basic {subcategory} Donation",
                "Functional {subcategory}s - Fair Condition",
                "Everyday {subcategory}s"
            ],
            "descriptions": [
                "Used {subcategory}s showing some wear but still functional. Perfect for anyone needing basic accessories.",
                "Basic {subcategory}s suitable for everyday use. Clean and ready to serve their purpose.",
                "Well-loved {subcategory}s that still have life left. Functional despite visible signs of use."
            ],
            "keywords": ["basic", "functional", "everyday", "practical", "affordable"]
        }
    },
    "shoes": {
        "excellent": {
            "titles": [
                "Like-New {subcategory}s - Barely Worn",
                "Premium {subcategory} Donation",
                "Fresh {subcategory}s - Excellent Condition",
                "High-Quality {subcategory}s"
            ],
            "descriptions": [
                "These {subcategory}s are in excellent condition with minimal wear on soles. Clean, comfortable, and ready for daily use.",
                "Premium quality footwear that looks almost new. Perfect for anyone needing reliable shoes for work, school, or daily activities.",
                "High-quality {subcategory}s in mint condition. Barely worn with plenty of life left in the soles and uppers."
            ],
            "keywords": ["quality", "comfortable", "durable", "fresh", "reliable"]
        },
        "good": {
            "titles": [
                "Quality {subcategory}s",
                "Comfortable {subcategory} Donation",
                "Functional {subcategory}s - Good Condition",
                "Everyday {subcategory}s"
            ],
            "descriptions": [
                "Quality {subcategory}s in good condition. Some wear on soles but still very comfortable and functional.",
                "Comfortable footwear suitable for daily use. Well-maintained and ready for anyone needing reliable shoes.",
                "Functional {subcategory}s with lots of wear time left. Perfect for work, school, or everyday activities."
            ],
            "keywords": ["comfortable", "functional", "everyday", "reliable", "practical"]
        },
        "fair": {
            "titles": [
                "Used {subcategory}s",
                "Basic Footwear Donation",
                "Functional {subcategory}s - Fair Condition",
                "Affordable {subcategory}s"
            ],
            "descriptions": [
                "Used {subcategory}s showing wear but still functional. Suitable for temporary needs or light daily use.",
                "Basic footwear for anyone in need. Shows signs of use but still serves its purpose.",
                "Well-loved {subcategory}s that can still provide basic foot protection. Clean and ready to use."
            ],
            "keywords": ["basic", "functional", "affordable", "temporary", "practical"]
        }
    },
    "household": {
        "excellent": {
            "titles": [
                "Like-New {subcategory}s - Premium Quality",
                "Fresh {subcategory} Donation",
                "High-Quality {subcategory}s - Barely Used",
                "Premium {subcategory} Bundle"
            ],
            "descriptions": [
                "These {subcategory}s are in excellent condition, barely used and well-maintained. Perfect for families setting up new homes or replacing worn items.",
                "Premium quality household items that look almost new. Clean, fresh, and ready for immediate use.",
                "High-quality {subcategory}s in mint condition. Ideal for anyone needing reliable household linens."
            ],
            "keywords": ["clean", "fresh", "quality", "household", "home"]
        },
        "good": {
            "titles": [
                "Quality {subcategory}s",
                "Household {subcategory} Donation",
                "Functional {subcategory}s - Good Condition",
                "Home Essentials Bundle"
            ],
            "descriptions": [
                "Quality {subcategory}s in good condition. Perfect for everyday household use with minor signs of wear.",
                "Functional household items suitable for families. Clean and ready to serve their purpose.",
                "Well-maintained {subcategory}s with lots of use left. Great for anyone setting up a home."
            ],
            "keywords": ["functional", "household", "everyday", "home", "practical"]
        },
        "fair": {
            "titles": [
                "Used {subcategory}s",
                "Basic Household {subcategory}s",
                "Functional {subcategory}s - Fair Condition",
                "Affordable Home Items"
            ],
            "descriptions": [
                "Used {subcategory}s showing wear but still functional. Perfect for temporary needs or emergency situations.",
                "Basic household items for anyone in need. Clean and ready to use despite visible wear.",
                "Well-loved {subcategory}s that can still serve basic household purposes. Functional and affordable."
            ],
            "keywords": ["basic", "functional", "household", "affordable", "emergency"]
        }
    },
    "traditional": {
        "excellent": {
            "titles": [
                "Premium Traditional {subcategory}s",
                "Like-New {subcategory} Collection",
                "Authentic {subcategory}s - Excellent Condition",
                "Cultural {subcategory} Donation"
            ],
            "descriptions": [
                "These traditional {subcategory}s are in excellent condition, perfect for cultural celebrations and religious ceremonies. Barely worn and beautifully maintained.",
                "Premium quality traditional wear that looks almost new. Ideal for festivals, weddings, or cultural events.",
                "Authentic {subcategory}s in mint condition. Perfect for anyone needing traditional attire for special occasions."
            ],
            "keywords": ["traditional", "cultural", "festive", "ceremonial", "authentic"]
        },
        "good": {
            "titles": [
                "Quality Traditional {subcategory}s",
                "Cultural {subcategory} Donation",
                "Festive {subcategory}s - Good Condition",
                "Traditional Wear Bundle"
            ],
            "descriptions": [
                "Quality traditional {subcategory}s suitable for cultural events and celebrations. Some minor wear but still beautiful.",
                "Well-maintained cultural attire perfect for festivals and ceremonies. Clean and ready for special occasions.",
                "Authentic {subcategory}s with lots of wear left. Great for anyone needing traditional clothing."
            ],
            "keywords": ["traditional", "cultural", "festive", "celebration", "authentic"]
        },
        "fair": {
            "titles": [
                "Used Traditional {subcategory}s",
                "Basic Cultural {subcategory}s",
                "Affordable Traditional Wear",
                "Functional {subcategory}s"
            ],
            "descriptions": [
                "Used traditional {subcategory}s showing wear but still suitable for cultural events. Clean and functional.",
                "Basic traditional attire for anyone needing cultural clothing. Shows signs of use but still presentable.",
                "Well-loved {subcategory}s perfect for everyday cultural wear or practice. Functional despite visible wear."
            ],
            "keywords": ["traditional", "basic", "cultural", "affordable", "functional"]
        }
    },
    "activewear": {
        "excellent": {
            "titles": [
                "Premium {subcategory}s - Like New",
                "Performance {subcategory} Collection",
                "Fresh Athletic {subcategory}s",
                "High-Quality Sportswear Donation"
            ],
            "descriptions": [
                "These {subcategory}s are in excellent condition, barely worn with elastic still strong. Perfect for anyone wanting to stay active and healthy.",
                "Premium athletic wear that looks almost new. Ideal for sports enthusiasts, students, or fitness programs.",
                "High-performance {subcategory}s in mint condition. Clean, fresh, and ready for active lifestyles."
            ],
            "keywords": ["athletic", "sports", "fitness", "performance", "active"]
        },
        "good": {
            "titles": [
                "Quality {subcategory}s",
                "Athletic {subcategory} Donation",
                "Functional Sportswear - Good Condition",
                "Active Lifestyle {subcategory}s"
            ],
            "descriptions": [
                "Quality {subcategory}s in good condition. Perfect for sports, exercise, or active daily wear.",
                "Functional athletic wear suitable for various sports and fitness activities. Well-maintained and clean.",
                "Comfortable {subcategory}s with lots of wear left. Great for anyone wanting to lead an active lifestyle."
            ],
            "keywords": ["athletic", "sports", "active", "fitness", "comfortable"]
        },
        "fair": {
            "titles": [
                "Used {subcategory}s",
                "Basic Athletic Wear",
                "Functional {subcategory}s - Fair Condition",
                "Affordable Sportswear"
            ],
            "descriptions": [
                "Used {subcategory}s showing wear but still functional for sports and exercise. Clean and ready to use.",
                "Basic athletic wear for anyone needing sportswear. Shows signs of use but elastic still works.",
                "Well-loved {subcategory}s perfect for casual exercise or active play. Functional despite visible wear."
            ],
            "keywords": ["athletic", "basic", "functional", "sports", "affordable"]
        }
    }
}

# Target audience mapping
TARGET_AUDIENCES = {
    "outerwear": ["families", "homeless individuals", "children", "elderly", "students"],
    "formal": ["job seekers", "students", "working professionals", "graduates", "career changers"],
    "casual": ["families", "students", "community members", "individuals", "youth"],
    "children": ["growing families", "schools", "daycare centers", "single parents", "foster care"],
    "accessories": ["job seekers", "students", "professionals", "individuals", "community members"],
    "shoes": ["students", "job seekers", "families", "workers", "athletes"],
    "household": ["families", "new homeowners", "refugees", "homeless shelters", "community centers"],
    "traditional": ["cultural communities", "families", "religious organizations", "cultural centers", "individuals"],
    "activewear": ["students", "fitness enthusiasts", "sports programs", "youth centers", "community gyms"],
    "maternity": ["expecting mothers", "new parents", "women's shelters", "maternity clinics", "support groups"],
    "plus-size": ["individuals", "community members", "families", "workers", "anyone in need"]
}

# ==================== HELPER FUNCTIONS ====================

def extract_keywords(text):
    """Extract important keywords from user input"""
    if not text:
        return []
    words = re.findall(r'\b\w+\b', text.lower())
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'in', 'on', 'at', 'to', 'of', 'is', 'are'}
    return [w for w in words if w not in stop_words and len(w) > 3]

def similarity_score(keyword, text):
    """Calculate similarity between keyword and text"""
    return SequenceMatcher(None, keyword.lower(), text.lower()).ratio()

def get_dynamic_subtypes(category):
    """Get subtypes that MATCH frontend dropdown exactly"""
    
    # Try to get from historical data first
    try:
        if os.path.exists(DATA_PATH):
            df = pd.read_csv(DATA_PATH)
            filtered = df[df['Type'].str.lower() == category.lower()]
            if not filtered.empty:
                top_subtypes = filtered['Subtype'].value_counts().head(10).index.tolist()
                if len(top_subtypes) > 0:
                    return top_subtypes
    except Exception as e:
        print(f"Error loading dynamic subtypes: {e}")
    
    # ✅ EXACT MATCH with frontend DonationForm.js categoryMap
    frontend_categories = {
        'outerwear': ['Jacket', 'Coat', 'Sweater', 'Vest'],
        'formal': ['Suit', 'Dress Shirt', 'Blouse', 'Trousers', 'Skirt'],
        'casual': ['T-Shirt', 'Jeans', 'Kurta', 'Shorts', 'Polo Shirt'],
        'children': ['Infant Set', 'Toddler Outfit', 'Youth T-Shirt', 'Youth Jeans'],
        'accessories': ['Hat', 'Scarf', 'Belt', 'Handbag', 'Tie'],
        'shoes': ['Sneakers', 'Boots', 'Sandals', 'Formal Shoes'],
        'activewear': ['Sportswear', 'Tracksuit', 'Swimwear'],
        'undergarments': ['New Underwear', 'New Socks', 'New Bras'],
        'traditional': ['Saree', 'Kurta Pajama', 'Lehenga', 'Sherwani'],
        'household': ['Blanket', 'Bedsheet', 'Towel', 'Curtain'],
        'linens': ['Bed Linens', 'Table Linens'],
        'maternity': ['Maternity Top', 'Maternity Bottoms'],
        'plus-size': ['Plus-Size Top', 'Plus-Size Bottoms'],
        'other': ['Other']
    }
    
    return frontend_categories.get(category.lower(), ['Item'])


def extract_dominant_subcategory(title, description, category):
    """Extract the most likely subcategory from user input"""
    all_text = f"{title} {description}".lower()
    keywords = extract_keywords(all_text)
    
    subtypes = get_dynamic_subtypes(category)
    
    # Score each subtype based on similarity to keywords
    scores = []
    for subtype in subtypes:
        max_score = 0
        for keyword in keywords:
            score = similarity_score(keyword, subtype)
            max_score = max(max_score, score)
        scores.append((subtype, max_score))
    
    # Return best match if score is reasonable
    scores.sort(key=lambda x: x[1], reverse=True)
    if scores and scores[0][1] > 0.6:
        return scores[0][0]
    
    return subtypes[0] if subtypes else "Item"

def personalize_template(template, category, subcategory, condition, keywords):
    """Personalize template with smart substitutions"""
    target_audience = random.choice(TARGET_AUDIENCES.get(category, ["community members"]))
    
    personalized = template.format(
        category=category.title(),
        subcategory=subcategory,
        condition=condition.title(),
        target_audience=target_audience
    )
    
    # Add contextual enhancements based on keywords
    if any(kw in ' '.join(keywords) for kw in ['winter', 'cold', 'warm']):
        personalized += " Perfect for winter months."
    if any(kw in ' '.join(keywords) for kw in ['school', 'student', 'education']):
        personalized += " Great for students and educational programs."
    if any(kw in ' '.join(keywords) for kw in ['work', 'job', 'professional']):
        personalized += " Ideal for professional settings."
    
    return personalized

# ==================== MAIN FUNCTION ====================

def generate_smart_suggestions(category: str, condition: str, context: str = ""):
    """
    Generate intelligent, context-aware suggestions using hybrid approach
    
    Args:
        category: Clothing category (outerwear, formal, casual, etc.)
        condition: Item condition (excellent, good, fair)
        context: Combined title and description text from user
    
    Returns:
        dict: Contains titles, descriptions, subcategories, and tags
    """
    
    try:
        # Extract keywords from context
        keywords = extract_keywords(context)
        
        # Get dynamic subtypes
        subtypes = get_dynamic_subtypes(category)
        
        # ✅ FIX: Safely extract dominant subcategory
        title_part = ""
        desc_part = ""
        
        if context and len(context.strip()) > 0:
            # Try to split context into title and description portions
            context_parts = context.strip().split()
            if len(context_parts) > 0:
                title_part = context_parts[0]
            desc_part = context
        
        # Find dominant subcategory if user mentioned one
        dominant_subcat = extract_dominant_subcategory(title_part, desc_part, category)
        
        # Get template set for this category and condition
        category_templates = TEMPLATES.get(category.lower(), TEMPLATES.get("casual", {}))
        condition_templates = category_templates.get(condition.lower(), category_templates.get("good", {}))
        
        # ✅ FIX: Ensure we have templates
        if not condition_templates:
            # Ultimate fallback
            condition_templates = {
                "titles": ["{subcategory} Donation", "Quality {category} Items"],
                "descriptions": ["Quality {category} items in {condition} condition for donation."],
                "keywords": ["quality", "donation"]
            }
        
        # Generate titles with smart substitution
        titles = []
        title_templates = condition_templates.get("titles", ["{subcategory} Donation"])
        
        for template in title_templates[:3]:  # Top 3 titles
            try:
                title = personalize_template(template, category, dominant_subcat, condition, keywords)
                titles.append(title)
            except Exception as e:
                print(f"Warning: Failed to generate title: {e}")
                titles.append(f"{category.title()} Donation")
        
        # Add one title based on subtypes variety
        if len(subtypes) > 1:
            titles.append(f"{category.title()} Bundle: {', '.join(subtypes[:2])}")
        
        # Ensure we have at least one title
        if not titles:
            titles = [f"{category.title()} {condition.title()} Donation"]
        
        # Generate descriptions with smart substitution
        descriptions = []
        desc_templates = condition_templates.get("descriptions", ["Quality items for donation."])
        
        for template in desc_templates[:3]:  # Top 3 descriptions
            try:
                desc = personalize_template(template, category, dominant_subcat, condition, keywords)
                descriptions.append(desc)
            except Exception as e:
                print(f"Warning: Failed to generate description: {e}")
                descriptions.append(f"Quality {category} items in {condition} condition.")
        
        # Ensure we have at least one description
        if not descriptions:
            descriptions = [f"Quality {category} items in {condition} condition for those in need."]
        
        # Score and rank subcategories based on relevance
        if keywords and subtypes:
            scored_subcats = []
            for subcat in subtypes:
                max_score = max([similarity_score(kw, subcat) for kw in keywords] + [0])
                scored_subcats.append((subcat, max_score))
            scored_subcats.sort(key=lambda x: x[1], reverse=True)
            ranked_subtypes = [s[0] for s in scored_subcats[:5]]
        else:
            ranked_subtypes = subtypes[:5] if subtypes else ["Item"]
        
        # Generate smart tags
        tags = [category.title(), condition.title(), "Donation"]
        
        # Add contextual tags based on keywords and templates
        template_keywords = condition_templates.get("keywords", [])
        tags.extend(template_keywords[:3])  # Add top 3 template keywords
        
        # Add context-aware tags
        keyword_string = ' '.join(keywords)
        if any(kw in keyword_string for kw in ['winter', 'cold', 'warm', 'snow']):
            tags.extend(["Winter Ready", "Cold Weather"])
        if any(kw in keyword_string for kw in ['summer', 'hot', 'light', 'beach']):
            tags.extend(["Summer", "Lightweight"])
        if any(kw in keyword_string for kw in ['school', 'student', 'education', 'uniform']):
            tags.extend(["School", "Education"])
        if any(kw in keyword_string for kw in ['work', 'job', 'professional', 'office']):
            tags.extend(["Professional", "Work"])
        if any(kw in keyword_string for kw in ['children', 'kids', 'baby', 'toddler']):
            tags.extend(["Kids", "Family"])
        if condition == "excellent":
            tags.append("High Quality")
        if category == "formal":
            tags.append("Interview Ready")
        
        # Remove duplicates while preserving order
        seen = set()
        unique_tags = []
        for tag in tags:
            tag_lower = tag.lower()
            if tag_lower not in seen:
                seen.add(tag_lower)
                unique_tags.append(tag)
        
        return {
            "titles": titles[:4],  # Return top 4 titles
            "descriptions": descriptions[:3],  # Return top 3 descriptions
            "subcategories": ranked_subtypes[:5],  # Return top 5 subcategories
            "tags": unique_tags[:8]  # Return top 8 tags
        }
    
    except Exception as e:
        # ✅ ULTIMATE FALLBACK: Return basic suggestions
        print(f"Error in generate_smart_suggestions: {e}")
        import traceback
        traceback.print_exc()
        
        # Fallback response
        subtypes = get_dynamic_subtypes(category)
        return {
            "titles": [
                f"{category.title()} Donation",
                f"{condition.title()} {category.title()} Items",
                f"Quality {category.title()} Bundle"
            ],
            "descriptions": [
                f"Quality {category} items in {condition} condition for donation.",
                f"These {category} items are ready for those in need.",
                f"Clean and usable {category} items available."
            ],
            "subcategories": subtypes[:5] if subtypes else ["Item"],
            "tags": [category.title(), condition.title(), "Donation", "Quality"]
        }


# ==================== TESTING ====================

if __name__ == "__main__":
    # Test the function
    print("\n" + "="*60)
    print("🧪 TESTING SMART SUGGESTIONS")
    print("="*60 + "\n")
    
    test_cases = [
        {
            "category": "outerwear",
            "condition": "excellent",
            "context": "Winter jacket warm coat"
        },
        {
            "category": "formal",
            "condition": "good",
            "context": "Business suit interview job"
        },
        {
            "category": "children",
            "condition": "fair",
            "context": "Kids school uniform"
        }
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n{'='*60}")
        print(f"Test Case {i}:")
        print(f"Category: {test['category']}, Condition: {test['condition']}")
        print(f"Context: {test['context']}")
        print(f"{'='*60}\n")
        
        result = generate_smart_suggestions(
            test["category"],
            test["condition"],
            test["context"]
        )
        
        print("📝 TITLES:")
        for title in result["titles"]:
            print(f"   • {title}")
        
        print("\n📄 DESCRIPTIONS:")
        for desc in result["descriptions"]:
            print(f"   • {desc}")
        
        print("\n🏷️  SUBCATEGORIES:")
        print(f"   {', '.join(result['subcategories'])}")
        
        print("\n🔖 TAGS:")
        print(f"   {', '.join(result['tags'])}")
        
        print()
