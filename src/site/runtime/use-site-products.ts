import { useMemo } from "react";
import { filterSiteMockProducts, siteMockProducts } from "./site-storefront-mock";

export function useSiteProducts(query: string, options?: { limit?: number }) {
  const limit = options?.limit ?? 48;

  const filteredProducts = useMemo(() => filterSiteMockProducts(siteMockProducts, query), [query]);

  const products = useMemo(() => filteredProducts.slice(0, limit), [filteredProducts, limit]);

  return {
    products,
    total: filteredProducts.length,
    loading: false,
    error: null,
  };
}
