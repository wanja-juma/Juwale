import { authenticatedRequest } from "./api";

import { notifyCartChanged } from "./cart";

export async function placeOrder(deliveryDetails) {
  try {
    return await authenticatedRequest("/orders", {
      method: "POST",
      body: deliveryDetails,
    });
  } finally {
    notifyCartChanged();
  }
}

export function getOrders(signal) {
  return authenticatedRequest("/orders", {
    signal,
  });
}

export function getOrder(orderId, signal) {
  return authenticatedRequest(`/orders/${orderId}`, {
    signal,
  });
}

export function cancelOrder(orderId) {
  return authenticatedRequest(`/orders/${orderId}/cancel`, {
    method: "POST",
  });
}