async function readResponse(response, fallbackMessage) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.message || fallbackMessage
    );
  }

  return response.json();
}

export async function getProducts(
  signal,
  {
    search = "",
    categoryId = "",
    page = 1,
    perPage = 12,
    sort = "newest",
  } = {}
) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    sort,
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (categoryId) {
    params.set("category_id", String(categoryId));
  }

  const response = await fetch(`/api/products?${params}`, {
    signal,
  });

  const data = await readResponse(response);

  if (
    !data ||
    !Array.isArray(data.items) ||
    !Number.isInteger(data.total) ||
    !Number.isInteger(data.page) ||
    !Number.isInteger(data.pages)
  ) {
    throw new Error("The server returned invalid product data.");
  }

  return data;
}

export async function getCategories(signal) {
  const response = await fetch("/api/categories", {
    signal,
  });

  const data = await readResponse(
    response,
    "Unable to load categories."
  );

  if (!Array.isArray(data)) {
    throw new Error("The server returned an unexpected category response.");
  }

  return data;
}

export async function getProduct(productId, signal) {
  const response = await fetch(`/api/products/${productId}`, {
    signal,
  });

  return readResponse(
    response,
    "Unable to load the product."
  );
}