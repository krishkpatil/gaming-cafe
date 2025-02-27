from app import db
from sqlalchemy.orm import relationship

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)  # Stored as hash
    is_admin = db.Column(db.Boolean, default=False)
    # Keep fields minimal to match existing database structure

    def __repr__(self):
        return f'<User {self.username}>'
        
    def to_json(self):
        return {
            "id": self.id,
            "username": self.username,
            "is_admin": self.is_admin
        }

class Friend(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    img_url = db.Column(db.String(200), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))  # FK to User
    creator = relationship("User", backref="friends")  # Establish relationship
    
    def to_json(self):
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "description": self.description,
            "gender": self.gender,
            "imgUrl": self.img_url,
            "created_by": self.created_by,
            "creator_username": self.creator.username if self.creator else None
        }