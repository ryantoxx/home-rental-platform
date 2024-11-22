from flask import Flask
from models import db
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import redis
from flask_socketio import SocketIO
from flask_cors import CORS
from prometheus_flask_exporter import PrometheusMetrics  # New import

socketio = SocketIO()

def create_app():
    app = Flask(__name__)

    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:nikita@booking-service-db:3306/bookingdb'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config["JWT_SECRET_KEY"] = "my-secret"

    CORS(app)
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")

    global cache
    cache = redis.StrictRedis(host='redis', port=6379, db=0, decode_responses=True)

    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["5 per minute", "1 per second"],
    )
    limiter.init_app(app)
    
    PrometheusMetrics(app)

    return app

if __name__ == '__main__':
    app = create_app()
    # # Initialize Prometheus metrics
    # metrics = PrometheusMetrics(app)
    import routes
    jwt = JWTManager(app)
    socketio.run(app, debug=True, port=5003, host='0.0.0.0', allow_unsafe_werkzeug=True)

