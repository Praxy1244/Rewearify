import pandas as pd

# Load NGO data
ngos = pd.read_csv('ngos.csv')

print('📊 NGO Data Info:')
print('='*50)
print(f'Total NGOs: {len(ngos)}')
print(f'\nColumns: {list(ngos.columns)}')
print(f'\nSample data:')
print(ngos.head(2))

# Check for missing trust_score
if 'trust_score' not in ngos.columns:
    print('\n⚠️ trust_score column missing!')
    print('💡 Adding default trust_score...')
    ngos['trust_score'] = 75
    ngos.to_csv('ngos_fixed.csv', index=False)
    print('✅ Saved to ngos_fixed.csv')
else:
    print(f'\n✅ trust_score exists')
    print(f'Range: {ngos["trust_score"].min()} - {ngos["trust_score"].max()}')
    
    # Check for NaN values
    if ngos['trust_score'].isna().any():
        print(f'⚠️ Found {ngos["trust_score"].isna().sum()} missing trust_scores')
        ngos['trust_score'].fillna(75, inplace=True)
        ngos.to_csv('ngos_fixed.csv', index=False)
        print('✅ Fixed and saved to ngos_fixed.csv')
