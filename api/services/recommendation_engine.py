# recommendation_engine.py — XGBoost inference service
# Replaces the beta distribution simulation with real model predictions.
# Loads xgboost_model.json once at module import time (warm boot pattern).
import os
import logging
import numpy as np

# XGBoost import with graceful fallback so the API doesn't crash
# if the model file is missing during development
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    logging.warning("XGBoost not installed — falling back to simulation")

logger = logging.getLogger(__name__)

# ── Product catalog ───────────────────────────────────────────────────────────
# Maps internal Santander product codes to display names, categories, descriptions.
# Matches the 24 product columns from the training dataset.
PRODUCT_CATALOG = {
    "ind_ahor_fin_ult1" : {"name": "Saving Account",          "category": "Investments", "desc": "Dedicated savings management account."},
    "ind_aval_fin_ult1" : {"name": "Guarantees",              "category": "Credit",      "desc": "Financial guarantee instruments."},
    "ind_cco_fin_ult1"  : {"name": "Current Account",         "category": "Accounts",    "desc": "Everyday transactional bank management."},
    "ind_cder_fin_ult1" : {"name": "Derivada Account",        "category": "Accounts",    "desc": "Derivative financial account."},
    "ind_cno_fin_ult1"  : {"name": "Payroll Account",         "category": "Accounts",    "desc": "Direct salary deposition rewards."},
    "ind_ctju_fin_ult1" : {"name": "Junior Account",          "category": "Accounts",    "desc": "Youth financial management account."},
    "ind_ctma_fin_ult1" : {"name": "Más Particular Account",  "category": "Accounts",    "desc": "Enhanced personal banking account."},
    "ind_ctop_fin_ult1" : {"name": "Particular Account",      "category": "Accounts",    "desc": "Standard personal banking account."},
    "ind_ctpp_fin_ult1" : {"name": "Particular Plus Account", "category": "Accounts",    "desc": "Premium personal banking account."},
    "ind_deco_fin_ult1" : {"name": "Short-term Deposits",     "category": "Investments", "desc": "Short horizon capital preservation."},
    "ind_deme_fin_ult1" : {"name": "Medium-term Deposits",    "category": "Investments", "desc": "Medium horizon capital growth."},
    "ind_dela_fin_ult1" : {"name": "Long-term Deposits",      "category": "Investments", "desc": "Long horizon wealth accumulation."},
    "ind_ecue_fin_ult1" : {"name": "e-Account",               "category": "Accounts",    "desc": "Digital-first banking account."},
    "ind_fond_fin_ult1" : {"name": "Funds",                   "category": "Investments", "desc": "Managed investment fund access."},
    "ind_hip_fin_ult1"  : {"name": "Mortgage",                "category": "Credit",      "desc": "Property financing instrument."},
    "ind_plan_fin_ult1" : {"name": "Pension Plan",            "category": "Investments", "desc": "Long-term retirement savings plan."},
    "ind_pres_fin_ult1" : {"name": "Loans",                   "category": "Credit",      "desc": "Personal and business lending."},
    "ind_reca_fin_ult1" : {"name": "Taxes",                   "category": "Utilities",   "desc": "Tax payment management service."},
    "ind_tjcr_fin_ult1" : {"name": "Credit Card",             "category": "Credit",      "desc": "Flexible premium payment lines."},
    "ind_valo_fin_ult1" : {"name": "Securities",              "category": "Investments", "desc": "Equity and bond portfolio access."},
    "ind_viv_fin_ult1"  : {"name": "Home Account",            "category": "Accounts",    "desc": "Property-linked banking account."},
    "ind_nomina_ult1"   : {"name": "Payroll",                 "category": "Accounts",    "desc": "Payroll processing service."},
    "ind_nom_pens_ult1" : {"name": "Pensions",                "category": "Investments", "desc": "Long-term security asset locking."},
    "ind_recibo_ult1"   : {"name": "Direct Debit",            "category": "Utilities",   "desc": "Automated recursive bill clearing."},
}

# Ordered list of the 24 product columns — must match training order exactly
PRODUCT_COLS = list(PRODUCT_CATALOG.keys())

# ── Model loader ──────────────────────────────────────────────────────────────
def _load_model():
    """
    Load the XGBoost model from the artifacts directory.
    Searches relative to this file's location so it works regardless
    of which directory Flask is launched from.
    """
    if not XGBOOST_AVAILABLE:
        return None

    # Build path relative to this file: api/services/ -> ../../artifacts/
    base_dir   = os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.abspath(__file__)
    )))
    model_path = os.path.join(base_dir, 'artifacts', 'xgboost_model.json')

    if not os.path.exists(model_path):
        logger.warning(f"Model not found at {model_path} — using simulation")
        return None

    try:
        model = xgb.Booster()
        model.load_model(model_path)
        logger.info(f"XGBoost model loaded from {model_path}")
        return model
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return None


# Load once at module import — warm boot pattern
# All requests share this single model instance
_MODEL = _load_model()


# ── Feature builder ───────────────────────────────────────────────────────────
def _build_feature_vector(profile):
    """
    Build a single-row feature matrix from a CustomerProfile object.

    The training pipeline (Stage 4) produced features in this order:
      - 24 current product ownership flags (Int8, binary)
      - 24 lag-1 product ownership flags (from previous month)
      - 24 lag-2 product ownership flags (two months prior)
      - total_products_held_lag_1 (sum of lag-1 flags)
      - product_velocity (lag-1 total minus lag-2 total)
      - renta (gross income, float)
      - age (integer)
      - antiguedad (seniority in months, integer)

    For seeded demo customers we don't have real lag history so we
    approximate: lag-1 = current holdings, lag-2 = current holdings.
    This gives the model realistic ownership context without leakage.
    """
    # Build binary ownership vector for current holdings
    held = set(profile.holdings_list)
    current = [1 if col in held else 0 for col in PRODUCT_COLS]

    # Approximate lag features using current holdings as prior state
    # In a real production system these would come from the feature store
    lag_1 = current.copy()
    lag_2 = current.copy()

    # Aggregate features derived from lag vectors
    total_lag_1    = sum(lag_1)
    product_velocity = total_lag_1 - sum(lag_2)  # Will be 0 for demo customers

    # Normalise income — training data had renta in raw float
    # Clip to reasonable range to avoid outlier effects
    income = min(max(float(profile.renta), 0.0), 1_000_000.0)

    # Assemble complete feature vector in training order
    feature_vector = (
        current +           # 24 current ownership flags
        lag_1 +             # 24 lag-1 flags
        lag_2 +             # 24 lag-2 flags
        [
            total_lag_1,        # aggregate: total products held
            product_velocity,   # aggregate: acquisition velocity
            income,             # demographic: gross income
            float(profile.age), # demographic: age
            float(profile.antiguedad),  # demographic: seniority
        ]
    )
    return np.array(feature_vector, dtype=np.float32).reshape(1, -1)


# ── Inference service ─────────────────────────────────────────────────────────
class RecommendationService:
    """
    Wraps XGBoost inference behind a clean static interface.
    Falls back to beta simulation if the model isn't available.
    """

    @staticmethod
    def generate_inference_scores(profile):
        """
        Run inference for a customer and return ranked product recommendations.

        If the XGBoost model is loaded, runs real predict() and returns
        the softmax probability distribution across 24 product classes.

        If the model is unavailable, falls back to seeded beta simulation
        so the API remains functional during development.

        Args:
            profile: CustomerProfile ORM object from the feature store.

        Returns:
            list: Dicts with product_code, name, category, description,
                  probability — sorted descending by probability,
                  excluding products the customer already holds.
        """
        held_codes = set(profile.holdings_list)

        if _MODEL is not None:
            # ── Real XGBoost inference path ────────────────────────────
            try:
                features = _build_feature_vector(profile)
                dmatrix  = xgb.DMatrix(features)

                # predict() returns shape (1, 24) — one probability per class
                raw_probs = _MODEL.predict(dmatrix)[0]

                recommendations = []
                for idx, code in enumerate(PRODUCT_COLS):
                    # Skip products the customer already owns
                    if code in held_codes:
                        continue

                    details = PRODUCT_CATALOG[code]
                    recommendations.append({
                        "product_code": code,
                        "name"        : details["name"],
                        "category"    : details["category"],
                        "description" : details["desc"],
                        "probability" : round(float(raw_probs[idx]), 4),
                    })

                # Sort descending by probability — highest affinity first
                recommendations.sort(
                    key=lambda x: x['probability'], reverse=True
                )
                return recommendations

            except Exception as e:
                logger.error(f"XGBoost inference failed: {e} — falling back")

        # ── Simulation fallback path ───────────────────────────────────
        # Used when model file is missing or inference throws an error.
        # Seeded with customer ID for reproducible results per customer.
        logger.info(f"Using simulation for customer {profile.ncodpers}")
        np.random.seed(profile.ncodpers % (2**31 - 1))

        recommendations = []
        for code, details in PRODUCT_CATALOG.items():
            if code not in held_codes:
                score = float(np.random.beta(2.5, 4.5))
                recommendations.append({
                    "product_code": code,
                    "name"        : details["name"],
                    "category"    : details["category"],
                    "description" : details["desc"],
                    "probability" : round(score, 4),
                })

        recommendations.sort(key=lambda x: x['probability'], reverse=True)
        return recommendations

    @staticmethod
    def get_top_customers_for_product(product_code, all_profiles, top_n=10):
        """
        Reverse lookup — given a product, return the customers most
        likely to add it next month.

        Used by the product-first search mode in the UI.

        Args:
            product_code: Santander product column name string.
            all_profiles: List of CustomerProfile ORM objects.
            top_n: How many customers to return (default 10).

        Returns:
            list: Customer dicts with probability for the target product,
                  sorted descending, excluding customers who already hold it.
        """
        if product_code not in PRODUCT_CATALOG:
            return []

        results = []
        for profile in all_profiles:
            # Skip customers who already own this product
            if product_code in set(profile.holdings_list):
                continue

            # Run inference and find this product's probability
            recs = RecommendationService.generate_inference_scores(profile)
            prob = next(
                (r['probability'] for r in recs
                 if r['product_code'] == product_code),
                0.0
            )

            results.append({
                **profile.to_dict(),
                'probability': prob,
            })

        results.sort(key=lambda x: x['probability'], reverse=True)
        return results[:top_n]