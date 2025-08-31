export function authFetch(url, options = {}) {
  const token = localStorage.getItem("stb_token");
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "Content-Type": "application/json",
  };
  return fetch(url, { ...options, headers });
}
