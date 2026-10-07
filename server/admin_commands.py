import click
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import User


def register_admin_commands(app):
    @app.cli.command("create-admin")
    @click.option("--name", prompt=True)
    @click.option("--email", prompt=True)
    @click.option(
        "--password",
        prompt=True,
        hide_input=True,
        confirmation_prompt=True
    )
    def create_admin(name, email, password):
        """Create an admin account from the terminal."""

        name = name.strip()
        email = email.strip().lower()

        if not name or len(name) > 100:
            raise click.ClickException("Enter a valid name.")

        if (
            len(email) > 255
            or "@" not in email
            or any(character.isspace() for character in email)
        ):
            raise click.ClickException("Enter a valid email.")

        if not password.strip() or not 8 <= len(password) <= 128:
            raise click.ClickException(
                "Password must contain 8 to 128 characters."
            )

        existing = db.session.scalar(
            db.select(User).where(User.email == email)
        )

        if existing is not None:
            raise click.ClickException(
                "This email already exists. Use a different admin email."
            )

        user = User(
            name=name,
            email=email,
            role="admin",
        )

        user.set_password(password)
        db.session.add(user)

        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            raise click.ClickException(
                "An account with this email already exists."
            )

        click.echo("Admin account created.")