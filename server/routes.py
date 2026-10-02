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
    search = request.args.get("search", "").strip()
    category_id = request.args.get("category_id", "").strip()

    query = db.select(Product).where(
        Product.is_active.is_(True)
    )

    if search:
        query = query.where(
            Product.name.contains(search, autoescape=True)
        )

    if category_id:
        try:
            category_id = int(category_id)

            if category_id <= 0:
                raise ValueError

        except ValueError:
            return jsonify({
                "message": "category_id must be a positive integer"
            }), 400

        query = query.where(
            Product.category_id == category_id
        )

    products = db.session.scalars(
        query.order_by(Product.id)
    ).all()

    return jsonify([
        product.to_dict()
        for product in products
    ]), 200


@api.get("/products/<int:product_id>")
def get_product(product_id):
    product = db.session.get(Product, product_id)

    if product is None or not product.is_active:
        return jsonify({
            "message": "Product not found"
        }), 404

    return jsonify(product.to_dict()), 200