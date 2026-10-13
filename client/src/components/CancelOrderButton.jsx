import { useState } from "react";

import { cancelOrder } from "../services/orders";

export default function CancelOrderButton({ order, onCancelled }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canCancel =
    order.status === "pending" &&
    order.payment_status === "unpaid";

  if (!canCancel) {
    return null;
  }

  async function handleCancel() {
    if (busy) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await cancelOrder(order.id);

      onCancelled();
    } catch (error) {
      setError(
        error.message ||
          "Unable to confirm cancellation. Refresh the order before retrying."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="order-cancellation">
      {!confirming ? (
        <button
          className="order-cancel-button"
          type="button"
          onClick={() => setConfirming(true)}
        >
          Cancel order
        </button>
      ) : (
        <div>
          <p>
            Cancel order #{order.id}? This cannot be undone.
          </p>

          <div className="order-cancellation__actions">
            <button
              className="order-cancel-button"
              type="button"
              onClick={handleCancel}
              disabled={busy}
            >
              {busy ? "Cancelling…" : "Yes, cancel order"}
            </button>

            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setError("");
              }}
              disabled={busy}
            >
              Keep order
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert">{error}</p>}
    </div>
  );
}