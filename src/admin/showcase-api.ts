import { API_BASE } from "../shared/admin-auth";
import { apiJson } from "../shared/api-client";
import type {
  CatalogExperienceResponse,
  CatalogViewKey,
  ShowcaseCatalogProductsResponse,
  ShowcaseDesignersDirectoryResponse,
  ShowcaseNavigationResponse,
} from "./showcase-contracts";

export async function fetchShowcaseNavigation(): Promise<ShowcaseNavigationResponse> {
  return apiJson<ShowcaseNavigationResponse>(`${API_BASE}/admin/showcase/navigation`);
}

export async function fetchCatalogExperience({
  viewKey,
  searchParams = new URLSearchParams(),
}: {
  viewKey: CatalogViewKey;
  searchParams?: URLSearchParams;
}): Promise<CatalogExperienceResponse> {
  const query = new URLSearchParams(searchParams);
  query.set("view_key", viewKey);
  return apiJson<CatalogExperienceResponse>(`${API_BASE}/admin/showcase/catalog-experience?${query.toString()}`);
}

function normalizeProductsQuery(searchParams: URLSearchParams, viewKey: CatalogViewKey): URLSearchParams {
  const query = new URLSearchParams(searchParams);
  query.delete("page");
  query.delete("top");
  query.delete("ctx");
  query.delete("ctx_ref");

  // Menu links use public-style values; products API accepts both.
  const availability = String(query.get("availability") || "").trim().toLowerCase();
  if (availability === "in-stock") {
    query.set("availability", "in_stock");
  } else if (availability === "preorder") {
    query.set("availability", "by_order");
  }

  const sort = String(query.get("sort") || "").trim().toLowerCase();
  if (sort === "price-asc") {
    query.set("sort", "price_asc");
  } else if (sort === "price-desc") {
    query.set("sort", "price_desc");
  } else if (sort === "featured") {
    query.delete("sort");
  }

  if (viewKey === "sale") {
    query.set("discounted_only", "true");
  } else {
    query.delete("discounted_only");
  }

  return query;
}

export async function fetchCatalogProducts({
  searchParams = new URLSearchParams(),
  viewKey = "default",
  page = 1,
  pageSize = 48,
}: {
  searchParams?: URLSearchParams;
  viewKey?: CatalogViewKey;
  page?: number;
  pageSize?: number;
}): Promise<ShowcaseCatalogProductsResponse> {
  const query = normalizeProductsQuery(searchParams, viewKey);
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));
  query.set("limit", String(safePageSize));
  query.set("offset", String((safePage - 1) * safePageSize));
  return apiJson<ShowcaseCatalogProductsResponse>(`${API_BASE}/admin/showcase/catalog-products?${query.toString()}`);
}

export type ShowcaseProductSource = {
  label: string;
  url: string;
};

export type ShowcaseCustomCatalogMembership = {
  slug: string;
  label: string;
  is_assigned: boolean;
};

export async function fetchShowcaseProductCustomCatalogs(productId: number): Promise<ShowcaseCustomCatalogMembership[]> {
  const payload = await apiJson<{ items?: ShowcaseCustomCatalogMembership[] }>(
    `${API_BASE}/admin/showcase/products/${productId}/custom-catalogs`,
  );
  return Array.isArray(payload.items) ? payload.items : [];
}

export function setShowcaseProductCustomCatalogMembership(
  productId: number,
  catalogSlug: string,
  isAssigned: boolean,
): Promise<{ slug: string; is_assigned: boolean }> {
  return apiJson(`${API_BASE}/admin/showcase/products/${productId}/custom-catalogs/${encodeURIComponent(catalogSlug)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_assigned: isAssigned }),
  });
}

export async function fetchShowcaseProductSources(productId: number): Promise<ShowcaseProductSource[]> {
  const payload = await apiJson<{ listings?: Array<{ source_name?: string | null; url?: string | null }> }>(
    `${API_BASE}/admin/products/${productId}`,
  );
  const seen = new Set<string>();
  return (payload.listings || []).flatMap((listing) => {
    const url = String(listing.url || "").trim();
    if (!url || seen.has(url)) {
      return [];
    }
    seen.add(url);
    return [{ label: String(listing.source_name || url).trim() || url, url }];
  });
}

export async function fetchShowcaseDesignersDirectory(): Promise<ShowcaseDesignersDirectoryResponse> {
  return apiJson<ShowcaseDesignersDirectoryResponse>(`${API_BASE}/admin/showcase/designers-directory`);
}
