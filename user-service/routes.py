from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity
from __main__ import app, db
from models import User

# Root route for testing
@app.route('/')
def home():
    return 'User Authentication Service is running!'

# Register a new user
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already exists'}), 400

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    new_user = User(username=username, email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

# Log in the user
from flask_jwt_extended import create_access_token
from datetime import timedelta

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'Invalid email or password'}), 401

    if not check_password_hash(user.password, password):
        return jsonify({'message': 'Invalid email or password'}), 401

    access_token = create_access_token(identity=user.id, expires_delta=timedelta(hours=1))
    
    return jsonify({'token': access_token, 'message': 'Login successful'}), 200


# Retrieve all users
@app.route('/api/allusers', methods=['GET'])
def get_all_users():
    users = User.query.all()
    user_list = [{'id': user.id, 'username': user.username, 'email': user.email} for user in users]
    return jsonify(user_list), 200
    
# Profile route to get user details
@app.route('/api/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id = get_jwt_identity() 
    user = User.query.get(user_id)

    if user:
        profile_info = {
            "userId": user.id,
            "username": user.username,
            "email": user.email,
            "registeredDate": user.registration_date.strftime('%Y-%m-%d')
        }
        return jsonify(profile_info), 200
    else:
        return jsonify({'message': 'User not found'}), 404

