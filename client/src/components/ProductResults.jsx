import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ProductCard from "./ProductCard";
import { getProducts } from "../services/products";

import "./ProductResults.css";

export default function ProductResults() {
  const [searchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("category_id") || "";
  const rawPage = searchParams.get("page") || "1";
  const parsedPage = Number(rawPage);

  const page =
    Number.isSafeInteger(parsedPage) && parsedPage > 0
      ? parsedPage
      : 1;

  return (
    <ProductResultsContent
      key={JSON.stringify([search, categoryId, page])}
      search={search}
      categoryId={categoryId}
      page={page}
    />
  );
}

function ProductResultsContent({ search, categoryId, page }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        const data = await getProducts(controller.signal, {
          search,
          categoryId,
          page,
        });

        if (!controller.signal.aborted) {
          setResult(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.message || "Unable to load products.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, [search, categoryId, page, attempt]);

  function retry() {
    setLoading(true);
    setError("");
    setAttempt((previous) => previous + 1);
  }

  function changePage(nextPage) {
    const params = new URLSearchParams(searchParams);

    if (nextPage === 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    setSearchParams(params);
  }

  if (loading) {
    return <p role="status">Loading products…</p>;
  }

  if (error) {
    return (
      <div>
        <p role="alert">{error}</p>
        <button type="button" onClick={retry}>
          Try again
        </button>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  if (result.total === 0) {
    return <p>No products match your search or category.</p>;
  }

  // Products may have been removed since this URL was saved.
  if (result.items.length === 0) {
    return (
      <div>
        <p>This page has no products.</p>
        <button type="button" onClick={() => changePage(1)}>
          Return to page 1
        </button>
      </div>
    );
  }

  const firstItem = (result.page - 1) * result.per_page + 1;
  const lastItem = firstItem + result.items.length - 1;

  return (
    <section aria-label="Product results">
      <p className="catalogue-count" role="status">
        Showing {firstItem}–{lastItem} of {result.total} products
      </p>

      <div className="catalogue-grid">
        {result.items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {result.pages > 1 && (
        <nav
          className="catalogue-pagination"
          aria-label="Product pagination"
        >
          <button
            type="button"
            disabled={!result.has_prev}
            onClick={() => changePage(result.page - 1)}
          >
            ← Previous
          </button>

          <span aria-current="page">
            Page {result.page} of {result.pages}
          </span>

          <button
            type="button"
            disabled={!result.has_next}
            onClick={() => changePage(result.page + 1)}
          >
            Next →
          </button>
        </nav>
      )}
    </section>
  );
}