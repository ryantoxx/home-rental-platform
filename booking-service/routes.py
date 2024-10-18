from flask import request, jsonify
from models import Property, Booking, Notification
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from __main__ import app, db, cache, socketio
from flask_socketio import emit, join_room, leave_room
import json
import eventlet

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('get-notification')
@jwt_required()
def handle_get_notification(data):
    user_id = get_jwt_identity()
    property_id = data.get('property_id')

    if property_id:

        existing_notification = Notification.query.filter_by(user_id=user_id, property_id=property_id).first()

        if existing_notification:
            emit('notification_response', {'message': f'Already watching notification for property with ID:{property_id}'})
            return  

        room = f'room {property_id}'

        notification = Notification(user_id=user_id, property_id=property_id)
        db.session.add(notification)
        db.session.commit()

        emit('notification_response', {'message': f'Subscribed to notification for property with ID:{property_id}'})
    else:
        emit('notification_response', {'message': 'Error'})
        
@socketio.on('stop-notification')
@jwt_required()
def handle_stop_notification(data):
    user_id = get_jwt_identity()
    property_id = data.get('property_id')

    if property_id:
        notification = Notification.query.filter_by(user_id=user_id, property_id=property_id).first()

        if notification:
            db.session.delete(notification)
            db.session.commit()

            room = f'room {property_id}'
            leave_room(room)

            emit('stop_notification_response', {'message': f'Stopped getting notification for property with ID: {property_id}'})
        else:
            emit('stop_notification_response', {'message': 'No notification found for this property id'})
    else:
        emit('stop_notification_response', {'message': 'Error'})

@socketio.on('join-room')
@jwt_required()
def handle_join_room(data):
    user_id = get_jwt_identity()
    property_id = data.get('property_id')

    if property_id:
        existing_notification = Notification.query.filter_by(user_id=user_id, property_id=property_id).first()

        if existing_notification:
            room = f'room {property_id}'
            join_room(room)
            emit('join_response', {'message': f'Connected to room {room} for notifications.'})
        else:
            emit('join_response', {'message': f'User {user_id} is has not yet joined a room to get notifications {property_id}.'})
    else:
        emit('join_response', {'message': 'Error'})
        
@socketio.on('leave-room')
@jwt_required()
def handle_leave_room(data):
    user_id = get_jwt_identity()
    property_id = data.get('property_id')

    if property_id:
        notification = Notification.query.filter_by(user_id=user_id, property_id=property_id).first()

        if notification:
            room = f'room {property_id}'
            leave_room(room)
            emit('leave_response', {'message': f'Left from room {room}.'})
            print(f"User {user_id} left room {room}.")
        else:
            emit('leave_response', {'message': f'User {user_id} did not get notification for property with ID: {property_id}.'})
    else:
        emit('leave_response', {'message': 'Error'})

@socketio.on('broadcast_notification')
def handle_notification(data):
    property_id = data.get('property_id')
    notification = data.get('notification')
    if property_id and notification:
        room = f'room {property_id}'
        emit('notification_update', {'update': notification}, room=room)
    else:
        emit('notification_update', {'message': 'Error'})

# Root route for testing
@app.route('/')
def home():
    return 'Booking Service is running!'

@app.route('/seed-properties', methods=['POST'])
def seed_properties():
    if Property.query.count() == 0: 
        property_data = [
            Property(name='Modern City Apartment', location='New York City NY', price_per_night=120.00, availability=True),
            Property(name='Oceanfront Luxury Villa', location='Malibu, CA', price_per_night=450.00, availability=True),
            Property(name='Rustic Mountain Cabin', location='Aspen, CO', price_per_night=180.00, availability=True),
            Property(name='Charming Country Cottage', location='Charleston, SC', price_per_night=90.00, availability=True),
            Property(name='Downtown Penthouse', location='Chicago, IL', price_per_night=600.00, availability=True)
        ]

        db.session.add_all(property_data)
        db.session.commit()
        return jsonify({"message": "Default property data added."}), 201
    else:
        return jsonify({"message": "Property data already exists."}), 200


@app.route('/api/properties', methods=['GET'])
def get_properties():

    cached_properties = cache.get('properties')

    if cached_properties:
        return jsonify(json.loads(cached_properties)), 200
    
    properties = Property.query.all()
    result = []
    for property in properties:
        result.append({
            "propertyId": property.id,
            "name": property.name,
            "location": property.location,
            "pricePerNight": property.price_per_night,
            "availability": property.availability
        })

    cache.setex('properties', 300, json.dumps(result))

    return jsonify(result), 200

@app.route('/api/book', methods=['POST'])
@jwt_required()
def create_booking():
    data = request.get_json()
    user_id = data.get('userId')
    property_id = data.get('propertyId')
    start_date = data.get('startDate')
    end_date = data.get('endDate')

    property = Property.query.filter_by(id=property_id, availability=True).first()
    if not property:
        return jsonify({'message': 'Property not found or not available'}), 404

    start_date_dt = datetime.strptime(start_date, '%Y-%m-%d')
    end_date_dt = datetime.strptime(end_date, '%Y-%m-%d')
    total_price = property.price_per_night * (end_date_dt - start_date_dt).days

    new_booking = Booking(
        property_id=property_id,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date
    )
    db.session.add(new_booking)
    property.availability = False
    db.session.commit()

    # Update the cache with the new property availability status
    cache.delete('properties')

    properties = Property.query.all()
    result = []
    for prop in properties:
        result.append({
            "propertyId": prop.id,
            "name": prop.name,
            "location": prop.location,
            "pricePerNight": prop.price_per_night,
            "availability": prop.availability
        })

    cache.setex('properties', 300, json.dumps(result))

    return jsonify({
        'bookingId': new_booking.id,
        'message': 'Booking confirmed',
        'totalPrice': total_price
    }), 201


@app.route('/api/booking/<string:booking_id>', methods=['GET'])
@jwt_required()
def get_booking(booking_id):
    booking = Booking.query.filter_by(id=booking_id).first()
    if not booking:
        return jsonify({'message': 'Booking not found'}), 404

    return jsonify({
        'bookingId': booking.id,
        'propertyId': booking.property_id,
        'userId': booking.user_id,
        'startDate': booking.start_date,
        'endDate': booking.end_date,
        'status': booking.status
    }), 200

@app.route('/api/cancel-booking/<int:booking_id>', methods=['DELETE'])
@jwt_required()
def cancel_booking(booking_id):
    booking = Booking.query.get(booking_id)
    property = Property.query.get(booking.property_id)

    if not booking:
        return jsonify({'message': 'Booking not found'}), 404

    booking.status = 'CANCELED'
    property.availability = True
    db.session.commit()
    cache.delete('properties')

    properties = Property.query.all()
    result = []
    for prop in properties:
        result.append({
            "propertyId": prop.id,
            "name": prop.name,
            "location": prop.location,
            "pricePerNight": prop.price_per_night,
            "availability": prop.availability
        })

    cache.setex('properties', 300, json.dumps(result))

    return jsonify({'message': 'Booking cancelled and property availability updated in cache'}), 200
