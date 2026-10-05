import { useEffect, useState } from "react";

import { AuthContext } from "./authContext";
import {
  getCurrentUser,
  loginUser,
} from "../services/auth";

const TOKEN_KEY = "juwale_access_token";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(
    () => Boolean(sessionStorage.getItem(TOKEN_KEY))
  );

  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
      return;
    }

    const controller = new AbortController();

    async function restoreSession() {
      try {
        const currentUser = await getCurrentUser(
          token,
          controller.signal
        );

        if (!controller.signal.aborted) {
          setUser(currentUser);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          if (error.status === 401 || error.status === 422) {
            sessionStorage.removeItem(TOKEN_KEY);
          }

          setSessionError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      controller.abort();
    };
  }, []);

  async function login(email, password) {
    const data = await loginUser({ email, password });

    sessionStorage.setItem(TOKEN_KEY, data.access_token);
    setUser(data.user);
    setSessionError("");
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setSessionError("");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionError,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}