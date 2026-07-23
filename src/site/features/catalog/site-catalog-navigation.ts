const SITE_CATALOG_FILTER_NAVIGATION_KEY = "siteCatalogFilterNavigation";

type SiteCatalogFilterNavigation = {
  [SITE_CATALOG_FILTER_NAVIGATION_KEY]: true;
};

function isCatalogPathname(pathname: string) {
  return pathname === "/catalog" || pathname === "/sale";
}

function mergeCatalogNavigationState(state: unknown): SiteCatalogFilterNavigation | (Record<string, unknown> & SiteCatalogFilterNavigation) {
  if (state && typeof state === "object" && !Array.isArray(state)) {
    return {
      ...(state as Record<string, unknown>),
      [SITE_CATALOG_FILTER_NAVIGATION_KEY]: true,
    };
  }

  return { [SITE_CATALOG_FILTER_NAVIGATION_KEY]: true };
}

export function prepareSiteCatalogFilterNavigation(to: string, state?: unknown) {
  if (!to.startsWith("/")) {
    return { to, state };
  }

  const url = new URL(to, window.location.origin);
  if (!isCatalogPathname(url.pathname)) {
    return { to, state };
  }

  url.searchParams.delete("page");
  return {
    to: url.pathname + url.search + url.hash,
    state: mergeCatalogNavigationState(state),
  };
}

export function isSiteCatalogFilterNavigation(state: unknown): boolean {
  return Boolean(
    state
    && typeof state === "object"
    && !Array.isArray(state)
    && (state as Record<string, unknown>)[SITE_CATALOG_FILTER_NAVIGATION_KEY] === true,
  );
}
