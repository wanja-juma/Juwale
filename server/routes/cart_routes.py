from flask import Blueprint, abort, jsonify, request
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)
from sqlalchemy.exc import IntegrityError, OperationalError

from extensions import db
from models import CartItem, Product, User


cart = Blueprint("cart", __name__)


@cart.errorhandler(400)
@cart.errorhandler(401)
@cart.errorhandler(404)
def handle_cart_error(error):
    db.session.rollback()

    return jsonify({
        "message": error.description
    }), error.code


def get_current_user():
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        abort(401, description="Invalid user identity")

    user = db.session.get(User, user_id)

    if user is None:
        abort(401, description="Account no longer exists")

    return user


def get_json_body():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        abort(400, description="A JSON object is required")

    return data


def validate_positive_integer(value, field_name):
    # Reject booleans, strings, decimals, zero, and negatives.
    if type(value) is not int or value < 1:
        abort(
            400,
            description=f"{field_name} must be a positive integer"
        )

    return value


def save_changes():
    try:
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "message": (
                "The cart changed during this request. "
                "Refresh your cart before trying again."
            )
        }), 409

    except OperationalError:
        db.session.rollback()

        return jsonify({
            "message": (
                "The database is temporarily unavailable. "
                "Please try again."
            )
        }), 503

    return None


@cart.get("")
@jwt_required()
def get_cart():
    user = get_current_user()

    items = db.session.scalars(
        db.select(CartItem)
        .where(CartItem.user_id == user.id)
        .order_by(CartItem.id)
    ).all()

    return jsonify({
        "items": [
            item.to_dict()
            for item in items
        ],
        "total_quantity": sum(
            item.quantity
            for item in items
        ),
        "total_minor": sum(
            item.quantity * item.product.price_minor
            for item in items
        ),
    }), 200


@cart.post("/items")
@jwt_required()
def add_cart_item():
    user = get_current_user()
    data = get_json_body()

    product_id = validate_positive_integer(
        data.get("product_id"),
        "product_id"
    )

    quantity = validate_positive_integer(
        data.get("quantity"),
        "quantity"
    )

    product = db.session.get(Product, product_id)

    if product is None or not product.is_active:
        abort(404, description="Product not found")

    item = db.session.scalar(
        db.select(CartItem).where(
            CartItem.user_id == user.id,
            CartItem.product_id == product.id,
        )
    )

    new_quantity = quantity + (
        item.quantity if item is not None else 0
    )

    if new_quantity > product.stock:
        abort(
            400,
            description=(
                f"Only {product.stock} units of "
                f"{product.name} are available"
            )
        )

    created = item is None

    if created:
        item = CartItem(
            user_id=user.id,
            product_id=product.id,
            quantity=new_quantity,
        )

        db.session.add(item)

    else:
        item.quantity = new_quantity

    error_response = save_changes()

    if error_response is not None:
        return error_response

    return jsonify({
        "message": "Cart updated",
        "item": item.to_dict(),
    }), 201 if created else 200


@cart.patch("/items/<int:item_id>")
@jwt_required()
def update_cart_item(item_id):
    user = get_current_user()

    item = db.session.scalar(
        db.select(CartItem).where(
            CartItem.id == item_id,
            CartItem.user_id == user.id,
        )
    )

    if item is None:
        abort(404, description="Cart item not found")

    data = get_json_body()

    quantity = validate_positive_integer(
        data.get("quantity"),
        "quantity"
    )

    if not item.product.is_active:
        abort(
            400,
            description="This product is no longer available"
        )

    if quantity > item.product.stock:
        abort(
            400,
            description=(
                f"Only {item.product.stock} units of "
                f"{item.product.name} are available"
            )
        )

    item.quantity = quantity

    error_response = save_changes()

    if error_response is not None:
        return error_response

    return jsonify({
        "message": "Quantity updated",
        "item": item.to_dict(),
    }), 200


@cart.delete("/items/<int:item_id>")
@jwt_required()
def remove_cart_item(item_id):
    user = get_current_user()

    item = db.session.scalar(
        db.select(CartItem).where(
            CartItem.id == item_id,
            CartItem.user_id == user.id,
        )
    )

    if item is None:
        abort(404, description="Cart item not found")

    db.session.delete(item)

    error_response = save_changes()

    if error_response is not None:
        return error_response

    return "", 204