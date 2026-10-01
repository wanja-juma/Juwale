from flask import Flask, jsonify


def create_app():
    app = Flask(__name__)

    @app.get("/api/health")
    def health_check():
        return jsonify({
            "message": "JUWALE API is running"
        }), 200

    return app