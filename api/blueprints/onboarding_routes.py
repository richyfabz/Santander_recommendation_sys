import os
import joblib
import numpy as np
import xgboost as xgb
from flask import Blueprint, request, jsonify, current_app
from sklearn.preprocessing import LabelEncoder

# Instantiate the blueprint with an explicit prefix to prevent routing namespace overlap 
# with your pre-existing legacy feature store database query endpoints.
onboarding_bp = Blueprint('onboarding', __name__, url_prefix='/api/v1')

# Hardcoded human-readable product dictionary catalog used to convert raw strings 
# parsed from the pipeline's target array back to clean UI dashboard presentation elements.
PRODUCT_CATALOG = {
    "ind_cco_fin_ult1": {
        "name": "Current Accounts", 
        "category": "Accounts", 
        "description": "Standard transactional checkings asset handling core daily operational flows."
    },
    "ind_reca_fin_ult1": {
        "name": "Payroll Account", 
        "category": "Accounts", 
        "description": "Direct automated salary deposition contract featuring premium card/cashback yields."
    },
    "ind_tjcr_fin_ult1": {
        "name": "Credit Cards", 
        "category": "Cards", 
        "description": "Flexible global secondary line of credit with automated monthly settlement parameters."
    },
    "ind_recibo_ult1": {
        "name": "Direct Debits", 
        "category": "Accounts", 
        "description": "Streamlined recurring electronic billing gateway for utility and subscription connectivity."
    },
    "ind_nom_pens_ult1": {
        "name": "Pensions", 
        "category": "Investments", 
        "description": "Tax-advantaged long-term matching capital reserves optimized for post-employment security."
    }
}

def load_pipeline_artifacts():
    """
    Safely resolves, opens, and hydrates the serialized binaries generated during 
    the 05_split and 06_model_training notebook implementation steps.
    """
    # Trace dynamically back to the root directory structure relative to this blueprint file
    artifacts_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../artifacts'))
    
    # Hydrate the ordered feature column template layout string list array
    with open(os.path.join(artifacts_path, 'feature_cols.pkl'), 'rb') as f:
        feature_columns = joblib.load(f)
        
    # Hydrate the multidimensional dictionary containing scikit-learn LabelEncoder instances
    with open(os.path.join(artifacts_path, 'label_encoders.pkl'), 'rb') as f:
        label_encoders = joblib.load(f)
        
    # Instantiate a blank XGBoost booster pointer and populate its weight nodes from the JSON file
    model = xgb.Booster()
    model.load_model(os.path.join(artifacts_path, 'xgboost_model.json'))
    
    return feature_columns, label_encoders, model

@onboarding_bp.route('/onboarding/recommend', methods=['POST'])
def cold_start_recommend():
    """
    Primary endpoint for processing un-registered incoming customer form matrices,
    assembling an input vector matching the structure expected by the XGBoost model,
    and serving real-time sorted product propensity scores.
    """
    try:
        # Extract the incoming JSON payload context safe fallback to blank dictionary
        data = request.get_json() or {}
        
        # 1. Capture and isolate raw form inputs with explicit type casting configurations
        age = int(data.get('age', 30))
        renta = float(data.get('income', 60000.0))
        segmento_raw = data.get('segment', '02 - PARTICULARES')
        sexo_raw = data.get('gender', 'V')
        
        # 2. Extract our underlying framework schema variables from local memory disk
        feature_columns, label_encoders, model = load_pipeline_artifacts()
        
        # 3. Initialize a map to hold the custom customer attributes before vectorization
        synthetic_profile = {}
        
        # Inject numerical features directly into our staging map
        synthetic_profile['age'] = age
        synthetic_profile['renta'] = renta
        synthetic_profile['antiguedad'] = 0     # 0 months tenure signifies a cold-start entity
        synthetic_profile['ind_nuevo'] = 1       # Explicitly flags the record matrix row as a new client
        synthetic_profile['indrel'] = 1          # Establishes structural classification as a primary customer
        synthetic_profile['ind_actividad_cliente'] = 1  # Forces active state visibility since they are interacting with the UI
        
        # Apply standard categorical default text values for missing parameters required by training data
        synthetic_profile['ind_empleado'] = label_encoders['ind_empleado'].transform(['N'])[0]
        synthetic_profile['pais_residencia'] = label_encoders['pais_residencia'].transform(['ES'])[0]
        synthetic_profile['indresi'] = label_encoders['indresi'].transform(['S'])[0]
        synthetic_profile['indext'] = label_encoders['indext'].transform(['N'])[0]
        synthetic_profile['indfall'] = label_encoders['indfall'].transform(['N'])[0]
        synthetic_profile['tipodom'] = 1 # Constant positional integer field mapped during training database ingestion
        
        # Dynamically transform 'segmento' input selection text using the pipeline's unique label encoder
        try:
            synthetic_profile['segmento'] = label_encoders['segmento'].transform([segmento_raw])[0]
        except Exception:
            # Fall back to the distribution mode if form entries fail alignment
            synthetic_profile['segmento'] = label_encoders['segmento'].transform(['02 - PARTICULARES'])[0]
            
        # Dynamically transform 'sexo' input selection text using the pipeline's unique label encoder
        try:
            synthetic_profile['sexo'] = label_encoders['sexo'].transform([sexo_raw])[0]
        except Exception:
            # Fall back to the distribution mode if form entries fail alignment
            synthetic_profile['sexo'] = label_encoders['sexo'].transform(['V'])[0]
            
        # 4. Generate the final flat sequential array by validating against the ordered column template.
        # This safely defaults all 48 lag columns, total products held, and velocity parameters to 0.
        synthetic_vector = []
        for col in feature_columns:
            if col in synthetic_profile:
                synthetic_vector.append(synthetic_profile[col])
            else:
                # If column field is a string object managed by an encoder, resolve default zero index mapping
                if col in label_encoders:
                    try:
                        synthetic_vector.append(label_encoders[col].transform([0])[0])
                    except Exception:
                        synthetic_vector.append(0)
                else:
                    # Continuous tracking fields defaults cleanly to a standard floating-point 0.0
                    synthetic_vector.append(0.0)
                    
        # 5. Pack the flat list array into a multi-dimensional row vector, then wrap into an XGBoost matrix context
        data_matrix = xgb.DMatrix(np.array([synthetic_vector]), feature_names=feature_columns)
        
        # 6. Fire local native booster mathematical inference calculation across all 24 classes simultaneously
        probabilities = model.predict(data_matrix)[0]
        
        # 7. Access target arrays, inverse transform class integer pointers, and format returning payload
        raw_encoder = label_encoders.get('target', None)
        recommendations = []
        
        for class_idx, prob in enumerate(probabilities):
            if raw_encoder:
                # Map integer indices back to alphanumeric string codes (e.g. 3 -> "ind_cco_fin_ult1")
                prod_code = raw_encoder.inverse_transform([class_idx])[0]
            else:
                prod_code = f"class_{class_idx}"
                
            # If the matching item exists in our user catalogue map, use its presentation details
            meta = PRODUCT_CATALOG.get(prod_code, {
                "name": prod_code.replace('ind_', '').replace('_fin_ult1', '').title(),
                "category": "Financial Services",
                "description": "Custom personalized asset suggestion tailored to your profile settings."
            })
            
            recommendations.append({
                "product_code": prod_code,
                "name": meta["name"],
                "category": meta["category"],
                "description": meta["description"],
                "probability": float(prob)
            })
            
        # Sort the array context descending based on mathematical probability confidence strength
        recommendations.sort(key=lambda x: x['probability'], reverse=True)
        
        # Return structured JSON output response block containing top 7 product suggestions
        return jsonify({
            "status": "success",
            "mode": "cold_start",
            "recommendations": recommendations[:7]
        })
        
    except Exception as e:
        # Gracefully handle validation failures, reporting details without halting the main WSGI listener loop
        return jsonify({"status": "error", "message": str(e)}), 500