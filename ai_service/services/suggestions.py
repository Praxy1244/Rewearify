"""
Smart Suggestion Service
Provides intelligent form auto-complete suggestions
"""

from typing import Dict, List

class SuggestionService:
    def __init__(self):
        # Pre-defined suggestion templates
        self.category_templates = {
            "outerwear": {
                "titles": [
                    "Winter Jackets Collection",
                    "Warm Coats for Donation",
                    "Outerwear Donation Pack"
                ],
                "descriptions": [
                    "Gently used winter jackets and coats in excellent condition.",
                    "A collection of warm outerwear suitable for cold weather."
                ],
                "subcategories": ["Jacket", "Coat", "Sweater", "Vest"],
                "tags": ["winter", "warm", "outerwear"]
            },
            "casual": {
                "titles": [
                    "Casual Wear Collection",
                    "Everyday Clothing Donation",
                    "Comfortable Daily Wear"
                ],
                "descriptions": [
                    "Comfortable casual wear for everyday use.",
                    "Gently used casual clothing in good condition."
                ],
                "subcategories": ["T-Shirt", "Jeans", "Shorts", "Polo Shirt"],
                "tags": ["casual", "everyday", "comfortable"]
            },
            "formal": {
                "titles": [
                    "Professional Attire Collection",
                    "Formal Wear Donation",
                    "Business Clothing Pack"
                ],
                "descriptions": [
                    "Professional clothing suitable for work environments.",
                    "Formal wear in excellent condition for job seekers."
                ],
                "subcategories": ["Suit", "Dress Shirt", "Blouse", "Trousers"],
                "tags": ["formal", "professional", "business"]
            },
            "children": {
                "titles": [
                    "Children's Clothing Collection",
                    "Kids Wear Donation",
                    "Youth Clothing Pack"
                ],
                "descriptions": [
                    "Quality children's clothing for various ages.",
                    "Gently used kids wear in excellent condition."
                ],
                "subcategories": ["Infant Set", "Toddler Outfit", "Youth T-Shirt"],
                "tags": ["children", "kids", "youth"]
            },
            "shoes": {
                "titles": [
                    "Footwear Collection",
                    "Shoe Donation",
                    "Quality Footwear Pack"
                ],
                "descriptions": [
                    "Gently used shoes in good condition.",
                    "Quality footwear for all ages."
                ],
                "subcategories": ["Sneakers", "Boots", "Sandals", "Formal Shoes"],
                "tags": ["shoes", "footwear"]
            },
            "accessories": {
                "titles": [
                    "Accessories Collection",
                    "Fashion Accessories Donation"
                ],
                "descriptions": [
                    "Quality accessories in excellent condition.",
                    "Fashion accessories to complement any outfit."
                ],
                "subcategories": ["Hat", "Scarf", "Belt", "Handbag"],
                "tags": ["accessories", "fashion"]
            }
        }
        
        self.condition_modifiers = {
            "excellent": ["like new", "barely worn", "pristine"],
            "good": ["gently used", "good condition", "minor wear"],
            "fair": ["some wear", "functional", "usable"]
        }

    def generate_suggestions(
        self, 
        title: str = "", 
        description: str = "", 
        category: str = "", 
        condition: str = ""
    ) -> Dict[str, List[str]]:
        """Generate smart suggestions based on input"""
        
        suggestions = {
            "titles": [],
            "descriptions": [],
            "subcategories": [],
            "tags": []
        }
        
        # Category-based suggestions
        if category and category in self.category_templates:
            template = self.category_templates[category]
            
            suggestions["titles"] = template["titles"][:3]
            suggestions["descriptions"] = template["descriptions"][:2]
            suggestions["subcategories"] = template["subcategories"][:4]
            suggestions["tags"] = template["tags"][:3]
            
            # Add condition to description if provided
            if condition and condition in self.condition_modifiers:
                for i, desc in enumerate(suggestions["descriptions"]):
                    suggestions["descriptions"][i] = f"{desc} Items are in {condition} condition."
        
        # Title enhancement
        if title and len(title) > 3:
            keywords = [word for word in title.lower().split() if len(word) > 3]
            suggestions["tags"].extend(keywords[:2])
        
        # Remove duplicates and limit
        suggestions["titles"] = list(dict.fromkeys(suggestions["titles"]))[:4]
        suggestions["descriptions"] = list(dict.fromkeys(suggestions["descriptions"]))[:3]
        suggestions["subcategories"] = list(dict.fromkeys(suggestions["subcategories"]))[:5]
        suggestions["tags"] = list(dict.fromkeys(suggestions["tags"]))[:5]
        
        return suggestions
