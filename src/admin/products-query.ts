export const PRODUCTS_QUERY_KEYS = {
  search: "q",
  sourceId: "source_id",
  vendor: "vendor",
  productType: "product_type",
  status: "status",
} as const;

export type ProductsQueryState = {
  search: string;
  sourceId: string;
  vendor: string;
  productType: string;
  status: string;
};

export function readProductsQuery(searchParams: URLSearchParams): ProductsQueryState {
  return {
    search: searchParams.get(PRODUCTS_QUERY_KEYS.search) || "",
    sourceId: searchParams.get(PRODUCTS_QUERY_KEYS.sourceId) || "",
    vendor: searchParams.get(PRODUCTS_QUERY_KEYS.vendor) || "",
    productType: searchParams.get(PRODUCTS_QUERY_KEYS.productType) || "",
    status: searchParams.get(PRODUCTS_QUERY_KEYS.status) || "",
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
    query.set("search", state.search.trim());
  }
  if (state.sourceId) {
    query.set("source_id", state.sourceId);
  }
  if (state.vendor) {
    query.set("vendor", state.vendor);
  }
  if (state.productType) {
    query.set("product_type", state.productType);
  }
  if (state.status) {
    query.set("status", state.status);
  }
  if (options?.cursor) {
    query.set("cursor", options.cursor);
  }
  return query;
}
