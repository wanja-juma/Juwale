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