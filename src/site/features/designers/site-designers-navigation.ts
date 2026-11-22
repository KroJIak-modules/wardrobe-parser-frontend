import { patchCatalogSearchParams, readCatalogListParam } from "../catalog/site-catalog-query";

export type SiteDesignersEntryMode = "browse" | "catalog-filter";

export type SiteDesignersLocationState = {
  designersEntryMode?: SiteDesignersEntryMode;
};

export function createSiteDesignersLocationState(mode: SiteDesignersEntryMode): SiteDesignersLocationState {
  return { designersEntryMode: mode };
}

export function resolveSiteDesignersEntryMode(
  locationState: unknown,
  searchParams: URLSearchParams,
): SiteDesignersEntryMode {
  if (locationState && typeof locationState === "object" && "designersEntryMode" in locationState) {
    const rawMode = (locationState as SiteDesignersLocationState).designersEntryMode;
    if (rawMode === "browse" || rawMode === "catalog-filter") {
      return rawMode;
    }
  }

  return searchParams.toString() === "" ? "browse" : "catalog-filter";
}

// Параметры каталога, которые имеет смысл сохранить при переходе на страницу
// дизайнеров: без них выбор из каталога теряется и подчёркивание пропадает.
const SITE_DESIGNERS_CARRYED_CATALOG_PARAMS = [
  "designer",
  "section",
  "gender",
  "collection",
  "availability",
  "sort",
  "q",
] as const;

/**
 * Переход на страницу дизайнеров из меню не должен терять текущий выбор.
 * Если в каталоге выбран хотя бы один дизайнер, переносим выбор (и остальные
 * фильтры) в адрес страницы дизайнеров и включаем режим «Применить/Очистить».
 */
export function prepareSiteDesignersDirectoryNavigation(
  to: string,
  state: unknown,
  currentSearch: string,
): { to: string; state: unknown } {
  if (!to.startsWith("/")) {
    return { to, state };
  }

  const url = new URL(to, window.location.origin);
  if (url.pathname !== "/designers") {
    return { to, state };
  }

  const current = new URLSearchParams(currentSearch);
  const carried = new URLSearchParams();
  SITE_DESIGNERS_CARRYED_CATALOG_PARAMS.forEach((key) => {
    const value = current.get(key);
    if (value !== null && value.trim() !== "") {
      carried.set(key, value);
    }
  });

  if (readCatalogListParam(carried, "designer").length === 0) {
    return { to, state };
  }

  url.search = carried.toString();
  return {
    to: `${url.pathname}${url.search}${url.hash}`,
    state: createSiteDesignersLocationState("catalog-filter"),
  };
}

export function buildBrowseDesignerCatalogSearchParams(
  currentSearchParams: URLSearchParams,
  designerId: string,
): URLSearchParams {
  return patchCatalogSearchParams(new URLSearchParams(currentSearchParams), {
    collection: null,
    multi: null,
    availability: null,
    section: null,
    designer: [designerId],
    sort: null,
    q: null,
    page: null,
  });
}
