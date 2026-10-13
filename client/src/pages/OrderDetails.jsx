import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getOrder } from "../services/orders";
import CancelOrderButton from "../components/CancelOrderButton";
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

export default function OrderDetails() {
  const { id } = useParams();

  // A different order ID gets its own loading state.
  return <OrderDetailsContent key={id} orderId={id} />;
}

function OrderDetailsContent({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrder() {
      try {
        const data = await getOrder(
          orderId,
          controller.signal
        );

        if (!controller.signal.aborted) {
          setOrder(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error.message || "Unable to load this order."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      controller.abort();
    };
  }, [orderId, attempt]);

  function reloadOrder() {
    setLoading(true);
    setError("");
    setAttempt((previous) => previous + 1);

    {order.status === "cancelled" && (
  <p className="order-cancelled-notice" role="status">
    This order has been cancelled.
  </p>
)}
  }

  return (
    <main className="orders-page">
      <header className="orders-header">
        <h1>Order details</h1>

        <div className="orders-actions">
          <Link to="/orders">← Back to My orders</Link>

          <button
            className="orders-button"
            type="button"
            onClick={reloadOrder}
            disabled={loading}
          >
            Refresh order
          </button>
        </div>
      </header>

      {loading ? (
        <p className="orders-panel" role="status">
          Loading order…
        </p>
      ) : error ? (
        <div className="orders-panel">
          <p className="orders-error" role="alert">
            {error}
          </p>

          <button
            className="orders-button"
            type="button"
            onClick={reloadOrder}
          >
            Try again
          </button>
        </div>
      ) : order ? (
        <article className="orders-panel">
          <h2>Order #{order.id}</h2>

          <p>Placed on {formatDate(order.created_at)}</p>

          <div className="order-statuses">
            <span>Order: {order.status}</span>
            <span>Payment: {order.payment_status}</span>
          </div>

          <h3>Purchased items</h3>

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

          <dl className="order-delivery">
            <div>
              <dt>Recipient</dt>
              <dd>{order.delivery_name}</dd>
            </div>

            <div>
              <dt>Phone</dt>
              <dd>{order.phone}</dd>
            </div>

            <div>
              <dt>Address</dt>
              <dd className="order-address">
                {order.address}
              </dd>
            </div>
          </dl>

          <p>
            Payment method:{" "}
            {order.payment_method === "cash_on_delivery"
              ? "Cash on delivery"
              : order.payment_method}
          </p>

          <CancelOrderButton
  key={order.id}
  order={order}
  onCancelled={reloadOrder}
/>
        </article>
      ) : null}
    </main>
  );
}