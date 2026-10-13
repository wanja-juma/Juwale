from flask import Blueprint, abort, jsonify, request
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)
from sqlalchemy.exc import IntegrityError, OperationalError

from extensions import db
from models import CartItem, Order, OrderItem, User


orders = Blueprint("orders", __name__)


@orders.errorhandler(400)
@orders.errorhandler(401)
@orders.errorhandler(404)
@orders.errorhandler(409)
def handle_order_error(error):
    db.session.rollback()

    return jsonify({
        "message": error.description
    }), error.code


def get_current_user_id():
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        abort(401, description="Invalid user identity")

    if db.session.get(User, user_id) is None:
        abort(401, description="Account no longer exists")

    return user_id


def validate_delivery_details(data):
    limits = {
        "delivery_name": 100,
        "phone": 30,
        "address": 1000,
    }

    values = {}
    errors = {}

    for field, limit in limits.items():
        value = data.get(field)

        if not isinstance(value, str) or not value.strip():
            errors[field] = (
                f"{field.replace('_', ' ').capitalize()} is required"
            )
            continue

        value = value.strip()

        if len(value) > limit:
            errors[field] = (
                f"Must be at most {limit} characters"
            )
            continue

        values[field] = value

    return values, errors


@orders.post("")
@jwt_required()
def create_order():
    user_id = get_current_user_id()

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        abort(400, description="A JSON object is required")

    delivery, errors = validate_delivery_details(data)

    if errors:
        return jsonify({
            "message": "Please correct the delivery details",
            "errors": errors,
        }), 400

    # Finish the user lookup's read transaction.
    # Checkout then acquires SQLite's writer lock before
    # reading the cart or stock.
    db.session.rollback()

    try:
        db.session.execute(
            db.text("BEGIN IMMEDIATE")
        )

        cart_items = db.session.scalars(
            db.select(CartItem)
            .where(CartItem.user_id == user_id)
            .order_by(CartItem.id)
        ).all()

        if not cart_items:
            abort(400, description="Your cart is empty")

        # Validate the entire cart before changing anything.
        for cart_item in cart_items:
            product = cart_item.product

            if product is None or not product.is_active:
                abort(
                    409,
                    description=(
                        "A product in your cart is no longer available. "
                        "Please review your cart."
                    )
                )

            if cart_item.quantity > product.stock:
                abort(
                    409,
                    description=(
                        f"Only {product.stock} units of "
                        f"{product.name} are available. "
                        "Please update your cart."
                    )
                )

        order = Order(
            user_id=user_id,
            status="pending",
            payment_method="cash_on_delivery",
            payment_status="unpaid",
            total_minor=0,
            **delivery,
        )

        for cart_item in cart_items:
            product = cart_item.product

            order.items.append(
                OrderItem(
                    product_id=product.id,
                    product_name=product.name,
                    quantity=cart_item.quantity,
                    unit_price_minor=product.price_minor,
                )
            )

            order.total_minor += (
                product.price_minor * cart_item.quantity
            )

            product.stock -= cart_item.quantity

            db.session.delete(cart_item)

        db.session.add(order)

        # Write changes and construct the response before committing.
        db.session.flush()
        order_data = order.to_dict()

        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "message": (
                "Checkout could not be completed. "
                "Please review your cart."
            )
        }), 409

    except OperationalError:
        db.session.rollback()

        return jsonify({
            "message": (
                "Checkout is temporarily unavailable. "
                "Check your orders before trying again."
            )
        }), 503

    return jsonify({
        "message": "Order placed successfully",
        "order": order_data,
    }), 201


@orders.get("")
@jwt_required()
def get_orders():
    user_id = get_current_user_id()

    user_orders = db.session.scalars(
        db.select(Order)
        .where(Order.user_id == user_id)
        .order_by(Order.id.desc())
    ).all()

    return jsonify([
        order.to_dict()
        for order in user_orders
    ]), 200


@orders.get("/<int:order_id>")
@jwt_required()
def get_order(order_id):
    user_id = get_current_user_id()

    order = db.session.scalar(
        db.select(Order).where(
            Order.id == order_id,
            Order.user_id == user_id,
        )
    )

    if order is None:
        abort(404, description="Order not found")

    return jsonify(order.to_dict()), 200

@orders.post("/<int:order_id>/cancel")
@jwt_required()
def cancel_order(order_id):
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid session."}), 401

    try:
        # End any read transaction opened during authentication.
        db.session.rollback()

        # Acquire the SQLite write transaction before reading the order.
        db.session.execute(text("BEGIN IMMEDIATE"))

        user = db.session.get(User, user_id)

        if user is None:
            db.session.rollback()
            return jsonify({
                "message": "Your account could not be found."
            }), 401

        order = db.session.scalar(
            db.select(Order).where(
                Order.id == order_id,
                Order.user_id == user_id,
            )
        )

        if order is None:
            db.session.rollback()
            return jsonify({"message": "Order not found."}), 404

        # A repeated request succeeds without restoring stock again.
        if order.status == "cancelled":
            order_data = order.to_dict()
            db.session.rollback()

            return jsonify({
                "message": "This order is already cancelled.",
                "order": order_data,
            })

        if (
            order.status != "pending"
            or order.payment_status != "unpaid"
        ):
            db.session.rollback()
            return jsonify({
                "message": "Only pending, unpaid orders can be cancelled."
            }), 409

        # The conditional update also guards against status changes.
        status_update = db.session.execute(
            update(Order)
            .where(
                Order.id == order_id,
                Order.user_id == user_id,
                Order.status == "pending",
                Order.payment_status == "unpaid",
            )
            .values(status="cancelled")
            .execution_options(synchronize_session=False)
        )

        if status_update.rowcount != 1:
            db.session.rollback()
            return jsonify({
                "message": "The order changed. Refresh and try again."
            }), 409

        for item in order.items:
            stock_update = db.session.execute(
                update(Product)
                .where(Product.id == item.product_id)
                .values(stock=Product.stock + item.quantity)
                .execution_options(synchronize_session=False)
            )

            if stock_update.rowcount != 1:
                db.session.rollback()
                return jsonify({
                    "message": (
                        "Unable to restore stock for an order item. "
                        "Please contact support."
                    )
                }), 409

        # Refresh the order so the response contains its new status.
        db.session.refresh(order)
        order_data = order.to_dict()

        db.session.commit()

        return jsonify({
            "message": "Order cancelled successfully.",
            "order": order_data,
        })

    except OperationalError:
        db.session.rollback()
        return jsonify({
            "message": (
                "The database is temporarily busy. "
                "Refresh the order before trying again."
            )
        }), 503

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "message": "Unable to cancel this order."
        }), 409

    except Exception:
        db.session.rollback()
        raise