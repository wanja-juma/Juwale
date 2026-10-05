import { useEffect, useState } from "react";

import { AuthContext } from "./authContext";
import {
  getCurrentUser,
  loginUser,
} from "../services/auth";

import {
  SESSION_EXPIRED_EVENT,
  TOKEN_KEY,
} from "../services/api";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(
    () => Boolean(sessionStorage.getItem(TOKEN_KEY))
  );

  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const initialToken = sessionStorage.getItem(TOKEN_KEY);

    function handleSessionExpired() {
      setUser(null);
      setSessionError(
        "Your session has expired or is invalid. Please log in again."
      );
    }

    window.addEventListener(
      SESSION_EXPIRED_EVENT,
      handleSessionExpired
    );

    async function restoreSession() {
      try {
        const currentUser = await getCurrentUser(
          controller.signal
        );

        if (
          !controller.signal.aborted &&
          sessionStorage.getItem(TOKEN_KEY) === initialToken
        ) {
          setUser(currentUser);
          setSessionError("");
        }
      } catch (error) {
        if (
          !controller.signal.aborted &&
          sessionStorage.getItem(TOKEN_KEY) === initialToken
        ) {
          setSessionError(error.message);

          // Flask-JWT-Extended defaults to 422 for malformed tokens.
          if (error.status === 422) {
            sessionStorage.removeItem(TOKEN_KEY);
            setUser(null);
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (initialToken) {
      restoreSession();
    }

    return () => {
      controller.abort();

      window.removeEventListener(
        SESSION_EXPIRED_EVENT,
        handleSessionExpired
      );
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

  async function refreshUser() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const currentUser = await getCurrentUser();

    if (
      token &&
      sessionStorage.getItem(TOKEN_KEY) === token
    ) {
      setUser(currentUser);
      setSessionError("");
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionError,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}