type SiteCatalogReturnSnapshot = {
  pathname: string;
  search: string;
  locationKey: string;
  scrollY: number;
};

const SITE_CATALOG_RETURN_STORAGE_KEY = "site-catalog-return-snapshot-v1";

export function saveSiteCatalogReturnSnapshot(snapshot: SiteCatalogReturnSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(SITE_CATALOG_RETURN_STORAGE_KEY, JSON.stringify(snapshot));
}

export function readSiteCatalogReturnSnapshot(): SiteCatalogReturnSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(SITE_CATALOG_RETURN_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<SiteCatalogReturnSnapshot>;
    if (
      typeof parsed.pathname !== "string" ||
      typeof parsed.search !== "string" ||
      typeof parsed.locationKey !== "string" ||
      typeof parsed.scrollY !== "number" ||
      !Number.isFinite(parsed.scrollY)
    ) {
      return null;
    }

    return {
      pathname: parsed.pathname,
      search: parsed.search,
      locationKey: parsed.locationKey,
      scrollY: parsed.scrollY,
    };
  } catch {
    return null;
  }
}

export function clearSiteCatalogReturnSnapshot() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(SITE_CATALOG_RETURN_STORAGE_KEY);
}
