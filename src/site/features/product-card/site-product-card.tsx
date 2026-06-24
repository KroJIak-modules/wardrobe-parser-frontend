import { Link, useLocation } from "react-router-dom";
import { saveSiteCatalogReturnSnapshot } from "../catalog/site-catalog-return";
import { buildDesignerCatalogHref } from "../catalog/site-catalog-query";
import { SiteImage, type SiteImageSkeletonVariant } from "../image/site-image";
import type { SiteProduct } from "../storefront/site-storefront-contracts";
import "./site-product-card.css";

function formatRubles(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function SiteProductCard({
  product,
  imageLoading = "lazy",
  imageSkeletonVariant = "wave",
  forceImageSkeleton = false,
}: {
  product: SiteProduct;
  imageLoading?: "lazy" | "eager";
  imageSkeletonVariant?: SiteImageSkeletonVariant;
  forceImageSkeleton?: boolean;
}) {
  const location = useLocation();
  const designerHref = product.designerId ? buildDesignerCatalogHref(product.designerId) : null;
  const productHref = `/show/${product.id}`;
  const productLinkState =
    location.pathname === "/catalog"
      ? {
          fromCatalog: {
            pathname: location.pathname,
            search: location.search,
          },
        }
      : undefined;

  const handleProductOpen = () => {
    if (location.pathname !== "/catalog") {
      return;
    }

    saveSiteCatalogReturnSnapshot({
      pathname: location.pathname,
      search: location.search,
      scrollY: window.scrollY,
    });
  };

  return (
    <article className="site-product-tile">
      <div className="site-product-tile__shell">
        <Link
          to={productHref}
          state={productLinkState}
          className="site-product-tile__media-link"
          aria-label={`${product.brand} ${product.name}`}
          onClick={handleProductOpen}
        >
          <div className="site-product-tile__media">
            <span className="site-product-tile__watermark" aria-hidden="true" />
            {product.imageSrc ? (
              <SiteImage
                src={product.imageSrc}
                alt={product.imageAlt}
                className="site-product-tile__image"
                fillContainer
                forceSkeletonVisible={forceImageSkeleton}
                loading={imageLoading}
                decoding={imageLoading === "eager" ? "sync" : "async"}
                fetchPriority={imageLoading === "eager" ? "high" : "auto"}
                skeletonVariant={imageSkeletonVariant}
              />
            ) : (
              <div className="site-product-tile__image site-product-tile__image--empty">Фото скоро появится</div>
            )}
          </div>
        </Link>
        <div className="site-product-tile__meta">
          {designerHref ? (
            <Link to={designerHref} className="site-product-tile__brand-link">
              {product.brand}
            </Link>
          ) : (
            <p className="site-product-tile__brand">{product.brand}</p>
          )}
          <Link to={productHref} state={productLinkState} className="site-product-tile__content-link" onClick={handleProductOpen}>
            <p className="site-product-tile__name">
              <span className="site-product-tile__name-text">{product.name.toUpperCase()}</span>
            </p>
            <p className="site-product-tile__statusline">
              <span className="site-product-tile__price">{formatRubles(product.priceRub)} ₽</span>
              <span className="site-product-tile__divider">-</span>
              <span className="site-product-tile__availability">{product.availability}</span>
            </p>
          </Link>
        </div>
      </div>
    </article>
  );
}
