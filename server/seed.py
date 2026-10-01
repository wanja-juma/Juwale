import click

from extensions import db
from models import Category, Product


def register_seed_command(app):
    @app.cli.command("seed")
    def seed():
        """Add sample categories and products."""

        sample_products = [
            {
                "category": "Electronics",
                "name": "Wireless Headphones",
                "description": (
                    "Comfortable wireless headphones "
                    "for music and phone calls."
                ),
                "price_minor": 350000,
                "stock": 15,
            },
            {
                "category": "Electronics",
                "name": "Bluetooth Speaker",
                "description": (
                    "A portable Bluetooth speaker "
                    "for everyday listening."
                ),
                "price_minor": 280000,
                "stock": 12,
            },
            {
                "category": "Home",
                "name": "Electric Kettle",
                "description": (
                    "A practical electric kettle "
                    "for your kitchen."
                ),
                "price_minor": 220000,
                "stock": 10,
            },
            {
                "category": "Home",
                "name": "Cooking Pot",
                "description": (
                    "A durable cooking pot "
                    "for preparing everyday meals."
                ),
                "price_minor": 180000,
                "stock": 20,
            },
            {
                "category": "Fashion",
                "name": "Travel Bag",
                "description": (
                    "A spacious travel bag "
                    "for weekend trips."
                ),
                "price_minor": 250000,
                "stock": 8,
            },
            {
                "category": "Fashion",
                "name": "Casual Shoes",
                "description": (
                    "Comfortable casual shoes "
                    "for everyday wear."
                ),
                "price_minor": 300000,
                "stock": 18,
            },
        ]

        categories_added = 0
        products_added = 0

        try:
            for sample in sample_products:
                category = db.session.scalar(
                    db.select(Category).where(
                        Category.name == sample["category"]
                    )
                )

                if category is None:
                    category = Category(
                        name=sample["category"]
                    )

                    db.session.add(category)

                    # Assign the category an ID before using it.
                    db.session.flush()

                    categories_added += 1

                existing_product = db.session.scalar(
                    db.select(Product).where(
                        Product.name == sample["name"],
                        Product.category_id == category.id,
                    )
                )

                if existing_product is not None:
                    continue

                product = Product(
                    name=sample["name"],
                    description=sample["description"],
                    price_minor=sample["price_minor"],
                    stock=sample["stock"],
                    image_url="",
                    is_active=True,
                    category_id=category.id,
                )

                db.session.add(product)
                products_added += 1

            db.session.commit()

        except Exception as error:
            db.session.rollback()

            raise click.ClickException(
                f"Seeding failed: {error}"
            ) from error

        click.echo(
            f"Added {categories_added} categories "
            f"and {products_added} products."
        )