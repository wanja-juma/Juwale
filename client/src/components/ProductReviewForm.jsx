import { useState } from "react";

import { createProductReview } from "../services/reviews";

export default function ProductReviewForm({
  productId,
  onSubmitted,
}) {
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (busy || submitted) {
      return;
    }

    setError("");

    const numericRating = Number(rating);
    const trimmedComment = comment.trim();

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      setError("Choose a rating from 1 to 5.");
      return;
    }

    if (!trimmedComment) {
      setError("Write a review before submitting.");
      return;
    }

    if (trimmedComment.length > 2000) {
      setError("Review must be at most 2,000 characters.");
      return;
    }

    setBusy(true);

    try {
      await createProductReview(productId, {
        rating: numericRating,
        comment: trimmedComment,
      });

      setSubmitted(true);
      onSubmitted();
    } catch (error) {
      setError(
        error.message ||
          "Unable to confirm submission. Refresh reviews before retrying."
      );
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <p className="product-reviews__success" role="status">
        Thank you! Your review has been submitted.
      </p>
    );
  }

  return (
    <form
      className="product-review-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <h3>Write a review</h3>

      <p id="review-eligibility">
        You can review a product after an order containing it has
        been delivered. One review is allowed per product.
      </p>

      <label htmlFor="review-rating">Rating</label>

      <select
        id="review-rating"
        value={rating}
        onChange={(event) => {
          setRating(event.target.value);
          setError("");
        }}
        required
        disabled={busy}
        aria-describedby="review-eligibility"
      >
        <option value="">Choose a rating</option>
        <option value="5">5 — Excellent</option>
        <option value="4">4 — Good</option>
        <option value="3">3 — Average</option>
        <option value="2">2 — Fair</option>
        <option value="1">1 — Poor</option>
      </select>

      <label htmlFor="review-comment">Your review</label>

      <textarea
        id="review-comment"
        value={comment}
        onChange={(event) => {
          setComment(event.target.value);
          setError("");
        }}
        rows={5}
        maxLength={2000}
        placeholder="Tell other shoppers about your experience."
        required
        disabled={busy}
        aria-describedby="review-comment-hint"
      />

      <small id="review-comment-hint">
        {comment.length}/2,000 characters
      </small>

      {error && (
        <p className="product-reviews__error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy}>
        {busy ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}