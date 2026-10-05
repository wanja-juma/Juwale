from datetime import timedelta
import os
import sqlite3

from flask import Flask, jsonify
from seed import register_seed_command
from sqlalchemy import event
from sqlalchemy.engine import Engine

from extensions import db, migrate, jwt


@event.listens_for(Engine, "connect")
def enable_sqlite_foreign_keys(connection, connection_record):
    if isinstance(connection, sqlite3.Connection):
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def create_app():
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        "sqlite:///juwale.db"
    )

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    os.makedirs(app.instance_path, exist_ok=True)

    jwt_secret = os.getenv("JWT_SECRET_KEY")

    if not jwt_secret:
        raise RuntimeError(
            "Set JWT_SECRET_KEY in server/.env before starting Flask"
        )

    app.config["JWT_SECRET_KEY"] = jwt_secret
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)

    db.init_app(app)

    # Import models so migrations can detect their tables.
    import models

    migrate.init_app(app, db)

    jwt.init_app(app)

    from seed import register_seed_command

    register_seed_command(app)

    from routes import api

    app.register_blueprint(api, url_prefix="/api")

    from auth_routes import auth

    app.register_blueprint(
        auth,
        url_prefix="/api/auth"
    )

    from cart_routes import cart

    app.register_blueprint(
        cart,
        url_prefix="/api/cart"
    )

    @app.get("/api/health")
    def health_check():
        return jsonify({
            "message": "JUWALE API is running"
        }), 200

    return app