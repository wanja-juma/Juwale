import { authenticatedRequest } from "./api";

export const CART_CHANGED_EVENT = "juwale:cart-changed";

export function notifyCartChanged() {
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}

export function getCart(signal) {
  return authenticatedRequest("/cart", { signal });
}

export async function addCartItem(productId, quantity) {
  try {
    return await authenticatedRequest("/cart/items", {
      method: "POST",
      body: {
        product_id: productId,
        quantity,
      },
    });
  } finally {
    notifyCartChanged();
  }
}

export async function updateCartItem(itemId, quantity) {
  try {
    return await authenticatedRequest(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: { quantity },
    });
  } finally {
    notifyCartChanged();
  }
}

export async function removeCartItem(itemId) {
  try {
    return await authenticatedRequest(`/cart/items/${itemId}`, {
      method: "DELETE",
    });
  } finally {
    notifyCartChanged();
  }
}