import { useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { formatSiteRubles } from "../../app/site-format";
import { saveSiteCatalogReturnSnapshot } from "../catalog/site-catalog-return";
import { buildDesignerCatalogHref } from "../catalog/site-catalog-query";
import { SiteImage, type SiteImageSkeletonVariant } from "../image/site-image";
import type { SiteProduct } from "../storefront/site-storefront-contracts";
import "./site-product-card.css";

export function SiteProductCard({
  product,
  layout = "desktop",
  imageLoading = "lazy",
  imageSkeletonVariant = "pulse",
  forceImageSkeleton = false,
}: {
  product: SiteProduct;
  layout?: "desktop" | "mobile";
  imageLoading?: "lazy" | "eager";
  imageSkeletonVariant?: SiteImageSkeletonVariant;
  forceImageSkeleton?: boolean;
}) {
  const location = useLocation();
  const isCompact = layout === "mobile";
  const titleRef = useRef<HTMLSpanElement | null>(null);
  const [titleLineCount, setTitleLineCount] = useState<1 | 2>(1);
  const designerHref = product.designerId ? buildDesignerCatalogHref(product.designerId) : null;
  const productHref = `/show/${product.path ?? product.id}`;
  const isStorefrontRoute = location.pathname === "/" && new URLSearchParams(location.search).get("view") === "storefront";
  const productLinkState =
    location.pathname === "/catalog" || isStorefrontRoute
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

  useLayoutEffect(() => {
    const titleNode = titleRef.current;
    if (!titleNode) {
      return;
    }

    const updateTitleLineCount = () => {
      const computedStyle = window.getComputedStyle(titleNode);
      const parsedLineHeight = Number.parseFloat(computedStyle.lineHeight);
      const fallbackLineHeight = Number.parseFloat(computedStyle.fontSize) * 1.2;
      const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : fallbackLineHeight;
      const nextLineCount = titleNode.getBoundingClientRect().height > lineHeight * 1.5 ? 2 : 1;

      setTitleLineCount((currentLineCount) =>
        currentLineCount === nextLineCount ? currentLineCount : (nextLineCount as 1 | 2),
      );
    };

    updateTitleLineCount();

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateTitleLineCount);
    resizeObserver?.observe(titleNode);
    window.addEventListener("resize", updateTitleLineCount);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateTitleLineCount);
    };
  }, [isCompact, product.name]);

  return (
    <article
      className={`site-product-tile${isCompact ? " site-product-tile--compact" : ""}`}
      data-title-lines={titleLineCount}
    >
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
              <span ref={titleRef} className="site-product-tile__name-text">
                {product.name.toUpperCase()}
              </span>
            </p>
            <p className="site-product-tile__statusline">
              <span className="site-product-tile__price">{formatSiteRubles(product.priceRub)} ₽</span>
              <span className="site-product-tile__divider">-</span>
              <span className="site-product-tile__availability">{product.availability}</span>
            </p>
          </Link>
        </div>
      </div>
    </article>
  );
}
