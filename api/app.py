# app.py Flask application factory
# Extended init-db command seeds 25 customers across all three segments
from flask    import Flask
from config   import ProductionConfig
from extensions import db, cors
from blueprints.customer_routes import customer_bp
from blueprints.feedback_routes import feedback_bp
from blueprints.health_routes   import health_bp
from database import CustomerProfile
import click

# Application factory and CLI command to seed the feature store with demo customers
# The init-db command drops all tables, recreates the schema, and seeds 25 customers across
#  PARTICULARES, UNIVERSITARIO, and TOP segments. Each customer has realistic
# demographic attributes and product holdings to support testing of all three UI search 
# modes and the recommendation engine. Run with
def create_app():
    """
    Application factory — initialises Flask, binds config,
    registers blueprints, and wires the database init command.
    """
    app = Flask(__name__)
    app.config.from_object(ProductionConfig)
    
    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(customer_bp)
    app.register_blueprint(feedback_bp)
    app.register_blueprint(health_bp)

    @app.cli.command("init-db")
    def init_db():
        """
        Drop all tables, recreate schema, and seed 25 demo customers
        across PARTICULARES, UNIVERSITARIO, and TOP segments.
        Run with: flask init-db
        """
        db.drop_all()
        db.create_all()

        # ── Seed data — 25 customers across 3 segments ────────────────
        # Holdings use real Santander product codes from the training data.
        # Ages, incomes, and tenures are realistic for each segment type.
        samples = [

            #  TOP segment — high income, long tenure, diverse holdings
            CustomerProfile(ncodpers=1001, name="Elena Vasquez",    email="elena.vasquez@demo.com",    segment="TOP",          gender="F", age=52, renta=235000.0, antiguedad=144, active_holdings_string="ind_cco_fin_ult1,ind_nom_pens_ult1,ind_tjcr_fin_ult1"),
            CustomerProfile(ncodpers=1002, name="Marco Fernández",  email="marco.fernandez@demo.com",  segment="TOP",          gender="M", age=48, renta=198000.0, antiguedad=120, active_holdings_string="ind_cco_fin_ult1,ind_tjcr_fin_ult1,ind_valo_fin_ult1"),
            CustomerProfile(ncodpers=1003, name="Sofia Moreno",     email="sofia.moreno@demo.com",     segment="TOP",          gender="F", age=55, renta=312000.0, antiguedad=180, active_holdings_string="ind_cco_fin_ult1,ind_hip_fin_ult1,ind_plan_fin_ult1,ind_valo_fin_ult1"),
            CustomerProfile(ncodpers=1004, name="Rafael Torres",    email="rafael.torres@demo.com",    segment="TOP",          gender="M", age=44, renta=175000.0, antiguedad=96,  active_holdings_string="ind_cco_fin_ult1,ind_tjcr_fin_ult1,ind_fond_fin_ult1"),
            CustomerProfile(ncodpers=1005, name="Isabela Ruiz",     email="isabela.ruiz@demo.com",     segment="TOP",          gender="F", age=61, renta=420000.0, antiguedad=216, active_holdings_string="ind_cco_fin_ult1,ind_nom_pens_ult1,ind_hip_fin_ult1,ind_plan_fin_ult1,ind_valo_fin_ult1"),

            #  PARTICULARES segment — mid income, varied tenure
            CustomerProfile(ncodpers=2001, name="Carlos García",    email="carlos.garcia@demo.com",    segment="PARTICULARES", gender="M", age=41, renta=142000.0, antiguedad=96,  active_holdings_string="ind_cco_fin_ult1,ind_tjcr_fin_ult1"),
            CustomerProfile(ncodpers=2002, name="Ana López",        email="ana.lopez@demo.com",        segment="PARTICULARES", gender="F", age=38, renta=68000.0,  antiguedad=60,  active_holdings_string="ind_cco_fin_ult1"),
            CustomerProfile(ncodpers=2003, name="Diego Martínez",   email="diego.martinez@demo.com",   segment="PARTICULARES", gender="M", age=45, renta=95000.0,  antiguedad=84,  active_holdings_string="ind_cco_fin_ult1,ind_recibo_ult1"),
            CustomerProfile(ncodpers=2004, name="Carmen Jiménez",   email="carmen.jimenez@demo.com",   segment="PARTICULARES", gender="F", age=33, renta=52000.0,  antiguedad=36,  active_holdings_string="ind_cco_fin_ult1,ind_nomina_ult1"),
            CustomerProfile(ncodpers=2005, name="Pablo Sánchez",    email="pablo.sanchez@demo.com",    segment="PARTICULARES", gender="M", age=50, renta=118000.0, antiguedad=108, active_holdings_string="ind_cco_fin_ult1,ind_tjcr_fin_ult1,ind_recibo_ult1"),
            CustomerProfile(ncodpers=2006, name="Lucia Hernández",  email="lucia.hernandez@demo.com",  segment="PARTICULARES", gender="F", age=29, renta=44000.0,  antiguedad=24,  active_holdings_string="ind_cco_fin_ult1"),
            CustomerProfile(ncodpers=2007, name="Jorge Díaz",       email="jorge.diaz@demo.com",       segment="PARTICULARES", gender="M", age=57, renta=134000.0, antiguedad=132, active_holdings_string="ind_cco_fin_ult1,ind_hip_fin_ult1,ind_recibo_ult1"),
            CustomerProfile(ncodpers=2008, name="María Pérez",      email="maria.perez@demo.com",      segment="PARTICULARES", gender="F", age=36, renta=61000.0,  antiguedad=48,  active_holdings_string="ind_cco_fin_ult1,ind_nomina_ult1,ind_recibo_ult1"),
            CustomerProfile(ncodpers=2009, name="Antonio Álvarez",  email="antonio.alvarez@demo.com",  segment="PARTICULARES", gender="M", age=43, renta=87000.0,  antiguedad=72,  active_holdings_string="ind_cco_fin_ult1,ind_tjcr_fin_ult1"),
            CustomerProfile(ncodpers=2010, name="Rosa González",    email="rosa.gonzalez@demo.com",    segment="PARTICULARES", gender="F", age=48, renta=102000.0, antiguedad=90,  active_holdings_string="ind_cco_fin_ult1,ind_recibo_ult1,ind_fond_fin_ult1"),

            #  UNIVERSITARIO segment — lower income, short tenure, minimal holdings
            CustomerProfile(ncodpers=3001, name="Alejandro Castro", email="alejandro.castro@demo.com", segment="UNIVERSITARIO",gender="M", age=21, renta=12000.0,  antiguedad=12,  active_holdings_string="ind_cco_fin_ult1"),
            CustomerProfile(ncodpers=3002, name="Valentina Romero", email="valentina.romero@demo.com", segment="UNIVERSITARIO",gender="F", age=20, renta=8000.0,   antiguedad=6,   active_holdings_string="ind_cco_fin_ult1"),
            CustomerProfile(ncodpers=3003, name="Andrés Navarro",   email="andres.navarro@demo.com",   segment="UNIVERSITARIO",gender="M", age=23, renta=15000.0,  antiguedad=18,  active_holdings_string="ind_cco_fin_ult1,ind_tjcr_fin_ult1"),
            CustomerProfile(ncodpers=3004, name="Gabriela Vargas",  email="gabriela.vargas@demo.com",  segment="UNIVERSITARIO",gender="F", age=22, renta=11000.0,  antiguedad=10,  active_holdings_string="ind_cco_fin_ult1"),
            CustomerProfile(ncodpers=3005, name="Miguel Ibáñez",    email="miguel.ibanez@demo.com",    segment="UNIVERSITARIO",gender="M", age=24, renta=18000.0,  antiguedad=20,  active_holdings_string="ind_cco_fin_ult1,ind_recibo_ult1"),
            CustomerProfile(ncodpers=3006, name="Laura Serrano",    email="laura.serrano@demo.com",    segment="UNIVERSITARIO",gender="F", age=19, renta=7500.0,   antiguedad=4,   active_holdings_string="ind_cco_fin_ult1"),
            CustomerProfile(ncodpers=3007, name="Daniel Molina",    email="daniel.molina@demo.com",    segment="UNIVERSITARIO",gender="M", age=25, renta=22000.0,  antiguedad=24,  active_holdings_string="ind_cco_fin_ult1,ind_nomina_ult1"),
            CustomerProfile(ncodpers=3008, name="Paula Ortega",     email="paula.ortega@demo.com",     segment="UNIVERSITARIO",gender="F", age=21, renta=9000.0,   antiguedad=8,   active_holdings_string="ind_cco_fin_ult1"),
            CustomerProfile(ncodpers=3009, name="Fernando Delgado", email="fernando.delgado@demo.com", segment="UNIVERSITARIO",gender="M", age=23, renta=16500.0,  antiguedad=16,  active_holdings_string="ind_cco_fin_ult1,ind_tjcr_fin_ult1"),
            CustomerProfile(ncodpers=3010, name="Natalia Reyes",    email="natalia.reyes@demo.com",    segment="UNIVERSITARIO",gender="F", age=22, renta=13000.0,  antiguedad=14,  active_holdings_string="ind_cco_fin_ult1"),
        ]

        db.session.add_all(samples)
        db.session.commit()
        click.echo(f"✓ Feature store seeded with {len(samples)} customers across 3 segments.")

    return app

# Run the app with: python app.py
if __name__ == '__main__':
    create_app().run(host='0.0.0.0', port=5000, debug=True)