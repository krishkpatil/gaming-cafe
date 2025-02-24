from . import app, db
from .models import User  # Import models before creating tables

print("Creating database tables...")
with app.app_context():
    db.drop_all()  # Drop all existing tables
    db.create_all()  # Create tables with current schema
    print("Database tables created successfully!")

if __name__ == '__main__':
    app.run(debug=True)