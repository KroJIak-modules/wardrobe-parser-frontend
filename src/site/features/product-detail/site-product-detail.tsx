import { Link } from "react-router-dom";
import type { SiteProductDetailItem } from "../../runtime/site-product-detail";
import type { SiteProduct } from "../storefront/site-storefront-contracts";
import { SiteProductCardSkeleton, SiteProductCard } from "../product-card/site-product-card";
import { SiteImage } from "../image/site-image";
import { SiteProductHero } from "./site-product-hero";
import "./site-product-detail.css";

const SITE_PRODUCT_RECOMMENDATIONS_SKELETON_COUNT = 8;
const SITE_PRODUCT_DESCRIPTION_SKELETON_LINES = [
  100,
  85,
  94,
  78,
  98,
  62,
  88,
  73,
] as const;

function getSkeletonTitleLineCount(index: number): 1 | 2 {
  return index % 4 === 1 ? 2 : 1;
}

export function SiteProductDetailView({
  product,
  recommendations,
  returnTarget,
  layout = "desktop",
  isLoading = false,
  isRecommendationsLoading = false,
}: {
  product: SiteProductDetailItem | null;
  recommendations: readonly SiteProduct[];
  returnTarget: { pathname: string; search: string } | null;
  layout?: "desktop" | "mobile";
  isLoading?: boolean;
  isRecommendationsLoading?: boolean;
}) {
  const isMobileLayout = layout === "mobile";
  const shouldShowRecommendations = recommendations.length > 0;
  const shouldShowRecommendationSkeleton = isRecommendationsLoading;

  if (isLoading) {
    return <SiteProductDetailSkeleton layout={isMobileLayout ? "mobile" : "desktop"} />;
  }

  if (!product) {
    return (
      <section className="site-product-detail site-product-detail--empty">
        <p className="site-product-detail__empty-title">ТОВАР НЕ НАЙДЕН</p>
        <Link to={returnTarget ?? "/catalog"} className="site-product-detail__empty-link">
          Вернуться в каталог
        </Link>
      </section>
    );
  }

  return (
    <section className={`site-product-detail${isMobileLayout ? " site-product-detail--mobile" : ""}`}>
      <SiteProductHero product={product} />

      {shouldShowRecommendations || shouldShowRecommendationSkeleton ? (
        <section className="site-product-detail__recommendations" aria-labelledby="site-product-detail-recommendations-title">
          <h2 id="site-product-detail-recommendations-title" className="site-product-detail__recommendations-title">
            РЕКОМЕНДУЮ
          </h2>
          <div className="site-product-detail__recommendations-grid">
            {shouldShowRecommendationSkeleton
              ? Array.from({ length: SITE_PRODUCT_RECOMMENDATIONS_SKELETON_COUNT }, (_, index) => (
                  <SiteProductCardSkeleton
                    key={`site-product-recommendation-skeleton-${index}`}
                    layout={isMobileLayout ? "mobile" : "desktop"}
                    titleLines={getSkeletonTitleLineCount(index)}
                  />
                ))
              : recommendations.map((item) => (
                  <SiteProductCard key={item.id} product={item} layout={isMobileLayout ? "mobile" : "desktop"} imageLoading="eager" />
                ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function SiteProductDetailSkeleton({ layout = "desktop" }: { layout?: "desktop" | "mobile" }) {
  const isMobileLayout = layout === "mobile";

  return (
    <section className={`site-product-detail${isMobileLayout ? " site-product-detail--mobile" : ""} site-product-detail--skeleton`} aria-hidden="true">
      <div className="site-product-detail__hero">
        <div className="site-product-detail__thumbs">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={`thumb-skeleton-${index}`} className="site-product-detail__thumb site-product-detail__thumb--skeleton">
              <SiteImage
                alt=""
                className="site-product-detail__thumb-image"
                fillContainer
                forceSkeletonVisible
                skeletonVariant="pulse"
              />
            </div>
          ))}
        </div>

        <div className="site-product-detail__main-image-shell">
          <div className="site-product-detail__main-image-viewport">
            <div className="site-product-detail__main-image-slide site-product-detail__main-image-slide--skeleton">
              <SiteImage
                alt=""
                className="site-product-detail__main-image"
                fillContainer
                forceSkeletonVisible
                skeletonVariant="pulse"
              />
            </div>
          </div>
        </div>

        <div className="site-product-detail__summary">
          <div className="site-product-detail__summary-head">
            <div className="site-product-detail__title-block">
              <span className="site-product-detail__brand site-product-detail__brand--skeleton" />
              <span className="site-product-detail__name site-product-detail__name--skeleton" />
            </div>
            <div className="site-product-detail__price-line site-product-detail__price-line--skeleton">
              <span className="site-product-detail__price site-product-detail__price--skeleton" />
              <span className="site-product-detail__price-divider">-</span>
              <span className="site-product-detail__availability site-product-detail__availability--skeleton" />
            </div>
          </div>

          <div className="site-product-detail__size-select site-product-detail__size-select--skeleton">
            <div className="site-product-detail__size-trigger site-product-detail__size-trigger--skeleton" />
          </div>

          <div className="site-product-detail__add-to-cart site-product-detail__add-to-cart--skeleton" />

          <div className="site-product-detail__description-block site-product-detail__description-block--skeleton">
            <div className="site-product-detail__description">
              <div className="site-product-detail__description-skeleton-lines">
                {SITE_PRODUCT_DESCRIPTION_SKELETON_LINES.map((width, index) => (
                  <span
                    key={`description-skeleton-${index}`}
                    className="site-product-detail__description-line site-product-detail__description-line--skeleton"
                    style={{ width: `${width}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="site-product-detail__source-button site-product-detail__source-button--skeleton" />
        </div>
      </div>
    </section>
  );
}
