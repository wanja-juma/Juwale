import { useState } from "react";

function toShillings(value) {
  return value === "" ? "" : (Number(value) / 100).toFixed(2);
}

function toMinorUnits(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(
      "Enter a positive price with at most two decimal places."
    );
  }

  const [whole, decimal = ""] = trimmed.split(".");

  const minor =
    Number(whole) * 100 +
    Number(decimal.padEnd(2, "0"));

  if (!Number.isSafeInteger(minor) || minor > 10_000_000_000) {
    throw new Error("Price must not exceed KSh 100,000,000.");
  }

  return String(minor);
}

export default function PriceFilterForm({
  minPrice,
  maxPrice,
  onApply,
}) {
  const [minimum, setMinimum] = useState(toShillings(minPrice));
  const [maximum, setMaximum] = useState(toShillings(maxPrice));
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const min = toMinorUnits(minimum);
      const max = toMinorUnits(maximum);

      if (min !== "" && max !== "" && Number(min) > Number(max)) {
        throw new Error(
          "Minimum price cannot exceed maximum price."
        );
      }

      onApply(min, max);
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <form
      className="catalogue-price"
      onSubmit={handleSubmit}
      noValidate
    >
      <fieldset>
        <legend>Price range (KSh)</legend>

        <div className="catalogue-price__controls">
          <div>
            <label htmlFor="minimum-price">Minimum</label>
            <input
              id="minimum-price"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={minimum}
              onChange={(event) => {
                setMinimum(event.target.value);
                setError("");
              }}
              aria-describedby={error ? "price-filter-error" : undefined}
            />
          </div>

          <div>
            <label htmlFor="maximum-price">Maximum</label>
            <input
              id="maximum-price"
              type="text"
              inputMode="decimal"
              placeholder="Any price"
              value={maximum}
              onChange={(event) => {
                setMaximum(event.target.value);
                setError("");
              }}
              aria-describedby={error ? "price-filter-error" : undefined}
            />
          </div>

          <button type="submit">Apply price</button>
        </div>

        {error && (
          <p id="price-filter-error" role="alert">
            {error}
          </p>
        )}
      </fieldset>
    </form>
  );
}