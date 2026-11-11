from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError, OperationalError

from extensions import db
from models import DeliveryDetails, User


delivery = Blueprint(
    "delivery",
    __name__,
    url_prefix="/api/delivery-details",
)


def get_current_delivery_user():
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return None

    return db.session.get(User, user_id)


@delivery.get("")
@jwt_required()
def get_delivery_details():
    user = get_current_delivery_user()

    if user is None:
        return jsonify({"message": "Invalid session."}), 401

    details = db.session.scalar(
        db.select(DeliveryDetails).where(
            DeliveryDetails.user_id == user.id
        )
    )

    return jsonify({
        "delivery_details": (
            details.to_dict() if details is not None else None
        )
    })


@delivery.put("")
@jwt_required()
def save_delivery_details():
    user = get_current_delivery_user()

    if user is None:
        return jsonify({"message": "Invalid session."}), 401

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Provide a JSON object."
        }), 400

    field_limits = {
        "delivery_name": 100,
        "phone": 30,
        "address": 1000,
    }

    if set(data) - set(field_limits):
        return jsonify({
            "message": "Only delivery_name, phone and address are allowed."
        }), 400

    values = {}
    errors = {}

    for field, maximum in field_limits.items():
        value = data.get(field)

        if not isinstance(value, str) or not value.strip():
            errors[field] = "This field is required."
        elif len(value.strip()) > maximum:
            errors[field] = (
                f"Must be at most {maximum} characters."
            )
        else:
            values[field] = value.strip()

    if errors:
        return jsonify({
            "message": "Please check your delivery details.",
            "errors": errors,
        }), 400

    details = db.session.scalar(
        db.select(DeliveryDetails).where(
            DeliveryDetails.user_id == user.id
        )
    )

    created = details is None

    if created:
        details = DeliveryDetails(user_id=user.id)
        db.session.add(details)

    details.delivery_name = values["delivery_name"]
    details.phone = values["phone"]
    details.address = values["address"]

    try:
        db.session.flush()
        details_data = details.to_dict()
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "message": (
                "Your saved details changed in another request. "
                "Refresh and try again."
            )
        }), 409

    return jsonify({
        "message": "Delivery details saved.",
        "delivery_details": details_data,
    }), 201 if created else 200


@delivery.delete("")
@jwt_required()
def delete_delivery_details():
    user = get_current_delivery_user()

    if user is None:
        return jsonify({"message": "Invalid session."}), 401

    details = db.session.scalar(
        db.select(DeliveryDetails).where(
            DeliveryDetails.user_id == user.id
        )
    )

    if details is not None:
        db.session.delete(details)
        db.session.commit()

    return "", 204


@delivery.errorhandler(OperationalError)
def handle_delivery_database_error(error):
    db.session.rollback()

    return jsonify({
        "message": "The database is temporarily unavailable. Try again."
    }), 503