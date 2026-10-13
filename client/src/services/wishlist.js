import { authenticatedRequest } from "./api";

export function getWishlist(signal) {
  return authenticatedRequest("/wishlist", { signal });
}

export function saveWishlistItem(productId) {
  return authenticatedRequest("/wishlist/items", {
    method: "POST",
    body: { product_id: productId },
  });
}

export function removeWishlistItem(itemId) {
  return authenticatedRequest(`/wishlist/items/${itemId}`, {
    method: "DELETE",
  });
}