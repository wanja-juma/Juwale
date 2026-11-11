import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/authContext";
import { getProductReviews } from "../services/reviews";
import ProductReviewForm from "./ProductReviewForm";

import "./ProductReviews.css";

export default function ProductReviews({ productId }) {
  const { user, loading: authLoading } = useAuth();

  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);

  function refreshReviews() {
    setPage(1);
    setRevision((previous) => previous + 1);
  }

  return (
    <section className="product-reviews">
      <h2>Customer reviews</h2>

      <ReviewList
        key={`${productId}:${page}:${revision}`}
        productId={productId}
        page={page}
        onPageChange={setPage}
        onRefresh={refreshReviews}
      />

      {authLoading ? (
        <p role="status">Checking your session…</p>
      ) : user ? (
        <ProductReviewForm
          key={`${productId}:${user.id}`}
          productId={productId}
          onSubmitted={refreshReviews}
        />
      ) : (
        <p>
          <Link
            to="/login"
            state={{ from: `/products/${productId}` }}
          >
            Log in
          </Link>{" "}
          to review a product you have received.
        </p>
      )}
    </section>
  );
}

function ReviewList({
  productId,
  page,
  onPageChange,
  onRefresh,
}) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadReviews() {
      try {
        const data = await getProductReviews(
          productId,
          controller.signal,
          page
        );

        if (!controller.signal.aborted) {
          setResult(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.message || "Unable to load reviews.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadReviews();

    return () => controller.abort();
  }, [productId, page]);

  if (loading) {
    return <p role="status">Loading reviews…</p>;
  }

  if (error) {
    return (
      <div>
        <p className="product-reviews__error" role="alert">
          {error}
        </p>

        <button type="button" onClick={onRefresh}>
          Reload reviews
        </button>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div>
      <div className="product-reviews__summary">
        <p role="status">
          {result.total === 0 ? (
            "No reviews yet. Be the first to share your experience."
          ) : (
            <>
              <strong>{result.average_rating} / 5</strong>
              {" · "}
              {result.total}{" "}
              {result.total === 1 ? "review" : "reviews"}
            </>
          )}
        </p>

        <button type="button" onClick={onRefresh}>
          Refresh reviews
        </button>
      </div>

      <ul className="product-reviews__list">
        {result.items.map((review) => (
          <li key={review.id} className="product-review">
            <div className="product-review__header">
              <h3>{review.reviewer_name}</h3>

              <span aria-label={`${review.rating} out of 5 stars`}>
                <span aria-hidden="true">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </span>
                {" "}
                {review.rating}/5
              </span>
            </div>

            <p className="product-review__comment">
              {review.comment}
            </p>
          </li>
        ))}
      </ul>

      {result.total > 0 && result.items.length === 0 && (
        <p>
          No reviews on this page.{" "}
          <button type="button" onClick={() => onPageChange(1)}>
            Return to page 1
          </button>
        </p>
      )}

      {result.pages > 1 && (
        <nav
          className="product-reviews__pagination"
          aria-label="Review pagination"
        >
          <button
            type="button"
            disabled={!result.has_prev}
            onClick={() => onPageChange(page - 1)}
          >
            ← Previous
          </button>

          <span aria-current="page">
            Page {result.page} of {result.pages}
          </span>

          <button
            type="button"
            disabled={!result.has_next}
            onClick={() => onPageChange(page + 1)}
          >
            Next →
          </button>
        </nav>
      )}
    </div>
  );
}