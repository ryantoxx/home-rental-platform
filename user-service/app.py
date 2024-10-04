from flask import Flask
from models import db
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

def create_app():
    app = Flask(__name__)

    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:nikita@user-service-db:5432/user_service_db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config["JWT_SECRET_KEY"] = "my-secret"

    db.init_app(app)  

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
    app.run(debug=True, host='0.0.0.0')
