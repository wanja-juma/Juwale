import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/authContext";
import { addCartItem } from "../services/cart";

export default function AddToCart({ product }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState("1");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

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

    const requestedQuantity = Number(quantity);

    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1 ||
      requestedQuantity > product.stock
    ) {
      setError("Enter a valid quantity within the available stock.");
      return;
    }

    setAdding(true);
    setError("");
    setNotice("");

    try {
      await addCartItem(product.id, requestedQuantity);

      setNotice(
        `${requestedQuantity} ${
          requestedQuantity === 1 ? "unit" : "units"
        } added to your cart.`
      );
    } catch (error) {
      setError(error.message || "Unable to add this product.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <form className="add-to-cart" onSubmit={handleSubmit}>
      <label htmlFor="cart-quantity">Quantity</label>

      <div className="add-to-cart__controls">
        <input
          id="cart-quantity"
          type="number"
          min="1"
          max={product.stock || 1}
          step="1"
          value={quantity}
          onChange={(event) => {
            setQuantity(event.target.value);
            setError("");
            setNotice("");
          }}
          required
          disabled={adding || product.stock === 0}
        />

        <button
          type="submit"
          disabled={adding || loading || product.stock === 0}
        >
          {adding
            ? "Adding…"
            : product.stock === 0
              ? "Out of stock"
              : "Add to cart"}
        </button>
      </div>

      {error && (
        <p className="add-to-cart__error" role="alert">
          {error}
        </p>
      )}

      {notice && <p role="status">{notice}</p>}

      <Link to="/cart">View cart →</Link>
    </form>
  );
}