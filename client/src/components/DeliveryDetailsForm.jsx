import { useEffect, useState } from "react";

import {
  deleteDeliveryDetails,
  getDeliveryDetails,
  saveDeliveryDetails,
} from "../services/delivery";

import "./DeliveryDetails.css";

const emptyDetails = {
  delivery_name: "",
  phone: "",
  address: "",
};

export default function DeliveryDetailsForm() {
  const [form, setForm] = useState({ ...emptyDetails });
  const [hasSavedDetails, setHasSavedDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDetails() {
      try {
        const data = await getDeliveryDetails(controller.signal);

        if (!controller.signal.aborted) {
          const details = data.delivery_details;

          setHasSavedDetails(Boolean(details));
          setForm(details || { ...emptyDetails });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(
            error.message || "Unable to load delivery details."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => controller.abort();
  }, [attempt]);

  function reloadDetails() {
    setLoading(true);
    setLoadError("");
    setError("");
    setNotice("");
    setConfirmDelete(false);
    setAttempt((previous) => previous + 1);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setNotice("");
    setConfirmDelete(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (busy) {
      return;
    }

    setError("");
    setNotice("");
    setConfirmDelete(false);

    const details = {
      delivery_name: form.delivery_name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };

    if (
      !details.delivery_name ||
      !details.phone ||
      !details.address
    ) {
      setError("Complete all delivery fields.");
      return;
    }

    if (
      details.delivery_name.length > 100 ||
      details.phone.length > 30 ||
      details.address.length > 1000
    ) {
      setError(
        "Use at most 100 characters for the name, 30 for the phone, and 1,000 for the address."
      );
      return;
    }

    setBusy("saving");

    try {
      const data = await saveDeliveryDetails(details);

      setForm(data.delivery_details);
      setHasSavedDetails(true);
      setNotice("Your delivery details have been saved.");
    } catch (error) {
      setError(
        error.message ||
          "Unable to confirm saving. Reload your saved details before retrying."
      );
    } finally {
      setBusy("");
    }
  }

  async function handleDelete() {
    if (busy) {
      return;
    }

    setBusy("deleting");
    setError("");
    setNotice("");

    try {
      await deleteDeliveryDetails();

      setForm({ ...emptyDetails });
      setHasSavedDetails(false);
      setConfirmDelete(false);
      setNotice("Your saved delivery details have been removed.");
    } catch (error) {
      setError(
        error.message ||
          "Unable to confirm removal. Reload your saved details."
      );
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="delivery-details">
      <h2>Saved delivery details</h2>

      <p>
        Save an address to use during checkout. Changes here
        do not change existing orders.
      </p>

      {loading ? (
        <p role="status">Loading delivery details…</p>
      ) : loadError ? (
        <div>
          <p className="delivery-details__error" role="alert">
            {loadError}
          </p>

          <button type="button" onClick={reloadDetails}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <form
            className="delivery-details__form"
            onSubmit={handleSubmit}
            noValidate
          >
            <label htmlFor="saved-delivery-name">
              Recipient name
            </label>

            <input
              id="saved-delivery-name"
              name="delivery_name"
              type="text"
              autoComplete="shipping name"
              value={form.delivery_name}
              onChange={handleChange}
              maxLength={100}
              required
              disabled={Boolean(busy)}
            />

            <label htmlFor="saved-delivery-phone">
              Phone number
            </label>

            <input
              id="saved-delivery-phone"
              name="phone"
              type="tel"
              autoComplete="shipping tel"
              value={form.phone}
              onChange={handleChange}
              maxLength={30}
              required
              disabled={Boolean(busy)}
            />

            <label htmlFor="saved-delivery-address">
              Delivery address
            </label>

            <textarea
              id="saved-delivery-address"
              name="address"
              autoComplete="shipping street-address"
              value={form.address}
              onChange={handleChange}
              maxLength={1000}
              rows={4}
              required
              disabled={Boolean(busy)}
              placeholder="Area, building, street and delivery instructions"
            />

            <div className="delivery-details__actions">
              <button
                className="delivery-details__primary"
                type="submit"
                disabled={Boolean(busy)}
              >
                {busy === "saving" ? "Saving…" : "Save details"}
              </button>

              <button
                type="button"
                onClick={reloadDetails}
                disabled={Boolean(busy)}
              >
                Reload saved details
              </button>
            </div>
          </form>

          {hasSavedDetails && (
            <div className="delivery-details__remove">
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={Boolean(busy)}
                >
                  Remove saved details
                </button>
              ) : (
                <>
                  <p>Remove your saved delivery details?</p>

                  <div className="delivery-details__actions">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={Boolean(busy)}
                    >
                      {busy === "deleting"
                        ? "Removing…"
                        : "Yes, remove"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={Boolean(busy)}
                    >
                      Keep details
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {error && (
            <p className="delivery-details__error" role="alert">
              {error}
            </p>
          )}

          {notice && (
            <p className="delivery-details__notice" role="status">
              {notice}
            </p>
          )}
        </>
      )}
    </section>
  );
}