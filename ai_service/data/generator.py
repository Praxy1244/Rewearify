"""Generate synthetic data for AI models - Simple version for beginners"""

import pandas as pd
import random
from datetime import datetime, timedelta
import os

class SimpleDataGenerator:
    def __init__(self, output_dir, num_donors=500, num_ngos=100, num_donations=2000):
        self.output_dir = output_dir
        self.num_donors = num_donors
        self.num_ngos = num_ngos
        self.num_donations = num_donations
        
        # Indian cities
        self.cities = ['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Kolkata', 
                       'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow']
        
        self.categories = ['outerwear', 'casual', 'formal', 'children', 'shoes', 'accessories']
        self.conditions = ['excellent', 'good', 'fair']
        
    def generate_all(self):
        """Generate all data files"""
        print("🔄 Generating data... Please wait...")
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Generate donors
        print("  ↳ Creating donors...")
        donors = []
        for i in range(self.num_donors):
            donors.append({
                'donor_id': f'D{i+1:05d}',
                'name': f'Donor {i+1}',
                'city': random.choice(self.cities),
                'reliability_score': round(random.uniform(0.5, 1.0), 2),
                'past_donations': random.randint(0, 20),
                'flagged': random.choice([True, False]) if random.random() < 0.1 else False
            })
        donors_df = pd.DataFrame(donors)
        donors_df.to_csv(f"{self.output_dir}/donors.csv", index=False)
        print(f"  ✓ Created {len(donors)} donors")
        
        # Generate NGOs
        print("  ↳ Creating NGOs...")
        ngos = []
        for i in range(self.num_ngos):
            ngos.append({
                'ngo_id': f'NGO{i+1:04d}',
                'name': f'NGO {i+1}',
                'city': random.choice(self.cities),
                'categories_accepted': ','.join(random.sample(self.categories, random.randint(2, 4))),
                'capacity': random.randint(50, 300),
                'urgent_need': random.choice([True, False])
            })
        ngos_df = pd.DataFrame(ngos)
        ngos_df.to_csv(f"{self.output_dir}/ngos.csv", index=False)
        print(f"  ✓ Created {len(ngos)} NGOs")
        
        # Generate donations
        print("  ↳ Creating donations...")
        donations = []
        for i in range(self.num_donations):
            donor = random.choice(donors)
            donations.append({
                'donation_id': f'DN{i+1:06d}',
                'donor_id': donor['donor_id'],
                'category': random.choice(self.categories),
                'condition': random.choice(self.conditions),
                'quantity': random.randint(1, 20),
                'city': donor['city'],
                'timestamp': (datetime.now() - timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d'),
                'matched_ngo': random.choice(ngos)['ngo_id'] if random.random() < 0.6 else None,
                'status': random.choice(['pending', 'approved', 'matched', 'delivered'])
            })
        donations_df = pd.DataFrame(donations)
        donations_df.to_csv(f"{self.output_dir}/donations.csv", index=False)
        print(f"  ✓ Created {len(donations)} donations")
        
        print("\n✅ Data generation complete!")
        print(f"📁 Files saved to: {self.output_dir}")
        return donors_df, ngos_df, donations_df

# Script to run data generation
if __name__ == "__main__":
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(__file__)))
    from config import config
    
    print("=" * 50)
    print("  REWEARIFY - DATA GENERATOR")
    print("=" * 50)
    
    generator = SimpleDataGenerator(
        output_dir=config.DATA_DIR,
        num_donors=config.NUM_DONORS,
        num_ngos=config.NUM_NGOS,
        num_donations=config.NUM_DONATIONS
    )
    
    generator.generate_all()
    
    print("\n🎉 All done! You can now start the AI service.")
