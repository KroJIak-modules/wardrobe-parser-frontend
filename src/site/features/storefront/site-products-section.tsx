import { Link } from "react-router-dom";
import type { SiteImageSkeletonVariant } from "../image/site-image";
import { SiteProductCard, SiteProductCardSkeleton } from "../product-card/site-product-card";
import type { SiteProduct } from "./site-storefront-contracts";

const SITE_PRODUCTS_SKELETON_COUNT = 8;

function getSkeletonTitleLineCount(index: number): 1 | 2 {
  return index % 4 === 1 ? 2 : 1;
}

type SiteProductsSectionProps = {
  title: string;
  products: SiteProduct[];
  layout?: "desktop" | "mobile";
  ctaLabel?: string;
  ctaTo?: string;
  emptyMessage?: string;
  loading?: boolean;
  errorMessage?: string | null;
  debugSkeletonVariants?: readonly SiteImageSkeletonVariant[];
  skeletonCount?: number;
};

type SiteProductsGridProps = {
  products: SiteProduct[];
  layout?: "desktop" | "mobile";
  emptyMessage?: string;
  loading?: boolean;
  errorMessage?: string | null;
  debugSkeletonVariants?: readonly SiteImageSkeletonVariant[];
  skeletonCount?: number;
};

export function SiteProductsGrid({
  products,
  layout = "desktop",
  emptyMessage = "Ничего не найдено",
  loading = false,
  errorMessage = null,
  debugSkeletonVariants = [],
  skeletonCount = SITE_PRODUCTS_SKELETON_COUNT,
}: SiteProductsGridProps) {
  if (loading) {
    return (
      <div className={`site-products__grid${layout === "mobile" ? " site-products__grid--mobile" : ""}`}>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <SiteProductCardSkeleton
            key={`site-product-skeleton-${layout}-${index}`}
            layout={layout}
            titleLines={getSkeletonTitleLineCount(index)}
          />
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return <div className="site-products__status site-products__status--error">{errorMessage}</div>;
  }

  if (products.length === 0) {
    return <div className="site-products__empty">{emptyMessage}</div>;
  }

  return (
    <div className={`site-products__grid${layout === "mobile" ? " site-products__grid--mobile" : ""}`}>
      {products.map((product, index) => (
        <SiteProductCard
          key={product.id}
          product={product}
          layout={layout}
          forceImageSkeleton={index < debugSkeletonVariants.length}
          imageSkeletonVariant={debugSkeletonVariants[index] ?? "pulse"}
        />
      ))}
    </div>
  );
}

export function SiteProductsSection({
  title,
  products,
  layout = "desktop",
  ctaLabel,
  ctaTo,
  emptyMessage = "Ничего не найдено",
  loading = false,
  errorMessage = null,
  debugSkeletonVariants = [],
  skeletonCount = SITE_PRODUCTS_SKELETON_COUNT,
}: SiteProductsSectionProps) {
  return (
    <section className={`site-products${layout === "mobile" ? " site-products--mobile" : ""}`} aria-labelledby="site-products-title">
      <div className="site-products__header">
        <h2 id="site-products-title" className="site-products__title">
          {title}
        </h2>
        {ctaLabel && ctaTo ? (
          <Link to={ctaTo} className="site-products__cta">
            {ctaLabel}
          </Link>
        ) : null}
      </div>
      <SiteProductsGrid
        products={products}
        layout={layout}
        emptyMessage={emptyMessage}
        loading={loading}
        errorMessage={errorMessage}
        debugSkeletonVariants={debugSkeletonVariants}
        skeletonCount={skeletonCount}
      />
    </section>
  );
}
