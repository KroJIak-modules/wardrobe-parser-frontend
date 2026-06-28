import { useMemo } from "react";
import { SiteProductCard } from "../product-card/site-product-card";
import type { SiteCatalogProduct } from "./site-catalog-contracts";
import { normalizeCatalogProductsForGrid } from "./site-catalog-logic";

export function SiteCatalogProductsGrid({ products }: { products: readonly SiteCatalogProduct[] }) {
  const normalizedProducts = useMemo(() => normalizeCatalogProductsForGrid(products), [products]);

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
