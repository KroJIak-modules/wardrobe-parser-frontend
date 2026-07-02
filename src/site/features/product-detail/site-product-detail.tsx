import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { SiteProductDetailItem } from "../../runtime/site-product-detail";
import type { SiteProduct } from "../storefront/site-storefront-contracts";
import { SiteProductCard } from "../product-card/site-product-card";
import { SiteProductHero } from "./site-product-hero";
import "./site-product-detail.css";

export function SiteProductDetailView({
  product,
  recommendations,
  returnTarget,
  layout = "desktop",
  isLoading = false,
}: {
  product: SiteProductDetailItem | null;
  recommendations: readonly SiteProduct[];
  returnTarget: { pathname: string; search: string } | null;
  layout?: "desktop" | "mobile";
  isLoading?: boolean;
}) {
  const recommendationCards = useMemo(() => recommendations.slice(0, 8), [recommendations]);
  const isMobileLayout = layout === "mobile";

  if (isLoading) {
    return (
      <section className="site-product-detail site-product-detail--empty">
        <p className="site-product-detail__empty-title">ЗАГРУЗКА...</p>
      </section>
    );
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

      <section className="site-product-detail__recommendations" aria-labelledby="site-product-detail-recommendations-title">
        <h2 id="site-product-detail-recommendations-title" className="site-product-detail__recommendations-title">
          РЕКОМЕНДУЮ
        </h2>
        <div className="site-product-detail__recommendations-grid">
          {recommendationCards.map((item) => (
            <SiteProductCard key={item.id} product={item} layout={isMobileLayout ? "mobile" : "desktop"} imageLoading="eager" />
          ))}
        </div>
      </section>
    </section>
  );
}
