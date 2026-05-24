# This module defines the feedback blueprint for recording customer interactions with recommendations.
# It uses a separate SQLite database to store feedback data, keeping it decoupled from the feature store.
# The feedback API includes endpoints for recording thumbs-up/down
#  and retrieving CTR statistics for monitoring purposes.
import sqlite3
import os
from datetime import datetime
from flask import Blueprint, request, jsonify

# Feedback blueprint mounted under a versioned API namespace
feedback_bp = Blueprint('feedback', __name__, url_prefix='/api/v1/feedback')

# Feedback database lives in the instance folder alongside the feature store
# Using a separate file from santander_feature_store.db as planned —
# this keeps recommendation data and interaction telemetry cleanly separated
FEEDBACK_DB_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    '..', '..', 'instance', 'feedback.db'
)


def get_feedback_connection():
    """
    Open a SQLite connection to the feedback database.
    Creates the database file and table on first call if they do not exist.
    """
    os.makedirs(os.path.dirname(FEEDBACK_DB_PATH), exist_ok=True)
    conn = sqlite3.connect(FEEDBACK_DB_PATH)
    conn.row_factory = sqlite3.Row  # enables dict-like row access

    conn.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id  INTEGER  NOT NULL,
            product_code TEXT     NOT NULL,
            product_name TEXT     NOT NULL,
            clicked      INTEGER  NOT NULL,    1 = thumbs up, 0 = thumbs down
            timestamp    TEXT     NOT NULL,
            session_id   TEXT
        )
    """)
    conn.commit()
    return conn

# Endpoint to record feedback on a recommendation
# Expects JSON body with customer_id, product_code, product_name, clicked (boolean), and optional session_id
@feedback_bp.route('', methods=['POST'])
def record_feedback():
    """
    POST /api/v1/feedback

    Records a customer's thumbs-up or thumbs-down on a recommendation.

    Request body (JSON):
        {
          "customer_id":  1001,
          "product_code": "ind_tjcr_fin_ult1",
          "product_name": "Credit Cards",
          "clicked":      true,
          "session_id":   "optional-string"
        }

    Response 200:
        { "status": "recorded", "feedback_id": 7 }

    Response 400: missing or invalid fields
    """
    # Parse and validate JSON body
    data = request.get_json(silent=True)

    # If body is not valid JSON, return an error response
    # This prevents the server from crashing on bad input and provides clear feedback to the client
    if not data:
        return jsonify({"status": "error", "message": "Request body must be valid JSON"}), 400

    # Validate all required fields are present before writing anything
    required = ['customer_id', 'product_code', 'product_name', 'clicked']
    missing  = [f for f in required if f not in data]
    # If any required fields are missing, return an error response listing them
    if missing:
        return jsonify({"status": "error", "message": f"Missing fields: {missing}"}), 400

    conn = get_feedback_connection() # Open connection to feedback database
    # Insert the feedback record into the database with a timestamp
    cursor = conn.execute("""
        INSERT INTO feedback
            (customer_id, product_code, product_name, clicked, timestamp, session_id)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        int(data['customer_id']),
        str(data['product_code']),
        str(data['product_name']),
        1 if data['clicked'] else 0,
        datetime.utcnow().isoformat(),
        data.get('session_id')
    ))

    conn.commit() # Commit the transaction to save the record
    # Retrieve the ID of the newly inserted feedback record to return in the response
    feedback_id = cursor.lastrowid
    conn.close() # Close the database connection to free up resources
    # Return a success response with the ID of the recorded feedback
    return jsonify({"status": "recorded", "feedback_id": feedback_id}), 200

# Endpoint to retrieve CTR statistics for monitoring purposes
# This allows the frontend dashboard to show live engagement data and identify trends in customer interactions
# It calculates overall CTR and provides a breakdown by product to see which recommendations are resonating
@feedback_bp.route('/stats', methods=['GET'])
def get_feedback_stats():
    """
    GET /api/v1/feedback/stats

    Returns CTR statistics from the feedback table.
    Used by the metrics dashboard to show live engagement data.

    Response 200:
        {
          "total_shown":   42,
          "total_clicked": 18,
          "ctr_pct":       42.86,
          "by_product":    [ { "product_name": "...", "clicks": 5, "total": 8 }, ... ]
        }
    """
    conn = get_feedback_connection() # Open connection to feedback database to read statistics
    # Calculate overall CTR — total clicks divided by total feedback events
    # This gives a high-level view of how customers are engaging with recommendations across the board      

    # Overall CTR — total clicks divided by total feedback events 
    row = conn.execute(
        "SELECT COUNT(*), COALESCE(SUM(clicked), 0) FROM feedback"
    ).fetchone()

    total  = row[0] or 0
    clicks = row[1] or 0
    ctr    = round((clicks / total * 100), 2) if total > 0 else 0.0

    # Per-product breakdown shows which products are resonating
    product_rows = conn.execute("""
        SELECT
            product_name,
            SUM(clicked)   AS clicks,
            COUNT(*)       AS total
        FROM feedback
        GROUP BY product_name
        ORDER BY clicks DESC
    """).fetchall()

    conn.close() # Close the database connection after reading statistics to free up resources
    # Return the statistics in a structured JSON format for the frontend dashboard to consume
    return jsonify({
        "total_shown"   : total,
        "total_clicked" : clicks,
        "ctr_pct"       : ctr,
        "by_product"    : [
            {
                "product_name": r["product_name"],
                "clicks"      : r["clicks"],
                "total"       : r["total"],
                "ctr_pct"     : round(r["clicks"] / r["total"] * 100, 1) if r["total"] else 0
            }
            for r in product_rows
        ]
    }), 200 