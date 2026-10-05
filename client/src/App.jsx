import { Link, Navigate, Route, Routes } from "react-router-dom";

import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";

import Register from "./pages/Register";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/products" replace />}
      />

      <Route
        path="/products"
        element={<Products />}
      />

      <Route
        path="/products/:id"
        element={<ProductDetails />}
      />

      <Route
  path="/register"
  element={<Register />}
/>
<Route path="/login" element={<Login />} />

<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>

      <Route
        path="*"
        element={
          <main className="products-page">
            <h1>Page not found</h1>
            <Link to="/products">Back to products</Link>
          </main>
        }
      />
    </Routes>
  );
}
