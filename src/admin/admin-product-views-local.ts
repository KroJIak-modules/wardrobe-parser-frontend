const STORAGE_KEY = "admin_locally_viewed_product_ids";

// Session-scoped hint of product ids this admin already viewed. The backend stays
// the source of truth; this only hides the NEW badge instantly until fresh table
// data arrives (e.g. when rows come back from the in-memory return-state cache).
export function readLocallyViewedProductIds(): Set<number> {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed.filter((item): item is number => typeof item === "number" && Number.isFinite(item) && item > 0));
  } catch {
    return new Set();
  }
}

export function rememberLocallyViewedProductIds(productIds: number[]): void {
  const normalized = productIds.filter((item) => Number.isFinite(item) && Number(item) > 0);
  if (normalized.length === 0) {
    return;
  }
  const merged = readLocallyViewedProductIds();
  for (const item of normalized) {
    merged.add(Number(item));
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...merged]));
  } catch {
    // Storage may be unavailable; the badge will just follow server data.
  }
}

export function forgetLocallyViewedProductIds(productIds: number[]): void {
  const normalized = new Set(productIds.filter((item) => Number.isFinite(item) && Number(item) > 0).map(Number));
  if (normalized.size === 0) {
    return;
  }
  const merged = readLocallyViewedProductIds();
  let changed = false;
  for (const item of normalized) {
    if (merged.delete(item)) {
      changed = true;
    }
  }
  if (!changed) {
    return;
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...merged]));
  } catch {
    // Storage may be unavailable; the badge will just follow server data.
  }
}
