import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { getDeliveryDetails } from "../services/delivery";

import "./DeliveryDetails.css";

export default function UseSavedDeliveryDetails({
  onApply,
  disabled = false,
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // The parent may start submitting while this request is running.
  const disabledRef = useRef(disabled);

useEffect(() => {
  disabledRef.current = disabled;
}, [disabled]);
  async function handleApply() {
    if (busy || disabled) {
      return;
    }

    setBusy(true);
    setNotice("");
    setError("");

    try {
      const data = await getDeliveryDetails();

      if (disabledRef.current) {
        return;
      }

      if (!data.delivery_details) {
        setNotice(
          "You have no saved delivery details. Add them on My profile."
        );
        return;
      }

      onApply(data.delivery_details);
      setNotice(
        "Saved details applied. Check them before placing your order."
      );
    } catch (error) {
      setError(
        error.message || "Unable to load saved delivery details."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="delivery-details-picker">
      <div className="delivery-details__actions">
        <button
          type="button"
          onClick={handleApply}
          disabled={busy || disabled}
        >
          {busy ? "Loading…" : "Use saved details"}
        </button>

        <Link to="/profile">Manage saved details</Link>
      </div>

      <p className="delivery-details-picker__hint">
        Using saved details replaces the recipient name, phone,
        and address currently entered below.
      </p>

      {notice && <p role="status">{notice}</p>}

      {error && (
        <p className="delivery-details__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}