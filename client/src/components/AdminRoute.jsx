import { Link } from "react-router-dom";

import { useAuth } from "../context/authContext";
import ProtectedRoute from "./ProtectedRoute";

function AdminAccess({ children }) {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <main className="products-page">
        <h1>Admin access required</h1>
        <Link to="/products">Back to products</Link>
      </main>
    );
  }

  return children;
}

export default function AdminRoute({ children }) {
  return (
    <ProtectedRoute>
      <AdminAccess>{children}</AdminAccess>
    </ProtectedRoute>
  );
}