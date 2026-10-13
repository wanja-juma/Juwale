import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getWishlist,
  removeWishlistItem,
} from "../services/wishlist";

import "./Wishlist.css";

function formatPrice(priceMinor) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(priceMinor / 100);
}

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWishlist() {
      try {
        const data = await getWishlist(controller.signal);

        if (!Array.isArray(data.items)) {
          throw new Error("The server returned invalid wishlist data.");
        }

        if (!controller.signal.aborted) {
          setItems(data.items);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.message || "Unable to load your wishlist.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadWishlist();

    return () => controller.abort();
  }, [attempt]);

  function reloadWishlist() {
    setLoading(true);
    setError("");
    setNotice("");
    setAttempt((previous) => previous + 1);
  }

  async function handleRemove(itemId) {
    if (removingId !== null) {
      return;
    }

    setRemovingId(itemId);
    setNotice("");
    setError("");

    try {
      await removeWishlistItem(itemId);

      setItems((previous) =>
        previous.filter((item) => item.id !== itemId)
      );

      setNotice("Product removed from your wishlist.");
    } catch (error) {
      // A 404 means the item is already absent.
      if (error.status === 404) {
        setItems((previous) =>
          previous.filter((item) => item.id !== itemId)
        );

        setNotice("This product is already removed.");
      } else {
        setError(
          error.message ||
            "Unable to confirm removal. Refresh your wishlist."
        );
      }
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <main className="wishlist-page">
      <header className="wishlist-page__header">
        <div>
          <h1>My wishlist</h1>
          <p>Products you have saved for later.</p>
        </div>

        <div className="wishlist-page__actions">
          <Link to="/products">Continue shopping</Link>

          <button
            type="button"
            onClick={reloadWishlist}
            disabled={loading || removingId !== null}
          >
            Refresh
          </button>
        </div>
      </header>

      {notice && <p role="status">{notice}</p>}

      {loading ? (
        <p role="status">Loading your wishlist…</p>
      ) : error ? (
        <div>
          <p className="wishlist-error" role="alert">
            {error}
          </p>

          <button type="button" onClick={reloadWishlist}>
            Reload wishlist
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="wishlist-empty">
          <p>You haven’t saved any products yet.</p>
          <Link to="/products">Browse products</Link>
        </div>
      ) : (
        <>
          <p role="status">
            {items.length} saved{" "}
            {items.length === 1 ? "product" : "products"}
          </p>

          <section
            className="wishlist-grid"
            aria-label="Saved products"
          >
            {items.map((item) => {
              const product = item.product;

              return (
                <article className="wishlist-card" key={item.id}>
                  {product.image_url && (
                    <img
                      className="wishlist-card__image"
                      src={product.image_url}
                      alt={product.name}
                      loading="lazy"
                    />
                  )}

                  <h2>{product.name}</h2>

                  <p className="wishlist-card__price">
                    {formatPrice(product.price_minor)}
                  </p>

                  <p>
                    {!product.is_active
                      ? "Currently unavailable"
                      : product.stock === 0
                        ? "Out of stock"
                        : "In stock"}
                  </p>

                  <div className="wishlist-card__actions">
                    {product.is_active && (
                      <Link to={`/products/${product.id}`}>
                        View product
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      disabled={removingId !== null}
                      aria-label={`Remove ${product.name} from wishlist`}
                    >
                      {removingId === item.id
                        ? "Removing…"
                        : "Remove"}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}