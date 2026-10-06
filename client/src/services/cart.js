import { authenticatedRequest } from "./api";

export function getCart(signal) {
  return authenticatedRequest("/cart", { signal });
}

export function addCartItem(productId, quantity) {
  return authenticatedRequest("/cart/items", {
    method: "POST",
    body: {
      product_id: productId,
      quantity,
    },
  });
}

export function updateCartItem(itemId, quantity) {
  return authenticatedRequest(`/cart/items/${itemId}`, {
    method: "PATCH",
    body: { quantity },
  });
}

export function removeCartItem(itemId) {
  return authenticatedRequest(`/cart/items/${itemId}`, {
    method: "DELETE",
  });
}