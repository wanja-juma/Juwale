import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/authContext";

import "./Profile.css";

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleRefresh() {
    setRefreshing(true);
    setError("");
    setNotice("");

    try {
      await refreshUser();
      setNotice("Your profile is up to date.");
    } catch (error) {
      setError(error.message || "Unable to refresh your profile.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <main className="profile-page">
      <section className="profile-card">
        <h1>My profile</h1>
        <p>Your JUWALE account details.</p>

        <dl className="profile-details">
          <div>
            <dt>Name</dt>
            <dd>{user.name}</dd>
          </div>

          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>

          <div>
            <dt>Account role</dt>
            <dd>{user.role}</dd>
          </div>
        </dl>

        <button
          className="profile-button"
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "Refresh profile"}
        </button>

        {notice && <p role="status">{notice}</p>}

        {error && (
          <p className="profile-error" role="alert">
            {error}
          </p>
        )}

        <Link className="profile-back" to="/products">
          ← Back to products
        </Link>
      </section>
    </main>
  );
}