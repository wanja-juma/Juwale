import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getCart,
  removeCartItem,
  updateCartItem,
} from "../services/cart";

import "./Cart.css";

const formatPrice = (priceMinor) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(priceMinor / 100);

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCart() {
      try {
        const data = await getCart(controller.signal);

        if (!controller.signal.aborted) {
          setCart(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.message || "Unable to load your cart.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCart();

    return () => {
      controller.abort();
    };
  }, [attempt]);

  function retryLoading() {
    setLoading(true);
    setError("");
    setAttempt((previous) => previous + 1);
  }

  async function changeItem(item, quantity) {
    if (busy) {
      return;
    }

    setBusy(true);
    setActionError("");
    setNotice("");

    let mutationCompleted = false;

    try {
      if (quantity === null) {
        await removeCartItem(item.id);
      } else {
        await updateCartItem(item.id, quantity);
      }

      mutationCompleted = true;

      const updatedCart = await getCart();
      setCart(updatedCart);

      setNotice(
        quantity === null
          ? `${item.product.name} removed from your cart.`
          : "Cart quantity updated."
      );
    } catch (error) {
      // After an uncertain update, hide stale totals and offer a reload.
      setError(
        mutationCompleted
          ? "Your change was saved, but the cart could not be refreshed. Reload it below."
          : "The change could not be confirmed. Reload your cart before trying again."
      );

      setActionError(error.message || "Unable to update your cart.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="cart-page">
      <header className="cart-page__header">
        <h1>Your cart</h1>
        <Link to="/products">← Continue shopping</Link>
      </header>

      {actionError && (
        <p className="cart-error" role="alert">
          {actionError}
        </p>
      )}

      {notice && <p role="status">{notice}</p>}

      {loading ? (
        <p className="cart-message" role="status">
          Loading your cart…
        </p>
      ) : error ? (
        <div className="cart-message">
          <p className="cart-error" role="alert">{error}</p>

          <button
            className="cart-button"
            type="button"
            onClick={retryLoading}
          >
            Reload cart
          </button>
        </div>
      ) : cart?.items.length === 0 ? (
        <div className="cart-message">
          <h2>Your cart is empty</h2>
          <p>Browse JUWALE and add a product to get started.</p>
          <Link to="/products">Browse products</Link>
        </div>
      ) : cart ? (
        <div className="cart-layout">
          <section aria-label="Cart items">
            {cart.items.map((item) => {
              const product = item.product;

              const unavailable =
                !product.is_active || product.stock === 0;

              const exceedsStock =
                item.quantity > product.stock;

              return (
                <article className="cart-item" key={item.id}>
                  <h2>
                    {product.is_active ? (
                      <Link to={`/products/${product.id}`}>
                        {product.name}
                      </Link>
                    ) : (
                      product.name
                    )}
                  </h2>

                  <p>{formatPrice(product.price_minor)} each</p>

                  {unavailable ? (
                    <p className="cart-error">
                      This product is currently unavailable.
                    </p>
                  ) : exceedsStock ? (
                    <p className="cart-error">
                      Only {product.stock} available. Reduce the
                      quantity or remove this item.
                    </p>
                  ) : null}

                  <div
                    className="cart-quantity"
                    role="group"
                    aria-label={`Quantity for ${product.name}`}
                  >
                    <button
                      type="button"
                      aria-label={`Decrease quantity for ${product.name}`}
                      disabled={
                        busy || item.quantity <= 1 || unavailable
                      }
                      onClick={() =>
                        changeItem(
                          item,
                          Math.min(item.quantity - 1, product.stock)
                        )
                      }
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      aria-label={`Increase quantity for ${product.name}`}
                      disabled={
                        busy ||
                        unavailable ||
                        item.quantity >= product.stock
                      }
                      onClick={() =>
                        changeItem(item, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>

                  <p className="cart-item__subtotal">
                    Subtotal: {formatPrice(item.subtotal_minor)}
                  </p>

                  <button
                    className="cart-remove"
                    type="button"
                    disabled={busy}
                    onClick={() => changeItem(item, null)}
                  >
                    Remove
                  </button>
                </article>
              );
            })}
          </section>

          <aside className="cart-summary">
            <h2>Cart summary</h2>

            <p>
              Total units: {cart.total_quantity}
            </p>

            <p className="cart-summary__total">
              {formatPrice(cart.total_minor)}
            </p>

            <p>
              Prices and availability are checked again at checkout.
            </p>
          </aside>
        </div>
      ) : null}

      {busy && <p role="status">Updating your cart…</p>}
    </main>
  );
}