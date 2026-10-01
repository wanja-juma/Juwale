import { useEffect, useState } from "react";

import ProductCard from "../components/ProductCard";
import { getProducts } from "../services/products";

import "./Products.css";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      setError("");

      try {
        const data = await getProducts(controller.signal);

        if (!controller.signal.aborted) {
          setProducts(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error.message || "Something went wrong loading products."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      controller.abort();
    };
  }, [attempt]);

  return (
    <main className="products-page">
      <header className="products-page__header">
        <p className="products-page__brand">JUWALE</p>
        <h1>Shop our products</h1>
        <p>Discover electronics, fashion, and home essentials.</p>
      </header>

      {loading ? (
        <p className="products-message" role="status">
          Loading products…
        </p>
      ) : error ? (
        <div className="products-message products-message--error">
          <p role="alert">{error}</p>

          <button
            type="button"
            onClick={() => setAttempt((previous) => previous + 1)}
          >
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <p className="products-message">
          No products are available yet.
        </p>
      ) : (
        <>
          <p className="products-page__count">
            {products.length} products available
          </p>

          <section
            className="products-grid"
            aria-label="Available products"
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </section>
        </>
      )}
    </main>
  );
}