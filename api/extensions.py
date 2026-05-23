from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

"""
Global Extension Instantiation Hub.

By defining object instances globally outside the application factory engine, 
we avoid cyclic import traps when models or blueprints require instance mappings.
"""

# Object-Relational Mapper (ORM) tracking entity frameworks
db = SQLAlchemy()

# Cross-Origin Resource Sharing (CORS) header configuration middleware engine
cors = CORS()