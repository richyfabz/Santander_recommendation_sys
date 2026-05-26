# customer_routes.py Primary recommendation and customer lookup endpoints
# Supports three search modes: customer ID, name/email search, segment browse
from flask          import Blueprint, jsonify, request
from database       import CustomerProfile
from services.recommendation_engine import RecommendationService, PRODUCT_CATALOG
import mlflow

customer_bp = Blueprint('customer', __name__, url_prefix='/api/v1')


# MLflow quality gate helper 
def fetch_mlflow_quality_gates():
    """
    Read training metrics from MLflow SQLite database.
    Falls back to notebook baseline values if query fails.
    """
    try:
        mlflow.set_tracking_uri("sqlite:///../mlflow.db")
        runs = mlflow.search_runs(experiment_ids=["0"], max_results=1)
        if not runs.empty:
            row = runs.iloc[0]
            return {
                "map7"    : round(float(row.get("metrics.map_at_7",        0.0312)), 4),
                "auc"     : round(float(row.get("metrics.auc_roc_macro",   0.7240)), 4),
                "coverage": round(float(row.get("metrics.catalog_coverage",55.40)),  2),
            }
    except Exception:
        pass
    return {"map7": 0.0312, "auc": 0.7240, "coverage": 55.40}


def build_pipeline_audit(cust_id):
    """
    Build the pipeline audit block attached to every recommendation response.
    Simulates drift detection trigger for customer 1005.
    """
    metrics      = fetch_mlflow_quality_gates()
    is_drifted   = (cust_id == 1005)
    baseline_ctr = 50.69
    current_ctr  = 30.43 if is_drifted else 51.12
    ctr_drop     = baseline_ctr - current_ctr

    return {
        "gates": {
            "map7_gate"    : {"metric": "MAP@7",             "value": metrics["map7"],             "threshold": 0.028},
            "auc_gate"     : {"metric": "AUC-ROC",           "value": metrics["auc"],              "threshold": 0.70},
            "coverage_gate": {"metric": "Catalog Coverage",  "value": f"{metrics['coverage']}%",  "threshold": "50.0%"},
        },
        "monitoring": {
            "baseline_ctr" : f"{baseline_ctr}%",
            "current_ctr"  : f"{current_ctr}%",
            "ctr_drop"     : f"{round(ctr_drop, 2)}%",
            "retrain_status": "FIRED – schedule retraining"
                              if ctr_drop >= 10.0 else " NOMINAL",
        },
    }


# Endpoint 1: Recommend by customer ID 
@customer_bp.route('/recommend/<int:cust_id>', methods=['GET'])
def run_recommender_pipeline(cust_id):
    """
    Primary inference endpoint — accepts a numeric customer ID,
    fetches the customer profile from the feature store, runs
    XGBoost inference, and returns ranked recommendations.
    """
    profile = CustomerProfile.query.filter_by(ncodpers=cust_id).first()
    if not profile:
        return jsonify({
            "status" : "error",
            "message": f"Customer {cust_id} not found in feature store."
        }), 404

    recommendations  = RecommendationService.generate_inference_scores(profile)
    human_holdings   = [
        PRODUCT_CATALOG[c]["name"]
        for c in profile.holdings_list
        if c in PRODUCT_CATALOG
    ]

    return jsonify({
        "status"        : "success",
        "customer_id"   : cust_id,
        "name"          : profile.name,
        "segment"       : profile.segment,
        "demographics"  : {
            "income"        : profile.renta,
            "age"           : profile.age,
            "tenure_months" : profile.antiguedad,
        },
        "holdings"       : human_holdings,
        "recommendations": recommendations[:5],
        "pipeline_audit" : build_pipeline_audit(cust_id),
    }), 200


# Endpoint 2: Customer search 
@customer_bp.route('/customers/search', methods=['GET'])
def search_customers():
    """
    Search customers by name, email, or segment.

    Query params:
      q       — partial name or email string (case-insensitive)
      segment — filter by PARTICULARES | UNIVERSITARIO | TOP
      limit   — max results to return (default 10, max 30)

    Returns a list of customer profile cards without running inference.
    Inference only runs when a specific customer is selected.
    """
    query   = request.args.get('q',       '').strip()
    segment = request.args.get('segment', '').strip().upper()
    limit   = min(int(request.args.get('limit', 10)), 30)

    # Start with all profiles
    qs = CustomerProfile.query

    # Apply name/email filter if search query provided
    if query:
        like = f"%{query}%"
        qs = qs.filter(
            db.or_(
                CustomerProfile.name.ilike(like),
                CustomerProfile.email.ilike(like),
            )
        )

    # Apply segment filter if provided
    if segment:
        qs = qs.filter(CustomerProfile.segment == segment)

    profiles = qs.limit(limit).all()

    return jsonify({
        "status"   : "success",
        "count"    : len(profiles),
        "customers": [p.to_dict() for p in profiles],
    }), 200


# Endpoint 3: Browse by segment 
@customer_bp.route('/segments', methods=['GET'])
def list_segments():
    """
    Return summary statistics for each customer segment.
    Used by the segment analysis mode in the UI.
    """
    segments = ['PARTICULARES', 'UNIVERSITARIO', 'TOP']
    result   = []

    for seg in segments:
        profiles = CustomerProfile.query.filter_by(segment=seg).all()
        if not profiles:
            continue
            # In a production system, we might want to return zero counts for empty segments,
            # but for this demo we'll just skip them.
        avg_age    = round(sum(p.age for p in profiles) / len(profiles), 1)
        avg_income = round(sum(p.renta for p in profiles) / len(profiles), 0)
        avg_tenure = round(sum(p.antiguedad for p in profiles) / len(profiles), 1)

        result.append({
            "segment"   : seg,
            "count"     : len(profiles),
            "avg_age"   : avg_age,
            "avg_income": avg_income,
            "avg_tenure": avg_tenure,
        })

    return jsonify({"status": "success", "segments": result}), 200


# Endpoint 4: Product-first reverse lookup 
@customer_bp.route('/products/<string:product_code>/top-customers', methods=['GET'])
def top_customers_for_product(product_code):
    """
    Reverse recommender — given a product code, return the customers
    most likely to add it next month.

    Used by the product-first search mode: a bank manager selects
    a product and sees which customers to target.

    Query params:
      limit — max customers to return (default 10, max 20)
    """
    if product_code not in PRODUCT_CATALOG:
        return jsonify({
            "status" : "error",
            "message": f"Product '{product_code}' not in catalog.",
            "valid_products": list(PRODUCT_CATALOG.keys()),
        }), 404

    limit    = min(int(request.args.get('limit', 10)), 20)
    profiles = CustomerProfile.query.all()

    top = RecommendationService.get_top_customers_for_product(
        product_code, profiles, top_n=limit
    )

    product_info = PRODUCT_CATALOG[product_code]
    return jsonify({
        "status"      : "success",
        "product_code": product_code,
        "product_name": product_info["name"],
        "category"    : product_info["category"],
        "top_customers": top,
    }), 200


# Endpoint 5: Full product catalog 
@customer_bp.route('/products', methods=['GET'])
def list_products():
    """
    Return the full product catalog for populating dropdowns in the UI.
    Used by the product-first search mode to populate the product selector.
    """
    products = [
        {
            "code"    : code,
            "name"    : details["name"],
            "category": details["category"],
            "desc"    : details["desc"],
        }
        for code, details in PRODUCT_CATALOG.items()
    ]
    return jsonify({"status": "success", "products": products}), 200


#  Import needed for search endpoint filters allows use of db.or_ and ilike in queries
from extensions import db