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
  { search = "", categoryId = "" } = {}
) {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (categoryId) {
    params.set("category_id", categoryId);
  }

  const query = params.toString();

  const response = await fetch(
    `/api/products${query ? `?${query}` : ""}`,
    { signal }
  );

  const data = await readResponse(
    response,
    "Unable to load products."
  );

  if (!Array.isArray(data)) {
    throw new Error("The server returned an unexpected product response.");
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