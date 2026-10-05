import { useState } from "react";
import { Link } from "react-router-dom";

import { registerUser } from "../services/auth";

import "./Register.css";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function Register() {
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
      ...(name === "password" ? { confirmPassword: "" } : {}),
    }));

    setSubmitError("");
    setSuccess("");
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Name is required.";
    } else if (form.name.trim().length > 100) {
      nextErrors.name = "Name must be at most 100 characters.";
    }

    const email = form.email.trim();

    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (
      !form.password.trim() ||
      form.password.length < 8 ||
      form.password.length > 12
    ) {
      nextErrors.password =
        "Password must contain 8 to 12 characters and cannot be only whitespace.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitError("");
    setSuccess("");

    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const data = await registerUser({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      setSuccess(
        `${data.user.name}, your account has been created successfully!`
      );

      setForm({ ...emptyForm });
      setErrors({});

      setShowPassword(false);
    setShowConfirmPassword(false);

    } catch (error) {
      setErrors(error.fieldErrors || {});
      setSubmitError(
        error.message || "Unable to register. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="register-page">
      <section className="register-card">
        <Link className="register-brand" to="/products">
          JUWALE
        </Link>

        <h1>Create your account</h1>
        <p className="register-intro">
          Join JUWALE and start your shopping journey.
        </p>

        {success && (
          <div className="register-success" role="status">
            <p>{success}</p>
            <Link to="/products">Continue browsing products</Link>

            <p>
  <Link to="/login">Log in to your new account</Link>
</p>
          </div>
        )}

        {submitError && (
          <p className="register-submit-error" role="alert">
            {submitError}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="register-field">
            <label htmlFor="register-name">Full name</label>

            <input
              id="register-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              maxLength={100}
              required
              disabled={submitting}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name ? "register-name-error" : undefined
              }
            />

            {errors.name && (
              <p id="register-name-error" className="register-field-error">
                {errors.name}
              </p>
            )}
          </div>

          <div className="register-field">
            <label htmlFor="register-email">Email address</label>

            <input
              id="register-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              maxLength={55}
              required
              disabled={submitting}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "register-email-error" : undefined
              }
            />

            {errors.email && (
              <p id="register-email-error" className="register-field-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="register-field">
  <label htmlFor="register-password">Password</label>

  <div className="password-control">
    <input
      id="register-password"
      name="password"
      type={showPassword ? "text" : "password"}
      value={form.password}
      onChange={handleChange}
      autoComplete="new-password"
      minLength={8}
      maxLength={12}
      required
      disabled={submitting}
      aria-invalid={Boolean(errors.password)}
      aria-describedby={
        errors.password
          ? "register-password-hint register-password-error"
          : "register-password-hint"
      }
    />

    <button
      className="password-toggle"
      type="button"
      onClick={() => setShowPassword((previous) => !previous)}
      aria-controls="register-password"
      disabled={submitting}
    >
      {showPassword ? "Hide password" : "Show password"}
    </button>
  </div>

  <p id="register-password-hint" className="register-hint">
    Use 8 to 12 characters.
  </p>

  {errors.password && (
    <p
      id="register-password-error"
      className="register-field-error"
    >
      {errors.password}
    </p>
  )}
</div>

<div className="register-field">
  <label htmlFor="register-confirm-password">
    Confirm password
  </label>

  <div className="password-control">
    <input
      id="register-confirm-password"
      name="confirmPassword"
      type={showConfirmPassword ? "text" : "password"}
      value={form.confirmPassword}
      onChange={handleChange}
      autoComplete="new-password"
      maxLength={12}
      required
      disabled={submitting}
      aria-invalid={Boolean(errors.confirmPassword)}
      aria-describedby={
        errors.confirmPassword
          ? "register-confirm-password-error"
          : undefined
      }
    />

    <button
      className="password-toggle"
      type="button"
      onClick={() =>
        setShowConfirmPassword((previous) => !previous)
      }
      aria-controls="register-confirm-password"
      disabled={submitting}
    >
      {showConfirmPassword ? "Hide password" : "Show password"}
    </button>
  </div>

  {errors.confirmPassword && (
    <p
      id="register-confirm-password-error"
      className="register-field-error"
    >
      {errors.confirmPassword}
    </p>
  )}
</div>

<button
  className="register-button"
  type="submit"
  disabled={submitting}
>
  {submitting ? "Creating account…" : "Create account"}
</button>
        </form>

        <Link className="register-back" to="/products">
          ← Back to products
        </Link>
      </section>
    </main>
  );
}