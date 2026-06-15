import type { AdminFiltersCategoriesPayload } from "./admin-filters-categories-types";
import { readAdminFiltersCategoriesSeed, saveAdminFiltersCategoriesSeed } from "./showcase-taxonomy-mock";

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function fetchAdminFiltersCategoriesMock(): Promise<AdminFiltersCategoriesPayload> {
  await delay(250);
  return readAdminFiltersCategoriesSeed();
}

export async function saveAdminFiltersCategoriesMock(payload: AdminFiltersCategoriesPayload): Promise<AdminFiltersCategoriesPayload> {
  await delay(80);
  return saveAdminFiltersCategoriesSeed(payload);
}
