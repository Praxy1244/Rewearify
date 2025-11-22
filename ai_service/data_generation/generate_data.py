import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# Indian cities with coordinates
CITIES = [
    {"name": "Mumbai", "lat": 19.0760, "lon": 72.8777, "weight": 0.20},
    {"name": "Delhi", "lat": 28.7041, "lon": 77.1025, "weight": 0.20},
    {"name": "Bengaluru", "lat": 12.9716, "lon": 77.5946, "weight": 0.15},
    {"name": "Pune", "lat": 18.5204, "lon": 73.8567, "weight": 0.10},
    {"name": "Hyderabad", "lat": 17.3850, "lon": 78.4867, "weight": 0.08},
    {"name": "Chennai", "lat": 13.0827, "lon": 80.2707, "weight": 0.08},
    {"name": "Kolkata", "lat": 22.5726, "lon": 88.3639, "weight": 0.07},
    {"name": "Ahmedabad", "lat": 23.0225, "lon": 72.5714, "weight": 0.05},
    {"name": "Jaipur", "lat": 26.9124, "lon": 75.7873, "weight": 0.04},
    {"name": "Surat", "lat": 21.1702, "lon": 72.8311, "weight": 0.03}
]

# Clothing types and subtypes
CLOTHING_TYPES = {
    "Men's Wear": ["Shirts", "Trousers", "Kurtas", "Jackets", "Sweaters", "Jeans"],
    "Women's Wear": ["Sarees", "Salwar Kameez", "Kurtis", "Tops", "Jeans", "Shawls"],
    "Kids Wear": ["T-Shirts", "Shorts", "Frocks", "School Uniforms", "Sweaters"],
    "Winter Wear": ["Jackets", "Sweaters", "Shawls", "Blankets", "Mufflers"],
    "Footwear": ["Shoes", "Sandals", "Slippers"],
    "Accessories": ["Bags", "Belts", "Scarves", "Caps"]
}

CONDITIONS = ["New", "Gently Worn", "Used"]
CONDITION_WEIGHTS = [0.20, 0.40, 0.40]

SEASONS = ["Summer", "Monsoon", "Winter", "All Season"]

NGO_CAUSES = [
    "Children Education", "Women Empowerment", "Elderly Care",
    "Homeless Shelter", "Disaster Relief", "Rural Development"
]

# Generate timestamps over 2 years
START_DATE = datetime(2023, 1, 1)
END_DATE = datetime(2024, 12, 31)

def random_date(start, end):
    """Generate random datetime between start and end"""
    delta = end - start
    random_days = random.randint(0, delta.days)
    random_seconds = random.randint(0, 86400)
    return start + timedelta(days=random_days, seconds=random_seconds)

def get_season(date):
    """Determine season based on month"""
    month = date.month
    if month in [2, 3, 4, 5]:
        return "Summer"
    elif month in [6, 7, 8, 9]:
        return "Monsoon"
    elif month in [10, 11, 12, 1]:
        return "Winter"
    return "All Season"

def select_city():
    """Select city based on weights"""
    cities = [c["name"] for c in CITIES]
    weights = [c["weight"] for c in CITIES]
    return random.choices(cities, weights=weights)[0]

def get_city_coords(city_name):
    """Get coordinates for a city"""
    city = next(c for c in CITIES if c["name"] == city_name)
    # Add small random offset for variety
    lat = city["lat"] + random.uniform(-0.05, 0.05)
    lon = city["lon"] + random.uniform(-0.05, 0.05)
    return lat, lon

def generate_donors(num_donors=2500):
    """Generate donor dataset"""
    print("Generating donors...")
    donors = []
    
    for i in range(num_donors):
        donor_id = f"D{i+1:05d}"
        signup_date = random_date(START_DATE, END_DATE - timedelta(days=180))
        
        # 92-95% reliable donors, 5-8% problematic
        is_fraud = random.random() < 0.07
        
        if is_fraud:
            past_donations = random.randint(5, 20)
            reliability_score = random.uniform(0.3, 0.6)
            flagged = random.choice([True, False])
        else:
            past_donations = random.randint(0, 15)
            reliability_score = random.uniform(0.75, 1.0)
            flagged = False
        
        city = select_city()
        
        donors.append({
            "DonorID": donor_id,
            "Name": f"Donor {i+1}",
            "Phone": f"+91{random.randint(7000000000, 9999999999)}",
            "Email": f"donor{i+1}@example.com",
            "City": city,
            "SignupDate": signup_date.strftime("%Y-%m-%d"),
            "Past_Donations": past_donations,
            "Reliability_Score": round(reliability_score, 2),
            "Last_Feedback": random.randint(3, 5) if not is_fraud else random.randint(1, 3),
            "Flagged": flagged
        })
    
    return pd.DataFrame(donors)

def generate_ngos(num_ngos=400):
    """Generate NGO dataset"""
    print("Generating NGOs...")
    ngos = []
    
    for i in range(num_ngos):
        ngo_id = f"NGO{i+1:04d}"
        city = select_city()
        lat, lon = get_city_coords(city)
        
        cause = random.choice(NGO_CAUSES)
        capacity = random.randint(50, 500)
        acceptance_rate = random.uniform(0.6, 0.95)
        urgent = random.choice([True, False, False, False])  # 25% urgent
        
        # Determine special focus based on cause
        special_focus_map = {
            "Children Education": ["Kids Wear", "Footwear"],
            "Women Empowerment": ["Women's Wear", "Accessories"],
            "Elderly Care": ["Winter Wear", "Men's Wear"],
            "Homeless Shelter": ["Winter Wear", "Men's Wear", "Women's Wear"],
            "Disaster Relief": ["All types"],
            "Rural Development": ["All types"]
        }
        special_focus = ", ".join(special_focus_map.get(cause, ["All types"]))
        
        ngos.append({
            "NGO_ID": ngo_id,
            "Name": f"NGO {cause.split()[0]} {i+1}",
            "City": city,
            "Latitude": round(lat, 6),
            "Longitude": round(lon, 6),
            "Cause": cause,
            "Special_Focus": special_focus,
            "Urgent_Need": urgent,
            "Capacity_per_week": capacity,
            "Acceptance_Rate": round(acceptance_rate, 2),
            "Contact": f"ngo{i+1}@example.org"
        })
    
    return pd.DataFrame(ngos)

def generate_donations(donors_df, ngos_df, num_donations=15000):
    """Generate donation dataset"""
    print("Generating donations...")
    donations = []
    
    for i in range(num_donations):
        donation_id = f"DON{i+1:06d}"
        
        # Select donor (fraud donors donate more often)
        donor = donors_df.sample(1).iloc[0]
        if donor["Flagged"]:
            # Fraud donor pattern
            is_fraud_donation = random.random() < 0.4
        else:
            is_fraud_donation = random.random() < 0.02
        
        # Select clothing type and subtype
        category = random.choice(list(CLOTHING_TYPES.keys()))
        subtype = random.choice(CLOTHING_TYPES[category])
        
        # Condition
        condition_donor = random.choices(CONDITIONS, CONDITION_WEIGHTS)[0]
        
        # Fraud pattern: claim better condition than reality
        if is_fraud_donation:
            if condition_donor == "New":
                condition_system = random.choice(["Gently Worn", "Used"])
            elif condition_donor == "Gently Worn":
                condition_system = "Used"
            else:
                condition_system = condition_donor
        else:
            condition_system = condition_donor
        
        # Quantity
        if is_fraud_donation:
            quantity = random.randint(15, 100)  # Over-promise
        else:
            quantity = random.choices(
                [random.randint(1, 10), random.randint(11, 50), random.randint(51, 100)],
                weights=[0.80, 0.15, 0.05]
            )[0]
        
        # Timestamps
        submitted = random_date(
            datetime.strptime(donor["SignupDate"], "%Y-%m-%d"),
            END_DATE
        )
        season = get_season(submitted)
        
        # Admin decision
        if is_fraud_donation and random.random() < 0.3:
            admin_decision = "Rejected"
            matched_ngo = None
            picked_up = None
            delivered = None
        else:
            admin_decision = "Approved"
            matched_ngo = ngos_df.sample(1).iloc[0]["NGO_ID"]
            
            # Pickup and delivery
            if is_fraud_donation and random.random() < 0.5:
                # Fraud: no follow-through
                picked_up = None
                delivered = None
            else:
                picked_up = submitted + timedelta(days=random.randint(2, 10))
                delivered = picked_up + timedelta(days=random.randint(1, 5))
        
        # Location
        city = donor["City"]
        lat, lon = get_city_coords(city)
        
        # Proof
        proof_type = random.choice(["Photo", "Receipt", "None"])
        proof_evidence = "Yes" if proof_type != "None" else "No"
        
        donations.append({
            "DonationID": donation_id,
            "DonorID": donor["DonorID"],
            "Type": category,
            "Subtype": subtype,
            "Size": random.choice(["S", "M", "L", "XL", "XXL", "Free Size"]),
            "Condition_Donor": condition_donor,
            "Condition_System": condition_system,
            "Season": season,
            "Quantity": quantity,
            "Location_City": city,
            "Latitude": round(lat, 6),
            "Longitude": round(lon, 6),
            "Timestamp_Submitted": submitted.strftime("%Y-%m-%d %H:%M:%S"),
            "Timestamp_PickedUp": picked_up.strftime("%Y-%m-%d %H:%M:%S") if picked_up else None,
            "Timestamp_Delivered": delivered.strftime("%Y-%m-%d %H:%M:%S") if delivered else None,
            "Matched_NGO_ID": matched_ngo,
            "AdminDecision": admin_decision,
            "Proof_Type": proof_type,
            "Proof_Evidence": proof_evidence,
            "IsFraud": is_fraud_donation
        })
    
    return pd.DataFrame(donations)

def generate_logs(donations_df, num_logs=80000):
    """Generate donation logs for state transitions"""
    print("Generating donation logs...")
    logs = []
    log_id = 1
    
    for _, donation in donations_df.iterrows():
        submitted = datetime.strptime(donation["Timestamp_Submitted"], "%Y-%m-%d %H:%M:%S")
        
        # State: Submitted
        logs.append({
            "LogID": f"LOG{log_id:06d}",
            "DonationID": donation["DonationID"],
            "State": "submitted",
            "Timestamp": submitted.strftime("%Y-%m-%d %H:%M:%S"),
            "Actor": donation["DonorID"],
            "Feedback": None,
            "Quantity_Received": None
        })
        log_id += 1
        
        # State: Under Review
        under_review = submitted + timedelta(hours=random.randint(1, 48))
        logs.append({
            "LogID": f"LOG{log_id:06d}",
            "DonationID": donation["DonationID"],
            "State": "under_review",
            "Timestamp": under_review.strftime("%Y-%m-%d %H:%M:%S"),
            "Actor": "ADMIN001",
            "Feedback": None,
            "Quantity_Received": None
        })
        log_id += 1
        
        # State: Approved/Rejected
        decision_time = under_review + timedelta(hours=random.randint(1, 24))
        logs.append({
            "LogID": f"LOG{log_id:06d}",
            "DonationID": donation["DonationID"],
            "State": donation["AdminDecision"].lower(),
            "Timestamp": decision_time.strftime("%Y-%m-%d %H:%M:%S"),
            "Actor": "ADMIN001",
            "Feedback": None,
            "Quantity_Received": None
        })
        log_id += 1
        
        if donation["AdminDecision"] == "Approved" and donation["Matched_NGO_ID"]:
            # State: Matched
            matched_time = decision_time + timedelta(hours=random.randint(1, 12))
            logs.append({
                "LogID": f"LOG{log_id:06d}",
                "DonationID": donation["DonationID"],
                "State": "matched",
                "Timestamp": matched_time.strftime("%Y-%m-%d %H:%M:%S"),
                "Actor": donation["Matched_NGO_ID"],
                "Feedback": None,
                "Quantity_Received": None
            })
            log_id += 1
            
            if donation["Timestamp_PickedUp"]:
                # State: Picked Up
                logs.append({
                    "LogID": f"LOG{log_id:06d}",
                    "DonationID": donation["DonationID"],
                    "State": "picked_up",
                    "Timestamp": donation["Timestamp_PickedUp"],
                    "Actor": donation["DonorID"],
                    "Feedback": None,
                    "Quantity_Received": None
                })
                log_id += 1
                
                if donation["Timestamp_Delivered"]:
                    # State: Delivered
                    # Fraud donations: quantity mismatch
                    if donation["IsFraud"] and random.random() < 0.6:
                        quantity_received = int(donation["Quantity"] * random.uniform(0.4, 0.8))
                        feedback = "Quantity mismatch"
                    else:
                        quantity_received = donation["Quantity"]
                        feedback = random.choice(["Excellent", "Good", "Satisfactory"])
                    
                    logs.append({
                        "LogID": f"LOG{log_id:06d}",
                        "DonationID": donation["DonationID"],
                        "State": "delivered",
                        "Timestamp": donation["Timestamp_Delivered"],
                        "Actor": donation["Matched_NGO_ID"],
                        "Feedback": feedback,
                        "Quantity_Received": quantity_received
                    })
                    log_id += 1
    
    return pd.DataFrame(logs)

def main():
    """Main function to generate all datasets"""
    print("=" * 50)
    print("REWEARIFY DATA GENERATION")
    print("=" * 50)
    
    # Generate datasets
    donors_df = generate_donors(2500)
    ngos_df = generate_ngos(400)
    donations_df = generate_donations(donors_df, ngos_df, 15000)
    logs_df = generate_logs(donations_df, 80000)
    
    # Create data directory
    import os
    os.makedirs("../data", exist_ok=True)
    
    # Save to CSV
    print("\nSaving datasets...")
    donors_df.to_csv("../data/donors.csv", index=False)
    ngos_df.to_csv("../data/ngos.csv", index=False)
    donations_df.to_csv("../data/donations.csv", index=False)
    logs_df.to_csv("../data/donation_logs.csv", index=False)
    
    print("\n" + "=" * 50)
    print("DATA GENERATION COMPLETE!")
    print("=" * 50)
    print(f"✅ Donors: {len(donors_df)} records")
    print(f"✅ NGOs: {len(ngos_df)} records")
    print(f"✅ Donations: {len(donations_df)} records")
    print(f"✅ Logs: {len(logs_df)} records")
    print(f"\n📁 Files saved in: ai_service/data/")
    print("=" * 50)
    
    # Print statistics
    print("\n📊 DATASET STATISTICS:")
    print(f"Fraud cases: {donations_df['IsFraud'].sum()} ({donations_df['IsFraud'].mean()*100:.1f}%)")
    print(f"Flagged donors: {donors_df['Flagged'].sum()} ({donors_df['Flagged'].mean()*100:.1f}%)")
    print(f"Urgent NGO needs: {ngos_df['Urgent_Need'].sum()} ({ngos_df['Urgent_Need'].mean()*100:.1f}%)")
    print(f"Cities covered: {', '.join(sorted(ngos_df['City'].unique()))}")

if __name__ == "__main__":
    main()
