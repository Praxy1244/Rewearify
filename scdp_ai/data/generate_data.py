"""
Synthetic data generator for SCDP AI models
Generates realistic data following the specification schema
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
from faker import Faker
import os

fake = Faker()
np.random.seed(42)
random.seed(42)

class SCDPDataGenerator:
    def __init__(self, 
                 num_donors=2000,
                 num_ngos=500, 
                 num_donations=10000):
        self.num_donors = num_donors
        self.num_ngos = num_ngos
        self.num_donations = num_donations
        
        # Indian cities with coordinates
        self.cities = {
            'Delhi': (28.6139, 77.2090),
            'Mumbai': (19.0760, 72.8777),
            'Bengaluru': (12.9716, 77.5946),
            'Chennai': (13.0827, 80.2707),
            'Kolkata': (22.5726, 88.3639),
            'Hyderabad': (17.3850, 78.4867),
            'Pune': (18.5204, 73.8567),
            'Ahmedabad': (23.0225, 72.5714),
            'Jaipur': (26.9124, 75.7873),
            'Lucknow': (26.8467, 80.9462),
            'Kanpur': (26.4499, 80.3319),
            'Nagpur': (21.1458, 79.0882),
            'Indore': (22.7196, 75.8577),
            'Thane': (19.2183, 72.9781),
            'Bhopal': (23.2599, 77.4126)
        }
        
        self.clothing_types = {
            'shirt': ['t-shirt', 'formal-shirt', 'kurta', 'polo'],
            'jacket': ['winter-jacket', 'blazer', 'hoodie', 'cardigan'],
            'saree': ['cotton-saree', 'silk-saree', 'synthetic-saree'],
            'blanket': ['woolen-blanket', 'cotton-blanket', 'fleece-blanket'],
            'pants': ['jeans', 'trousers', 'track-pants', 'shorts'],
            'dress': ['casual-dress', 'formal-dress', 'ethnic-dress'],
            'footwear': ['shoes', 'sandals', 'slippers', 'boots']
        }
        
        self.ngo_causes = [
            'Child_Welfare', 'Women_Empowerment', 'Disaster_Relief', 
            'Education', 'Healthcare', 'Environment', 'Rural_Development',
            'Elderly_Care', 'Disability_Support', 'Poverty_Alleviation'
        ]
        
    def generate_donors(self):
        """Generate donors table"""
        donors = []
        
        for i in range(self.num_donors):
            city = np.random.choice(list(self.cities.keys()))
            
            donor = {
                'DonorID': f'D{i+1:06d}',
                'Name': fake.name(),
                'Phone': fake.phone_number(),
                'Email': fake.email(),
                'City': city,
                'SignupDate': fake.date_between(start_date='-2y', end_date='today'),
                'Past_Donations': np.random.poisson(3),
                'Reliability_Score': np.random.uniform(0.4, 0.9),
                'Last_Feedback': fake.date_between(start_date='-6m', end_date='today'),
                'Flagged': np.random.choice([True, False], p=[0.05, 0.95])
            }
            donors.append(donor)
            
        return pd.DataFrame(donors)
    
    def generate_ngos(self):
        """Generate NGOs table"""
        ngos = []
        
        for i in range(self.num_ngos):
            city = np.random.choice(list(self.cities.keys()))
            lat, lon = self.cities[city]
            
            # Add some noise to coordinates
            lat += np.random.uniform(-0.1, 0.1)
            lon += np.random.uniform(-0.1, 0.1)
            
            ngo = {
                'NGO_ID': f'NGO{i+1:05d}',
                'Name': f"{fake.company()} Foundation",
                'City': city,
                'Latitude': lat,
                'Longitude': lon,
                'Cause': np.random.choice(self.ngo_causes),
                'Special_Focus': ', '.join(np.random.choice(['children', 'women', 'elderly', 'disabled', 'rural'], 
                                                          size=np.random.randint(1, 3), replace=False)),
                'Urgent_Need': np.random.choice([True, False], p=[0.2, 0.8]),
                'Capacity_per_week': np.random.randint(50, 500),
                'Acceptance_Rate': np.random.uniform(0.6, 0.98),
                'Contact': fake.phone_number()
            }
            ngos.append(ngo)
            
        return pd.DataFrame(ngos)
    
    def generate_donations(self, donors_df, ngos_df):
        """Generate donations table"""
        donations = []
        
        for i in range(self.num_donations):
            donor = donors_df.sample(1).iloc[0]
            
            # Select clothing type and subtype
            clothing_type = np.random.choice(list(self.clothing_types.keys()))
            subtype = np.random.choice(self.clothing_types[clothing_type])
            
            # Condition logic as per spec
            condition_donor = np.random.choice(['New', 'Gently Worn', 'Used'], p=[0.2, 0.4, 0.4])
            
            if condition_donor == 'New':
                condition_system = np.random.choice(['New', 'Gently Worn'], p=[0.95, 0.05])
            elif condition_donor == 'Gently Worn':
                condition_system = np.random.choice(['Gently Worn', 'Used', 'Dirty', 'Torn'], p=[0.7, 0.2, 0.05, 0.05])
            else:  # Used
                condition_system = np.random.choice(['Used', 'Dirty', 'Torn', 'Gently Worn'], p=[0.5, 0.2, 0.1, 0.2])
            
            # Quantity distribution
            quantity_prob = np.random.random()
            if quantity_prob < 0.8:
                quantity = np.random.randint(1, 11)  # Small donations
            elif quantity_prob < 0.95:
                quantity = np.random.randint(11, 51)  # Medium donations
            else:
                quantity = np.random.randint(51, 201)  # Large donations
            
            # Timestamps
            submitted = fake.date_time_between(start_date='-2y', end_date='now')
            picked_up = None
            delivered = None
            matched_ngo = None
            
            # 70% chance of being picked up
            if np.random.random() < 0.7:
                picked_up = submitted + timedelta(days=np.random.randint(1, 10))
                matched_ngo = ngos_df.sample(1).iloc[0]['NGO_ID']
                
                # 80% chance of being delivered if picked up
                if np.random.random() < 0.8:
                    delivered = picked_up + timedelta(days=np.random.randint(1, 7))
            
            # Admin decision logic
            if condition_system in ['Dirty', 'Torn', 'Damaged', 'Unusable']:
                admin_decision = 'AutoRejected'
            elif condition_system in ['New', 'Gently Worn', 'Used']:
                admin_decision = np.random.choice(['AutoApproved', 'ManualApproved'], p=[0.8, 0.2])
            else:
                admin_decision = 'ManualRejected'
            
            city = donor['City']
            lat, lon = self.cities[city]
            lat += np.random.uniform(-0.05, 0.05)
            lon += np.random.uniform(-0.05, 0.05)
            
            donation = {
                'DonationID': f'DON{i+1:08d}',
                'DonorID': donor['DonorID'],
                'Type': clothing_type,
                'Subtype': subtype,
                'Size': np.random.choice(['S', 'M', 'L', 'XL', 'Free'], p=[0.15, 0.3, 0.3, 0.2, 0.05]),
                'Condition_Donor': condition_donor,
                'Condition_System': condition_system,
                'Season': np.random.choice(['Winter', 'Summer', 'All'], p=[0.3, 0.3, 0.4]),
                'Quantity': quantity,
                'Location_City': city,
                'Latitude': lat,
                'Longitude': lon,
                'Timestamp_Submitted': submitted,
                'Timestamp_PickedUp': picked_up,
                'Timestamp_Delivered': delivered,
                'Matched_NGO_ID': matched_ngo,
                'AdminDecision': admin_decision,
                'Proof_Type': np.random.choice(['OTP', 'QR', 'Geo', 'NGOReceipt', 'Photo', None], 
                                             p=[0.2, 0.2, 0.15, 0.15, 0.2, 0.1]),
                'Proof_Evidence': np.random.choice([True, False], p=[0.8, 0.2]) if np.random.random() < 0.9 else None
            }
            donations.append(donation)
            
        return pd.DataFrame(donations)
    
    def generate_logs(self, donations_df):
        """Generate donation logs table"""
        logs = []
        log_id = 1
        
        states = ['submitted', 'under_review', 'approved', 'rejected', 'matched', 'picked_up', 'delivered']
        
        for _, donation in donations_df.iterrows():
            # Always start with submitted
            logs.append({
                'LogID': f'LOG{log_id:08d}',
                'DonationID': donation['DonationID'],
                'State': 'submitted',
                'Timestamp': donation['Timestamp_Submitted'],
                'Actor': 'donor',
                'Feedback': None,
                'Quantity_Received': None
            })
            log_id += 1
            
            # Add review state
            review_time = donation['Timestamp_Submitted'] + timedelta(hours=np.random.randint(1, 48))
            logs.append({
                'LogID': f'LOG{log_id:08d}',
                'DonationID': donation['DonationID'],
                'State': 'under_review',
                'Timestamp': review_time,
                'Actor': 'auto',
                'Feedback': None,
                'Quantity_Received': None
            })
            log_id += 1
            
            # Add approval/rejection
            if donation['AdminDecision'] in ['AutoApproved', 'ManualApproved']:
                decision_time = review_time + timedelta(hours=np.random.randint(1, 24))
                logs.append({
                    'LogID': f'LOG{log_id:08d}',
                    'DonationID': donation['DonationID'],
                    'State': 'approved',
                    'Timestamp': decision_time,
                    'Actor': 'admin' if 'Manual' in donation['AdminDecision'] else 'auto',
                    'Feedback': None,
                    'Quantity_Received': None
                })
                log_id += 1
                
                # Add matched state if NGO assigned
                if pd.notna(donation['Matched_NGO_ID']):
                    match_time = decision_time + timedelta(hours=np.random.randint(1, 12))
                    logs.append({
                        'LogID': f'LOG{log_id:08d}',
                        'DonationID': donation['DonationID'],
                        'State': 'matched',
                        'Timestamp': match_time,
                        'Actor': 'auto',
                        'Feedback': None,
                        'Quantity_Received': None
                    })
                    log_id += 1
                    
                    # Add pickup state
                    if pd.notna(donation['Timestamp_PickedUp']):
                        logs.append({
                            'LogID': f'LOG{log_id:08d}',
                            'DonationID': donation['DonationID'],
                            'State': 'picked_up',
                            'Timestamp': donation['Timestamp_PickedUp'],
                            'Actor': 'ngo',
                            'Feedback': None,
                            'Quantity_Received': None
                        })
                        log_id += 1
                        
                        # Add delivery state with NGO feedback
                        if pd.notna(donation['Timestamp_Delivered']):
                            # Simulate quantity received (sometimes less than claimed)
                            quantity_received = donation['Quantity']
                            if np.random.random() < 0.1:  # 10% chance of mismatch
                                quantity_received = max(1, int(donation['Quantity'] * np.random.uniform(0.5, 0.9)))
                            
                            feedback_rating = np.random.randint(1, 6)
                            feedback_text = self._generate_feedback_text(feedback_rating)
                            
                            logs.append({
                                'LogID': f'LOG{log_id:08d}',
                                'DonationID': donation['DonationID'],
                                'State': 'delivered',
                                'Timestamp': donation['Timestamp_Delivered'],
                                'Actor': 'ngo',
                                'Feedback': f"{feedback_text} (Rating: {feedback_rating}/5)",
                                'Quantity_Received': quantity_received
                            })
                            log_id += 1
            else:
                # Rejected
                rejection_time = review_time + timedelta(hours=np.random.randint(1, 24))
                logs.append({
                    'LogID': f'LOG{log_id:08d}',
                    'DonationID': donation['DonationID'],
                    'State': 'rejected',
                    'Timestamp': rejection_time,
                    'Actor': 'admin' if 'Manual' in donation['AdminDecision'] else 'auto',
                    'Feedback': self._generate_rejection_reason(),
                    'Quantity_Received': None
                })
                log_id += 1
        
        return pd.DataFrame(logs)
    
    def _generate_feedback_text(self, rating):
        """Generate realistic NGO feedback based on rating"""
        if rating >= 4:
            return np.random.choice([
                "Excellent quality donations, very helpful for our beneficiaries",
                "Great condition items, exactly what we needed",
                "Perfect donations, will definitely accept from this donor again",
                "Outstanding quality, exceeded expectations"
            ])
        elif rating >= 3:
            return np.random.choice([
                "Good quality items, minor wear but acceptable",
                "Decent donations, some items better than others",
                "Satisfactory condition, useful for our programs",
                "Average quality but still valuable for our cause"
            ])
        else:
            return np.random.choice([
                "Items not in described condition, some unusable",
                "Quality below expectations, limited usability",
                "Several items damaged or too worn",
                "Condition worse than claimed by donor"
            ])
    
    def _generate_rejection_reason(self):
        """Generate rejection reasons"""
        return np.random.choice([
            "Items in poor condition, not suitable for distribution",
            "Hygiene concerns, items need cleaning",
            "Damaged items, cannot be used safely",
            "Incomplete proof of authenticity"
        ])
    
    def inject_fraud_cases(self, donors_df, donations_df):
        """Inject synthetic fraud cases as per specification"""
        # Select 5% of donors to be fraudulent
        fraud_donors = donors_df.sample(frac=0.05)
        
        for _, donor in fraud_donors.iterrows():
            # Case 1: Many donations with no follow-through
            fraud_donations = donations_df[donations_df['DonorID'] == donor['DonorID']]
            if len(fraud_donations) > 0:
                # Make 80% of their donations have no pickup/delivery
                fraud_indices = fraud_donations.sample(frac=0.8).index
                donations_df.loc[fraud_indices, 'Timestamp_PickedUp'] = None
                donations_df.loc[fraud_indices, 'Timestamp_Delivered'] = None
                donations_df.loc[fraud_indices, 'Matched_NGO_ID'] = None
                
            # Case 2: Large quantity claims with no proof
            large_quantity_donations = fraud_donations[fraud_donations['Quantity'] > 50]
            if len(large_quantity_donations) > 0:
                donations_df.loc[large_quantity_donations.index, 'Proof_Type'] = None
                donations_df.loc[large_quantity_donations.index, 'AdminDecision'] = 'ManualRejected'
        
        # Update donor reliability scores for fraud cases
        for donor_id in fraud_donors['DonorID']:
            donors_df.loc[donors_df['DonorID'] == donor_id, 'Reliability_Score'] *= 0.3
            donors_df.loc[donors_df['DonorID'] == donor_id, 'Flagged'] = True
        
        return donors_df, donations_df
    
    def generate_all_data(self, output_dir='data/generated'):
        """Generate all datasets and save to CSV files"""
        os.makedirs(output_dir, exist_ok=True)
        
        print("Generating donors data...")
        donors_df = self.generate_donors()
        
        print("Generating NGOs data...")
        ngos_df = self.generate_ngos()
        
        print("Generating donations data...")
        donations_df = self.generate_donations(donors_df, ngos_df)
        
        print("Injecting fraud cases...")
        donors_df, donations_df = self.inject_fraud_cases(donors_df, donations_df)
        
        print("Generating logs data...")
        logs_df = self.generate_logs(donations_df)
        
        # Save to CSV files
        donors_df.to_csv(f'{output_dir}/donors.csv', index=False)
        ngos_df.to_csv(f'{output_dir}/ngos.csv', index=False)
        donations_df.to_csv(f'{output_dir}/donations.csv', index=False)
        logs_df.to_csv(f'{output_dir}/donation_logs.csv', index=False)
        
        print(f"\nData generation complete!")
        print(f"Generated {len(donors_df)} donors, {len(ngos_df)} NGOs, {len(donations_df)} donations, {len(logs_df)} log entries")
        print(f"Files saved to {output_dir}/")
        
        return donors_df, ngos_df, donations_df, logs_df

if __name__ == "__main__":
    generator = SCDPDataGenerator(
        num_donors=2000,
        num_ngos=500,
        num_donations=10000
    )
    
    generator.generate_all_data()