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