import { authenticatedRequest } from "./api";

export async function getProductReviews(
  productId,
  signal,
  page = 1
) {
  const params = new URLSearchParams({
    page: String(page),
  });

  const response = await fetch(
    `/api/products/${productId}/reviews?${params}`,
    { signal }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Unable to load reviews.");
  }

  if (!data || !Array.isArray(data.items)) {
    throw new Error("The server returned invalid review data.");
  }

  return data;
}

export function createProductReview(productId, review) {
  return authenticatedRequest(`/products/${productId}/reviews`, {
    method: "POST",
    body: review,
  });
}