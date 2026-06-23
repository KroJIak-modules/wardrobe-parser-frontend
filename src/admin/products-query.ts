export const PRODUCTS_QUERY_KEYS = {
  search: "q",
  sourceId: "source_id",
  sourceMode: "source_mode",
  designer: "designer_id",
  filterSlug: "filter_slug",
  customCatalogSlug: "custom_catalog_slug",
  gender: "gender",
  visibilityStatus: "visibility_status",
  availabilityMode: "availability_mode",
  orderabilityStatus: "orderability_status",
} as const;

export type ProductsQueryState = {
  search: string;
  sourceId: string;
  sourceMode: string;
  designer: string;
  filterSlug: string;
  customCatalogSlug: string;
  gender: string;
  visibilityStatus: string;
  availabilityMode: string;
  orderabilityStatus: string;
};

export function readProductsQuery(searchParams: URLSearchParams): ProductsQueryState {
  return {
    search: searchParams.get(PRODUCTS_QUERY_KEYS.search) || "",
    sourceId: searchParams.get(PRODUCTS_QUERY_KEYS.sourceId) || "",
    sourceMode: searchParams.get(PRODUCTS_QUERY_KEYS.sourceMode) || "",
    designer: searchParams.get(PRODUCTS_QUERY_KEYS.designer) || "",
    filterSlug: searchParams.get(PRODUCTS_QUERY_KEYS.filterSlug) || "",
    customCatalogSlug: searchParams.get(PRODUCTS_QUERY_KEYS.customCatalogSlug) || "",
    gender: searchParams.get(PRODUCTS_QUERY_KEYS.gender) || "",
    visibilityStatus: searchParams.get(PRODUCTS_QUERY_KEYS.visibilityStatus) || "",
    availabilityMode: searchParams.get(PRODUCTS_QUERY_KEYS.availabilityMode) || "",
    orderabilityStatus: searchParams.get(PRODUCTS_QUERY_KEYS.orderabilityStatus) || "",
  };
}

export function withProductsQueryParam(previous: URLSearchParams, key: string, value: string): URLSearchParams {
  const next = new URLSearchParams(previous);
  const normalized = value.trim();
  if (!normalized) {
    next.delete(key);
  } else {
    next.set(key, normalized);
  }
  return next;
}

export function buildProductsApiQuery(
  state: ProductsQueryState,
  options?: { includeLimit?: boolean; limit?: number; cursor?: string | null }
): URLSearchParams {
  const query = new URLSearchParams();
  if (options?.includeLimit ?? true) {
    query.set("limit", String(options?.limit ?? 100));
  }
  if (state.search.trim()) {
    query.set("q", state.search.trim());
  }
  if (state.sourceId) {
    query.set("source_id", state.sourceId);
  }
  if (state.sourceMode) {
    query.set("source_mode", state.sourceMode);
  }
  if (state.designer) {
    query.set("designer_id", state.designer);
  }
  if (state.filterSlug) {
    query.set("filter_slug", state.filterSlug);
  }
  if (state.customCatalogSlug) {
    query.set("custom_catalog_slug", state.customCatalogSlug);
  }
  if (state.gender) {
    query.set("gender", state.gender);
  }
  if (state.visibilityStatus) {
    query.set("visibility_status", state.visibilityStatus);
  }
  if (state.availabilityMode) {
    query.set("availability_mode", state.availabilityMode);
  }
  if (state.orderabilityStatus) {
    query.set("orderability_status", state.orderabilityStatus);
  }
  if (options?.cursor) {
    query.set("cursor", options.cursor);
  }
  return query;
}
