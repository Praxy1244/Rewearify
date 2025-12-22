# ai_service/services/suggestions.py (WITH REQUEST MODE)

import pandas as pd
import os
import random
import re
from difflib import SequenceMatcher
from collections import Counter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'generated', 'donations.csv')

# ==================== DONATION TEMPLATES (DONOR GIVING) ====================

DONATION_TEMPLATES = {
    "outerwear": {
        "excellent": {
            "titles": [
                "Like-New {subcategory} Collection",
                "Premium Quality {subcategory}s - Excellent Condition",
                "{subcategory} Bundle - Barely Worn",
                "High-End {subcategory}s for Donation"
            ],
            "descriptions": [
                "These {subcategory}s are in excellent condition, barely worn and well-maintained. Perfect for families needing quality winter wear.",
                "Premium quality {subcategory}s that look almost new. Ideal for families seeking high-quality outerwear.",
                "Clean, fresh {subcategory}s in mint condition. These items were well-cared for and have plenty of life left."
            ],
        },
        "good": {
            "titles": [
                "Quality {subcategory} Donation",
                "Well-Maintained {subcategory}s",
                "Gently Used {subcategory} Set"
            ],
            "descriptions": [
                "These {subcategory}s are in good condition with minor signs of wear. Still very functional and comfortable.",
                "Well-cared-for {subcategory}s perfect for daily wear by families in need.",
            ],
        },
        "fair": {
            "titles": [
                "Functional {subcategory} Donation",
                "Used {subcategory}s - Fair Condition",
                "Warm {subcategory}s for Those in Need"
            ],
            "descriptions": [
                "These {subcategory}s show signs of use but are still functional and warm.",
                "Well-loved {subcategory}s that still have life left in them.",
            ],
        }
    }
}

# ==================== REQUEST TEMPLATES (NGO ASKING) ====================

REQUEST_TEMPLATES = {
    "outerwear": {
        "excellent": {
            "titles": [
                "Urgent Need: {subcategory}s for Winter",
                "Seeking Quality {subcategory}s for Families",
                "Help Us Provide {subcategory}s to Those in Need",
                "{subcategory}s Needed for Cold Weather Relief"
            ],
            "descriptions": [
                "We urgently need {subcategory}s in excellent condition for families facing the winter cold. Your donation will directly help those struggling to stay warm.",
                "Seeking high-quality {subcategory}s to provide warmth and dignity to families in need. Even gently used items can make a huge difference.",
                "Our organization needs {subcategory}s to distribute to homeless individuals and low-income families this winter season."
            ],
        },
        "good": {
            "titles": [
                "Request: {subcategory}s for Community Members",
                "Seeking Gently Used {subcategory}s",
                "{subcategory}s Needed for Winter Program",
                "Help Provide Warmth: {subcategory}s Requested"
            ],
            "descriptions": [
                "We are requesting {subcategory}s in good condition for our community outreach program. These items will help families stay warm.",
                "Our shelter needs {subcategory}s to distribute to those facing homelessness. Gently used items are greatly appreciated.",
                "Looking for functional {subcategory}s to help families prepare for winter. Any condition that provides warmth is welcome."
            ],
        },
        "fair": {
            "titles": [
                "Urgent: Any {subcategory}s Needed",
                "Request: Functional {subcategory}s",
                "{subcategory}s Needed for Emergency Relief",
                "Help Us Gather {subcategory}s for Winter"
            ],
            "descriptions": [
                "We need any functional {subcategory}s for emergency winter relief. Even well-worn items can provide critical warmth.",
                "Our program serves families facing immediate need. Any {subcategory}s that can provide basic warmth are urgently needed.",
                "Requesting {subcategory}s in any usable condition for our winter assistance program. Every item helps someone in need."
            ],
        }
    },
    "formal": {
        "excellent": {
            "titles": [
                "Job Seekers Need Professional {subcategory}s",
                "Request: Interview-Ready {subcategory}s",
                "Help Build Careers: {subcategory}s Needed",
                "Seeking Business {subcategory}s for Employment Program"
            ],
            "descriptions": [
                "We need professional {subcategory}s in excellent condition for our job readiness program. Help someone land their dream job!",
                "Seeking interview-ready {subcategory}s to help job seekers make great first impressions. Your donation can change a life.",
                "Our employment program needs business attire to help individuals transition into the workforce with confidence."
            ],
        },
        "good": {
            "titles": [
                "Professional {subcategory}s Requested",
                "Seeking Work-Appropriate {subcategory}s",
                "Help Job Seekers: {subcategory}s Needed"
            ],
            "descriptions": [
                "We are requesting professional {subcategory}s for individuals seeking employment. Gently used items are perfect.",
                "Our program helps people prepare for job interviews. We need {subcategory}s in presentable condition.",
            ],
        },
        "fair": {
            "titles": [
                "Any Professional {subcategory}s Needed",
                "Request: Work {subcategory}s for Training",
                "Seeking Functional Business {subcategory}s"
            ],
            "descriptions": [
                "We need any usable professional {subcategory}s for our workforce training program.",
                "Requesting {subcategory}s in any condition suitable for work environments. Every item helps.",
            ],
        }
    },
    "casual": {
        "excellent": {
            "titles": [
                "Families Need: Quality {subcategory}s",
                "Request: Everyday {subcategory}s for Community",
                "Seeking {subcategory}s for Family Support Program",
                "Help Provide Clothing: {subcategory}s Needed"
            ],
            "descriptions": [
                "We need quality {subcategory}s for families in our community assistance program. Help us provide dignity and comfort.",
                "Seeking gently used {subcategory}s to distribute to families facing financial hardship.",
                "Our program serves low-income families. We need {subcategory}s in good condition for everyday wear."
            ],
        },
        "good": {
            "titles": [
                "Casual {subcategory}s Requested",
                "Seeking Everyday {subcategory}s",
                "{subcategory}s Needed for Families"
            ],
            "descriptions": [
                "We are requesting {subcategory}s for families served by our organization. Gently used items are greatly appreciated.",
                "Our community center needs {subcategory}s to distribute to families in need of clothing assistance.",
            ],
        },
        "fair": {
            "titles": [
                "Any {subcategory}s Needed Urgently",
                "Request: Functional {subcategory}s",
                "{subcategory}s for Emergency Assistance"
            ],
            "descriptions": [
                "We urgently need any usable {subcategory}s for emergency family assistance.",
                "Requesting {subcategory}s in any wearable condition for immediate distribution.",
            ],
        }
    },
    "children": {
        "excellent": {
            "titles": [
                "Children Need: Quality {subcategory}s",
                "Request: Kids {subcategory}s for School",
                "Seeking {subcategory}s for Children's Program",
                "Help Kids Grow: {subcategory}s Needed"
            ],
            "descriptions": [
                "We need children's {subcategory}s in excellent condition for families with growing kids. Your donation helps children thrive.",
                "Seeking quality {subcategory}s for our youth program. Kids grow fast and need clothing support.",
                "Our school partnership program needs {subcategory}s for children from low-income families."
            ],
        },
        "good": {
            "titles": [
                "Children's {subcategory}s Requested",
                "Seeking Kids {subcategory}s",
                "{subcategory}s Needed for Youth Program"
            ],
            "descriptions": [
                "We are requesting {subcategory}s for children in our after-school program. Gently used items are perfect.",
                "Our organization serves families with young children. We need {subcategory}s in usable condition.",
            ],
        },
        "fair": {
            "titles": [
                "Any Kids {subcategory}s Needed",
                "Request: Children's {subcategory}s",
                "{subcategory}s for Growing Children"
            ],
            "descriptions": [
                "We need any usable children's {subcategory}s for families facing hardship.",
                "Requesting {subcategory}s in any condition suitable for active kids.",
            ],
        }
    },
    "accessories": {
        "excellent": {
            "titles": [
                "Request: Professional {subcategory}s",
                "Seeking Quality {subcategory}s",
                "{subcategory}s Needed for Complete Outfits"
            ],
            "descriptions": [
                "We need {subcategory}s to complete professional outfits for job seekers. Small items make big differences.",
                "Seeking quality {subcategory}s to help individuals present their best selves.",
            ],
        },
        "good": {
            "titles": [
                "{subcategory}s Requested",
                "Seeking Functional {subcategory}s",
                "Help Complete Outfits: {subcategory}s Needed"
            ],
            "descriptions": [
                "We are requesting {subcategory}s to help individuals complete their wardrobes.",
                "Our program needs {subcategory}s for community members in need.",
            ],
        },
        "fair": {
            "titles": [
                "Any {subcategory}s Needed",
                "Request: Basic {subcategory}s",
                "{subcategory}s for Those in Need"
            ],
            "descriptions": [
                "We need any usable {subcategory}s for our community assistance program.",
            ],
        }
    },
    "shoes": {
        "excellent": {
            "titles": [
                "Urgent: Quality {subcategory}s Needed",
                "Request: {subcategory}s for Walking to Work",
                "Seeking Reliable {subcategory}s",
                "{subcategory}s Needed for Job Seekers"
            ],
            "descriptions": [
                "We urgently need quality {subcategory}s for individuals walking to job interviews and work.",
                "Seeking reliable {subcategory}s to help people stay mobile and employed.",
                "Our program needs {subcategory}s in good condition for community members lacking proper footwear."
            ],
        },
        "good": {
            "titles": [
                "{subcategory}s Requested",
                "Seeking Functional {subcategory}s",
                "Help Provide Footwear: {subcategory}s Needed"
            ],
            "descriptions": [
                "We are requesting {subcategory}s for individuals in need of reliable footwear.",
                "Our organization needs {subcategory}s to distribute to those without proper shoes.",
            ],
        },
        "fair": {
            "titles": [
                "Any {subcategory}s Needed",
                "Request: Basic Footwear",
                "{subcategory}s for Emergency Relief"
            ],
            "descriptions": [
                "We need any wearable {subcategory}s for emergency assistance.",
                "Requesting {subcategory}s in any condition that provides basic foot protection.",
            ],
        }
    },
    "household": {
        "excellent": {
            "titles": [
                "Families Need: Quality {subcategory}s",
                "Request: {subcategory}s for New Homes",
                "Seeking {subcategory}s for Housing Program",
                "Help Furnish Homes: {subcategory}s Needed"
            ],
            "descriptions": [
                "We need quality {subcategory}s for families moving into stable housing after homelessness.",
                "Seeking {subcategory}s in excellent condition for our housing assistance program.",
                "Our program helps families establish homes. We need {subcategory}s to make houses feel like home."
            ],
        },
        "good": {
            "titles": [
                "{subcategory}s Requested",
                "Seeking Household {subcategory}s",
                "Help Set Up Homes: {subcategory}s Needed"
            ],
            "descriptions": [
                "We are requesting {subcategory}s for families setting up new households.",
                "Our organization needs {subcategory}s for refugees and families in transition.",
            ],
        },
        "fair": {
            "titles": [
                "Any {subcategory}s Needed",
                "Request: Basic Household Items",
                "{subcategory}s for Emergency Housing"
            ],
            "descriptions": [
                "We need any usable {subcategory}s for emergency housing situations.",
            ],
        }
    },
    "traditional": {
        "excellent": {
            "titles": [
                "Cultural Program Needs: {subcategory}s",
                "Request: Traditional {subcategory}s",
                "Seeking {subcategory}s for Cultural Events",
                "Help Preserve Culture: {subcategory}s Needed"
            ],
            "descriptions": [
                "We need traditional {subcategory}s for our cultural celebration program serving immigrant families.",
                "Seeking {subcategory}s to help families maintain cultural traditions.",
            ],
        },
        "good": {
            "titles": [
                "Traditional {subcategory}s Requested",
                "Seeking Cultural {subcategory}s",
                "{subcategory}s Needed for Community Events"
            ],
            "descriptions": [
                "We are requesting traditional {subcategory}s for our multicultural community center.",
            ],
        },
        "fair": {
            "titles": [
                "Any Traditional {subcategory}s Needed",
                "Request: Cultural Clothing"
            ],
            "descriptions": [
                "We need any usable traditional {subcategory}s for our cultural programs.",
            ],
        }
    },
    "activewear": {
        "excellent": {
            "titles": [
                "Youth Sports Need: {subcategory}s",
                "Request: Athletic {subcategory}s",
                "Seeking {subcategory}s for Fitness Program",
                "Help Kids Stay Active: {subcategory}s Needed"
            ],
            "descriptions": [
                "We need quality {subcategory}s for our youth sports program serving underprivileged children.",
                "Seeking athletic wear to help kids participate in sports and stay healthy.",
            ],
        },
        "good": {
            "titles": [
                "Athletic {subcategory}s Requested",
                "Seeking {subcategory}s for Sports",
                "{subcategory}s Needed for Youth Program"
            ],
            "descriptions": [
                "We are requesting {subcategory}s for our community fitness initiative.",
            ],
        },
        "fair": {
            "titles": [
                "Any {subcategory}s Needed",
                "Request: Basic Athletic Wear"
            ],
            "descriptions": [
                "We need any usable {subcategory}s for our sports program.",
            ],
        }
    }
}

# ==================== HELPER FUNCTIONS ====================

def get_dynamic_subtypes(category):
    """Get subtypes that MATCH frontend dropdown exactly"""
    
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

def personalize_template(template, category, subcategory):
    """Personalize template with smart substitutions"""
    return template.format(
        category=category.title(),
        subcategory=subcategory
    )

# ==================== MAIN FUNCTION ====================

def generate_smart_suggestions(category: str, condition: str, context: str = "", mode: str = "donation"):
    """
    Generate intelligent suggestions based on mode
    
    Args:
        category: Clothing category
        condition: Item condition
        context: User input text
        mode: "donation" (donor giving) or "request" (NGO asking)
    """
    
    try:
        # Choose template set based on mode
        if mode == "request":
            TEMPLATES = REQUEST_TEMPLATES
        else:
            TEMPLATES = DONATION_TEMPLATES
        
        # Get subtypes
        subtypes = get_dynamic_subtypes(category)
        dominant_subcat = subtypes[0] if subtypes else "Item"
        
        # Get templates
        category_templates = TEMPLATES.get(category.lower(), TEMPLATES.get("casual", {}))
        condition_templates = category_templates.get(condition.lower(), category_templates.get("good", {}))
        
        # Fallback if no templates
        if not condition_templates:
            if mode == "request":
                condition_templates = {
                    "titles": ["Request: {subcategory}s Needed", "Seeking {subcategory}s"],
                    "descriptions": ["We urgently need {subcategory}s for our community program."]
                }
            else:
                condition_templates = {
                    "titles": ["{subcategory} Donation", "Quality {subcategory}s"],
                    "descriptions": ["Quality {subcategory}s for donation."]
                }
        
        # Generate titles
        titles = []
        title_templates = condition_templates.get("titles", [])
        for template in title_templates[:3]:
            title = personalize_template(template, category, dominant_subcat)
            titles.append(title)
        
        if not titles:
            if mode == "request":
                titles = [f"Request: {category.title()} {dominant_subcat}s"]
            else:
                titles = [f"{category.title()} {dominant_subcat} Donation"]
        
        # Generate descriptions
        descriptions = []
        desc_templates = condition_templates.get("descriptions", [])
        for template in desc_templates[:3]:
            desc = personalize_template(template, category, dominant_subcat)
            descriptions.append(desc)
        
        if not descriptions:
            if mode == "request":
                descriptions = [f"We need {category} items in {condition} condition for our program."]
            else:
                descriptions = [f"Quality {category} items in {condition} condition."]
        
        # Return suggestions
        return {
            "titles": titles[:4],
            "descriptions": descriptions[:3],
            "subcategories": subtypes[:5],
            "tags": [category.title(), condition.title(), mode.title()]
        }
    
    except Exception as e:
        print(f"Error in generate_smart_suggestions: {e}")
        import traceback
        traceback.print_exc()
        
        # Ultimate fallback
        subtypes = get_dynamic_subtypes(category)
        if mode == "request":
            return {
                "titles": [f"Request: {category.title()} Items", f"Seeking {category.title()}"],
                "descriptions": [f"We need {category} items for our community program."],
                "subcategories": subtypes[:5],
                "tags": [category.title(), "Request"]
            }
        else:
            return {
                "titles": [f"{category.title()} Donation"],
                "descriptions": [f"Quality {category} items for donation."],
                "subcategories": subtypes[:5],
                "tags": [category.title(), "Donation"]
            }
