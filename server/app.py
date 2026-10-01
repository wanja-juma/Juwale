import os
import sqlite3

from flask import Flask, jsonify
from seed import register_seed_command
from sqlalchemy import event
from sqlalchemy.engine import Engine

from extensions import db, migrate


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

    db.init_app(app)

    # Import models so migrations can detect their tables.
    import models

    migrate.init_app(app, db)

    from seed import register_seed_command

    register_seed_command(app)

    @app.get("/api/health")
    def health_check():
        return jsonify({
            "message": "JUWALE API is running"
        }), 200

    return app