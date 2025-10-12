# SCDP AI Implementation TODO

## Project Structure
```
scdp_ai/
├── data/
│   ├── generate_data.py
│   └── generated/ (CSVs will be stored here)
├── models/
│   ├── __init__.py
│   ├── matching.py
│   ├── fraud_detection.py
│   ├── clustering.py
│   ├── time_series.py
│   └── fsm.py
├── utils/
│   ├── __init__.py
│   ├── feature_engineering.py
│   └── preprocessing.py
├── api/
│   ├── main.py
│   ├── endpoints/
│   │   ├── __init__.py
│   │   ├── matching.py
│   │   ├── fraud.py
│   │   ├── clustering.py
│   │   └── forecasting.py
│   └── schemas.py
├── tests/
│   ├── test_matching.py
│   ├── test_fraud.py
│   ├── test_clustering.py
│   ├── test_time_series.py
│   └── test_api.py
├── notebooks/
│   ├── data_exploration.ipynb
│   ├── model_evaluation.ipynb
│   └── demo.ipynb
├── requirements.txt
└── README.md
```

## Implementation Plan
1. ✅ Data generation script with realistic synthetic data
2. ✅ Feature engineering utilities
3. ✅ Content-Based Filtering (CBF) matching model
4. ✅ Fraud detection model (Logistic Regression + Random Forest)
5. ✅ NGO clustering (DBSCAN + KMeans)
6. ✅ Time series forecasting (Prophet)
7. ✅ Finite State Machine (FSM) for donation lifecycle
8. ✅ FastAPI service with all endpoints
9. ✅ Comprehensive test cases
10. ✅ Documentation and examples

## Key Features
- Human-in-the-loop design (AI assists, doesn't auto-reject)
- Explainable models (Decision Trees, scoring functions)
- Single dataset design supporting all models
- Conservative thresholds for fraud detection
- Comprehensive evaluation metrics