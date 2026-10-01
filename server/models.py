from extensions import db


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