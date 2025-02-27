from app import db
from sqlalchemy.orm import relationship
from datetime import datetime
from pytz import timezone

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)  # Stored as hash
    is_admin = db.Column(db.Boolean, default=False)
    balance = db.Column(db.Float, default=0.0)  # User's current balance
    gender = db.Column(db.String(10), default="male", nullable=True)  # "male", "female", or "other"
    img_url = db.Column(db.String(200), nullable=True)  # URL to avatar image
    
    # Relationships
    sessions = relationship("Session", back_populates="user")
    
    def __repr__(self):
        return f'<User {self.username}>'
        
    def to_json(self):
        return {
            "id": self.id,
            "username": self.username,
            "is_admin": self.is_admin,
            "balance": self.balance,
            "gender": self.gender,
            "img_url": self.img_url
        }

class Machine(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    machine_type = db.Column(db.String(20), nullable=False)  # Standard, Premium, VIP
    hourly_rate = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default="Available")  # Available, In Use, Maintenance
    
    # Relationships
    sessions = relationship("Session", back_populates="machine")
    
    def to_json(self):
        return {
            "id": self.id,
            "name": self.name,
            "machine_type": self.machine_type,
            "hourly_rate": self.hourly_rate,
            "status": self.status
        }

class Session(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    machine_id = db.Column(db.Integer, db.ForeignKey('machine.id'), nullable=False)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=True)
    duration = db.Column(db.Float, nullable=True)  # in hours
    amount_charged = db.Column(db.Float, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    machine = relationship("Machine", back_populates="sessions")
    
    def to_json(self):
        # Create local timezone object for Asia/Kolkata (Indian Standard Time)
        local_tz = timezone('Asia/Kolkata')
        
        # Convert start_time to local timezone
        local_start_time = None
        if self.start_time:
            # Make sure we have a timezone-aware datetime (add UTC if naive)
            if self.start_time.tzinfo is None:
                from datetime import timezone as dt_timezone
                start_time_utc = self.start_time.replace(tzinfo=dt_timezone.utc)
            else:
                start_time_utc = self.start_time
            
            local_start_time = start_time_utc.astimezone(local_tz)
        
        # Convert end_time to local timezone
        local_end_time = None
        if self.end_time:
            # Make sure we have a timezone-aware datetime (add UTC if naive)
            if self.end_time.tzinfo is None:
                from datetime import timezone as dt_timezone
                end_time_utc = self.end_time.replace(tzinfo=dt_timezone.utc)
            else:
                end_time_utc = self.end_time
            
            local_end_time = end_time_utc.astimezone(local_tz)
        
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.user.username if self.user else None,
            "user_balance": self.user.balance if self.user else 0,
            "machine_id": self.machine_id,
            "machine_name": self.machine.name if self.machine else None,
            "machine_type": self.machine.machine_type if self.machine else None,
            "hourly_rate": self.machine.hourly_rate if self.machine else None,
            "start_time": local_start_time.isoformat() if local_start_time else None,
            "end_time": local_end_time.isoformat() if local_end_time else None,
            "duration": self.duration,
            "amount_charged": self.amount_charged,
            "is_active": self.is_active
        }

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # deposit, session_charge
    description = db.Column(db.String(255), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    session_id = db.Column(db.Integer, db.ForeignKey('session.id'), nullable=True)
    
    # Relationships
    user = relationship("User")
    session = relationship("Session", foreign_keys=[session_id])
    
    def to_json(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.user.username if self.user else None,
            "amount": self.amount,
            "transaction_type": self.transaction_type,
            "description": self.description,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "session_id": self.session_id
        }