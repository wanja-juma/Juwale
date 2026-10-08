import { authenticatedRequest } from "./api";

export function getAdminProducts(signal) {
  return authenticatedRequest("/admin/products", { signal });
}

export function saveAdminProduct(product, productId) {
  return authenticatedRequest(
    productId
      ? `/admin/products/${productId}`
      : "/admin/products",
    {
      method: productId ? "PATCH" : "POST",
      body: product,
    }
  );
}

export function getAdminOrders(signal) {
  return authenticatedRequest("/admin/orders", { signal });
}

export function updateAdminOrder(orderId, details) {
  return authenticatedRequest(`/admin/orders/${orderId}`, {
    method: "PATCH",
    body: details,
  });
}

export function createAdminCategory(name) {
  return authenticatedRequest("/admin/categories", {
    method: "POST",
    body: { name },
  });
}