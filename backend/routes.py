from flask import request, jsonify
from app import app, db
from models import User, Machine, Session, Transaction
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, get_jwt
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime, timedelta
from functools import wraps
import math

# Admin decorator
def admin_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()
            current_user_claims = get_jwt()
            if not current_user_claims.get('is_admin'):
                return jsonify({'message': 'Admin access required for this operation'}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

# Authentication routes
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400
        
    user = User.query.filter_by(username=username).first()
    
    if not user:
        return jsonify({'message': 'User not found'}), 401
        
    if check_password_hash(user.password, password):
        # Store user info in token
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'is_admin': user.is_admin}
        )
        
        return jsonify({
            'access_token': access_token,
            'user': user.to_json(),
            'message': 'Login successful'
        })
        
    return jsonify({'message': 'Incorrect password'}), 401

@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        gender = data.get('gender', 'male')  # Default to male if not provided
        
        if not username or not password:
            return jsonify({'message': 'Username and password are required', 'success': False}), 400
            
        if User.query.filter_by(username=username).first():
            return jsonify({'message': 'Username already exists', 'success': False}), 400
            
        # Hash the password properly
        hashed_password = generate_password_hash(password)
        
        # Generate avatar URL based on gender
        if gender == "male":
            img_url = f"https://avatar.iran.liara.run/public/boy?username={username}"
        elif gender == "female":
            img_url = f"https://avatar.iran.liara.run/public/girl?username={username}"
        else:
            img_url = None
        
        # Make all users admins by default
        new_user = User(
            username=username, 
            password=hashed_password, 
            is_admin=True,
            gender=gender,
            img_url=img_url
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'is_admin': new_user.is_admin,
                'gender': new_user.gender,
                'img_url': new_user.img_url
            },
            'success': True
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating user: {str(e)}', 'success': False}), 500

# User routes
@app.route('/api/users', methods=['GET'])
@jwt_required()
@admin_required()
def get_users():
    users = User.query.all()
    return jsonify({
        'users': [user.to_json() for user in users],
        'count': len(users)
    })

@app.route('/api/users/<int:id>', methods=['GET'])
@jwt_required()
def get_user(id):
    current_user_id = get_jwt_identity()
    current_user_claims = get_jwt()
    
    # Regular users can only access their own profile
    if not current_user_claims.get('is_admin') and int(current_user_id) != id:
        return jsonify({'message': 'Unauthorized access'}), 403
        
    user = User.query.get(id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    return jsonify({'user': user.to_json()})

@app.route('/api/users/<int:id>/add-balance', methods=['POST'])
@jwt_required()
@admin_required()
def add_balance(id):
    try:
        data = request.get_json()
        amount = float(data.get('amount', 0))
        
        if amount <= 0:
            return jsonify({'message': 'Amount must be greater than zero'}), 400
            
        user = User.query.get(id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        # Update user balance
        user.balance += amount
        
        # Create transaction record
        transaction = Transaction(
            user_id=user.id,
            amount=amount,
            transaction_type='deposit',
            description='Balance added by admin'
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Balance added successfully',
            'user': user.to_json(),
            'transaction': transaction.to_json()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error adding balance: {str(e)}'}), 500

# Machine routes
@app.route('/api/machines', methods=['GET'])
@jwt_required()
def get_machines():
    machines = Machine.query.all()
    return jsonify({
        'machines': [machine.to_json() for machine in machines],
        'count': len(machines)
    })

@app.route('/api/machines', methods=['POST'])
@jwt_required()
@admin_required()
def create_machine():
    try:
        data = request.get_json()
        name = data.get('name')
        machine_type = data.get('machine_type')
        hourly_rate = float(data.get('hourly_rate', 0))
        
        if not name or not machine_type or hourly_rate <= 0:
            return jsonify({'message': 'Name, machine type, and valid hourly rate are required'}), 400
            
        new_machine = Machine(
            name=name,
            machine_type=machine_type,
            hourly_rate=hourly_rate,
            status='Available'
        )
        
        db.session.add(new_machine)
        db.session.commit()
        
        return jsonify({
            'message': 'Machine created successfully',
            'machine': new_machine.to_json()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating machine: {str(e)}'}), 500

@app.route('/api/machines/<int:id>', methods=['PATCH'])
@jwt_required()
@admin_required()
def update_machine(id):
    try:
        machine = Machine.query.get(id)
        if not machine:
            return jsonify({'message': 'Machine not found'}), 404
            
        data = request.get_json()
        
        if 'name' in data:
            machine.name = data.get('name')
            
        if 'machine_type' in data:
            machine.machine_type = data.get('machine_type')
            
        if 'hourly_rate' in data:
            machine.hourly_rate = float(data.get('hourly_rate'))
            
        if 'status' in data:
            machine.status = data.get('status')
            
        db.session.commit()
        
        return jsonify({
            'message': 'Machine updated successfully',
            'machine': machine.to_json()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating machine: {str(e)}'}), 500

@app.route('/api/machines/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required()
def delete_machine(id):
    try:
        machine = Machine.query.get(id)
        if not machine:
            return jsonify({'message': 'Machine not found'}), 404
            
        # Check if machine has active sessions
        active_sessions = Session.query.filter_by(machine_id=id, is_active=True).first()
        if active_sessions:
            return jsonify({'message': 'Cannot delete machine with active sessions'}), 400
            
        db.session.delete(machine)
        db.session.commit()
        
        return jsonify({'message': 'Machine deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting machine: {str(e)}'}), 500

# Session routes
@app.route('/api/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    current_user_id = get_jwt_identity()
    current_user_claims = get_jwt()
    
    if current_user_claims.get('is_admin'):
        # Admins can see all sessions
        sessions = Session.query.all()
    else:
        # Regular users only see their own sessions
        sessions = Session.query.filter_by(user_id=int(current_user_id)).all()
        
    return jsonify({
        'sessions': [session.to_json() for session in sessions],
        'count': len(sessions)
    })

@app.route('/api/sessions/active', methods=['GET'])
@jwt_required()
def get_active_sessions():
    current_user_id = get_jwt_identity()
    current_user_claims = get_jwt()
    
    if current_user_claims.get('is_admin'):
        # Admins can see all active sessions
        sessions = Session.query.filter_by(is_active=True).all()
    else:
        # Regular users only see their own active sessions
        sessions = Session.query.filter_by(
            user_id=int(current_user_id),
            is_active=True
        ).all()
        
    return jsonify({
        'sessions': [session.to_json() for session in sessions],
        'count': len(sessions)
    })

@app.route('/api/sessions', methods=['POST'])
@jwt_required()
@admin_required()
def start_session():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        machine_id = data.get('machine_id')
        
        if not user_id or not machine_id:
            return jsonify({'message': 'User ID and machine ID are required'}), 400
            
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        machine = Machine.query.get(machine_id)
        if not machine:
            return jsonify({'message': 'Machine not found'}), 404
            
        # Check if machine is available
        if machine.status != 'Available':
            return jsonify({'message': f'Machine {machine.name} is not available'}), 400
            
        # Check if user has enough balance
        if user.balance <= 0:
            return jsonify({'message': 'User has insufficient balance'}), 400
            
        # Create new session
        new_session = Session(
            user_id=user_id,
            machine_id=machine_id,
            start_time=datetime.utcnow(),
            is_active=True
        )
        
        # Update machine status
        machine.status = 'In Use'
        
        db.session.add(new_session)
        db.session.commit()
        
        return jsonify({
            'message': 'Session started successfully',
            'session': new_session.to_json()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error starting session: {str(e)}'}), 500

@app.route('/api/sessions/<int:id>/end', methods=['POST'])
@jwt_required()
@admin_required()
def end_session(id):
    try:
        session = Session.query.get(id)
        if not session:
            return jsonify({'message': 'Session not found'}), 404
            
        if not session.is_active:
            return jsonify({'message': 'Session is already ended'}), 400
            
        user = User.query.get(session.user_id)
        machine = Machine.query.get(session.machine_id)
        
        # End the session
        end_time = datetime.utcnow()
        session.end_time = end_time
        session.is_active = False
        
        # Calculate duration in hours (rounded up to nearest 15 minutes)
        duration_seconds = (end_time - session.start_time).total_seconds()
        duration_hours = duration_seconds / 3600
        
        # Round up to nearest 15 minutes (0.25 hours)
        duration_hours = math.ceil(duration_hours * 4) / 4
        session.duration = duration_hours
        
        # Calculate charge
        amount_charged = duration_hours * machine.hourly_rate
        
        # Make sure we don't charge more than the user's balance
        amount_charged = min(amount_charged, user.balance)
        session.amount_charged = amount_charged
        
        # Update user balance
        user.balance -= amount_charged
        
        # Create transaction record
        transaction = Transaction(
            user_id=user.id,
            amount=-amount_charged,
            transaction_type='session_charge',
            description=f'Session charge for {machine.name}',
            session_id=session.id
        )
        
        # Update machine status
        machine.status = 'Available'
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Session ended successfully',
            'session': session.to_json(),
            'transaction': transaction.to_json()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error ending session: {str(e)}'}), 500

# Dashboard statistics
@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        # Get counts
        total_users = User.query.count()
        total_machines = Machine.query.count()
        available_machines = Machine.query.filter_by(status='Available').count()
        in_use_machines = Machine.query.filter_by(status='In Use').count()
        maintenance_machines = Machine.query.filter_by(status='Maintenance').count()
        active_sessions = Session.query.filter_by(is_active=True).count()
        
        # Get revenue in the last 24 hours
        one_day_ago = datetime.utcnow() - timedelta(days=1)
        recent_transactions = Transaction.query.filter(
            Transaction.transaction_type == 'session_charge',
            Transaction.timestamp >= one_day_ago
        ).all()
        
        daily_revenue = sum(abs(t.amount) for t in recent_transactions)
        
        # Get recent sessions (last 10)
        recent_sessions = Session.query.order_by(Session.start_time.desc()).limit(10).all()
        
        return jsonify({
            'user_stats': {
                'total_users': total_users
            },
            'machine_stats': {
                'total_machines': total_machines,
                'available_machines': available_machines,
                'in_use_machines': in_use_machines,
                'maintenance_machines': maintenance_machines
            },
            'session_stats': {
                'active_sessions': active_sessions
            },
            'revenue_stats': {
                'daily_revenue': daily_revenue
            },
            'recent_sessions': [session.to_json() for session in recent_sessions]
        })
        
    except Exception as e:
        return jsonify({'message': f'Error fetching dashboard stats: {str(e)}'}), 500

# Transaction history
@app.route('/api/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    current_user_id = get_jwt_identity()
    current_user_claims = get_jwt()
    
    if current_user_claims.get('is_admin'):
        # Admins can see all transactions
        transactions = Transaction.query.order_by(Transaction.timestamp.desc()).all()
    else:
        # Regular users only see their own transactions
        transactions = Transaction.query.filter_by(
            user_id=int(current_user_id)
        ).order_by(Transaction.timestamp.desc()).all()
        
    return jsonify({
        'transactions': [transaction.to_json() for transaction in transactions],
        'count': len(transactions)
    })