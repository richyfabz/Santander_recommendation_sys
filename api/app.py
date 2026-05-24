from flask import Flask
from config import ProductionConfig
from extensions import db, cors
from blueprints.customer_routes import customer_bp
from database import CustomerProfile
import click

def create_app():
    """
    Application Factory Pattern initializer.
    
    Binds active configurations, handles module hooks, maps CORS endpoints,
    and mounts custom terminal command line controls cleanly.
    """
    app = Flask(__name__)
    app.config.from_object(ProductionConfig)
    
    # Inject application environment variables into active extensions
    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    
    # Attach tracking endpoint namespaces across the blueprint routes
    app.register_blueprint(customer_bp)
    
    @app.cli.command("init-db")
    def init_db():
        """
        Terminal Command Line hook to regenerate tables and load seed sets.
        """
        db.drop_all()
        db.create_all()
        
        # Populate operational feature stores with sample testing parameters
        samples = [
            CustomerProfile(ncodpers=1001, renta=68200.0, age=28, antiguedad=18, active_holdings_string="ind_cco_fin_ult1"),
            CustomerProfile(ncodpers=1002, renta=142000.0, age=41, antiguedad=96, active_holdings_string="ind_cco_fin_ult1,ind_tjcr_fin_ult1"),
            CustomerProfile(ncodpers=1005, renta=235000.0, age=52, antiguedad=144, active_holdings_string="ind_cco_fin_ult1,ind_nom_pens_ult1")
        ]
        db.session.add_all(samples)
        db.session.commit()
        click.echo("✓ Feature Store Database successfully initialized.")
        
    return app

if __name__ == '__main__':
    create_app().run(host='0.0.0.0', port=5000, debug=True)