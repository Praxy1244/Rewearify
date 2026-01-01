import pandas as pd
import numpy as np
from services.matching import DonationMatcher

def calculate_matching_scores():
    print("="*60)
    print("🧪 TESTING MATCHING ALGORITHM PERFORMANCE")
    print("="*60)

    # 1. Setup Test Data (Ground Truth)
    # We create fake donations and define what the "Correct" match should look like
    test_cases = [
        # format: (Donation Category, Donation Location, Expected Request Category)
        ({"category": "Winter Wear", "location": {"coordinates": {"coordinates": [12.97, 77.59]}}}, "Winter Wear"),
        ({"category": "Kids Wear", "location": {"coordinates": {"coordinates": [19.07, 72.87]}}}, "Kids Wear"),
        ({"category": "Food", "location": {"coordinates": {"coordinates": [28.70, 77.10]}}}, "Food"),
        # ... add more test cases if you want
    ]

    # Mock database of requests (Since we might not have MongoDB running)
    mock_requests = [
        {"_id": "1", "status": "active", "category": "Winter Wear", "location": {"coordinates": {"coordinates": [12.98, 77.60]}}}, # Close to case 1
        {"_id": "2", "status": "active", "category": "Kids Wear", "location": {"coordinates": {"coordinates": [19.08, 72.88]}}},   # Close to case 2
        {"_id": "3", "status": "active", "category": "Medical", "location": {"coordinates": {"coordinates": [28.71, 77.11]}}},     # Mismatch
    ]

    matcher = DonationMatcher()
    
    tp = 0 # True Positives (Correct Match)
    fp = 0 # False Positives (Wrong Match)
    fn = 0 # False Negatives (Missed a valid match)
    
    print(f"\nrunning {len(test_cases)} test cases...")

    for donation, expected_category in test_cases:
        # Run your actual matching logic
        matches = matcher.find_matches_for_request(donation, mock_requests)
        
        if matches:
            top_match = matches[0]
            # Check if the top match is what we expected
            if top_match['category'] == expected_category:
                print(f"✅ Match Success: {expected_category} -> {top_match['category']}")
                tp += 1
            else:
                print(f"❌ Match Failed: {expected_category} -> {top_match['category']}")
                fp += 1
        else:
            # If we expected a match but got none
            print(f"⚠️ No Match Found for {expected_category}")
            fn += 1

    # 2. Calculate Metrics
    # Avoid division by zero
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    accuracy = tp / len(test_cases)

    # 3. Print Results for your Report
    print("\n" + "="*60)
    print("📊 FINAL RESULTS FOR SECTION 7.2")
    print("="*60)
    print(f"{'Metric':<20} | {'Value (%)'}")
    print("-" * 35)
    print(f"{'Accuracy':<20} | {accuracy*100:.2f}%")
    print(f"{'Precision':<20} | {precision*100:.2f}%")
    print(f"{'Recall':<20} | {recall*100:.2f}%")
    print(f"{'F1-Score':<20} | {f1*100:.2f}%")
    print("-" * 35)

if __name__ == "__main__":
    calculate_matching_scores()