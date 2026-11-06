import { useState } from "react";

import { addCartItem } from "../services/cart";

export default function WishlistAddToCartButton({ product }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const unavailable = !product.is_active;
  const outOfStock = product.stock < 1;

  async function handleAdd() {
    if (busy || unavailable || outOfStock) {
      return;
    }

    setBusy(true);
    setNotice("");
    setError("");

    try {
      await addCartItem(product.id, 1);
      setNotice("One item added to your cart.");
    } catch (error) {
      setError(
        error.message ||
          "Unable to confirm the addition. Check your cart before retrying."
      );
    } finally {
      setBusy(false);
    }
  }

  let label = "Add to cart";

  if (unavailable) {
    label = "Unavailable";
  } else if (outOfStock) {
    label = "Out of stock";
  } else if (busy) {
    label = "Adding…";
  }

  return (
    <div className="wishlist-cart-control">
      <button
        className="wishlist-cart-button"
        type="button"
        onClick={handleAdd}
        disabled={busy || unavailable || outOfStock}
        aria-label={`${label}: ${product.name}`}
      >
        {label}
      </button>

      {notice && (
        <p className="wishlist-cart-notice" role="status">
          {notice}
        </p>
      )}

      {error && (
        <p className="wishlist-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}