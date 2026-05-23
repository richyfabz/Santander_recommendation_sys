import os

class ProductionConfig:
    """
    Production-grade application configuration instance profiles.
    
    This class isolates variables, links configuration tokens, paths, 
    and points directly to database endpoints used across the pipeline.
    """
    
    # Secret key signature variable used for cryptographic cookie signing or session protection
    SECRET_KEY = os.environ.get("SECRET_KEY", "santander-secure-session-token-88392")
    
    # Path configuration pointing local SQLite to the low-latency feature cache file
    SQLALCHEMY_DATABASE_URI = "sqlite:///santander_feature_store.db"
    
    # Flag to disable tracking object modifications to preserve system memory space
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Target path connection identifying where the mlflow.db instance is mounted
    MLFLOW_TRACKING_URI = "sqlite:///../mlflow.db"