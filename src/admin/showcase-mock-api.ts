import type {
  CatalogExperienceResponse,
  CatalogViewKey,
  ShowcaseDesignersDirectoryResponse,
  ShowcaseNavigationResponse,
} from "./showcase-contracts";
import { buildCatalogExperienceSeed, buildShowcaseDesignersDirectorySeed, buildShowcaseNavigationSeed } from "./showcase-taxonomy-mock";

const MOCK_LATENCY_MS = 140;

function simulateResponse<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(value);
    }, MOCK_LATENCY_MS);
  });
}

export async function fetchShowcaseNavigation(): Promise<ShowcaseNavigationResponse> {
  return simulateResponse(buildShowcaseNavigationSeed());
}

export async function fetchCatalogExperience({
  viewKey,
  searchParams = new URLSearchParams(),
}: {
  viewKey: CatalogViewKey;
  searchParams?: URLSearchParams;
}): Promise<CatalogExperienceResponse> {
  return simulateResponse(buildCatalogExperienceSeed(viewKey, searchParams));
}

export async function fetchShowcaseDesignersDirectory(): Promise<ShowcaseDesignersDirectoryResponse> {
  return simulateResponse(buildShowcaseDesignersDirectorySeed());
}

export function readShowcaseNavigationSeed(): ShowcaseNavigationResponse {
  return buildShowcaseNavigationSeed();
}

export function readCatalogExperienceSeed({
  viewKey,
  searchParams = new URLSearchParams(),
}: {
  viewKey: CatalogViewKey;
  searchParams?: URLSearchParams;
}): CatalogExperienceResponse {
  return buildCatalogExperienceSeed(viewKey, searchParams);
}

export function readShowcaseDesignersDirectorySeed(): ShowcaseDesignersDirectoryResponse {
  return buildShowcaseDesignersDirectorySeed();
}
