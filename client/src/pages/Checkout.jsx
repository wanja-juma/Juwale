import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/authContext";
import { getCart } from "../services/cart";
import { placeOrder } from "../services/orders";

import "./Orders.css";

const formatPrice = (priceMinor) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(priceMinor / 100);

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const [form, setForm] = useState({
    delivery_name: user.name,
    phone: "",
    address: "",
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uncertainSubmission, setUncertainSubmission] = useState(false);

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
          setLoadError(error.message || "Unable to load your cart.");
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
    setLoadError("");
    setAttempt((previous) => previous + 1);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setSubmitError("");
  }

  function validateForm() {
    const nextErrors = {};

    const limits = {
      delivery_name: 100,
      phone: 30,
      address: 1000,
    };

    for (const [field, limit] of Object.entries(limits)) {
      const value = form[field].trim();

      if (!value) {
        nextErrors[field] = "This field is required.";
      } else if (value.length > limit) {
        nextErrors[field] = `Use at most ${limit} characters.`;
      }
    }

    return nextErrors;
  }

  const hasUnavailableItems = Boolean(
    cart?.items.some(
      (item) =>
        !item.product.is_active ||
        item.quantity > item.product.stock
    )
  );

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      submitting ||
      uncertainSubmission ||
      !cart?.items.length ||
      hasUnavailableItems
    ) {
      return;
    }

    const nextErrors = validateForm();

    setErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const data = await placeOrder({
        delivery_name: form.delivery_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });

      navigate("/orders", {
        replace: true,
        state: {
          placedOrderId: data.order.id,
        },
      });
    } catch (error) {
      setErrors(error.fieldErrors || {});
      setSubmitError(error.message || "Unable to place your order.");

      // A network/server failure may occur after an order was saved.
      // Require checking order history instead of blindly resubmitting.
      if (!error.status || error.status >= 500) {
        setUncertainSubmission(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="orders-page">
      <header className="orders-header">
        <h1>Checkout</h1>
        <Link to="/cart">← Back to cart</Link>
      </header>

      {loading ? (
        <p className="orders-panel" role="status">
          Loading your cart…
        </p>
      ) : loadError ? (
        <div className="orders-panel">
          <p className="orders-error" role="alert">
            {loadError}
          </p>

          <button
            className="orders-button"
            type="button"
            onClick={retryLoading}
          >
            Try again
          </button>
        </div>
      ) : !cart?.items.length ? (
        <div className="orders-panel">
          <h2>Your cart is empty</h2>
          <Link to="/products">Browse products</Link>
        </div>
      ) : (
        <div className="checkout-layout">
          <section className="orders-panel">
            <h2>Delivery details</h2>

            <form onSubmit={handleSubmit} noValidate>
              <div className="checkout-field">
                <label htmlFor="delivery-name">
                  Recipient name
                </label>

                <input
                  id="delivery-name"
                  name="delivery_name"
                  value={form.delivery_name}
                  onChange={handleChange}
                  autoComplete="shipping name"
                  maxLength={100}
                  required
                  disabled={submitting}
                  aria-invalid={Boolean(errors.delivery_name)}
                  aria-describedby={
                    errors.delivery_name
                      ? "delivery-name-error"
                      : undefined
                  }
                />

                {errors.delivery_name && (
                  <p
                    id="delivery-name-error"
                    className="orders-error"
                  >
                    {errors.delivery_name}
                  </p>
                )}
              </div>

              <div className="checkout-field">
                <label htmlFor="delivery-phone">
                  Phone number
                </label>

                <input
                  id="delivery-phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="shipping tel"
                  maxLength={30}
                  required
                  disabled={submitting}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={
                    errors.phone ? "delivery-phone-error" : undefined
                  }
                />

                {errors.phone && (
                  <p
                    id="delivery-phone-error"
                    className="orders-error"
                  >
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="checkout-field">
                <label htmlFor="delivery-address">
                  Delivery address
                </label>

                <textarea
                  id="delivery-address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  autoComplete="shipping street-address"
                  placeholder="Town, building, street, and landmark"
                  maxLength={1000}
                  required
                  disabled={submitting}
                  aria-invalid={Boolean(errors.address)}
                  aria-describedby={
                    errors.address
                      ? "delivery-address-error"
                      : undefined
                  }
                />

                {errors.address && (
                  <p
                    id="delivery-address-error"
                    className="orders-error"
                  >
                    {errors.address}
                  </p>
                )}
              </div>

              <p>
                Payment method: <strong>Cash on delivery</strong>.
                No online payment is collected.
              </p>

              {submitError && (
                <p className="orders-error" role="alert">
                  {submitError}
                </p>
              )}

              {uncertainSubmission && (
                <p role="alert">
                  Your order may already have been placed.{" "}
                  <Link to="/orders">
                    Check My orders before trying again.
                  </Link>
                </p>
              )}

              <button
                className="orders-button"
                type="submit"
                disabled={
                  submitting ||
                  uncertainSubmission ||
                  hasUnavailableItems
                }
              >
                {submitting ? "Placing order…" : "Place order"}
              </button>
            </form>
          </section>

          <aside className="orders-panel">
            <h2>Order summary</h2>

            <ul className="checkout-items">
              {cart.items.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.product.name} × {item.quantity}
                  </span>

                  <strong>
                    {formatPrice(item.subtotal_minor)}
                  </strong>
                </li>
              ))}
            </ul>

            <p className="order-total">
              Total: {formatPrice(cart.total_minor)}
            </p>

            <p>
              No delivery fee is included in this version.
              Flask checks prices and stock again when you place
              the order.
            </p>

            {hasUnavailableItems && (
              <p className="orders-error" role="alert">
                Some items are unavailable or exceed current stock.{" "}
                <Link to="/cart">Update your cart.</Link>
              </p>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}