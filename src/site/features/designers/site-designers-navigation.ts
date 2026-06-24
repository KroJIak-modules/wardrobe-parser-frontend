import { patchCatalogSearchParams } from "../catalog/site-catalog-query";

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

export function buildBrowseDesignerCatalogSearchParams(designerId: string): URLSearchParams {
  return patchCatalogSearchParams(new URLSearchParams(), {
    collection: null,
    multi: null,
    availability: null,
    section: null,
    designer: [designerId],
    gender: null,
    sort: null,
    q: null,
    page: null,
  });
}
