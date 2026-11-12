import { useEffect, useState } from "react";

import { authenticatedRequest } from "../services/api";

import "./AdminSummary.css";

function formatPrice(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(value / 100);
}

export default function AdminSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSummary() {
      try {
        const data = await authenticatedRequest("/admin/summary", {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setSummary(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error.message || "Unable to load dashboard summary."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSummary();

    return () => controller.abort();
  }, [attempt]);

  function refreshSummary() {
    setLoading(true);
    setError("");
    setAttempt((previous) => previous + 1);
  }

  const cards = summary
    ? [
        {
          label: "Total orders",
          value: summary.total_orders,
        },
        {
          label: "Pending orders",
          value: summary.pending_orders,
        },
        {
          label: "Collected sales",
          value: formatPrice(summary.collected_sales_minor),
        },
        {
          label: "Active products",
          value: summary.active_products,
        },
        {
          label: "Low-stock products",
          value: summary.low_stock_products,
          hint: "1–5 units remaining",
          attention: summary.low_stock_products > 0,
        },
        {
          label: "Out-of-stock products",
          value: summary.out_of_stock_products,
          hint: "Active products with no stock",
          attention: summary.out_of_stock_products > 0,
        },
      ]
    : [];

  return (
    <section
      className="admin-summary"
      aria-labelledby="admin-summary-heading"
    >
      <header className="admin-summary__header">
        <h2 id="admin-summary-heading">Store overview</h2>

        <button
          type="button"
          onClick={refreshSummary}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh summary"}
        </button>
      </header>

      {loading ? (
        <p role="status">Loading store overview…</p>
      ) : error ? (
        <p className="admin-summary__error" role="alert">
          {error}
        </p>
      ) : (
        <dl className="admin-summary__grid">
          {cards.map((card) => (
            <div
              key={card.label}
              className={
                card.attention
                  ? "admin-summary__card admin-summary__card--attention"
                  : "admin-summary__card"
              }
            >
              <dt>{card.label}</dt>

              <dd>{card.value}</dd>

              {card.hint && (
                <dd className="admin-summary__hint">
                  {card.hint}
                </dd>
              )}
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}