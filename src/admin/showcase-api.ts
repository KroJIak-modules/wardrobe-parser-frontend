import { API_BASE } from "../shared/admin-auth";
import { apiJson } from "../shared/api-client";
import type {
  CatalogExperienceResponse,
  CatalogViewKey,
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

export async function fetchShowcaseDesignersDirectory(): Promise<ShowcaseDesignersDirectoryResponse> {
  return apiJson<ShowcaseDesignersDirectoryResponse>(`${API_BASE}/admin/showcase/designers-directory`);
}
