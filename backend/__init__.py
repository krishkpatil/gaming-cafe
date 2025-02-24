from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

app = Flask(__name__, instance_relative_config=True)
CORS(app)

# Ensure the instance folder exists
try:
    os.makedirs(app.instance_path)
    print(f"Instance path created at: {app.instance_path}")
except OSError:
    print(f"Using existing instance path: {app.instance_path}")

# Configure database path in instance folder
db_path = os.path.join(app.instance_path, 'gaming_cafe.db')
print(f"Database will be created at: {db_path}")

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Import routes after db initialization
from .routes import *