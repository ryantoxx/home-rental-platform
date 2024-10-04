from flask import Flask
from models import db
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import redis

def create_app():
    app = Flask(__name__)

    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:nikita@booking-service-db:3306/bookingdb'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config["JWT_SECRET_KEY"] = "my-secret"

    db.init_app(app)
    
    global cache
    cache = redis.StrictRedis(host='redis', port=6379, db=0, decode_responses=True)
    
    limiter = Limiter(
        key_func = get_remote_address,
        default_limits=["5 per minute", "1 per second"],
    )
    limiter.init_app(app)

    return app

if __name__ == '__main__':
    app = create_app()
    import routes
    jwt = JWTManager(app)
    app.run(debug=True, port=5001, host='0.0.0.0')
