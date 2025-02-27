from flask import Flask, request, jsonify, session
from app import app, db
from models import User, Friend
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, get_jwt
from werkzeug.security import check_password_hash, generate_password_hash
from functools import wraps
import datetime

# Login route - improved to return user role info
@app.route('/login', methods=['POST'])
def login():
    auth = request.authorization
    if not auth or not auth.username or not auth.password:
        return jsonify({'message': 'Could not verify'}), 401, {'WWW-Authenticate': 'Basic realm="Login Required!"'}

    user = User.query.filter_by(username=auth.username).first()

    if not user:
        return jsonify({'message': 'User not found'}), 401

    if check_password_hash(user.password, auth.password):
        # Store user info in token
        access_token = create_access_token(
            identity=str(user.id),  # Use string user ID as the subject
            additional_claims={'is_admin': user.is_admin}  # Put other data in additional claims
        )

        # Return more user info for the frontend
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'is_admin': user.is_admin
            },
            'message': 'Login successful'
        })

    return jsonify({'message': 'Incorrect password'}), 401

# Admin decorator (using JWT Extended)
def admin_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()  # Verify JWT token first
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()  # This is now a string
            current_user_claims = get_jwt()  # Get all JWT claims
            if not current_user_claims.get('is_admin'):
                return jsonify({'message': 'Admin access required for this operation'}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

# Get all friends - now requires login and respects user role
@app.route("/api/friends", methods=["GET"])
@jwt_required()
def get_friends():
    current_user_id = get_jwt_identity()  # This is now a string with user_id
    current_user_claims = get_jwt()  # Get all JWT claims
    
    # If admin, return all friends
    if current_user_claims.get('is_admin'):
        friends = Friend.query.all()
    else:
        # Regular users only see friends they created
        friends = Friend.query.filter_by(created_by=int(current_user_id)).all()
    
    result = [friend.to_json() for friend in friends]
    return jsonify({
        'friends': result,
        'count': len(result),
        'success': True
    })

# Get a specific friend - respect user permissions
@app.route("/api/friends/<int:id>", methods=["GET"])
@jwt_required()
def get_friend(id):
    current_user_id = get_jwt_identity()  # This is now a string
    current_user_claims = get_jwt()  # Get all JWT claims
    
    friend = Friend.query.get(id)
    if friend is None:
        return jsonify({"error": "Friend not found"}), 404
        
    # Check if user has permission to view this friend
    if not current_user_claims.get('is_admin') and friend.created_by != int(current_user_id):
        return jsonify({"error": "You don't have permission to view this friend"}), 403
        
    return jsonify({
        'friend': friend.to_json(),
        'success': True
    })

# Create a friend - requires login, sets creator
@app.route("/api/friends", methods=["POST"])
@jwt_required()
def create_friend():
    current_user_id = get_jwt_identity()  # This is now a string
    try:
        data = request.json

        # Validations
        required_fields = ["name", "role", "description", "gender"]
        for field in required_fields:
            if field not in data or not data.get(field):
                return jsonify({"error": f'Missing required field: {field}'}), 400

        name = data.get("name")
        role = data.get("role")
        description = data.get("description")
        gender = data.get("gender")

        # Fetch avatar image based on gender
        if gender == "male":
            img_url = f"https://avatar.iran.liara.run/public/boy?username={name}"
        elif gender == "female":
            img_url = f"https://avatar.iran.liara.run/public/girl?username={name}"
        else:
            img_url = None

        new_friend = Friend(name=name, role=role, description=description, gender=gender, img_url=img_url, created_by=int(current_user_id))

        db.session.add(new_friend)
        db.session.commit()

        return jsonify({
            'friend': new_friend.to_json(),
            'message': 'Friend created successfully',
            'success': True
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "success": False}), 500

# Delete a friend - ADMIN can delete any friend, regular users can delete their own
@app.route("/api/friends/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_friend(id):
    current_user_id = get_jwt_identity()  # This is now a string
    current_user_claims = get_jwt()  # Get all JWT claims
    
    try:
        friend = Friend.query.get(id)
        if friend is None:
            return jsonify({"error": "Friend not found", "success": False}), 404
            
        # Check if user has permission to delete this friend
        if not current_user_claims.get('is_admin') and friend.created_by != int(current_user_id):
            return jsonify({"error": "You don't have permission to delete this friend", "success": False}), 403

        db.session.delete(friend)
        db.session.commit()
        return jsonify({"message": "Friend deleted successfully", "success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "success": False}), 500

# Update a friend profile - ADMIN can update any friend, regular users can update their own
@app.route("/api/friends/<int:id>", methods=["PATCH", "PUT"])
@jwt_required()
def update_friend(id):
    current_user_id = get_jwt_identity()  # This is now a string
    current_user_claims = get_jwt()  # Get all JWT claims

    try:
        friend = Friend.query.get(id)
        if friend is None:
            return jsonify({"error": "Friend not found", "success": False}), 404
            
        # Check if user has permission to update this friend
        if not current_user_claims.get('is_admin') and friend.created_by != int(current_user_id):
            return jsonify({"error": "You don't have permission to update this friend", "success": False}), 403

        data = request.json

        # Update fields if provided
        if "name" in data:
            friend.name = data.get("name")
        if "role" in data:
            friend.role = data.get("role")
        if "description" in data:
            friend.description = data.get("description")
        if "gender" in data:
            friend.gender = data.get("gender")
            # Update avatar if gender changes
            if data.get("gender") == "male":
                friend.img_url = f"https://avatar.iran.liara.run/public/boy?username={friend.name}"
            elif data.get("gender") == "female":
                friend.img_url = f"https://avatar.iran.liara.run/public/girl?username={friend.name}"

        db.session.commit()
        return jsonify({
            'friend': friend.to_json(),
            'message': 'Friend updated successfully',
            'success': True
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e), "success": False}), 500

# User signup route
@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        is_admin = data.get('is_admin', False)  # Default to regular user
        
        if not username or not password:
            return jsonify({'message': 'Username and password are required', 'success': False}), 400
            
        if User.query.filter_by(username=username).first():
            return jsonify({'message': 'Username already exists', 'success': False}), 400
            
        # Hash the password properly
        hashed_password = generate_password_hash(password)
        
        new_user = User(username=username, password=hashed_password, is_admin=is_admin)
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'is_admin': new_user.is_admin
            },
            'success': True
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating user: {str(e)}', 'success': False}), 500

# Get current user profile
@app.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()  # This is now a string with the user ID
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({'message': 'User not found', 'success': False}), 404
        
    return jsonify({
        'user': {
            'id': user.id,
            'username': user.username,
            'is_admin': user.is_admin
        },
        'success': True
    })

# Test authentication endpoint
@app.route('/test-auth', methods=['GET'])
@jwt_required()
def test_auth():
    current_user_id = get_jwt_identity()
    current_user_claims = get_jwt()
    return jsonify({
        "message": "Authentication successful", 
        "user_id": current_user_id,
        "is_admin": current_user_claims.get('is_admin', False)
    })