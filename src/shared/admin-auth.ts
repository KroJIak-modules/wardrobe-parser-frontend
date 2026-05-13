export const API_BASE = "/api/v1";
export const ADMIN_AUTH_EXPIRED_FLAG = "admin_auth_expired";
export const ADMIN_AUTH_EXPIRED_EVENT = "admin-auth-expired";

export function clearAdminSessionHints(): void {
  try {
    window.sessionStorage.removeItem(ADMIN_AUTH_EXPIRED_FLAG);
  } catch {
    // Ignore storage errors.
  }
}

function markAuthExpired(): void {
  try {
    window.sessionStorage.setItem(ADMIN_AUTH_EXPIRED_FLAG, "1");
  } catch {
    // Ignore storage errors.
  }
  window.dispatchEvent(new CustomEvent(ADMIN_AUTH_EXPIRED_EVENT));
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAdminSession(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  refreshInFlight = (async () => {
    const res = await globalThis.fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const response = await globalThis.fetch(input, { ...init, credentials: "include" });
  if (response.status !== 401 || requestUrl.startsWith(`${API_BASE}/auth/`)) {
    return response;
  }

  const refreshed = await refreshAdminSession();
  if (!refreshed) {
    markAuthExpired();
    return response;
  }

  return globalThis.fetch(input, { ...init, credentials: "include" });
}

export async function checkAdminSessionSilently(): Promise<boolean> {
  const res = await globalThis.fetch(`${API_BASE}/auth/me`, { credentials: "include" });
  return res.ok;
}

export async function logoutAdminSession(): Promise<void> {
  try {
    await globalThis.fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
  } finally {
    clearAdminSessionHints();
  }
}
