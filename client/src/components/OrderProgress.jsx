import "./OrderProgress.css";

const steps = [
  {
    status: "pending",
    label: "Order placed",
    description: "Your order has been received.",
  },
  {
    status: "processing",
    label: "Processing",
    description: "Your items are being prepared.",
  },
  {
    status: "shipped",
    label: "Shipped",
    description: "Your order is on its way.",
  },
  {
    status: "delivered",
    label: "Delivered",
    description: "Your order has been delivered.",
  },
];

export default function OrderProgress({ status }) {
  if (status === "cancelled") {
    return (
      <section className="order-progress" aria-label="Order tracking">
        <h3>Order tracking</h3>

        <p className="order-progress__cancelled">
          This order has been cancelled.
        </p>
      </section>
    );
  }

  const currentIndex = steps.findIndex(
    (step) => step.status === status
  );

  if (currentIndex === -1) {
    return (
      <section className="order-progress" aria-label="Order tracking">
        <h3>Order tracking</h3>
        <p>Tracking information is currently unavailable.</p>
      </section>
    );
  }

  return (
    <section className="order-progress" aria-label="Order tracking">
      <h3>Order tracking</h3>

      <p className="order-progress__summary" role="status">
        {steps[currentIndex].description}
      </p>

      <ol className="order-progress__steps">
        {steps.map((step, index) => {
          const completed = index < currentIndex;
          const current = index === currentIndex;

          const state = completed
            ? "complete"
            : current
              ? "current"
              : "upcoming";

          return (
            <li
              key={step.status}
              className={`order-progress__step order-progress__step--${state}`}
              aria-current={current ? "step" : undefined}
            >
              <span
                className="order-progress__marker"
                aria-hidden="true"
              >
                {completed ? "✓" : index + 1}
              </span>

              <div>
                <span className="order-progress__label">
                  {step.label}
                </span>

                <span className="order-progress__state">
                  {completed
                    ? "Completed"
                    : current
                      ? status === "delivered"
                        ? "Completed"
                        : "Current stage"
                      : "Upcoming"}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}