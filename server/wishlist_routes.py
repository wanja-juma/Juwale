from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError, OperationalError

from extensions import db
from models import Product, User, WishlistItem


wishlist = Blueprint(
    "wishlist",
    __name__,
    url_prefix="/api/wishlist",
)


def current_user():
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return None

    return db.session.get(User, user_id)


@wishlist.get("")
@jwt_required()
def get_wishlist():
    user = current_user()

    if user is None:
        return jsonify({"message": "Invalid session."}), 401

    items = db.session.scalars(
        db.select(WishlistItem)
        .where(WishlistItem.user_id == user.id)
        .order_by(WishlistItem.id.desc())
    ).all()

    return jsonify({
        "items": [item.to_dict() for item in items],
        "total": len(items),
    })


@wishlist.post("/items")
@jwt_required()
def add_wishlist_item():
    user = current_user()

    if user is None:
        return jsonify({"message": "Invalid session."}), 401

    user_id = user.id
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Provide a JSON object."
        }), 400

    product_id = data.get("product_id")

    if type(product_id) is not int or product_id < 1:
        return jsonify({
            "message": "product_id must be a positive integer."
        }), 400

    product = db.session.get(Product, product_id)

    if product is None or not product.is_active:
        return jsonify({
            "message": "Product not found."
        }), 404

    existing = db.session.scalar(
        db.select(WishlistItem).where(
            WishlistItem.user_id == user_id,
            WishlistItem.product_id == product_id,
        )
    )

    if existing is not None:
        return jsonify({
            "message": "Product is already in your wishlist.",
            "item": existing.to_dict(),
        }), 200

    item = WishlistItem(
        user_id=user_id,
        product_id=product_id,
    )

    db.session.add(item)

    try:
        db.session.flush()
        item_data = item.to_dict()
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        # Another request may have saved this product first.
        existing = db.session.scalar(
            db.select(WishlistItem).where(
                WishlistItem.user_id == user_id,
                WishlistItem.product_id == product_id,
            )
        )

        if existing is not None:
            return jsonify({
                "message": "Product is already in your wishlist.",
                "item": existing.to_dict(),
            }), 200

        return jsonify({
            "message": "Unable to save this product."
        }), 409

    return jsonify({
        "message": "Product saved to your wishlist.",
        "item": item_data,
    }), 201


@wishlist.delete("/items/<int:item_id>")
@jwt_required()
def remove_wishlist_item(item_id):
    user = current_user()

    if user is None:
        return jsonify({"message": "Invalid session."}), 401

    item = db.session.scalar(
        db.select(WishlistItem).where(
            WishlistItem.id == item_id,
            WishlistItem.user_id == user.id,
        )
    )

    if item is None:
        return jsonify({
            "message": "Wishlist item not found."
        }), 404

    db.session.delete(item)
    db.session.commit()

    return "", 204


@wishlist.errorhandler(OperationalError)
def handle_database_busy(error):
    db.session.rollback()

    return jsonify({
        "message": "The database is temporarily unavailable. Try again."
    }), 503


@wishlist.errorhandler(IntegrityError)
def handle_integrity_error(error):
    db.session.rollback()

    return jsonify({
        "message": "Unable to update your wishlist."
    }), 409