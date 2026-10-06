import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getProduct } from "../services/products";
import AddToCart from "../components/AddToCart";

import "./ProductDetails.css";

const formatPrice = (priceMinor) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(priceMinor / 100);

export default function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProduct() {
      setLoading(true);
      setError("");
      setProduct(null);
      setImageFailed(false);

      try {
        const data = await getProduct(id, controller.signal);

        if (!controller.signal.aborted) {
          setProduct(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error.message || "Something went wrong loading this product."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      controller.abort();
    };
  }, [id, attempt]);

  return (
    <main className="product-details-page">
      <Link className="product-details__back" to="/products">
        ← Back to products
      </Link>

      {loading ? (
        <p className="product-details__message" role="status">
          Loading product…
        </p>
      ) : error ? (
        <div className="product-details__message product-details__message--error">
          <p role="alert">{error}</p>

          <button
            type="button"
            onClick={() => setAttempt((previous) => previous + 1)}
          >
            Try again
          </button>
        </div>
      ) : product ? (
        <article className="product-details">
          <div className="product-details__image">
            {product.image_url && !imageFailed ? (
              <img
                src={product.image_url}
                alt={product.name}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span className="product-details__placeholder">
                JUWALE
              </span>
            )}
          </div>

          <div className="product-details__content">
            <p className="product-details__brand">JUWALE</p>
            

            <h1>{product.name}</h1>

            <p className="product-details__price">
              {formatPrice(product.price_minor)}
            </p>

            <p
              className={
                product.stock > 0
                  ? "product-details__stock"
                  : "product-details__stock product-details__stock--empty"
              }
            >
              {product.stock > 0
                ? `${product.stock} in stock`
                : "Out of stock"}
            </p>

            <h2>Description</h2>

            <p className="product-details__description">
              {product.description}
            </p>
            <AddToCart key={product.id} product={product} />
            
          </div>
        </article>
      ) : null}
    </main>
  );
}