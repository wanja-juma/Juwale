import { authenticatedRequest } from "./api";

export async function registerUser(userDetails) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userDetails),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data?.message || "Registration failed. Please try again."
    );

    error.fieldErrors = data?.errors || {};

    throw error;
  }

  if (!data?.user) {
    throw new Error("The server returned an unexpected response.");
  }

  return data;
}

export async function loginUser(credentials) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || data?.msg || "Unable to log in."
    );
  }

  if (!data?.access_token || !data?.user) {
    throw new Error("The server returned an unexpected login response.");
  }

  return data;
}

export async function getCurrentUser(signal) {
  const data = await authenticatedRequest("/auth/me", {
    signal,
  });

  if (!data?.user) {
    throw new Error("The server returned an unexpected user response.");
  }

  return data.user;
}