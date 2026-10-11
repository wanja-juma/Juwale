import { useEffect, useState } from "react";

import {
  CART_CHANGED_EVENT,
  getCart,
} from "../services/cart";

export default function CartBadge() {
  const [quantity, setQuantity] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let controller;
    let requestNumber = 0;

    async function refreshQuantity() {
      controller?.abort();

      controller = new AbortController();

      const currentController = controller;
      const currentRequest = ++requestNumber;

      try {
        const cart = await getCart(currentController.signal);

        if (
          active &&
          !currentController.signal.aborted &&
          currentRequest === requestNumber
        ) {
          setQuantity(cart.total_quantity);
          setError(false);
        }
      } catch {
        if (
          active &&
          !currentController.signal.aborted &&
          currentRequest === requestNumber
        ) {
          setError(true);
        }
      }
    }

    window.addEventListener(
      CART_CHANGED_EVENT,
      refreshQuantity
    );

    // Recheck when the customer returns to this browser window.
    window.addEventListener("focus", refreshQuantity);

    refreshQuantity();

    return () => {
      active = false;
      controller?.abort();

      window.removeEventListener(
        CART_CHANGED_EVENT,
        refreshQuantity
      );

      window.removeEventListener("focus", refreshQuantity);
    };
  }, []);

  const label = error
    ? "Cart quantity unavailable"
    : quantity === null
      ? "Loading cart quantity"
      : `${quantity} ${quantity === 1 ? "unit" : "units"} in cart`;

  return (
    <span
      className="juwale-nav__cart-badge"
      role="status"
      aria-label={label}
      title={label}
    >
      {error ? "?" : quantity === null ? "…" : quantity}
    </span>
  );
}