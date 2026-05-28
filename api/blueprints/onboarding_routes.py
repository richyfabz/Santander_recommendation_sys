import os
import joblib
import numpy as np
import xgboost as xgb
from flask import Blueprint, request, jsonify

# Blueprint mounted under /api/v1 — matches existing route namespace
onboarding_bp = Blueprint('onboarding', __name__, url_prefix='/api/v1')

# ── Complete 24-product catalogue ────────────────────────────────────────────
# Maps every XGBoost class index (0–23) directly to human-readable display data.
# Index order matches the PRODUCT_COLS list used during notebook 03–05 training.
# This eliminates the class_X fallback entirely — every index has a real label.
PRODUCT_INDEX_MAP = {
    0 : {
        "name"       : "Saving Account",
        "category"   : "Accounts",
        "description": "A flexible savings account to grow your money with competitive interest rates.",
    },
    1 : {
        "name"       : "Guarantees",
        "category"   : "Credit",
        "description": "Bank-backed guarantees for rental, business, or legal obligations.",
    },
    2 : {
        "name"       : "Current Account",
        "category"   : "Accounts",
        "description": "Your everyday account for payments, direct debits, and day-to-day banking.",
    },
    3 : {
        "name"       : "Derivada Account",
        "category"   : "Accounts",
        "description": "A linked account offering additional features tied to your main current account.",
    },
    4 : {
        "name"       : "Payroll Account",
        "category"   : "Accounts",
        "description": "Receive your salary directly and enjoy exclusive rewards and cashback benefits.",
    },
    5 : {
        "name"       : "Junior Account",
        "category"   : "Accounts",
        "description": "A savings and spending account designed for young customers under 18.",
    },
    6 : {
        "name"       : "Más Particular Account",
        "category"   : "Accounts",
        "description": "A premium personal account with enhanced service and priority support.",
    },
    7 : {
        "name"       : "Particular Account",
        "category"   : "Accounts",
        "description": "A standard personal current account for everyday transactions.",
    },
    8 : {
        "name"       : "Particular Plus Account",
        "category"   : "Accounts",
        "description": "An upgraded personal account with higher limits and added benefits.",
    },
    9 : {
        "name"       : "Short-term Deposit",
        "category"   : "Investments",
        "description": "Lock your money away for a short period and earn a guaranteed return.",
    },
    10: {
        "name"       : "Medium-term Deposit",
        "category"   : "Investments",
        "description": "A fixed-term deposit offering better rates for a medium commitment period.",
    },
    11: {
        "name"       : "Long-term Deposit",
        "category"   : "Investments",
        "description": "Maximise your savings with a long-term fixed deposit and higher interest.",
    },
    12: {
        "name"       : "e-Account",
        "category"   : "Accounts",
        "description": "A fully digital account managed entirely online with no branch visits needed.",
    },
    13: {
        "name"       : "Investment Funds",
        "category"   : "Investments",
        "description": "Diversify your savings across professionally managed investment portfolios.",
    },
    14: {
        "name"       : "Mortgage",
        "category"   : "Credit",
        "description": "Competitive home loan rates to help you buy your first or next property.",
    },
    15: {
        "name"       : "Pension Plan",
        "category"   : "Investments",
        "description": "A long-term retirement savings plan with tax advantages to secure your future.",
    },
    16: {
        "name"       : "Personal Loan",
        "category"   : "Credit",
        "description": "Flexible borrowing for any purpose — home improvements, travel, or emergencies.",
    },
    17: {
        "name"       : "Tax Account",
        "category"   : "Utilities",
        "description": "A dedicated account for managing tax payments and VAT obligations.",
    },
    18: {
        "name"       : "Credit Card",
        "category"   : "Cards",
        "description": "A flexible credit card with worldwide acceptance and monthly settlement.",
    },
    19: {
        "name"       : "Securities Account",
        "category"   : "Investments",
        "description": "Buy and manage stocks, bonds, and other financial instruments.",
    },
    20: {
        "name"       : "Home Account",
        "category"   : "Accounts",
        "description": "A specialist account for managing property-related payments and expenses.",
    },
    21: {
        "name"       : "Payroll Direct Debit",
        "category"   : "Utilities",
        "description": "Automated salary processing with direct debit management built in.",
    },
    22: {
        "name"       : "Pension Direct Debit",
        "category"   : "Utilities",
        "description": "Automatic pension contribution payments set up and managed for you.",
    },
    23: {
        "name"       : "Direct Debit",
        "category"   : "Utilities",
        "description": "Set up recurring bill payments so you never miss a due date.",
    },
}


def load_pipeline_artifacts():
    """
    Loads the three artifacts produced by notebooks 05 and 06:
    - feature_cols.pkl  : ordered list of 69 feature column names
    - label_encoders.pkl: dict of fitted scikit-learn LabelEncoders
    - xgboost_model.json: trained XGBoost booster with 476 trees

    Path resolves two directories up from this blueprint file to reach
    the project root artifacts/ folder regardless of working directory.
    """
    artifacts_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), '../../artifacts')
    )

    feature_columns = joblib.load(
        os.path.join(artifacts_path, 'feature_cols.pkl')
    )
    label_encoders = joblib.load(
        os.path.join(artifacts_path, 'label_encoders.pkl')
    )

    model = xgb.Booster()
    model.load_model(os.path.join(artifacts_path, 'xgboost_model.json'))

    return feature_columns, label_encoders, model


@onboarding_bp.route('/onboarding/recommend', methods=['POST'])
def cold_start_recommend():
    """
    Cold-start recommendation endpoint.

    Accepts a new customer's basic profile (name, age, income, segment, gender),
    builds a synthetic 69-feature vector that matches what XGBoost was trained on,
    runs real model inference, and returns human-labelled product recommendations.

    New customers have no product history — all 48 lag columns default to 0,
    which correctly signals to the model: this customer holds nothing yet.

    Steps:
        1. Parse and validate form inputs
        2. Load model artifacts from disk
        3. Build synthetic feature vector (known fields + zeros for unknowns)
        4. Run XGBoost inference → 24 class probabilities
        5. Map each class index to human label using PRODUCT_INDEX_MAP
        6. Sort by probability, return top 7
    """
    try:
        payload = request.get_json() or {}

        # ── Step 1: Parse inputs ─────────────────────────────────────────────
        # name is display-only — not used in the feature vector but included
        # in the response so the UI can personalise the results header
        name         = str(payload.get('name', 'New Customer')).strip()
        age          = int(payload.get('age', 30))
        renta        = float(payload.get('income', 60000.0))
        segmento_raw = str(payload.get('segment', '02 - PARTICULARES'))
        sexo_raw     = str(payload.get('gender', 'V'))

        # Basic validation — age must be realistic
        if not (18 <= age <= 110):
            return jsonify({
                "status" : "error",
                "message": "Age must be between 18 and 110."
            }), 400

        # ── Step 2: Load artifacts ───────────────────────────────────────────
        feature_columns, label_encoders, model = load_pipeline_artifacts()

        # ── Step 3: Build synthetic feature vector ───────────────────────────
        # Start with known numeric values
        synthetic = {
            'age'                   : age,
            'renta'                 : renta,
            'antiguedad'            : 0,   # 0 = new customer, no tenure
            'ind_nuevo'             : 1,   # 1 = flagged as new customer
            'indrel'                : 1,   # 1 = primary customer classification
            'ind_actividad_cliente' : 1,   # 1 = active (they are using the form)
            'tipodom'               : 1,   # standard address type constant
            # All lag columns and velocity default to 0 via the loop below
            # because a cold-start customer has no product history
        }

        # Encode categorical fields using the same encoders from training.
        # Each encoder maps a string value to the integer the model expects.
        # Unknown values fall back to the most common training class.
        categorical_defaults = {
            'ind_empleado'    : 'N',   # not an employee
            'pais_residencia' : 'ES',  # Spain (majority of training data)
            'indresi'         : 'S',   # resident in Spain
            'indext'          : 'N',   # not a foreign national
            'indfall'         : 'N',   # not deceased
            'sexo'            : sexo_raw,
            'segmento'        : segmento_raw,
        }

        for field, default_value in categorical_defaults.items():
            if field not in label_encoders:
                # Field not in training encoders — skip, will default to 0 in loop
                continue
            encoder = label_encoders[field]
            value   = default_value

            # If the value was not seen during training, fall back to first known class
            if value not in encoder.classes_:
                value = encoder.classes_[0]

            synthetic[field] = int(encoder.transform([value])[0])

        # Build the final ordered vector by iterating the exact column list
        # the model was trained on. Every column not in synthetic gets 0.0.
        # This correctly zero-fills all 48 lag product columns.
        vector = []
        for col in feature_columns:
            vector.append(float(synthetic.get(col, 0.0)))

        # ── Step 4: XGBoost inference ────────────────────────────────────────
        # Wrap the single-row vector in a DMatrix — XGBoost's native format.
        # feature_names must match the training DMatrix exactly.
        dmatrix      = xgb.DMatrix(
            np.array([vector]),
            feature_names=feature_columns
        )
        # model.predict returns shape (1, 24) — one probability per class
        probabilities = model.predict(dmatrix)[0]   # shape (24,)

        # ── Step 5: Map class indices to human labels ────────────────────────
        # PRODUCT_INDEX_MAP covers all 24 indices (0–23) so no class_X
        # fallback is ever reached. Every index has a real product name.
        recommendations = []
        for class_idx, prob in enumerate(probabilities):
            meta = PRODUCT_INDEX_MAP.get(class_idx, {
                "name"       : f"Product {class_idx}",
                "category"   : "Financial Services",
                "description": "A personalised financial product based on your profile.",
            })
            recommendations.append({
                "product_code": f"product_{class_idx}",
                "name"        : meta["name"],
                "category"    : meta["category"],
                "description" : meta["description"],
                "probability" : round(float(prob), 4),
            })

        # ── Step 6: Sort and return top 7 ───────────────────────────────────
        recommendations.sort(key=lambda x: x['probability'], reverse=True)

        return jsonify({
            "status"         : "success",
            "mode"           : "cold_start",
            "customer_name"  : name,           # passed back for UI personalisation
            "recommendations": recommendations[:7],
        }), 200

    except Exception as e:
        # Return the error string so you can debug during development.
        # In production this would be replaced with a generic message.
        return jsonify({"status": "error", "message": str(e)}), 500