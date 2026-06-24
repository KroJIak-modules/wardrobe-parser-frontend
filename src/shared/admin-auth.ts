import { API_BASE } from "./api-base";

export { API_BASE };
export const ADMIN_AUTH_EXPIRED_FLAG = "admin_auth_expired";
export const ADMIN_AUTH_EXPIRED_EVENT = "admin-auth-expired";

export type AdminMePayload = {
  user_id: number;
  login: string;
  role_name: string | null;
  is_superuser: boolean;
  is_active: boolean;
  permissions: string[];
};

let cachedAdminMe: AdminMePayload | null = null;
let adminMeInFlight: Promise<AdminMePayload | null> | null = null;

export function clearAdminSessionHints(): void {
  try {
    window.sessionStorage.removeItem(ADMIN_AUTH_EXPIRED_FLAG);
  } catch {
    // Ignore storage errors.
  }
  cachedAdminMe = null;
  adminMeInFlight = null;
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

function shouldSkipRefresh(requestUrl: string): boolean {
  try {
    const origin = globalThis.location?.origin || "http://localhost";
    const { pathname } = new URL(requestUrl, origin);
    return pathname === `${API_BASE}/auth/login` || pathname === `${API_BASE}/auth/refresh` || pathname === `${API_BASE}/auth/logout`;
  } catch {
    return requestUrl === `${API_BASE}/auth/login` || requestUrl === `${API_BASE}/auth/refresh` || requestUrl === `${API_BASE}/auth/logout`;
  }
}

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
  if (response.status !== 401 || shouldSkipRefresh(requestUrl)) {
    return response;
  }

  const refreshed = await refreshAdminSession();
  if (!refreshed) {
    cachedAdminMe = null;
    markAuthExpired();
    return response;
  }

  return globalThis.fetch(input, { ...init, credentials: "include" });
}

export async function getAdminMeCached(force = false): Promise<AdminMePayload | null> {
  if (!force && cachedAdminMe) {
    return cachedAdminMe;
  }
  if (!force && adminMeInFlight) {
    return adminMeInFlight;
  }
  adminMeInFlight = (async () => {
    const response = await authFetch(`${API_BASE}/auth/me`);
    if (!response.ok) {
      cachedAdminMe = null;
      return null;
    }
    const payload = (await response.json()) as AdminMePayload;
    cachedAdminMe = payload;
    return payload;
  })();
  try {
    return await adminMeInFlight;
  } finally {
    adminMeInFlight = null;
  }
}

export async function checkAdminSessionSilently(): Promise<boolean> {
  const me = await globalThis.fetch(`${API_BASE}/auth/me`, { credentials: "include" });
  if (me.ok) {
    cachedAdminMe = (await me.json()) as AdminMePayload;
    return true;
  }
  if (me.status !== 401) {
    cachedAdminMe = null;
    return false;
  }
  const refreshed = await refreshAdminSession();
  if (!refreshed) {
    cachedAdminMe = null;
    return false;
  }
  const recheck = await globalThis.fetch(`${API_BASE}/auth/me`, { credentials: "include" });
  if (!recheck.ok) {
    cachedAdminMe = null;
    return false;
  }
  cachedAdminMe = (await recheck.json()) as AdminMePayload;
  return true;
}

export async function logoutAdminSession(): Promise<void> {
  try {
    await globalThis.fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
  } finally {
    clearAdminSessionHints();
  }
}
