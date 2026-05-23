from extensions import db

class CustomerProfile(db.Model):
    """
    SQLAlchemy Model mapping values cached inside your feature database.
    
    This class structure abstracts relational attributes engineered inside 
    your exploratory analyses notebooks into formal operational system columns.
    """
    __tablename__ = 'customer_profiles'

    # Primary key index tracking column representing customer ID configurations (ncodpers)
    ncodpers = db.Column(db.Integer, primary_key=True, index=True)
    
    # Floating-point variable mapping gross annual household income evaluations (renta)
    renta = db.Column(db.Float, nullable=False)
    
    # Integer metric storing parsed customer chronological lifecycle metrics (age)
    age = db.Column(db.Integer, nullable=False)
    
    # Structural metric specifying account history longevity records in months (antiguedad)
    antiguedad = db.Column(db.Integer, nullable=False)
    
    # Text collection column storing actively held financial instruments split by separators
    active_holdings_string = db.Column(db.String, nullable=False, default="")

    @property
    def holdings_list(self):
        """
        Dynamic parser method split-mapping character tokens into clean array indexes.
        
        Returns:
            list: Parsed raw catalog codes representation strings matching client inputs.
        """
        if not self.active_holdings_string:
            return []
        return [item.strip() for item in self.active_holdings_string.split(",") if item.strip()]