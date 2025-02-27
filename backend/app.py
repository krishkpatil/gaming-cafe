from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os

app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = 'your_secret_key'  # Change this! Use an environment variable in production
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///gamers.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 30 * 60  # 30 minutes (in seconds)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# Create the database tables within the app context
with app.app_context():
    # Import models (after db is defined)
    from models import User, Machine, Session, Transaction  # Added missing imports
    db.create_all()

# Import and register routes
import routes

if __name__ == "__main__":
    app.run(debug=True)