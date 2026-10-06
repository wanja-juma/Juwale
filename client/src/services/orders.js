import { authenticatedRequest } from "./api";

export function placeOrder(deliveryDetails) {
  return authenticatedRequest("/orders", {
    method: "POST",
    body: deliveryDetails,
  });
}

export function getOrders(signal) {
  return authenticatedRequest("/orders", {
    signal,
  });
}