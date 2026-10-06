import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { getOrders } from "../services/orders";

import "./Orders.css";

const formatPrice = (priceMinor) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(priceMinor / 100);

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

export default function Orders() {
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const placedOrderId = location.state?.placedOrderId;

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrders() {
      try {
        const data = await getOrders(controller.signal);

        if (!Array.isArray(data)) {
          throw new Error("The server returned an unexpected response.");
        }

        if (!controller.signal.aborted) {
          setOrders(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.message || "Unable to load your orders.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      controller.abort();
    };
  }, [attempt]);

  function reloadOrders() {
    setLoading(true);
    setError("");
    setAttempt((previous) => previous + 1);
  }

  return (
    <main className="orders-page">
      <header className="orders-header">
        <h1>My orders</h1>

        <div className="orders-actions">
          <Link to="/products">Continue shopping</Link>

          <button
            className="orders-button"
            type="button"
            onClick={reloadOrders}
            disabled={loading}
          >
            Refresh orders
          </button>
        </div>
      </header>

      {placedOrderId && (
        <p className="orders-success" role="status">
          Order #{placedOrderId} was placed successfully!
        </p>
      )}

      {loading ? (
        <p className="orders-panel" role="status">
          Loading your orders…
        </p>
      ) : error ? (
        <div className="orders-panel">
          <p className="orders-error" role="alert">
            {error}
          </p>

          <button
            className="orders-button"
            type="button"
            onClick={reloadOrders}
          >
            Try again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-panel">
          <h2>No orders yet</h2>
          <p>Your purchases will appear here.</p>
          <Link to="/products">Browse products</Link>
        </div>
      ) : (
        orders.map((order) => (
          <article className="orders-panel order-card" key={order.id}>
            <h2>Order #{order.id}</h2>

            <p>{formatDate(order.created_at)}</p>

            <div className="order-statuses">
              <span>Order: {order.status}</span>
              <span>Payment: {order.payment_status}</span>
            </div>

            <ul className="checkout-items">
              {order.items.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.product_name} × {item.quantity}
                    <small>
                      {formatPrice(item.unit_price_minor)} each
                    </small>
                  </span>

                  <strong>
                    {formatPrice(item.subtotal_minor)}
                  </strong>
                </li>
              ))}
            </ul>

            <p className="order-total">
              Total: {formatPrice(order.total_minor)}
            </p>

            <h3>Delivery details</h3>
            <p>{order.delivery_name}</p>
            <p>{order.phone}</p>
            <p className="order-address">{order.address}</p>

            <p>Payment method: Cash on delivery</p>
          </article>
        ))
      )}
    </main>
  );
}