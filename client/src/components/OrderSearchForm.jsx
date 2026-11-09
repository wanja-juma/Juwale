import { useState } from "react";

export default function OrderSearchForm({ search, onSearch }) {
  const [input, setInput] = useState(search);

  function handleSubmit(event) {
    event.preventDefault();

    const value = input.trim();

    setInput(value);
    onSearch(value);
  }

  return (
    <form className="orders-search" onSubmit={handleSubmit}>
      <label htmlFor="order-search">
        Search your orders
      </label>

      <div className="orders-search__controls">
        <input
          id="order-search"
          type="search"
          placeholder="Order number or product name"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />

        <button type="submit">Search</button>
      </div>
    </form>
  );
}