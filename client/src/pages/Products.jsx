import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductResults from "../components/ProductResults";
import { getCategories } from "../services/products";

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
  const sort = searchParams.get("sort") || "newest";

 const [categories, setCategories] = useState([]);
const [categoriesLoading, setCategoriesLoading] = useState(true);
const [categoriesError, setCategoriesError] = useState("");
const [categoriesAttempt, setCategoriesAttempt] = useState(0);

useEffect(() => {
  const controller = new AbortController();

  async function loadCategories() {
    try {
      const data = await getCategories(controller.signal);

      if (!controller.signal.aborted) {
        setCategories(data);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setCategoriesError(
          error.message || "Unable to load categories."
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setCategoriesLoading(false);
      }
    }
  }

  loadCategories();

  return () => controller.abort();
}, [categoriesAttempt]);

// This function belongs outside useEffect,
// but still inside the Products component.
function changeSort(event) {
  const nextParams = new URLSearchParams(searchParams);
  const selectedSort = event.target.value;

  if (selectedSort === "newest") {
    nextParams.delete("sort");
  } else {
    nextParams.set("sort", selectedSort);
  }

  nextParams.delete("page");
  setSearchParams(nextParams);
}

  // Keep the input in sync with browser Back/Forward navigation.

 function applySearch(searchValue) {
  const nextParams = new URLSearchParams(searchParams);

  if (searchValue) {
    nextParams.set("search", searchValue);
  } else {
    nextParams.delete("search");
  }

  nextParams.delete("page");
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

  nextParams.delete("page");
  setSearchParams(nextParams);
}

  function clearFilters() {
  setSearchParams({});
}
  const selectedCategoryExists = categories.some(
    (category) => String(category.id) === categoryId
  );

function retryCategories() {
  setCategoriesLoading(true);
  setCategoriesError("");
  setCategoriesAttempt((previous) => previous + 1);
}

  return (
    <main className="products-page">
      <header className="products-page__header">
  <h1>Shop our products</h1>

  <p>
    Discover electronics, fashion, and home essentials.
  </p>

    
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

        <div className="catalogue-sort">
  <label htmlFor="product-sort">
    Sort by
  </label>

  <select
    id="product-sort"
    value={sort}
    onChange={changeSort}
  >
    <option value="newest">Newest products</option>
    <option value="price_asc">Price: low to high</option>
    <option value="price_desc">Price: high to low</option>
    <option value="name_asc">Name: A to Z</option>
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

          <button type="button" onClick={retryCategories}>
  Retry categories
</button>
        </div>
      )}

      {search && (
        <p className="products-page__search-summary">
          Search results for “{search}”
        </p>
      )}

  <ProductResults />
    </main>
  );
}