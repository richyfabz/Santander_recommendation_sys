# This file defines the Flask application factory, which initializes the app with configurations,
# registers blueprints, and sets up terminal command line hooks for database initialization.
# The create_app function is the main entry point for creating the Flask application instance,
# and it is designed to be flexible and modular to support different configurations and extensions.
from flask import Flask
from config import ProductionConfig
from extensions import db, cors
from blueprints.customer_routes import customer_bp
from blueprints.feedback_routes import feedback_bp   
from blueprints.health_routes   import health_bp     
from database import CustomerProfile
import click

# Application Factory Pattern initializer.
# Binds active configurations, handles module hooks, maps CORS endpoints,
# and mounts custom terminal command line controls cleanly.
def create_app():
    """
    Application Factory Pattern initializer.

    Binds active configurations, handles module hooks, maps CORS endpoints,
    and mounts custom terminal command line controls cleanly.
    """
    # Create the Flask application instance and load configurations from the ProductionConfig class.
    app = Flask(__name__)
    app.config.from_object(ProductionConfig)

    # Inject application environment variables into active extensions
    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Attach tracking endpoint namespaces across the blueprint routes
    app.register_blueprint(customer_bp) # Existing customer profile endpoints
    app.register_blueprint(feedback_bp)  # feedback recording + CTR stats
    app.register_blueprint(health_bp)    # model health + deployment gates

    # Terminal Command Line hook to regenerate tables and load seed sets.
    # This provides a convenient way to initialize the database with sample data for testing and development.
    @app.cli.command("init-db")
    def init_db():
        """
        Terminal Command Line hook to regenerate tables and load seed sets.
        """
        db.drop_all() # Drop all existing tables to start fresh
        db.create_all() # Create new tables based on the defined models

        # Populate operational feature stores with sample testing parameters
        samples = [
            CustomerProfile(ncodpers=1001, renta=68200.0,  age=28, antiguedad=18,  active_holdings_string="ind_cco_fin_ult1"),
            CustomerProfile(ncodpers=1002, renta=142000.0, age=41, antiguedad=96,  active_holdings_string="ind_cco_fin_ult1,ind_tjcr_fin_ult1"),
            CustomerProfile(ncodpers=1005, renta=235000.0, age=52, antiguedad=144, active_holdings_string="ind_cco_fin_ult1,ind_nom_pens_ult1")
        ]
        # Add the sample customer profiles to the database session and commit them to persist in the database.
        db.session.add_all(samples)
        db.session.commit()
        # Print a success message to the terminal after initializing the database.
        click.echo("✓ Feature Store Database successfully initialized.")

    return app

# The main entry point for running the Flask application. It creates the app instance and runs it on host '0.0.0.0'
if __name__ == '__main__':
    create_app().run(host='0.0.0.0', port=5000, debug=True)