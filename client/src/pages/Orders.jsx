import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

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

  const orderFilters = [
  { value: "all", label: "All orders" },
  { value: "active", label: "Active orders" },
  { value: "pending", label: "Order placed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const activeStatuses = new Set([
  "pending",
  "processing",
  "shipped",
]);
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const placedOrderId = location.state?.placedOrderId;

  const [searchParams, setSearchParams] = useSearchParams();

const requestedStatus = searchParams.get("status") || "all";

const selectedStatus = orderFilters.some(
  (filter) => filter.value === requestedStatus
)
  ? requestedStatus
  : "all";

const filteredOrders = orders.filter((order) => {
  if (selectedStatus === "all") {
    return true;
  }

  if (selectedStatus === "active") {
    return activeStatuses.has(order.status);
  }

  return order.status === selectedStatus;
});

const selectedFilterLabel = orderFilters.find(
  (filter) => filter.value === selectedStatus
).label;

function changeStatusFilter(event) {
  const nextParams = new URLSearchParams(searchParams);
  const value = event.target.value;

  if (value === "all") {
    nextParams.delete("status");
  } else {
    nextParams.set("status", value);
  }

  setSearchParams(nextParams);
}

function clearStatusFilter() {
  const nextParams = new URLSearchParams(searchParams);

  nextParams.delete("status");

  setSearchParams(nextParams);
}

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

      <div className="orders-filters">
  <div className="orders-filters__field">
    <label htmlFor="order-status-filter">
      Filter by status
    </label>

    <select
      id="order-status-filter"
      value={selectedStatus}
      onChange={changeStatusFilter}
    >
      {orderFilters.map((filter) => (
        <option key={filter.value} value={filter.value}>
          {filter.label}
        </option>
      ))}
    </select>
  </div>

  {selectedStatus !== "all" && (
    <button type="button" onClick={clearStatusFilter}>
      Show all orders
    </button>
  )}
</div>

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
      ) : filteredOrders.length === 0 ? (
  <div className="orders-empty">
    <p>
      {orders.length === 0
        ? "You haven’t placed any orders yet."
        : `No orders found for “${selectedFilterLabel}”.`}
    </p>

    {selectedStatus !== "all" ? (
      <button type="button" onClick={clearStatusFilter}>
        Show all orders
      </button>
    ) : (
      <Link to="/products">Browse products</Link>
    )}
  </div>
      ) : (
        <>
          <p className="orders-result-count" role="status">
            Showing {filteredOrders.length} of {orders.length}{" "}
            {orders.length === 1 ? "order" : "orders"}
          </p>

          {filteredOrders.map((order) => (
            <article
              className="orders-panel order-card"
              key={order.id}
            >
              <h2>Order #{order.id}</h2>

              <Link
                className="order-details-link"
                to={`/orders/${order.id}`}
              >
                View order →
              </Link>

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
          ))}
        </>
      )}
    </main>
  );
}