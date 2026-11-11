from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm import joinedload

from extensions import db
from models import Order, OrderItem, Product, Review, User


reviews = Blueprint(
    "reviews",
    __name__,
    url_prefix="/api/products",
)


@reviews.get("/<int:product_id>/reviews")
def get_product_reviews(product_id):
    product = db.session.get(Product, product_id)

    if product is None or not product.is_active:
        return jsonify({"message": "Product not found."}), 404

    try:
        page = int(request.args.get("page", "1"))
    except ValueError:
        return jsonify({
            "message": "page must be a positive integer."
        }), 400

    if page < 1:
        return jsonify({
            "message": "page must be a positive integer."
        }), 400

    statement = (
        db.select(Review)
        .options(joinedload(Review.user))
        .where(Review.product_id == product_id)
        .order_by(Review.id.desc())
    )

    pagination = db.paginate(
        statement,
        page=page,
        per_page=5,
        max_per_page=5,
        error_out=False,
    )

    average = db.session.scalar(
        db.select(func.avg(Review.rating)).where(
            Review.product_id == product_id
        )
    )

    return jsonify({
        "items": [
            review.to_dict()
            for review in pagination.items
        ],
        "total": pagination.total,
        "average_rating": (
            round(float(average), 1)
            if average is not None
            else None
        ),
        "page": pagination.page,
        "pages": pagination.pages,
        "has_next": pagination.has_next,
        "has_prev": pagination.has_prev,
    })


@reviews.post("/<int:product_id>/reviews")
@jwt_required()
def create_product_review(product_id):
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid session."}), 401

    user = db.session.get(User, user_id)

    if user is None:
        return jsonify({"message": "Account not found."}), 401

    product = db.session.get(Product, product_id)

    if product is None or not product.is_active:
        return jsonify({"message": "Product not found."}), 404

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Provide a JSON object."
        }), 400

    rating = data.get("rating")
    comment = data.get("comment")

    if type(rating) is not int or not 1 <= rating <= 5:
        return jsonify({
            "message": "Rating must be an integer from 1 to 5."
        }), 400

    if not isinstance(comment, str) or not comment.strip():
        return jsonify({
            "message": "A review comment is required."
        }), 400

    comment = comment.strip()

    if len(comment) > 2000:
        return jsonify({
            "message": "Review must be at most 2,000 characters."
        }), 400

    existing = db.session.scalar(
        db.select(Review.id).where(
            Review.user_id == user_id,
            Review.product_id == product_id,
        )
    )

    if existing is not None:
        return jsonify({
            "message": "You have already reviewed this product."
        }), 409

    delivered_purchase = db.session.scalar(
        db.select(OrderItem.id)
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            Order.user_id == user_id,
            Order.status == "delivered",
            OrderItem.product_id == product_id,
        )
        .limit(1)
    )

    if delivered_purchase is None:
        return jsonify({
            "message": (
                "You can review this product after an order "
                "containing it has been delivered."
            )
        }), 403

    review = Review(
        user_id=user_id,
        product_id=product_id,
        rating=rating,
        comment=comment,
    )

    db.session.add(review)

    try:
        db.session.flush()
        review_data = review.to_dict()
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "message": (
                "Unable to save this review. "
                "You may have already reviewed this product."
            )
        }), 409

    return jsonify({
        "message": "Your review has been submitted.",
        "review": review_data,
    }), 201


@reviews.errorhandler(OperationalError)
def handle_database_unavailable(error):
    db.session.rollback()

    return jsonify({
        "message": "The database is temporarily unavailable. Try again."
    }), 503