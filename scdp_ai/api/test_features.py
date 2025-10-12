# api/test_features.py
import os
import pandas as pd
from utils.feature_engineering import FeatureEngineer

# Paths to your data
data_dir = "C:/Users/Lenovo/Major/scdp_ai/data/generated"

# Load a small sample of each CSV for testing
donors_df = pd.read_csv(os.path.join(data_dir, "donors.csv")).head(100)
ngos_df = pd.read_csv(os.path.join(data_dir, "ngos.csv")).head(100)
donations_df = pd.read_csv(os.path.join(data_dir, "donations.csv")).head(100)
logs_df = pd.read_csv(os.path.join(data_dir, "donation_logs.csv")).head(100)

# Initialize FeatureEngineer
fe = FeatureEngineer()

# Prepare matching features
print("Preparing matching features...")
matching_features = fe.prepare_matching_features(donations_df, ngos_df)
print("Matching features prepared:")
print(matching_features.head(25))

# Prepare fraud features
print("\nPreparing fraud features...")
fraud_features = fe.prepare_fraud_features(donors_df, donations_df, logs_df)
print("Fraud features prepared:")
print(fraud_features.head(25))

# Prepare clustering features
print("\nPreparing clustering features...")
clustering_features = fe.prepare_clustering_features(ngos_df, donations_df)
print("Clustering features prepared:")
print(clustering_features.head(25))

# Prepare timeseries features
print("\nPreparing timeseries features...")
city_type_monthly, ngo_monthly = fe.prepare_timeseries_features(donations_df, ngos_df)
print("Timeseries features prepared:")
print("City type monthly shape:", city_type_monthly.shape)
print("NGO monthly shape:", ngo_monthly.shape)

print("\nFeature preparation test completed successfully!")
