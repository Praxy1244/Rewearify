import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

print('🔄 Generating synthetic donation data for recommendation engine...\n')

# Load NGOs to get valid NGO IDs
try:
    ngos = pd.read_csv('ngos.csv')
    ngo_ids = ngos['_id'].tolist()
    cities_from_ngos = ngos['city'].unique().tolist()
    print(f'✅ Loaded {len(ngo_ids)} NGO IDs')
    print(f'✅ Found {len(cities_from_ngos)} cities\n')
except:
    print('⚠️ Could not load NGOs, using defaults\n')
    ngo_ids = [f'ngo_{i}' for i in range(100)]
    cities_from_ngos = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata']

# Configuration
num_donors = 50
base_donations = 500

# Categories and attributes
categories = ['outerwear', 'formal', 'casual', 'children', 'accessories', 
              'shoes', 'activewear', 'traditional', 'seasonal', 'winter wear']
conditions = ['excellent', 'good', 'fair', 'poor']
cities = cities_from_ngos if len(cities_from_ngos) > 0 else ['Mumbai', 'Delhi', 'Bengaluru']
states = {
    'Mumbai': 'Maharashtra',
    'Delhi': 'Delhi',
    'Bengaluru': 'Karnataka',
    'Chennai': 'Tamil Nadu',
    'Kolkata': 'West Bengal',
    'Pune': 'Maharashtra',
    'Hyderabad': 'Telangana'
}

donations = []

print('📊 Creating donation patterns...\n')

# Create donor profiles with preferences
donor_profiles = {}
for i in range(1, num_donors + 1):
    donor_id = f"donor_{i}"
    donor_profiles[donor_id] = {
        'preferred_category': random.choice(categories),
        'preferred_city': random.choice(cities),
        'donation_frequency': random.choice(['high', 'medium', 'low']),
        'avg_quantity': random.randint(5, 30)
    }

# Generate base donations
for i in range(base_donations):
    donor_id = f"donor_{random.randint(1, num_donors)}"
    profile = donor_profiles[donor_id]
    
    # 70% chance donor donates preferred category
    if random.random() < 0.7:
        category = profile['preferred_category']
    else:
        category = random.choice(categories)
    
    # 60% chance donor uses preferred city
    if random.random() < 0.6:
        city = profile['preferred_city']
    else:
        city = random.choice(cities)
    
    state = states.get(city, 'Maharashtra')
    
    # Quantity based on profile
    quantity = int(np.random.normal(profile['avg_quantity'], 10))
    quantity = max(1, min(quantity, 100))
    
    # 60% chance of being matched
    matched_ngo = random.choice(ngo_ids) if random.random() > 0.4 else None
    
    # Generate dates (past year)
    days_ago = random.randint(0, 365)
    created_date = datetime.now() - timedelta(days=days_ago)
    
    donation = {
        'donation_id': f"don_{i+1}",
        'donor_id': donor_id,
        'category': category,
        'condition': random.choice(conditions),
        'quantity': quantity,
        'city': city,
        'state': state,
        'country': 'India',
        'matched_ngo': matched_ngo,
        'created_at': created_date.isoformat(),
        'status': 'completed' if matched_ngo else random.choice(['pending', 'approved'])
    }
    
    donations.append(donation)

# Add frequent donor activity (makes recommendations better)
print('👥 Adding frequent donor patterns...')
frequent_donors = [f"donor_{i}" for i in range(1, 11)]

for donor_id in frequent_donors:
    profile = donor_profiles[donor_id]
    extra_count = random.randint(10, 25)
    
    for _ in range(extra_count):
        # Frequent donors are more consistent
        category = profile['preferred_category'] if random.random() < 0.8 else random.choice(categories)
        city = profile['preferred_city'] if random.random() < 0.7 else random.choice(cities)
        state = states.get(city, 'Maharashtra')
        
        days_ago = random.randint(0, 365)
        created_date = datetime.now() - timedelta(days=days_ago)
        
        matched_ngo = random.choice(ngo_ids) if random.random() > 0.3 else None
        
        donation = {
            'donation_id': f"don_{len(donations) + 1}",
            'donor_id': donor_id,
            'category': category,
            'condition': random.choice(['excellent', 'good']),
            'quantity': int(np.random.normal(profile['avg_quantity'], 5)),
            'city': city,
            'state': state,
            'country': 'India',
            'matched_ngo': matched_ngo,
            'created_at': created_date.isoformat(),
            'status': 'completed' if matched_ngo else 'approved'
        }
        
        donations.append(donation)

# Create DataFrame
donations_df = pd.DataFrame(donations)

# Save to CSV
output_file = 'synthetic_donations.csv'
donations_df.to_csv(output_file, index=False)

# Statistics
print('\n✅ Synthetic Donation Data Generated!')
print('═══════════════════════════════════════')
print(f'📊 Total Donations: {len(donations_df)}')
print(f'👥 Unique Donors: {donations_df["donor_id"].nunique()}')
print(f'🏢 Matched Donations: {donations_df["matched_ngo"].notna().sum()} ({donations_df["matched_ngo"].notna().sum()/len(donations_df)*100:.1f}%)')

print('\n👥 Donor Activity Levels:')
donor_counts = donations_df.groupby('donor_id').size().sort_values(ascending=False)
print(f'   Most active donor: {donor_counts.iloc[0]} donations')
print(f'   Average per donor: {donor_counts.mean():.1f} donations')
print(f'   Frequent donors (10+): {(donor_counts >= 10).sum()}')

print('\n📦 Top Categories:')
print(donations_df['category'].value_counts().head())

print('\n🗺️ Top Cities:')
print(donations_df['city'].value_counts().head())

print('\n📊 Status Breakdown:')
print(donations_df['status'].value_counts())

print('\n📋 Sample Donations:')
print(donations_df[['donation_id', 'donor_id', 'category', 'city', 'quantity', 'matched_ngo']].head(3))

print(f'\n✅ Data saved to: {output_file}')
print('💡 This data is optimized for recommendation engine training!')
