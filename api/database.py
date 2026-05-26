# database.py — SQLAlchemy models for the customer feature store
# Extended with name, segment, email and gender for multi-mode search
from extensions import db


class CustomerProfile(db.Model):
    """
    SQLAlchemy model mapping customer attributes into the feature store.
    Extended beyond the original 3-column design to support name-based
    and segment-based search across the three UI search modes.
    """
    __tablename__ = 'customer_profiles'

    # Primary key — maps to ncodpers in the Santander dataset
    ncodpers   = db.Column(db.Integer, primary_key=True, index=True)

    # ── Demographic features ──────────────────────────────────────────
    # Gross annual household income (renta) — used as model feature
    renta      = db.Column(db.Float,   nullable=False)

    # Customer age in years — used as model feature
    age        = db.Column(db.Integer, nullable=False)

    # Account seniority in months (antiguedad) — used as model feature
    antiguedad = db.Column(db.Integer, nullable=False)

    # ── Search-facing fields ──────────────────────────────────────────
    # Full display name — enables name-based search in the UI
    name       = db.Column(db.String(120), nullable=False, default='Unknown')

    # Email address — secondary search key
    email      = db.Column(db.String(120), nullable=False, default='')

    # Customer segment — PARTICULARES | UNIVERSITARIO | TOP
    # Maps directly to the segmento column in the Santander dataset
    segment    = db.Column(db.String(40),  nullable=False, default='PARTICULARES')

    # Gender — M | F — used for display only
    gender     = db.Column(db.String(1),   nullable=False, default='M')

    # Comma-separated product codes the customer currently holds
    # e.g. "ind_cco_fin_ult1,ind_tjcr_fin_ult1"
    active_holdings_string = db.Column(
        db.String, nullable=False, default=""
    )

    @property
    def holdings_list(self):
        """
        Parse the comma-separated holdings string into a clean Python list.
        Returns empty list if no holdings are recorded.
        """
        if not self.active_holdings_string:
            return []
        return [
            item.strip()
            for item in self.active_holdings_string.split(',')
            if item.strip()
        ]

    def to_dict(self):
        """
        Serialise the customer profile to a dictionary for API responses.
        Used by search endpoints that return customer lists.
        """
        return {
            'customer_id': self.ncodpers,
            'name'       : self.name,
            'email'      : self.email,
            'segment'    : self.segment,
            'age'        : self.age,
            'tenure_months': self.antiguedad,
            'income'     : self.renta,
            'gender'     : self.gender,
            'holdings'   : self.holdings_list,
        }