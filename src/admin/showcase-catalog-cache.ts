import type { CatalogExperienceResponse, ShowcaseCatalogProductsResponse } from "./showcase-contracts";

type Entry = {
  experience?: CatalogExperienceResponse;
  products?: ShowcaseCatalogProductsResponse;
};

const entries = new Map<string, Entry>();
const MAX_ENTRIES = 20;

export function readShowcaseCatalogCache(key: string): Entry | undefined {
  return entries.get(key);
}

export function clearShowcaseCatalogCache(): void {
  entries.clear();
}

export function updateShowcaseCatalogCache(key: string, patch: Entry): void {
  const entry = { ...entries.get(key), ...patch };
  entries.delete(key);
  entries.set(key, entry);
  if (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next().value;
    if (oldest) entries.delete(oldest);
  }
}
