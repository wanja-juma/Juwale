from functools import wraps
import re
from pathlib import Path

from flask import Blueprint, abort, current_app, jsonify, request
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)
from sqlalchemy.exc import IntegrityError, OperationalError

from extensions import db
from models import Category, Order, Product, User


admin = Blueprint("admin", __name__)


@admin.errorhandler(400)
@admin.errorhandler(401)
@admin.errorhandler(403)
@admin.errorhandler(404)
@admin.errorhandler(409)
def handle_admin_error(error):
    db.session.rollback()

    return jsonify({
        "message": error.description
    }), error.code


def admin_required(function):
    @wraps(function)
    @jwt_required()
    def wrapped(*args, **kwargs):
        try:
            user_id = int(get_jwt_identity())
        except (TypeError, ValueError):
            abort(401, description="Invalid user identity")

        user = db.session.get(User, user_id)

        if user is None:
            abort(401, description="Account no longer exists")

        if user.role != "admin":
            abort(403, description="Admin access required")

        return function(*args, **kwargs)

    return wrapped


def get_body():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        abort(400, description="A JSON object is required")

    return data


def validate_product(data):
    values = {}

    for field, limit in (
        ("name", 150),
        ("description", 1000),
    ):
        value = data.get(field)

        if (
            not isinstance(value, str)
            or not value.strip()
            or len(value.strip()) > limit
        ):
            abort(
                400,
                description=(
                    f"{field} is required and must be "
                    f"at most {limit} characters"
                )
            )

        values[field] = value.strip()

    for field, minimum in (
        ("price_minor", 1),
        ("stock", 0),
        ("category_id", 1),
    ):
        value = data.get(field)

        if type(value) is not int or value < minimum:
            abort(
                400,
                description=(
                    f"{field} must be an integer "
                    f"of at least {minimum}"
                )
            )

        values[field] = value

    if db.session.get(Category, values["category_id"]) is None:
        abort(400, description="Category does not exist")

        image_url = data.get("image_url", "")

    if not isinstance(image_url, str) or len(image_url) > 1000:
        abort(400, description="Invalid image URL")

    image_url = image_url.strip()

    if image_url and not image_url.startswith("https://"):
        match = re.fullmatch(
            r"/api/uploads/([a-f0-9]{32}\.jpg)",
            image_url
        )

        if match is None:
            abort(
                400,
                description="Use an uploaded image or an HTTPS image URL"
            )

        image_path = (
            Path(current_app.config["UPLOAD_FOLDER"])
            / match.group(1)
        )

        if not image_path.is_file():
            abort(400, description="Uploaded image does not exist")

    is_active = data.get("is_active", True)

    if type(is_active) is not bool:
        abort(400, description="is_active must be a boolean")

    values["image_url"] = image_url
    values["is_active"] = is_active

    return values


def commit_changes():
    db.session.commit()


@admin.errorhandler(IntegrityError)
def handle_integrity_error(error):
    db.session.rollback()

    return jsonify({
        "message": "This change conflicts with existing data"
    }), 409


@admin.errorhandler(OperationalError)
def handle_database_error(error):
    db.session.rollback()

    return jsonify({
        "message": (
            "The database is temporarily unavailable. "
            "Refresh before trying again."
        )
    }), 503


@admin.get("/products")
@admin_required
def get_admin_products():
    products = db.session.scalars(
        db.select(Product).order_by(Product.id.desc())
    ).all()

    return jsonify([
        product.to_dict()
        for product in products
    ]), 200


@admin.post("/products")
@admin_required
def create_product():
    values = validate_product(get_body())

    product = Product(**values)
    db.session.add(product)

    commit_changes()

    return jsonify({
        "message": "Product created",
        "product": product.to_dict(),
    }), 201


@admin.patch("/products/<int:product_id>")
@admin_required
def update_product(product_id):
    product = db.session.get(Product, product_id)

    if product is None:
        abort(404, description="Product not found")

    data = get_body()

    allowed_fields = {
        "name",
        "description",
        "price_minor",
        "stock",
        "category_id",
        "image_url",
        "is_active",
    }

    if not data or not set(data).issubset(allowed_fields):
        abort(400, description="Send valid product fields")

    merged = product.to_dict()
    merged.update(data)

    values = validate_product(merged)

    for field, value in values.items():
        setattr(product, field, value)

    commit_changes()

    return jsonify({
        "message": "Product updated",
        "product": product.to_dict(),
    }), 200


@admin.get("/orders")
@admin_required
def get_admin_orders():
    all_orders = db.session.scalars(
        db.select(Order).order_by(Order.id.desc())
    ).all()

    return jsonify([
        {
            **order.to_dict(),
            "user_id": order.user_id,
        }
        for order in all_orders
    ]), 200


@admin.patch("/orders/<int:order_id>")
@admin_required
def update_order(order_id):
    order = db.session.get(Order, order_id)

    if order is None:
        abort(404, description="Order not found")

    data = get_body()
    next_status = data.get("status")

    transitions = {
        "pending": "processing",
        "processing": "shipped",
        "shipped": "delivered",
    }

    current_status = order.status

    if (
        not isinstance(next_status, str)
        or transitions.get(current_status) != next_status
    ):
        abort(
            400,
            description=(
                "Invalid transition. Use pending → processing "
                "→ shipped → delivered."
            )
        )

    changes = {"status": next_status}

    if next_status == "delivered":
        if order.payment_method != "cash_on_delivery":
            abort(
                400,
                description="This flow supports cash-on-delivery orders only"
            )

        if data.get("cash_collected") is not True:
            abort(
                400,
                description="Confirm cash collection before marking delivered"
            )

        changes["payment_status"] = "paid"

    # Update only if another admin has not already changed the status.
    result = db.session.execute(
        db.update(Order)
        .where(
            Order.id == order.id,
            Order.status == current_status,
        )
        .values(**changes)
    )

    if result.rowcount != 1:
        abort(
            409,
            description="The order changed. Refresh and try again."
        )

    commit_changes()

    return jsonify({
        "message": "Order updated",
        "order": order.to_dict(),
    }), 200

@admin.get("/categories")
@admin_required
def get_admin_categories():
    categories = db.session.scalars(
        db.select(Category).order_by(Category.name)
    ).all()

    return jsonify([
        category.to_dict()
        for category in categories
    ]), 200


@admin.post("/categories")
@admin_required
def create_category():
    data = get_body()
    name = data.get("name")

    if not isinstance(name, str) or not name.strip():
        abort(400, description="Category name is required")

    name = name.strip()

    if len(name) > 100:
        abort(
            400,
            description="Category name must be at most 100 characters"
        )

    existing = db.session.scalar(
        db.select(Category).where(
            db.func.lower(Category.name) == name.lower()
        )
    )

    if existing is not None:
        abort(
            409,
            description="A category with this name already exists"
        )

    category = Category(name=name)

    db.session.add(category)
    commit_changes()

    return jsonify({
        "message": "Category created",
        "category": category.to_dict(),
    }), 201