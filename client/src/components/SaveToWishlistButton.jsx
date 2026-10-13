import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/authContext";
import { saveWishlistItem } from "../services/wishlist";

import "./SaveToWishlistButton.css";

export default function SaveToWishlistButton({ product }) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function handleSave() {
    if (busy || authLoading) {
      return;
    }

    if (!user) {
      navigate("/login", {
        state: { from: `/products/${product.id}` },
      });
      return;
    }

    setBusy(true);
    setNotice("");
    setError("");

    try {
      const data = await saveWishlistItem(product.id);
      setNotice(data.message || "Product saved to your wishlist.");
    } catch (error) {
      setError(error.message || "Unable to save this product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wishlist-save">
      <button
        className="wishlist-save__button"
        type="button"
        onClick={handleSave}
        disabled={busy || authLoading || !product.is_active}
      >
        {busy ? "Saving…" : "♡ Wishlist"}
      </button>

      {notice && (
        <p className="wishlist-save__notice" role="status">
          {notice}
        </p>
      )}

      {error && (
        <p className="wishlist-save__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}