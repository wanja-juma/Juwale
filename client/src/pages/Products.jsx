import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/authContext";
import ProductCard from "../components/ProductCard";
import {
  getCategories,
  getProducts,
} from "../services/products";

import "./Products.css";

function SearchForm({ search, onSearch }) {
  const [searchInput, setSearchInput] = useState(search);

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedSearch = searchInput.trim();

    setSearchInput(trimmedSearch);
    onSearch(trimmedSearch);
  }

  return (
    <form
      className="catalogue-search"
      onSubmit={handleSubmit}
    >
      <label htmlFor="product-search">
        Search products
      </label>

      <div className="catalogue-search__controls">
        <input
          id="product-search"
          type="search"
          placeholder="Try headphones or kettle"
          value={searchInput}
          onChange={(event) =>
            setSearchInput(event.target.value)
          }
        />

        <button type="submit">
          Search
        </button>
      </div>
    </form>
  );
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("category_id") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [categoriesAttempt, setCategoriesAttempt] = useState(0);

  // Keep the input in sync with browser Back/Forward navigation.

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      setCategoriesLoading(true);
      setCategoriesError("");

      try {
        const data = await getCategories(controller.signal);

        if (!controller.signal.aborted) {
          setCategories(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setCategoriesError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCategoriesLoading(false);
        }
      }
    }

    loadCategories();

    

    return () => {
      controller.abort();
    };
  }, [categoriesAttempt]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      setError("");

      try {
        const data = await getProducts(controller.signal, {
          search,
          categoryId,
        });

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
  }, [search, categoryId, attempt]);

  function applySearch(searchValue) {
  const nextParams = new URLSearchParams(searchParams);

  if (searchValue) {
    nextParams.set("search", searchValue);
  } else {
    nextParams.delete("search");
  }

  setSearchParams(nextParams);
}

  function changeCategory(event) {
    const nextParams = new URLSearchParams(searchParams);
    const selectedCategory = event.target.value;

    if (selectedCategory) {
      nextParams.set("category_id", selectedCategory);
    } else {
      nextParams.delete("category_id");
    }

    setSearchParams(nextParams);
  }

  function clearFilters() {
  setSearchParams({});
}

  const hasFilters = Boolean(search || categoryId);

  const selectedCategoryExists = categories.some(
    (category) => String(category.id) === categoryId
  );

  const { user, loading: authLoading, sessionError, logout } = useAuth();

  return (
    <main className="products-page">
      <header className="products-page__header">
        <p className="products-page__brand">JUWALE</p>
        <h1>Shop our products</h1>
        <p>Discover electronics, fashion, and home essentials.</p>

        {authLoading ? (
  <p role="status">Checking your session…</p>
) : user ? (
  <div>
    <p>Welcome, {user.name}!</p>

    <Link className="products-page__register" to="/profile">
  My profile
</Link>

{" "}
<Link className="products-page__register" to="/cart">
  My cart
</Link>

{" "}

<Link className="products-page__register" to="/orders">
  My orders
</Link>

{" "}

{user.role === "admin" && (
  <>
    <Link className="products-page__register" to="/admin">
      Admin dashboard
    </Link>

    {" "}
  </>
)}

    <button
      className="products-page__register"
      type="button"
      onClick={logout}
    >
      Log out
    </button>
  </div>
) : (
  <div>
    <Link className="products-page__register" to="/register">
      Create an account
    </Link>

    {" "}

    <Link className="products-page__register" to="/login">
      Log in
    </Link>
  </div>
)}

{sessionError && (
  <p role="alert">{sessionError}</p>
)}
      </header>

      <div className="catalogue-filters">
        <SearchForm
  key={searchParams.toString()}
  search={search}
  onSearch={applySearch}
/>

        <div className="catalogue-category">
          <label htmlFor="product-category">
            Category
          </label>

          <select
            id="product-category"
            value={categoryId}
            onChange={changeCategory}
            disabled={
              categoriesLoading || Boolean(categoriesError)
            }
          >
            <option value="">
              {categoriesLoading
                ? "Loading categories…"
                : "All categories"}
            </option>

            {categoryId && !selectedCategoryExists && (
              <option value={categoryId}>
                Category {categoryId}
              </option>
            )}

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="catalogue-clear"
          type="button"
          onClick={clearFilters}
        >
          Clear filters
        </button>
      </div>

      {categoriesError && (
        <div className="products-message products-message--error">
          <p role="alert">{categoriesError}</p>

          <button
            type="button"
            onClick={() =>
              setCategoriesAttempt((previous) => previous + 1)
            }
          >
            Retry categories
          </button>
        </div>
      )}

      {search && (
        <p className="products-page__search-summary">
          Search results for “{search}”
        </p>
      )}

      {loading ? (
        <p className="products-message" role="status">
          Loading products…
        </p>
      ) : error ? (
        <div className="products-message products-message--error">
          <p role="alert">{error}</p>

          <button
            type="button"
            onClick={() =>
              setAttempt((previous) => previous + 1)
            }
          >
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="products-message">
          <p>
            {hasFilters
              ? "No products match your search or category."
              : "No products are available yet."}
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
            >
              Show all products
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="products-page__count" role="status">
            {products.length}{" "}
            {products.length === 1 ? "product" : "products"} found
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