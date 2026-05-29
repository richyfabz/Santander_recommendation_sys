# Santander RecSys — Bank Product Recommendation System

> An end-to-end machine learning pipeline that predicts which new financial
> products Santander bank customers will add next month, served via a Flask
> REST API, displayed on a React dashboard, and extended with cold-start
> onboarding and an AI-powered product advisor chatbot.

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
11. [Chatbot and agent notifications](#chatbot-and-agent-notifications)
12. [Tech stack](#tech-stack)

---

## Project overview

This project trains an XGBoost multi-class gradient boosting model on the
[Santander Product Recommendation Kaggle dataset](https://www.kaggle.com/c/santander-product-recommendation)
and serves personalised banking product recommendations through a
production-style web application.

**What it recommends:** Given a customer ID, the system predicts which of 24
Santander banking products (credit cards, mortgages, pension plans, savings
accounts, etc.) the customer is most likely to add next month.

**Three recommendation modes:**
- **Existing customers** — search by name, email, or customer ID
- **Product-first** — select a product, see which customers are most likely to add it
- **Segment analysis** — browse recommendations aggregated by VIP, Retail, or University customers

**New customer onboarding:** First-time users with no account fill a simple
form (name, age, income, segment). The trained XGBoost model runs inference
on a synthetic feature vector built from their inputs — no history required.

**AI product advisor:** A floating chatbot powered by Mistral-7B-Instruct
answers questions about any Santander product in plain English. When the
user ends the chat, a structured summary is automatically emailed to the
agent team via Brevo.

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
- The Santander dataset from Kaggle (`train_ver2.csv`)
- A HuggingFace API token (`HF_API_TOKEN`)
- A Brevo API key (`BREVO_API_KEY`)

### 1. Clone and set up the virtual environment

```bash
git clone https://github.com/richyfabz/Santander_recommendation_sys.git
cd santander-recommender

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Create your `.env` file

```bash
touch .env
```

Add your API keys:
```
HF_API_TOKEN=your_huggingface_token_here
BREVO_API_KEY=your_brevo_key_here
```

### 3. Initialise the database

```bash
PYTHONPATH=.:api FLASK_APP=api/app.py flask init-db
```

Seeds 25 demo customers across VIP, Retail, and University segments.

### 4. Start the Flask API

```bash
PYTHONPATH=.:api FLASK_APP=api/app.py flask run --port=5000
```

### 5. Start the React frontend

```bash
cd frontend
npm install
npm start
```

React opens at `http://localhost:3000`.

### 6. Explore the system

| URL | What it does |
|-----|-------------|
| `/` | Home — system overview and pipeline summary |
| `/search` | Three-mode recommendation interface |
| `/onboarding` | New customer form — cold-start recommendations |
| `/metrics` | Model performance dashboard |
| `/about` | Full pipeline explanation and tech stack |

---

## Project structure

```
santander-recommender/
│
├── notebooks/                          # 8 Jupyter notebooks — one per pipeline stage
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
│   ├── raw/                            # Kaggle CSV files (git-ignored)
│   ├── parquet/                        # Stage 1 output — typed Parquet
│   └── processed/                      # Pipeline stage outputs
│
├── artifacts/                          # Trained model and preprocessing artifacts
│   ├── xgboost_model.json              # Trained XGBoost model (476 trees)
│   ├── label_encoders.pkl              # Fitted scikit-learn LabelEncoders
│   ├── feature_cols.pkl                # Ordered feature column list
│   ├── sample_weights.npy
│   ├── training_config.json
│   ├── loss_curve.png
│   └── drift_distributions.png
│
├── api/                                # Flask application
│   ├── app.py                          # Application factory
│   ├── config.py
│   ├── extensions.py
│   ├── database.py                     # CustomerProfile ORM model
│   ├── blueprints/
│   │   ├── customer_routes.py          # Recommend, search, segment, product endpoints
│   │   ├── feedback_routes.py          # Thumbs up/down feedback
│   │   ├── health_routes.py            # Deployment gates
│   │   ├── chat_routes.py              # Chatbot + agent email summary
│   │   └── onboarding_routes.py        # Cold-start new user recommendations
│   └── services/
│       └── recommendation_engine.py    # XGBoost inference service
│
├── frontend/                           # React application
│   └── src/
│       ├── App.jsx
│       ├── index.css                   # Design system tokens
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── SearchPage.jsx          # Three-mode search interface
│       │   ├── OnboardingPage.jsx      # New customer cold-start form
│       │   ├── MetricsPage.jsx
│       │   ├── ProfilePage.jsx
│       │   └── AboutPage.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Footer.jsx
│       │   └── ChatWidget.jsx          # Floating AI product advisor
│       └── services/
│           └── api.js
│
├── .env                                # API keys (git-ignored)
├── requirements.txt
└── mlflow.db
```

---

## The 8-stage ML pipeline

### Stage 1 — Data ingestion
13.3M row CSV streamed in 100k row chunks. Schema enforced on read.
Persisted to Parquet 2.5GB CSV becomes under 500MB.

### Stage 2 — Cohort selection
Filtered to final 3 months (Mar–May 2016). Only customers present
in all 3 months retained. ~922k active customers confirmed representative
of full dataset (max ownership rate difference: 5.1%).

### Stage 3 — Target engineering
Difference vector ΔP = P(month_t) − P(month_t−1) computed per customer.
Value of +1 = newly added product = training target. Rows flattened so
each new product addition is one training row. 9,852x class imbalance discovered.

### Stage 4 — Feature engineering
Lag-1 and lag-2 product ownership columns added (48 new columns).
`product_velocity` and `total_products_held_lag_1` aggregates computed.
Income imputed using province-level medians.

### Stage 5 — Split and formatting
Shuffled 80/20 split. Sample weights applied to handle class imbalance.
Converted to XGBoost DMatrix format.

### Stage 6 — Model training
XGBoost `multi:softprob`. 24 classes. Early stopping at round 476.
Best val log-loss: 1.138. Training time: 11 minutes on CPU.

### Stage 7 — Evaluation
MAP@7: 0.699 · AUC-ROC: 0.894 · Catalog coverage: 55.4%.
All three deployment gates passed.

### Stage 8 — Monitoring simulation
PSI, KS test, and CTR drift detectors validated on synthetic shift scenarios.
All three triggers fired correctly.

---

## Flask backend

### Blueprint structure

| Blueprint | Prefix | Purpose |
|-----------|--------|---------|
| `customer_bp` | `/api/v1` | Recommend, search, segment, product endpoints |
| `feedback_bp` | `/api/v1` | Thumbs up/down recording and CTR stats |
| `health_bp` | `/api/v1` | Model health and deployment gate status |
| `chat_bp` | `/api/v1` | Chatbot inference and agent email summary |
| `onboarding_bp` | `/api/v1` | Cold-start recommendations for new users |

### Inference flow

```
React → POST /api/v1/chat
  → chat_routes.py builds Mistral prompt
  → HuggingFace Inference API (Mistral-7B)
  → reply returned to React

React → POST /api/v1/chat/summary
  → chat_routes.py generates HTML summary
  → Brevo SDK sends email to agent
```

---

## React frontend

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Hero, stats band, feature cards, pipeline steps |
| Recommend | `/search` | Three-mode search: customer, product, segment |
| New Customer | `/onboarding` | Cold-start form with live recommendations |
| Metrics | `/metrics` | Model performance dashboard |
| Profile | `/profile/:id` | Full customer profile and recommendations |
| About | `/about` | Pipeline explanation and tech stack |

### ChatWidget

Floats bottom-right on every page. Architecture:
- **Bubble** — click to open/close. Green notification dot when history exists.
- **Panel** — 360px wide, max 560px tall, scrollable message area.
- **Suggestions** — pre-written question chips on first open.
- **History** — full conversation passed with every API call for context.
- **End Chat** — triggers Brevo email to agent with transcript summary.
- **Context-aware** — reads `recsys_last_recommendations` from sessionStorage.

---

## Database design

### customer_profiles

```sql
CREATE TABLE customer_profiles (
    ncodpers               INTEGER PRIMARY KEY,
    renta                  REAL NOT NULL,
    age                    INTEGER NOT NULL,
    antiguedad             INTEGER NOT NULL,
    name                   TEXT NOT NULL,
    email                  TEXT NOT NULL,
    segment                TEXT NOT NULL,
    gender                 TEXT NOT NULL,
    active_holdings_string TEXT NOT NULL
);
```

25 customers seeded across three segments:
- **TOP (VIP)** — 5 customers, avg income €268k, avg tenure 151 months
- **PARTICULARES (Retail)** — 10 customers, avg income €90k, avg tenure 75 months
- **UNIVERSITARIO (University)** — 10 customers, avg income €13k, avg tenure 13 months

---

## API reference

### GET /api/v1/recommend/{customer_id}
Returns top recommendations for an existing customer.

### GET /api/v1/customers/search?q={query}&segment={segment}
Search customers by name, email, or segment (VIP/Retail/University).

### GET /api/v1/products/{product_code}/top-customers
Reverse lookup — customers most likely to add a specific product.

### GET /api/v1/segments
Segment summary statistics with friendly labels.

### GET /api/v1/products
Full product catalog for dropdown population.

### POST /api/v1/onboarding/recommend
Cold-start recommendations from form inputs. Body: `{age, income, segment, gender}`.

### POST /api/v1/chat
Send a message to Mistral-7B. Body: `{message, history, context}`.

### POST /api/v1/chat/summary
End chat and email transcript to agent. Body: `{history, user_name}`.

### POST /api/v1/feedback
Record thumbs up/down. Body: `{customer_id, product_code, product_name, clicked}`.

### GET /api/v1/health
Deployment gate status and model metrics.

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

| Trigger | Threshold | Metric |
|---------|-----------|--------|
| PSI feature drift | > 0.20 | Population Stability Index |
| KS statistical drift | p-value < 0.05 | Kolmogorov-Smirnov test |
| CTR drop | > 10% below 30-day avg | Click-through from feedback.db |
| Fairness gap | > 5% between age groups | NDCG@7 difference |

---

## Chatbot and agent notifications

### How it works

1. User clicks the 💬 bubble bottom-right on any page
2. Panel opens with suggested questions
3. User types a product question
4. Flask receives message + full history
5. Mistral-7B-Instruct generates a context-aware reply
6. Reply displayed in chat panel
7. User clicks "End Chat"
8. Flask generates structured HTML email with transcript
9. Brevo sends email to `dammifabz@gmail.com`

### Cold-start onboarding

1. New user visits `/onboarding`
2. Fills: name, age, annual income, customer type, gender
3. Flask builds a synthetic 71-column feature vector
4. XGBoost runs `predict()` across 24 product classes
5. Softmax probabilities ranked and returned
6. Top 7 products displayed with match percentage bars

### Models used

| Purpose | Model | Provider |
|---------|-------|---------|
| Product recommendations | XGBoost (trained) | Local |
| Cold-start recommendations | XGBoost (trained) | Local |
| Product advisor chatbot | Mistral-7B-Instruct-v0.2 | HuggingFace |
| Chatbot fallback | Zephyr-7B-Beta | HuggingFace |
| Agent email | Brevo transactional API | Brevo |

---

## Tech stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| ML training | XGBoost 2.x | Multi-class gradient boosting |
| Data processing | pandas, NumPy, PyArrow | ETL pipeline, feature engineering |
| ML utilities | scikit-learn | Encoders, class weights, metrics |
| Experiment tracking | MLflow | Metric logging |
| Backend | Flask 3.x | REST API server |
| ORM | Flask-SQLAlchemy | Database abstraction |
| CORS | Flask-CORS | Cross-origin requests |
| Chatbot | HuggingFace Inference API | Mistral-7B product advisor |
| Email | Brevo SDK | Agent notification emails |
| Env management | python-dotenv | API key loading |
| Database | SQLite | Customer profiles + feedback |
| Frontend | React 18 | Component-based UI |
| Routing | React Router v6 | Client-side navigation |
| Animations | Framer Motion | Page and widget animations |
| HTTP client | Axios | API service layer |
| Fonts | Syne + Inter | Display and body typography |

---

> This project uses the [Santander Product Recommendation]
> Not affiliated with Banco Santander S.A.