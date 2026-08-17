import type { AdminProductsTableItem } from "./admin-types";

export type AdminProductsTableCacheEntry = {
  items: AdminProductsTableItem[];
  total: number;
  overallTotal: number;
  offset: number;
  hasMore: boolean;
};

const entries = new Map<string, AdminProductsTableCacheEntry>();

export function readAdminProductsTableCache(href: string): AdminProductsTableCacheEntry | null {
  return entries.get(href) ?? null;
}

export function saveAdminProductsTableCache(href: string, entry: AdminProductsTableCacheEntry): void {
  entries.set(href, entry);
}
