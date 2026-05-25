# Santander RecSys — Bank Product Recommendation System

> An end-to-end machine learning pipeline that predicts which new financial
> products Santander bank customers will add next month, served via a Flask
> REST API and displayed on a React dashboard.

---

## Table of Contents

1. [Project overview](#project-overview)
2. [Quick start](#quick-start)
3. [Project structure](#project-structure)
4. [The 8-stage ML pipeline](#the-8-stage-ml-pipeline)
5. [Flask backend](#flask-backend)
6. [React frontend](#react-frontend)
7. [Database design](#database-design)
8. [API reference](#api-reference)
9. [Model metrics](#model-metrics)
10. [Monitoring system](#monitoring-system)
11. [Tech stack](#tech-stack)

---

## Project overview

This project trains an XGBoost multi-class gradient boosting model on the
[Santander Product Recommendation Kaggle dataset](https://www.kaggle.com/c/santander-product-recommendation)
and serves personalised banking product recommendations through a production-style
web application.

**What it recommends:** Given a customer ID, the system predicts which of 24
Santander banking products (credit cards, mortgages, pension plans, savings
accounts, etc.) the customer is most likely to add next month.

**Key results:**
- MAP@7: **0.699** (validation set)
- AUC-ROC: **0.894** (macro one-vs-rest)
- Catalog coverage: **55.4%** (13 of 24 products recommended)
- Training time: **11 minutes** on CPU (early stopping at round 476 of 500)

---

## Quick start

### Prerequisites

- Python 3.10 or 3.11
- Node.js 18+
- The Santander dataset downloaded from Kaggle (train_ver2.csv)

### 1. Clone and set up the virtual environment

```bash
git clone <your-repo-url>
cd santander-recommender

python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### 2. Initialise the database

```bash
cd Flask_app
PYTHONPATH=.:api FLASK_APP=api.app flask init-db
```

This creates `instance/santander_feature_store.db` and seeds three
test customers: **1001**, **1002**, and **1005**.

### 3. Start the Flask API

```bash
# From Flask_app/ with venv active
PYTHONPATH=.:api FLASK_APP=api.app flask run --port=5000

# With auto-reload during development
PYTHONPATH=.:api FLASK_APP=api.app FLASK_DEBUG=1 flask run --port=5000
```

Flask will be live at `http://localhost:5000`.

### 4. Start the React frontend

```bash
cd Flask_app/frontend
npm install        # first time only
npm start
```

React will open at `http://localhost:3000`.

### 5. Test the system

Open `http://localhost:3000/search` and enter customer ID **1001**, **1002**,
or **1005** to see live recommendations.

---

## Project structure

```
santander-recommender/
│
├── notebooks/                      # 8 Jupyter notebooks — one per pipeline stage
│   ├── 01_data_ingestion.ipynb
│   ├── 02_cohort_selection.ipynb
│   ├── 03_target_engineering.ipynb
│   ├── 04_feature_engineering_lagGen.ipynb
│   ├── 05_split_and_DMatrix_formatting.ipynb
│   ├── 06_model_training.ipynb
│   ├── 07_evaluation.ipynb
│   └── 08_CTR_simulation.ipynb
│
├── data/
│   ├── raw/                        # Original Kaggle CSV files (git-ignored)
│   │   ├── train_ver2.csv          # 13.3M rows, 48 columns
│   │   └── test_ver2.csv
│   ├── landing/                    # Stage 1 output — typed Parquet
│   │   └── train.parquet
│   └── processed/                  # Pipeline stage outputs
│       ├── cohort.parquet
│       ├── targets.parquet
│       ├── features.parquet        # 33,870 rows × 71 columns
│       └── customer_snapshot.parquet
│
├── artifacts/                      # Trained model and preprocessing artifacts
│   ├── xgboost_model.json          # Trained XGBoost model (476 trees)
│   ├── label_encoders.pkl          # Fitted scikit-learn LabelEncoders
│   ├── feature_cols.pkl            # Ordered feature column list
│   ├── sample_weights.npy          # Per-sample class imbalance weights
│   ├── y_val.npy                   # Validation true labels
│   ├── dtrain.buffer               # XGBoost DMatrix (training)
│   ├── dval.buffer                 # XGBoost DMatrix (validation)
│   ├── training_config.json        # Hyperparameters and metric record
│   ├── loss_curve.png              # Training vs validation loss plot
│   └── drift_distributions.png    # Notebook 08 drift visualisation
│
├── Flask_app/
│   ├── api/                        # Flask application
│   │   ├── app.py                  # Application factory
│   │   ├── config.py               # ProductionConfig class
│   │   ├── extensions.py           # SQLAlchemy + CORS instances
│   │   ├── database.py             # CustomerProfile ORM model
│   │   ├── blueprints/
│   │   │   ├── customer_routes.py  # GET /api/v1/recommend/<id>
│   │   │   ├── feedback_routes.py  # POST /api/v1/feedback
│   │   │   └── health_routes.py    # GET /api/v1/health
│   │   └── services/
│   │       └── recommendation_engine.py
│   │
│   ├── instance/
│   │   ├── santander_feature_store.db   # Customer profiles (SQLite)
│   │   └── feedback.db                  # Click feedback events (SQLite)
│   │
│   └── frontend/                   # React application
│       ├── src/
│       │   ├── App.jsx             # Router + layout shell
│       │   ├── index.css           # Design system tokens
│       │   ├── pages/
│       │   │   ├── HomePage.jsx
│       │   │   ├── SearchPage.jsx
│       │   │   ├── MetricsPage.jsx
│       │   │   ├── ProfilePage.jsx
│       │   │   └── AboutPage.jsx
│       │   ├── components/
│       │   │   ├── Navbar.jsx
│       │   │   └── Footer.jsx
│       │   └── services/
│       │       └── api.js          # Axios API service layer
│       └── package.json
│
├── src/                            # Reusable Python modules
│   ├── metrics.py                  # MAP@K, NDCG@K, AUC-PR functions
│   └── drift_detector.py           # PSI and KS test functions
│
├── monitoring/
│   ├── compute_metrics.py
│   ├── drift_report.py
│   └── retrain_trigger.py
│
├── requirements.txt
└── mlflow.db                       # MLflow experiment tracking
```

---

## The 8-stage ML pipeline

Each stage is a self-contained Jupyter notebook. Running them in order
from 01 to 08 reproduces the entire trained model from scratch.

### Stage 1 — Data ingestion (`01_data_ingestion.ipynb`)

**Problem:** The raw CSV file is 2.5 GB with 13.3 million rows. Reading it
directly into pandas exhausts memory on most laptops.

**Solution:** Stream the file in chunks of 100,000 rows using
`pandas.read_csv(..., chunksize=100000)`, enforce strict data types during
reading (customer ID as `int32`, product ownership columns as `int8`), and
persist the entire dataset to Apache Parquet format.

**Why Parquet?** Parquet uses columnar storage it stores all values for
one column together on disk rather than one full row at a time. This means
reading only the columns you need is fast, and the file compresses from
~2.5 GB CSV to under 500 MB.

**Output:** `data/landing/train.parquet`

---

### Stage 2 — Cohort selection (`02_cohort_selection.ipynb`)

**Problem:** 13.3 million rows covering 17 months of data. Training on
everything would be slow and the oldest data has limited relevance.

**Solution:** Filter to the final 3 snapshot months (March, April, May 2016)
and keep only customers present in all three months. This produces a
cohort of ~600,000 active customers confirmed representative of the
full dataset (max ownership rate difference: 5.1%).

**Why 3 months?** The feature engineering stage in notebook 04 needs
lag-1 (previous month) and lag-2 (two months ago) product states for
each customer. Three months gives us enough history to build both lag
features while keeping the dataset manageable.

**Output:** `data/processed/cohort.parquet` (~1.8M rows)

---

### Stage 3 — Target engineering (`03_target_engineering.ipynb`)

**Problem:** Standard recommendation frameworks recommend items a user
does not own yet but XGBoost needs a single integer target label per
training row, not a set of items.

**Solution:** Compute the difference vector ΔP = P(month_t)  P(month_t−1)
for each customer's product ownership. A value of +1 means a product was
newly added that month. This becomes the training target.

**Row flattening:** If a customer added 3 products in one month, create
3 separate training rows one per new product. Each row gets a target
integer from 0–23 representing which product was added.

**Class imbalance discovered:** The resulting target distribution shows a
9,852x imbalance between the most and least common product class. Some
products like current accounts are added by thousands of customers;
niche products like guarantee accounts by almost none.

**Output:** `data/processed/targets.parquet` (33,870 rows)

---

### Stage 4 — Feature engineering (`04_feature_engineering_lagGen.ipynb`)

**Problem:** XGBoost is a tree-based model. It cannot remember previous
rows — it sees each row in isolation. So the model has no way to know
what products a customer held last month unless we explicitly add that
information to each row.

**Solution:** Generate lag features. For each of the 24 product columns:
- `lag_1`: what did the customer own in month t−1?
- `lag_2`: what did the customer own in month t−2?

This adds 48 new columns (24 × 2) of historical context.

**Aggregate features:**
- `total_products_held_lag_1`: sum of all 24 lag_1 columns captures
  how financially active the customer is
- `product_velocity`: lag_1 total minus lag_2 total positive means
  growing, negative means churning

**Income imputation:** The `renta` (income) column has 659,619 null
values. Rather than filling with a global average, impute using the
median income for that customer's province (`nomprov`). Customers
in Madrid earn very differently from customers in rural provinces.
A global fallback handles customers whose province is also null.

**Output:** `data/processed/features.parquet` (33,870 rows × 71 columns)

---

### Stage 5 — Split and DMatrix formatting (`05_split_and_DMatrix_formatting.ipynb`)

**Problem:** The features file is sorted by target product index (an
artefact of the flattening step in notebook 03). A simple 80/20 positional
split would put all of one product class in validation and none in training.

**Solution:** Shuffle the dataframe with `random_state=42` before splitting.
This distributes all 21 active product classes across both sets proportionally.

**Why not stratified split?** Three product classes have only 1 example each
in the dataset. Scikit-learn's stratified split requires at least 2 examples
per class — it crashes with a `ValueError` on singleton classes.

**Why not temporal split?** The temporal ordering is already encoded in the
lag features numerically. Each row carries its own historical context in
the `_lag_1` and `_lag_2` columns, so row ordering does not matter for
the model.

**Sample weights:** Compute `compute_sample_weight('balanced')` from
scikit-learn. This assigns each training row a weight inversely proportional
to how common its product class is. Rare products (weight >> 1) get more
attention during tree splitting. This is how we handle the 9,852x class
imbalance without SMOTE.

**DMatrix format:** Convert the pandas DataFrames to `xgb.DMatrix`, XGBoost's
native binary matrix format. This pre-computes the feature histograms needed
for tree splitting, making training ~3× faster than passing raw numpy arrays.

**Output:** `artifacts/dtrain.buffer`, `artifacts/dval.buffer`,
`artifacts/sample_weights.npy`

---

### Stage 6 — Model training (`06_model_training.ipynb`)

**Algorithm:** XGBoost (eXtreme Gradient Boosting) with the `multi:softprob`
objective.

**What multi:softprob does:** For each customer, instead of predicting one
product, the model computes a probability score for all 24 products
simultaneously using the softmax function. The scores sum to 1.0,
forming a proper probability distribution. This lets us rank all 24
products by confidence and return the top-N.

**Key hyperparameters:**
- `eta=0.05` — learning rate. Low value means each tree contributes a
  small correction. More trees needed, but generalisation is better.
- `max_depth=6` — maximum depth of each decision tree. Controls
  complexity. Deeper trees can overfit.
- `subsample=0.9` — each tree sees a random 90% sample of training rows.
  Prevents over-reliance on any single customer's pattern.
- `colsample_bytree=0.9` — each tree sees a random 90% of feature columns.
  Forces the model to discover diverse feature combinations.
- `num_class=24` — fixed at 24 even though only 21 classes appear in
  training. XGBoost needs this to match the full product catalogue size.

**Early stopping:** Monitor validation log-loss after every boosting round.
If it does not improve for 15 consecutive rounds, stop training. This
automatically prevents overfitting without manually tuning the number of
trees. Training stopped at round **476** of the 500 maximum.

**Training time:** 11 minutes on CPU. XGBoost is a tree algorithm GPU
does not significantly help tree building the way it helps neural networks.

**Output:** `artifacts/xgboost_model.json`

---

### Stage 7 — Evaluation (`07_evaluation.ipynb`)

Three metrics are computed. All must pass their threshold before the model
is approved for deployment.

**MAP@7 (Mean Average Precision at 7):**
The primary ranking metric. For each customer, take the 7
highest-probability products and check whether the product they actually
added appears in that list. Higher positions are weighted more heavily.
A model that puts the right product at rank 1 scores higher than one
that puts it at rank 7.
Result: **0.699** (threshold: ≥ 0.028)

**AUC-ROC (Area Under the ROC Curve):**
Measures discrimination can the model separate customers who will buy
product X from those who will not, across all 24 products simultaneously?
Uses One-vs-Rest macro averaging (each product treated as a binary
classification problem).
Result: **0.894** (threshold: ≥ 0.70)

**Catalog coverage:**
What percentage of the 24 products appear in at least one customer's
top-1 recommendation? Low coverage means the model is creating a filter
bubble — always recommending the same 2-3 popular products.
Result: **55.4%** 13 of 24 products recommended (threshold: ≥ 50%)

---

### Stage 8 — Monitoring simulation (`08_CTR_simulation.ipynb`)

Before deploying, prove that the monitoring system would correctly detect
when the model is going stale. Three detectors are validated:

**PSI (Population Stability Index):** Measures how much a feature's
distribution has shifted between training time and now. Computed by
dividing both distributions into 10 bins and comparing the percentage
of population in each bin. PSI > 0.20 triggers a review.

**KS test (Kolmogorov-Smirnov):** A statistical test that measures whether
two samples come from the same distribution. p-value < 0.05 means they
are statistically different drift detected.

**CTR simulation:** Generate synthetic click data from model predictions
(correct prediction = click, wrong prediction = no click). Baseline CTR
from validation set: 50.69%. Corrupt 40% of correct predictions to
simulate model staleness. Drifted CTR: 30.43%. The 40% drop triggers
the retraining alert.

---

## Flask backend

The backend uses the **Application Factory Pattern** — a function
(`create_app()`) creates and configures the Flask app rather than having
a global app object. This allows creating multiple app instances with
different configurations (useful for testing).

### Request flow

```
React (port 3000)
    ↓  HTTP GET /api/v1/recommend/1001
Flask blueprint router
    ↓  customer_routes.py
CustomerProfile.query.filter_by(ncodpers=1001)
    ↓  SQLAlchemy ORM reads from santander_feature_store.db
RecommendationService.generate_inference_scores(profile)
    ↓  numpy beta distribution scoring per product
JSON response: { customer_id, demographics, holdings, recommendations, pipeline_audit }
    ↑
React renders cards, probability bars, sidebar
```

### Blueprint pattern

Routes are organised into Blueprints — Flask's way of grouping related
endpoints. Each blueprint is registered in `create_app()`:

```python
app.register_blueprint(customer_bp)   # /api/v1/recommend/<id>
app.register_blueprint(feedback_bp)   # /api/v1/feedback
app.register_blueprint(health_bp)     # /api/v1/health
```

Blueprints keep the codebase modular — adding a new group of routes means
creating a new file and registering one line, without touching existing routes.

### SQLAlchemy ORM

The `CustomerProfile` class in `database.py` is an ORM (Object-Relational
Mapper) model. Instead of writing SQL strings, you interact with the database
through Python objects:

```python
# Without ORM:
cursor.execute("SELECT * FROM customer_profiles WHERE ncodpers = 1001")

# With SQLAlchemy ORM:
profile = CustomerProfile.query.filter_by(ncodpers=1001).first()
print(profile.age)   # access columns as attributes
```

The ORM maps Python class attributes to database columns, handles connection
pooling, and protects against SQL injection automatically.

---

## React frontend

### Component architecture

```
App.jsx  (router shell)
├── Navbar.jsx          (sticky header, active link highlighting)
├── Pages:
│   ├── HomePage.jsx    (hero, stats, feature cards, pipeline steps, CTA)
│   ├── SearchPage.jsx  (search input, recommendation cards, sidebar)
│   ├── MetricsPage.jsx (live metric bars, deployment gates, CTR stats)
│   ├── ProfilePage.jsx (full customer profile, all recommendations)
│   └── AboutPage.jsx   (pipeline explanation, tech stack, results)
└── Footer.jsx
```

### State management

The project uses React's built-in `useState` hook for all state no Redux,
no external state library. Each page manages its own:
- `loading` — controls skeleton display during API calls
- `error` — captures and displays API error messages
- `results` — stores the API response once it arrives

### Framer Motion animations

Every page uses `framer-motion` for entrance animations. The core pattern
used throughout is `variants` with `staggerChildren`:

```jsx
const stagger = {
  show: { transition: { staggerChildren: 0.08 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45 } }
};

<motion.div variants={stagger} initial="hidden" animate="show">
  <motion.div variants={fadeUp}>First item — animates first</motion.div>
  <motion.div variants={fadeUp}>Second item — 80ms later</motion.div>
  <motion.div variants={fadeUp}>Third item — 160ms later</motion.div>
</motion.div>
```

The parent `stagger` variant cascades to children automatically. Each child
uses the same `fadeUp` variant but receives it delayed by `staggerChildren`.

### API service layer

All HTTP calls are centralised in `src/services/api.js` using axios. No
component ever writes a raw `fetch()` call. This means:
- The base URL is defined in one place (`.env` file)
- Timeout and headers are configured once
- Swapping the backend URL for deployment is a one-line change

---

## Database design

### santander_feature_store.db

Stores customer profiles used for inference. Populated from the Parquet
feature store via the `flask init-db` CLI command.

```sql
CREATE TABLE customer_profiles (
    ncodpers               INTEGER PRIMARY KEY,
    renta                  REAL NOT NULL,      -- annual income
    age                    INTEGER NOT NULL,
    antiguedad             INTEGER NOT NULL,   -- tenure in months
    active_holdings_string TEXT NOT NULL       -- comma-separated product codes
);
```

The `active_holdings_string` field stores product codes as a comma-separated
string (e.g. `"ind_cco_fin_ult1,ind_tjcr_fin_ult1"`). The `holdings_list`
property on the ORM model parses this into a Python list on demand.

### feedback.db

Stores thumbs-up/thumbs-down interactions from the React dashboard.
Used by the monitoring system to compute live CTR.

```sql
CREATE TABLE feedback (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id  INTEGER NOT NULL,
    product_code TEXT NOT NULL,
    product_name TEXT NOT NULL,
    clicked      INTEGER NOT NULL,   -- 1 = thumbs up, 0 = thumbs down
    timestamp    TEXT NOT NULL,
    session_id   TEXT
);
```

---

## API reference

### GET /api/v1/recommend/{customer_id}

Returns top product recommendations for a customer.

**Response:**
```json
{
  "status": "success",
  "customer_id": 1001,
  "demographics": {
    "income": 68200.0,
    "age": 28,
    "tenure_months": 18
  },
  "holdings": ["Current Accounts"],
  "recommendations": [
    {
      "product_code": "ind_reca_fin_ult1",
      "name": "Payroll Account",
      "category": "Accounts",
      "description": "Direct salary deposition rewards.",
      "probability": 0.4693
    }
  ],
  "pipeline_audit": {
    "gates": {
      "map7_gate": { "metric": "MAP@7", "value": 0.0312, "threshold": 0.028 },
      "auc_gate":  { "metric": "AUC-ROC", "value": 0.724, "threshold": 0.70 },
      "coverage_gate": { "metric": "Catalog Coverage", "value": "55.4%", "threshold": "50.0%" }
    },
    "monitoring": {
      "baseline_ctr": "50.69%",
      "current_ctr": "51.12%",
      "ctr_drop": "0.0%",
      "retrain_status": "NOMINAL"
    }
  }
}
```

**Error 404:** Customer ID not found in feature store.

---

### POST /api/v1/feedback

Records a customer's response to a recommendation.

**Request body:**
```json
{
  "customer_id": 1001,
  "product_code": "ind_tjcr_fin_ult1",
  "product_name": "Credit Cards",
  "clicked": true
}
```

**Response:** `{ "status": "recorded", "feedback_id": 7 }`

---

### GET /api/v1/feedback/stats

Returns CTR statistics from all recorded feedback.

**Response:**
```json
{
  "total_shown": 42,
  "total_clicked": 18,
  "ctr_pct": 42.86,
  "by_product": [
    { "product_name": "Credit Cards", "clicks": 5, "total": 8, "ctr_pct": 62.5 }
  ]
}
```

---

### GET /api/v1/health

Returns model version and deployment gate status.

**Response:**
```json
{
  "status": "ok",
  "model_version": "v1.0",
  "snapshot_customers": 3,
  "product_catalog_size": 5,
  "metrics": { "map_at_7": 0.699674, "auc_roc": 0.8942, "catalog_coverage": 55.40 },
  "gates": { "map7_pass": true, "auc_pass": true, "coverage_pass": true, "all_pass": true }
}
```

---

## Model metrics

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| MAP@7 | 0.699 | ≥ 0.028 | PASS |
| AUC-ROC | 0.894 | ≥ 0.70 | PASS |
| Catalog coverage | 55.4% | ≥ 50% | PASS |
| Best iteration | Round 476 | — | — |
| Val log-loss | 1.138 | — | — |
| Training time | 11 min | — | CPU only |

---

## Monitoring system

### Drift triggers

| Trigger | Threshold | Metric |
|---------|-----------|--------|
| PSI — feature drift | > 0.20 | Population Stability Index on `renta`, `age` |
| KS test — statistical drift | p-value < 0.05 | Kolmogorov-Smirnov on feature distributions |
| CTR drop | > 10% below 30-day average | Click-through rate from feedback.db |
| Fairness gap | > 5% between age groups | NDCG@7 difference across age bands |

### Simulated drift results (Notebook 08)

- Age distribution shift of +5 years: PSI = 0.2374 → **TRIGGER FIRED**
- Income distribution shift of +30%: KS p-value = 0.0000 → **TRIGGER FIRED**
- CTR corruption of 40%: drop from 50.69% to 30.43% → **TRIGGER FIRED**

---

## Tech stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| ML training | XGBoost 2.x | Multi-class gradient boosting |
| Data processing | pandas, NumPy, PyArrow | ETL pipeline, feature engineering |
| ML utilities | scikit-learn | Encoders, class weights, metrics |
| Experiment tracking | MLflow | Metric logging, model registry |
| Backend | Flask 3.x | REST API server |
| ORM | Flask-SQLAlchemy | Database abstraction layer |
| CORS | Flask-CORS | Cross-origin request handling |
| Database | SQLite | Customer profiles + feedback store |
| Frontend | React 18 | Component-based UI |
| Routing | React Router v6 | Client-side page navigation |
| Animations | Framer Motion | Page and card entrance animations |
| HTTP client | Axios | API service layer |
| Fonts | Syne + Inter (Google Fonts) | Display and body typography |

---

## Notes

- The dataset used is the [Santander Product Recommendation](https://www.kaggle.com/c/santander-product-recommendation)
  Kaggle competition dataset. This project is for educational and portfolio
  purposes only and is not affiliated with Banco Santander S.A.
- Only customers **1001**, **1002**, and **1005** are seeded in the development
  database. Add more via `flask init-db` or directly via the SQLite CLI.
- The recommendation engine in `recommendation_engine.py` uses a beta
  distribution scoring system seeded by customer ID. To use the actual
  trained XGBoost model for inference, load `artifacts/xgboost_model.json`
  and build the feature vector from the customer's profile row.