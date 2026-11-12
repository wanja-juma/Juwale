import { authenticatedRequest } from "./api";

export function getDeliveryDetails(signal) {
  return authenticatedRequest("/delivery-details", { signal });
}

export function saveDeliveryDetails(details) {
  return authenticatedRequest("/delivery-details", {
    method: "PUT",
    body: details,
  });
}

export function deleteDeliveryDetails() {
  return authenticatedRequest("/delivery-details", {
    method: "DELETE",
  });
}