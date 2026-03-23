// API_BASE is intentionally empty. In production, the Express server serves
// the frontend from the same origin, so all /api paths resolve correctly as
// relative URLs. In development, Vite's proxy config forwards /api requests
// to the backend, so the same relative paths work there too.
const API_BASE = "";

/**
 * Sends an authenticated API request and returns the parsed JSON response.
 *
 * Credentials are always included so the browser sends the HttpOnly auth
 * cookie on every request. If the server returns a non-2xx status, the
 * response body's error field is used as the error message and the HTTP
 * status code is attached to the thrown error for callers to inspect.
 *
 * @param {string} path - API path, e.g. "/api/auth/me".
 * @param {RequestInit} options - Fetch options merged with the defaults.
 * @returns {Promise<any>} Parsed JSON response body, or null for empty responses.
 * @throws {Error} With a status property set to the HTTP status code on failure.
 */
export async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}