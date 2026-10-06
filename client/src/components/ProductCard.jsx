import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/authContext";
import { addCartItem } from "../services/cart";

const formatPrice = (priceMinor) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(priceMinor / 100);

export default function ProductCard({ product }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [imageFailed, setImageFailed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const showImage = product.image_url && !imageFailed;

  async function handleAddToCart() {
    if (adding || loading) {
      return;
    }

    if (!user) {
      navigate("/login", {
        state: {
          from: `/products/${product.id}`,
        },
      });

      return;
    }

    setAdding(true);
    setError("");
    setNotice("");

    try {
      await addCartItem(product.id, 1);
      setNotice("Added to your cart.");
    } catch (error) {
      setError(error.message || "Unable to add this product.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className="product-card">
      <Link
        className="product-card__link"
        to={`/products/${product.id}`}
      >
        <div className="product-card__image">
          {showImage ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="product-card__placeholder">
              JUWALE
            </span>
          )}
        </div>
      </Link>

      <div className="product-card__content">
        <h2>
          <Link to={`/products/${product.id}`}>
            {product.name}
          </Link>
        </h2>

        <p className="product-card__description">
          {product.description}
        </p>

        <p className="product-card__price">
          {formatPrice(product.price_minor)}
        </p>

        <p
          className={
            product.stock > 0
              ? "product-card__stock"
              : "product-card__stock product-card__stock--empty"
          }
        >
          {product.stock > 0
            ? `${product.stock} in stock`
            : "Out of stock"}
        </p>

        <div className="product-card__actions">
          <Link
            className="product-card__view"
            to={`/products/${product.id}`}
          >
            View product
          </Link>

          <button
            className="product-card__add"
            type="button"
            onClick={handleAddToCart}
            disabled={adding || loading || product.stock === 0}
            aria-label={`Add ${product.name} to cart`}
          >
            {adding
              ? "Adding…"
              : product.stock === 0
                ? "Out of stock"
                : "Add to cart"}
          </button>
        </div>

        {notice && (
          <p className="product-card__notice" role="status">
            {notice} <Link to="/cart">View cart</Link>
          </p>
        )}

        {error && (
          <p className="product-card__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}