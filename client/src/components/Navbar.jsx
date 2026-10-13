import { Link, NavLink, useNavigate } from "react-router-dom";

import CartBadge from "./CartBadge";

import { useAuth } from "../context/authContext";

import "./Navbar.css";

export default function Navbar() {
  const {
    user,
    loading,
    sessionError,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/products", { replace: true });
  }

  function linkClass({ isActive }) {
    return isActive
      ? "juwale-nav__link juwale-nav__link--active"
      : "juwale-nav__link";
  }

  return (
    <>
      <header className="juwale-nav">
        <div className="juwale-nav__inner">
          <Link className="juwale-nav__brand" to="/products">
            JUWALE
          </Link>

          <nav
            className="juwale-nav__links"
            aria-label="Main navigation"
          >
            <NavLink to="/products" className={linkClass}>
              Shop
            </NavLink>

            {loading ? (
              <span role="status">Checking session…</span>
            ) : user ? (
              <>
                <NavLink to="/cart" className={linkClass}>
  My cart
  <CartBadge key={user.id} />
</NavLink>

                <NavLink to="/orders" className={linkClass}>
                  My orders
                </NavLink>

                <NavLink to="/wishlist">
  My wishlist
</NavLink>

                <NavLink to="/profile" className={linkClass}>
                  My profile
                </NavLink>

                {user.role === "admin" && (
                  <NavLink to="/admin" className={linkClass}>
                    Admin dashboard
                  </NavLink>
                )}

                <span className="juwale-nav__user">
                  Hi, {user.name}
                </span>

                <button
                  className="juwale-nav__logout"
                  type="button"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>
                  Log in
                </NavLink>

                <NavLink to="/register" className={linkClass}>
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      {sessionError && (
        <div className="juwale-nav__message" role="alert">
          {sessionError}
        </div>
      )}
    </>
  );
}