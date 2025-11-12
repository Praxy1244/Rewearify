"""Configuration for AI Service"""
import os

class Config:
    # Get the directory where this file is located
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    
    # Data paths
    DATA_DIR = os.path.join(BASE_DIR, "data", "generated")
    MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
    
    # Data generation settings
    NUM_DONORS = 500      # Reduced for faster generation
    NUM_NGOS = 100        # Reduced for faster generation
    NUM_DONATIONS = 2000  # Reduced for faster generation
    
    # Model settings
    LAZY_LOADING = True
    CACHE_MODELS = True
    
    # Matching settings
    TOP_K_MATCHES = 5
    MIN_MATCH_SCORE = 0.3
    
    # Fraud detection settings
    FRAUD_THRESHOLD = 0.7
    
    @classmethod
    def ensure_dirs(cls):
        """Create necessary directories"""
        os.makedirs(cls.DATA_DIR, exist_ok=True)
        os.makedirs(cls.MODELS_DIR, exist_ok=True)

config = Config()
config.ensure_dirs()
