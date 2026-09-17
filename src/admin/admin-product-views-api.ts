import { API_BASE, authFetch } from "../shared/admin-auth";
import { buildProductsApiQuery, type ProductsQueryState } from "./products-query";

export async function markAdminProductViewed(productId: number): Promise<boolean> {
  const normalizedProductId = Number(productId);
  if (!Number.isFinite(normalizedProductId) || normalizedProductId <= 0) {
    return false;
  }
  const response = await authFetch(`${API_BASE}/admin/products/${normalizedProductId}/view`, {
    method: "POST",
  });
  return response.ok;
}

export async function markAllAdminProductsViewed(query: ProductsQueryState): Promise<number> {
  const params = buildProductsApiQuery(query, { includeLimit: false });
  const response = await authFetch(`${API_BASE}/admin/products/mark-all-viewed?${params.toString()}`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Mark all viewed API error: ${response.status}`);
  }
  const payload = (await response.json()) as { marked?: number };
  return typeof payload.marked === "number" ? payload.marked : 0;
}
