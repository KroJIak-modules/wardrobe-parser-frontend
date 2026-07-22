import { useMemo } from "react";
import { SiteProductCard, SiteProductCardSkeleton } from "../product-card/site-product-card";
import type { SiteCatalogProduct } from "./site-catalog-contracts";
import { normalizeCatalogProductsForGrid } from "./site-catalog-logic";

const SITE_CATALOG_SKELETON_COUNT = 8;

function getSkeletonTitleLineCount(index: number): 1 | 2 {
  return index % 4 === 1 ? 2 : 1;
}

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
    return (
      <div className="site-catalog-products__grid">
        {Array.from({ length: SITE_CATALOG_SKELETON_COUNT }, (_, index) => (
          <SiteProductCardSkeleton key={`site-catalog-skeleton-${index}`} titleLines={getSkeletonTitleLineCount(index)} />
        ))}
      </div>
    );
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
