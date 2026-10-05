import re

from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import User


auth = Blueprint("auth", __name__)

EMAIL_PATTERN = re.compile(
    r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
)


@auth.post("/register")
def register():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "A JSON object is required"
        }), 400

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    errors = {}

    if not isinstance(name, str) or not name.strip():
        errors["name"] = "Name is required"
    else:
        name = name.strip()

        if len(name) > 100:
            errors["name"] = "Name must be at most 100 characters"

    if not isinstance(email, str) or not email.strip():
        errors["email"] = "Email is required"
    else:
        email = email.strip().lower()

        if (
            len(email) > 255
            or not EMAIL_PATTERN.fullmatch(email)
        ):
            errors["email"] = "Enter a valid email address"

    if not isinstance(password, str):
        errors["password"] = "Password is required"
    elif (
        not password.strip()
        or not 8 <= len(password) <= 128
    ):
        errors["password"] = (
            "Password must contain 8 to 128 characters "
            "and cannot be only whitespace"
        )

    if errors:
        return jsonify({
            "message": "Please correct the registration details",
            "errors": errors,
        }), 400

    existing_user = db.session.scalar(
        db.select(User).where(
            User.email == email
        )
    )

    if existing_user is not None:
        return jsonify({
            "message": "An account with this email already exists",
            "errors": {
                "email": "This email is already registered"
            },
        }), 409

    user = User(
        name=name,
        email=email,
        role="customer",
    )

    user.set_password(password)

    db.session.add(user)

    try:
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "message": "Registration conflicts with an existing account",
            "errors": {
                "email": "This email may already be registered"
            },
        }), 409

    return jsonify({
        "message": "Account created successfully",
        "user": user.to_dict(),
    }), 201