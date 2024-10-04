from flask import request, jsonify
from models import Property, Booking
from flask_jwt_extended import jwt_required
from datetime import datetime
from __main__ import app, db, cache
import json

# Root route for testing
@app.route('/')
def home():
    return 'Booking Service is running!'

@app.route('/seed-properties', methods=['POST'])
def seed_properties():
    if Property.query.count() == 0: 
        property_data = [
            Property(name='Modern City Apartment', location='New York City NY', price_per_night=120.00, availability=False),
            Property(name='Oceanfront Luxury Villa', location='Malibu, CA', price_per_night=450.00, availability=True),
            Property(name='Rustic Mountain Cabin', location='Aspen, CO', price_per_night=180.00, availability=False),
            Property(name='Charming Country Cottage', location='Charleston, SC', price_per_night=90.00, availability=True),
            Property(name='Downtown Penthouse', location='Chicago, IL', price_per_night=600.00, availability=False)
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

    return jsonify({'message': 'Booking cancelled'}), 200