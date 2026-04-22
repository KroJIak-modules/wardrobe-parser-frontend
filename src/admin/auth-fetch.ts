const API_BASE = "/api/v1";
const ADMIN_ACCESS_TOKEN_KEY = "admin_access_token";
const ADMIN_REFRESH_TOKEN_KEY = "admin_refresh_token";

async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const accessToken = window.localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
  const headers = new Headers(init?.headers ?? undefined);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  const response = await globalThis.fetch(input, { ...init, headers });
  if (response.status !== 401 || requestUrl.startsWith(`${API_BASE}/auth/`)) {
    return response;
  }

  const refreshToken = window.localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return response;
  }

  const refreshResponse = await globalThis.fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!refreshResponse.ok) {
    window.localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    return response;
  }
  const refreshed = (await refreshResponse.json()) as { access_token: string; refresh_token: string };
  window.localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, refreshed.access_token || "");
  window.localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshed.refresh_token || "");
  const retryHeaders = new Headers(init?.headers ?? undefined);
  retryHeaders.set("Authorization", `Bearer ${refreshed.access_token}`);
  return globalThis.fetch(input, { ...init, headers: retryHeaders });
}

export { ADMIN_ACCESS_TOKEN_KEY, ADMIN_REFRESH_TOKEN_KEY, API_BASE, authFetch };
