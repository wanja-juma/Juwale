import io
import re
import warnings
from pathlib import Path
from uuid import uuid4

from flask import (
    Blueprint,
    abort,
    current_app,
    jsonify,
    request,
    send_from_directory,
)
from PIL import Image, ImageOps, UnidentifiedImageError
from werkzeug.exceptions import HTTPException

from admin_routes import admin_required


images = Blueprint("images", __name__)

MAX_FILE_BYTES = 5 * 1024 * 1024
MAX_PIXELS = 20_000_000


@images.errorhandler(HTTPException)
def handle_image_error(error):
    return jsonify({
        "message": error.description
    }), error.code


@images.post("/admin/uploads")
@admin_required
def upload_product_image():
    # Allow room for multipart headers around a 5 MB file.
    request.max_content_length = 6 * 1024 * 1024

    uploaded_file = request.files.get("image")

    if uploaded_file is None or not uploaded_file.filename:
        abort(400, description="Select an image to upload")

    contents = uploaded_file.stream.read(MAX_FILE_BYTES + 1)

    if not contents:
        abort(400, description="The selected file is empty")

    if len(contents) > MAX_FILE_BYTES:
        abort(413, description="Image must be 5 MB or smaller")

    try:
        with warnings.catch_warnings():
            warnings.simplefilter(
                "error",
                Image.DecompressionBombWarning
            )

            with Image.open(io.BytesIO(contents)) as source:
                if source.format not in {"JPEG", "PNG", "WEBP"}:
                    abort(
                        400,
                        description="Use a JPEG, PNG, or WebP image"
                    )

                if source.width * source.height > MAX_PIXELS:
                    abort(
                        400,
                        description="Image dimensions are too large"
                    )

                source.verify()

            # Reopen after verification to decode the image.
            with Image.open(io.BytesIO(contents)) as source:
                corrected = ImageOps.exif_transpose(source)
                corrected.thumbnail((1600, 1600))

                rgba = corrected.convert("RGBA")

                # Save a clean JPEG; transparency becomes white.
                clean_image = Image.new(
                    "RGB",
                    rgba.size,
                    "white"
                )

                clean_image.paste(
                    rgba,
                    mask=rgba.getchannel("A")
                )

    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        SyntaxError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
    ):
        abort(
            400,
            description="The file is not a valid supported image"
        )

    filename = f"{uuid4().hex}.jpg"

    destination = (
        Path(current_app.config["UPLOAD_FOLDER"]) / filename
    )

    try:
        clean_image.save(
            destination,
            format="JPEG",
            quality=85
        )
    except OSError:
        destination.unlink(missing_ok=True)

        current_app.logger.exception("Product image save failed")

        abort(
            500,
            description="Unable to save the image"
        )

    return jsonify({
        "message": "Image uploaded",
        "image_url": f"/api/uploads/{filename}",
    }), 201


@images.get("/uploads/<filename>")
def get_product_image(filename):
    if not re.fullmatch(r"[a-f0-9]{32}\.jpg", filename):
        abort(404, description="Image not found")

    response = send_from_directory(
        current_app.config["UPLOAD_FOLDER"],
        filename,
        mimetype="image/jpeg",
        max_age=86400
    )

    response.headers["X-Content-Type-Options"] = "nosniff"

    return response