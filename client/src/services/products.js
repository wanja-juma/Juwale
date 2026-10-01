export async function getProducts(signal) {
  const response = await fetch("/api/products", {
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `Unable to load products. Server returned ${response.status}.`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("The server returned an unexpected product response.");
  }

  return data;
}

export async function getProduct(productId, signal) {
  const response = await fetch(`/api/products/${productId}`, {
    signal,
  });

  if (response.status === 404) {
    throw new Error("This product could not be found.");
  }

  if (!response.ok) {
    throw new Error(
      `Unable to load the product. Server returned ${response.status}.`
    );
  }

  return response.json();
}