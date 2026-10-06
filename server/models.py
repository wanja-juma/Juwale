from datetime import datetime, timezone
from extensions import db
from werkzeug.security import (
    generate_password_hash,
    check_password_hash,
)


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100), nullable=False, unique=True)

    products = db.relationship("Product", back_populates="category")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name
        }


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(150), nullable=False)

    description = db.Column(db.Text, nullable=False)

    price_minor = db.Column(db.Integer, nullable=False)

    stock = db.Column(db.Integer, nullable=False, default=0)

    image_url = db.Column(db.String(1000), nullable=False, default="")

    is_active = db.Column(db.Boolean, nullable=False, default=True)

    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)

    category = db.relationship("Category", back_populates="products")

    __table_args__ = (db.CheckConstraint("price_minor > 0", name="positive_product_price"),
        db.CheckConstraint("stock >= 0", name="nonnegative_product_stock"),)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price_minor": self.price_minor,
            "stock": self.stock,
            "image_url": self.image_url,
            "is_active": self.is_active,
            "category_id": self.category_id
        }

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(255),
        nullable=False,
        unique=True
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    role = db.Column(
        db.String(20),
        nullable=False,
        default="customer"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(
            self.password_hash,
            password
        )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
        }


class CartItem(db.Model):
    __tablename__ = "cart_items"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=False
    )

    quantity = db.Column(
        db.Integer,
        nullable=False
    )

    user = db.relationship("User")
    product = db.relationship("Product")

    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "product_id",
            name="unique_user_cart_product"
        ),
        db.CheckConstraint(
            "quantity > 0",
            name="positive_cart_quantity"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "quantity": self.quantity,
            "product": self.product.to_dict(),
            "subtotal_minor": (
                self.quantity * self.product.price_minor
            ),
        }

class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="pending"
    )

    payment_method = db.Column(
        db.String(30),
        nullable=False,
        default="cash_on_delivery"
    )

    payment_status = db.Column(
        db.String(30),
        nullable=False,
        default="unpaid"
    )

    total_minor = db.Column(
        db.Integer,
        nullable=False
    )

    delivery_name = db.Column(
        db.String(100),
        nullable=False
    )

    phone = db.Column(
        db.String(30),
        nullable=False
    )

    address = db.Column(
        db.String(1000),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).replace(
            tzinfo=None
        )
    )

    user = db.relationship("User")

    items = db.relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        db.CheckConstraint(
            "total_minor > 0",
            name="positive_order_total"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "status": self.status,
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "total_minor": self.total_minor,
            "delivery_name": self.delivery_name,
            "phone": self.phone,
            "address": self.address,
            "created_at": (
                self.created_at
                .replace(tzinfo=timezone.utc)
                .isoformat()
            ),
            "items": [
                item.to_dict()
                for item in self.items
            ],
        }


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    order_id = db.Column(
        db.Integer,
        db.ForeignKey("orders.id"),
        nullable=False
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=False
    )

    product_name = db.Column(
        db.String(150),
        nullable=False
    )

    quantity = db.Column(
        db.Integer,
        nullable=False
    )

    unit_price_minor = db.Column(
        db.Integer,
        nullable=False
    )

    order = db.relationship(
        "Order",
        back_populates="items"
    )

    product = db.relationship("Product")

    __table_args__ = (
        db.CheckConstraint(
            "quantity > 0",
            name="positive_order_item_quantity"
        ),
        db.CheckConstraint(
            "unit_price_minor > 0",
            name="positive_order_item_price"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product_name,
            "quantity": self.quantity,
            "unit_price_minor": self.unit_price_minor,
            "subtotal_minor": (
                self.quantity * self.unit_price_minor
            ),
        }    