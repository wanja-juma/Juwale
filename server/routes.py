from flask import Blueprint, jsonify, request

from extensions import db
from models import Category, Product


api = Blueprint("api", __name__)


@api.get("/categories")
def get_categories():
    categories = db.session.scalars(
        db.select(Category).order_by(Category.name)
    ).all()

    return jsonify([
        category.to_dict()
        for category in categories
    ]), 200


@api.get("/products")
def get_products():
    def positive_integer(name, default=None):
        raw = request.args.get(name)

        if raw is None:
            return default

        try:
            value = int(raw)
        except ValueError:
            raise ValueError(f"{name} must be a positive integer.")

        if value < 1:
            raise ValueError(f"{name} must be a positive integer.")

        return value

    try:
        page = positive_integer("page", 1)
        per_page = positive_integer("per_page", 12)
        category_id = positive_integer("category_id")
    except ValueError as error:
        return jsonify({"message": str(error)}), 400

    if per_page > 48:
        return jsonify({
            "message": "per_page must be at most 48."
        }), 400

    search = request.args.get("search", "").strip()

    statement = db.select(Product).where(
        Product.is_active.is_(True)
    )

    if search:
        statement = statement.where(
            Product.name.contains(search, autoescape=True)
        )

    if category_id is not None:
        statement = statement.where(
            Product.category_id == category_id
        )

    statement = statement.order_by(Product.id)

    pagination = db.paginate(
        statement,
        page=page,
        per_page=per_page,
        max_per_page=48,
        error_out=False,
    )

    return jsonify({
        "items": [
            product.to_dict()
            for product in pagination.items
        ],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
        "per_page": pagination.per_page,
        "has_next": pagination.has_next,
        "has_prev": pagination.has_prev,
    })


@api.get("/products/<int:product_id>")
def get_product(product_id):
    product = db.session.get(Product, product_id)

    if product is None or not product.is_active:
        return jsonify({
            "message": "Product not found"
        }), 404

    return jsonify(product.to_dict()), 200