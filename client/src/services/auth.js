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