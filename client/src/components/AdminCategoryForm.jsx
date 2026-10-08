import { useState } from "react";

import { createAdminCategory } from "../services/admin";

export default function AdminCategoryForm({ onCreated }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (busy) {
      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Enter a category name.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Use at most 100 characters.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await createAdminCategory(trimmedName);

      setName("");
      onCreated();
    } catch (error) {
      setError(error.message || "Unable to create the category.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="admin-panel admin-form"
      onSubmit={handleSubmit}
    >
      <h2>Add a category</h2>

      <label htmlFor="admin-category-name">
        Category name
      </label>

      <input
        id="admin-category-name"
        name="name"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setError("");
        }}
        placeholder="For example, Beauty"
        maxLength={100}
        required
        disabled={busy}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? "admin-category-error" : undefined
        }
      />

      {error && (
        <p
          id="admin-category-error"
          className="admin-error"
          role="alert"
        >
          {error}
        </p>
      )}

      <button type="submit" disabled={busy}>
        {busy ? "Adding…" : "Add category"}
      </button>
    </form>
  );
}