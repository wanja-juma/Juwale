import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminCategoryForm from "../components/AdminCategoryForm";

import {
  getAdminOrders,
  getAdminProducts,
  saveAdminProduct,
  updateAdminOrder,
} from "../services/admin";

import { getCategories } from "../services/products";

import "./Admin.css";

const money = (value) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(value / 100);



function ProductForm({ product, categories, onSaved, onCancel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));

    // Convert decimal KSh input to integer minor units.
    if (!/^\d+(\.\d{1,2})?$/.test(values.price_kes)) {
      setError("Enter a price with at most two decimal places.");
      return;
    }

    const [whole, fraction = ""] = values.price_kes.split(".");
    const priceMinor =
      Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

    if (!Number.isSafeInteger(priceMinor) || priceMinor < 1) {
      setError("Enter a valid positive price.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await saveAdminProduct(
        {
          name: values.name.trim(),
          description: values.description.trim(),
          price_minor: priceMinor,
          stock: Number(values.stock),
          category_id: Number(values.category_id),
          image_url: values.image_url.trim(),
          is_active: values.is_active === "on",
        },
        product?.id
      );

      onSaved();
    } catch (error) {
      setError(error.message || "Unable to save the product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-panel admin-form" onSubmit={handleSubmit}>
      <h2>{product ? `Edit ${product.name}` : "Add a product"}</h2>

      <fieldset disabled={busy}>
        <label>
          Name
          <input
            name="name"
            defaultValue={product?.name || ""}
            maxLength={150}
            required
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            defaultValue={product?.description || ""}
            maxLength={1000}
            required
          />
        </label>

        <label>
          Price in KSh
          <input
            name="price_kes"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={
              product ? (product.price_minor / 100).toFixed(2) : ""
            }
            required
          />
        </label>

        <label>
          Stock
          <input
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.stock ?? 0}
            required
          />
        </label>

        <label>
          Category
          <select
            name="category_id"
            defaultValue={product?.category_id || ""}
            required
          >
            <option value="">Select a category</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          HTTPS image URL — optional
          <input
            name="image_url"
            type="url"
            defaultValue={product?.image_url || ""}
            maxLength={1000}
          />
        </label>

        <label className="admin-checkbox">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={product?.is_active ?? true}
          />
          Show in the customer catalogue
        </label>

        <button type="submit">
          {busy ? "Saving…" : "Save product"}
        </button>

        {product && (
          <button type="button" onClick={onCancel}>
            Cancel edit
          </button>
        )}
      </fieldset>

      {error && (
        <p className="admin-error" role="alert">{error}</p>
      )}
    </form>
  );
}

function AdminOrderCard({ order, onUpdated }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cashCollected, setCashCollected] = useState(false);

  const nextStatus = {
    pending: "processing",
    processing: "shipped",
    shipped: "delivered",
  }[order.status];

  async function advanceOrder() {
    setBusy(true);
    setError("");

    try {
      await updateAdminOrder(order.id, {
        status: nextStatus,
        ...(nextStatus === "delivered"
          ? { cash_collected: cashCollected }
          : {}),
      });

      onUpdated();
    } catch (error) {
      setError(error.message || "Unable to update the order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="admin-panel">
      <h3>Order #{order.id}</h3>

      <p>
        Customer #{order.user_id} · {order.status} ·{" "}
        {order.payment_status}
      </p>

      <ul>
        {order.items.map((item) => (
          <li key={item.id}>
            {item.product_name} × {item.quantity} —{" "}
            {money(item.subtotal_minor)}
          </li>
        ))}
      </ul>

      <strong>Total: {money(order.total_minor)}</strong>

      <p>{order.delivery_name} · {order.phone}</p>
      <p className="admin-address">{order.address}</p>

      {nextStatus === "delivered" && (
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={cashCollected}
            onChange={(event) =>
              setCashCollected(event.target.checked)
            }
            disabled={busy}
          />
          Delivery completed and cash payment collected
        </label>
      )}

      {nextStatus && (
        <button
          type="button"
          onClick={advanceOrder}
          disabled={
            busy ||
            (nextStatus === "delivered" && !cashCollected)
          }
        >
          {busy ? "Updating…" : `Mark ${nextStatus}`}
        </button>
      )}

      {error && (
        <p className="admin-error" role="alert">{error}</p>
      )}
    </article>
  );
}

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const [productData, orderData, categoryData] =
          await Promise.all([
            getAdminProducts(controller.signal),
            getAdminOrders(controller.signal),
            getCategories(controller.signal),
          ]);

        if (!controller.signal.aborted) {
          setProducts(productData);
          setOrders(orderData);
          setCategories(categoryData);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.message || "Unable to load the dashboard.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => controller.abort();
  }, [revision]);

  function reload() {
    setLoading(true);
    setError("");
    setEditing(null);
    setRevision((previous) => previous + 1);
  }

  return (
    <main className="admin-page">
      <header>
        <h1>Admin dashboard</h1>
        <Link to="/products">← Back to shop</Link>
        <button type="button" onClick={reload} disabled={loading}>
          Refresh dashboard
        </button>
      </header>

      {loading ? (
        <p role="status">Loading dashboard…</p>
      ) : error ? (
        <div className="admin-panel">
          <p className="admin-error" role="alert">{error}</p>
          <button type="button" onClick={reload}>Try again</button>
        </div>
      ) : (
        
        <>
        <AdminCategoryForm onCreated={reload} />

    <ProductForm
      key={editing?.id || "new"}
      product={editing}
      categories={categories}
      onSaved={reload}
      onCancel={() => setEditing(null)}
    />
        
          <ProductForm
            key={editing?.id || "new"}
            product={editing}
            categories={categories}
            onSaved={reload}
            onCancel={() => setEditing(null)}
          />

          <section>
            <h2>Products</h2>

            {!products.length && <p>No products yet.</p>}

            {products.map((product) => (
              <article className="admin-panel" key={product.id}>
                <h3>{product.name}</h3>

                <p>
                  {money(product.price_minor)} · Stock: {product.stock}
                  {" · "}
                  {product.is_active ? "Active" : "Hidden"}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setEditing(product);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Edit product
                </button>
              </article>
            ))}
          </section>

          <section>
            <h2>Customer orders</h2>

            {!orders.length && <p>No orders yet.</p>}

            {orders.map((order) => (
              <AdminOrderCard
                key={`${order.id}-${order.status}`}
                order={order}
                onUpdated={reload}
              />
            ))}
          </section>
        </>
      )}
    </main>
  );
}