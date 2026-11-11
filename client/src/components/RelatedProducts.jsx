import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ProductCard from "./ProductCard";
import { getProducts } from "../services/products";

import "./RelatedProducts.css";

export default function RelatedProducts({ product }) {
  if (!product.category_id) {
    return null;
  }

  return (
    <RelatedProductsContent
      key={`${product.id}:${product.category_id}`}
      productId={product.id}
      categoryId={product.category_id}
    />
  );
}

function RelatedProductsContent({ productId, categoryId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRelatedProducts() {
      try {
        // Fetch five so we can exclude the current product
        // and still display up to four alternatives.
        const data = await getProducts(controller.signal, {
          categoryId,
          page: 1,
          perPage: 5,
          sort: "newest",
        });

        const related = data.items
          .filter((item) => item.id !== productId)
          .slice(0, 4);

        if (!controller.signal.aborted) {
          setProducts(related);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error.message || "Unable to load related products."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadRelatedProducts();

    return () => controller.abort();
  }, [productId, categoryId, attempt]);

  function retry() {
    setLoading(true);
    setError("");
    setAttempt((previous) => previous + 1);
  }

  if (!loading && !error && products.length === 0) {
    return null;
  }

  const categoryParams = new URLSearchParams({
    category_id: String(categoryId),
  });

  return (
    <section
      className="related-products"
      aria-labelledby="related-products-heading"
    >
      <header className="related-products__header">
        <div>
          <h2 id="related-products-heading">
            You may also like
          </h2>

          <p>Explore more products in this category.</p>
        </div>

        <Link to={`/products?${categoryParams}`}>
          View category →
        </Link>
      </header>

      {loading ? (
        <p role="status">Loading related products…</p>
      ) : error ? (
        <div>
          <p className="related-products__error" role="alert">
            {error}
          </p>

          <button type="button" onClick={retry}>
            Try again
          </button>
        </div>
      ) : (
        <div className="related-products__grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}