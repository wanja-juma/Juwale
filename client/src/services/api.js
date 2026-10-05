export const TOKEN_KEY = "juwale_access_token";
export const SESSION_EXPIRED_EVENT = "juwale:session-expired";

export async function authenticatedRequest(
  path,
  { method = "GET", body, signal } = {}
) {
  const token = sessionStorage.getItem(TOKEN_KEY);

  if (!token) {
    const error = new Error("Please log in to continue.");
    error.status = 401;
    throw error;
  }

  const response = await fetch(`/api${path}`, {
    method,
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {}),
  });

  const data =
    response.status === 204
      ? null
      : await response.json().catch(() => null);

  if (!response.ok) {
    // Only clear the session if this request used the current token.
    if (
      response.status === 401 &&
      sessionStorage.getItem(TOKEN_KEY) === token
    ) {
      sessionStorage.removeItem(TOKEN_KEY);

      window.dispatchEvent(
        new Event(SESSION_EXPIRED_EVENT)
      );
    }

    const error = new Error(
      data?.message ||
        data?.msg ||
        `Request failed (${response.status}).`
    );

    error.status = response.status;
    error.fieldErrors = data?.errors || {};

    throw error;
  }

  return data;
}