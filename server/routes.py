from flask import Blueprint, jsonify

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
    products = db.session.scalars(
        db.select(Product)
        .where(Product.is_active.is_(True))
        .order_by(Product.id)
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