import { useMemo } from "react";
import { SiteProductCard } from "../product-card/site-product-card";
import type { SiteCatalogProduct } from "./site-catalog-contracts";
import { normalizeCatalogProductsForGrid } from "./site-catalog-logic";

export function SiteCatalogProductsGrid({
  products,
  loading = false,
  errorMessage = null,
}: {
  products: readonly SiteCatalogProduct[];
  loading?: boolean;
  errorMessage?: string | null;
}) {
  const normalizedProducts = useMemo(() => normalizeCatalogProductsForGrid(products), [products]);

  if (loading) {
    return <div className="site-catalog-products__empty">Загрузка товаров...</div>;
  }

  if (errorMessage) {
    return <div className="site-catalog-products__empty">{errorMessage}</div>;
  }

  if (normalizedProducts.length === 0) {
    return <div className="site-catalog-products__empty">Ничего не найдено</div>;
  }

  return (
    <div className="site-catalog-products__grid">
      {normalizedProducts.map((product) => (
        <SiteProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
