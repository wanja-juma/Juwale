import { useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/authContext";

import "./Register.css";

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await login(email.trim().toLowerCase(), password);
      navigate("/products", { replace: true });
    } catch (error) {
      setError(error.message || "Unable to log in.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="register-page">
        <p role="status">Checking your session…</p>
      </main>
    );
  }

  if (user) {
    return <Navigate to="/products" replace />;
  }

  return (
    <main className="register-page">
      <section className="register-card">
        <Link className="register-brand" to="/products">
          JUWALE
        </Link>

        <h1>Welcome back</h1>
        <p className="register-intro">
          Log in to your JUWALE account.
        </p>

        {error && (
          <p className="register-submit-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="register-field">
            <label htmlFor="login-email">Email address</label>

            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              maxLength={255}
              required
              disabled={submitting}
            />
          </div>

          <div className="password-control">
  <input
    id="login-password"
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(event) => setPassword(event.target.value)}
    autoComplete="current-password"
    maxLength={128}
    required
    disabled={submitting}
  />

  <button
    className="password-toggle"
    type="button"
    onClick={() => setShowPassword((previous) => !previous)}
    aria-controls="login-password"
    disabled={submitting}
  >
    {showPassword ? "Hide password" : "Show password"}
  </button>
</div>
        </form>

        <p>
          Don’t have an account?{" "}
          <Link to="/register">Create one</Link>
        </p>

        <Link className="register-back" to="/products">
          ← Back to products
        </Link>
      </section>
    </main>
  );
}