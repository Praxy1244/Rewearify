import pandas as pd
import numpy as np

# Load fixed NGOs
ngos = pd.read_csv('ngos_fixed.csv')

print(f'📊 Enhancing {len(ngos)} NGOs...\n')

# Map existing columns
ngos['_id'] = ngos['NGO_ID']
ngos['name'] = ngos['Name']
ngos['city'] = ngos['City']
ngos['latitude'] = ngos['Latitude']
ngos['longitude'] = ngos['Longitude']

# Add state column
ngos['state'] = ngos['City'].map({
    'Mumbai': 'Maharashtra',
    'Delhi': 'Delhi',
    'Bengaluru': 'Karnataka',
    'Chennai': 'Tamil Nadu',
    'Kolkata': 'West Bengal',
    'Pune': 'Maharashtra',
    'Hyderabad': 'Telangana',
    'Ahmedabad': 'Gujarat',
    'Jaipur': 'Rajasthan',
    'Lucknow': 'Uttar Pradesh'
}).fillna('Maharashtra')

# Add impact_score
ngos['impact_score'] = np.random.randint(60, 95, len(ngos))

# Focus areas from Cause column
ngos['focus_areas'] = ngos['Cause']

# Accepted clothing types
clothing_types = ['outerwear', 'casual', 'formal', 'children', 'accessories', 'shoes']
ngos['accepted_clothing_types'] = ngos.apply(
    lambda x: ';'.join(np.random.choice(clothing_types, size=np.random.randint(3, 6), replace=False)),
    axis=1
)

# Select and reorder columns
output_cols = [
    '_id', 'name', 'city', 'state', 'latitude', 'longitude',
    'trust_score', 'impact_score', 'focus_areas', 'accepted_clothing_types',
    'Capacity_per_week', 'Acceptance_Rate', 'Urgent_Need', 'Contact'
]

ngos_output = ngos[output_cols]

# Save
ngos_output.to_csv('ngos.csv', index=False)

print('✅ NGO data enhanced!')
print('='*50)
print(f'Total NGOs: {len(ngos_output)}')
print(f'\nColumns: {list(ngos_output.columns)}')
print(f'\nSample:')
print(ngos_output[['_id', 'name', 'city', 'trust_score', 'impact_score']].head(3))
