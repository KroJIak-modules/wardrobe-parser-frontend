type AdminProductsReturnState = {
  href: string;
  scrollY: number;
  loadedCount: number;
  pending: boolean;
};

const STORAGE_KEY = "admin-products-return-state:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function normalizeState(payload: unknown): AdminProductsReturnState | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const raw = payload as Record<string, unknown>;
  const href = String(raw.href || "").trim();
  const scrollY = Number(raw.scrollY);
  const loadedCount = Number(raw.loadedCount);
  if (!href || !Number.isFinite(scrollY) || scrollY < 0 || !Number.isFinite(loadedCount) || loadedCount < 0) {
    return null;
  }
  return {
    href,
    scrollY,
    loadedCount,
    pending: raw.pending !== false,
  };
}

export function readAdminProductsReturnState(): AdminProductsReturnState | null {
  if (!isBrowser()) {
    return null;
  }
  try {
    return normalizeState(JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "null"));
  } catch {
    return null;
  }
}

export function captureAdminProductsReturnState(input: {
  href: string;
  scrollY: number;
  loadedCount: number;
}): void {
  if (!isBrowser()) {
    return;
  }
  const href = String(input.href || "").trim();
  if (!href) {
    return;
  }
  const payload: AdminProductsReturnState = {
    href,
    scrollY: Math.max(0, Math.round(input.scrollY)),
    loadedCount: Math.max(0, Math.round(input.loadedCount)),
    pending: true,
  };
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function markAdminProductsReturnStateRestored(): void {
  if (!isBrowser()) {
    return;
  }
  const current = readAdminProductsReturnState();
  if (!current) {
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, pending: false }));
}

export function getAdminProductsReturnHref(): string | null {
  return readAdminProductsReturnState()?.href || null;
}
