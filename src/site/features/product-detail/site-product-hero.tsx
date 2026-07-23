import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { formatSiteRubles } from "../../app/site-format";
import type { SiteProductDetailItem } from "../../runtime/site-product-detail";
import {
  buildSiteCartItemFromProduct,
  resolveSiteProductDetailSourceUrl,
} from "../../runtime/site-product-detail";
import { useSiteCart } from "../../runtime/use-site-cart";
import { buildDesignerCatalogHref } from "../catalog/site-catalog-query";
import { SiteImage } from "../image/site-image";
import { SiteProductDescription } from "./site-product-description";
import { SiteProductSourcesDialog } from "./site-product-sources-dialog";
import { SiteSizeSelector } from "./site-size-selector";
import { useSiteProductHeroState } from "./use-site-product-hero-state";

export function SiteProductHero({
  product,
}: {
  product: SiteProductDetailItem;
}) {
  const { addItem } = useSiteCart();
  const designerHref = product.designerId ? buildDesignerCatalogHref(product.designerId) : null;
  const thumbButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const collapsedSummaryHeightRef = useRef<number | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [summaryExpansionHeightPx, setSummaryExpansionHeightPx] = useState(0);
  const {
    dragOffsetPx,
    hasMultipleSourceVariants,
    isDraggingGallery,
    isSourcesDialogOpen,
    mainImageViewportRef,
    selectedGalleryIndex,
    selectedGalleryItem,
    selectedSize,
    selectedSourceId,
    closeSourcesDialog,
    openSourcesDialog,
    setSelectedGalleryItemId,
    setSelectedSize,
    setSelectedSourceId,
  } = useSiteProductHeroState(product);

  useEffect(() => {
    if (!selectedGalleryItem) {
      return;
    }

    const button = thumbButtonRefs.current.get(selectedGalleryItem.id);
    if (!button) {
      return;
    }

    button.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [selectedGalleryItem]);

  useEffect(() => {
    setIsDescriptionExpanded(false);
    setSummaryExpansionHeightPx(0);
    collapsedSummaryHeightRef.current = null;
  }, [product.id]);

  useLayoutEffect(() => {
    const summary = summaryRef.current;
    if (!summary) {
      return undefined;
    }

    const updateExpansionHeight = () => {
      const height = summary.getBoundingClientRect().height;
      if (!isDescriptionExpanded) {
        collapsedSummaryHeightRef.current = height;
        setSummaryExpansionHeightPx((current) => (current === 0 ? current : 0));
        return;
      }

      const collapsedHeight = collapsedSummaryHeightRef.current;
      if (collapsedHeight === null) {
        return;
      }
      const expansionHeight = Math.max(0, height - collapsedHeight);
      setSummaryExpansionHeightPx((current) => (Math.abs(current - expansionHeight) < 0.5 ? current : expansionHeight));
    };

    updateExpansionHeight();
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateExpansionHeight);
    resizeObserver?.observe(summary);
    return () => resizeObserver?.disconnect();
  }, [isDescriptionExpanded]);

  return (
    <section
      className="site-product-detail__hero"
      style={{ "--site-product-detail-summary-expansion-height": `${summaryExpansionHeightPx}px` } as CSSProperties}
    >
      <div className="site-product-detail__thumbs" aria-label="Миниатюры товара">
        {product.gallery.map((item, index) => {
          const isActive = item.id === selectedGalleryItem?.id;
          return (
            <button
              key={item.id}
              type="button"
              className={isActive ? "site-product-detail__thumb site-product-detail__thumb--active" : "site-product-detail__thumb"}
              ref={(node) => {
                if (node) {
                  thumbButtonRefs.current.set(item.id, node);
                  return;
                }
                thumbButtonRefs.current.delete(item.id);
              }}
              onClick={() => {
                setSelectedGalleryItemId(item.id);
              }}
              aria-label={`Фотография ${index + 1}`}
            >
              <SiteImage
                src={item.thumbSrc}
                alt=""
                aria-hidden="true"
                className="site-product-detail__thumb-image"
                fillContainer
                skeletonVariant="pulse"
              />
            </button>
          );
        })}
      </div>

      <div className="site-product-detail__main-image-shell">
        <div className="site-product-detail__main-image-viewport" ref={mainImageViewportRef}>
          <div
            className={
              isDraggingGallery
                ? "site-product-detail__main-image-container site-product-detail__main-image-container--dragging"
                : "site-product-detail__main-image-container"
            }
            style={
              {
                "--site-product-detail-gallery-index": selectedGalleryIndex,
                "--site-product-detail-gallery-drag-offset": `${dragOffsetPx}px`,
              } as CSSProperties
            }
          >
            {product.gallery.map((item, index) => (
              <figure
                key={item.id}
                className="site-product-detail__main-image-slide"
                aria-hidden={selectedGalleryItem?.id === item.id ? "false" : "true"}
              >
                <SiteImage
                  src={item.imageSrc}
                  alt={item.alt}
                  className="site-product-detail__main-image"
                  fillContainer
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={index === 0 ? "high" : "auto"}
                  skeletonVariant="pulse"
                />
              </figure>
            ))}
          </div>
        </div>
      </div>

      <div ref={summaryRef} className="site-product-detail__summary">
        <div className="site-product-detail__summary-head">
          <div className="site-product-detail__title-block">
            {designerHref ? (
              <Link to={designerHref} className="site-product-detail__brand-link">
                {product.brand}
              </Link>
            ) : (
              <p className="site-product-detail__brand">{product.brand}</p>
            )}
            <h1 className="site-product-detail__name">{product.name.toUpperCase()}</h1>
          </div>
          <div className="site-product-detail__price-line">
            <span className="site-product-detail__price">{formatSiteRubles(product.priceRub)} ₽</span>
            <span className="site-product-detail__price-divider">-</span>
            <span className="site-product-detail__availability">{product.availability}</span>
          </div>
        </div>

        <SiteSizeSelector sizes={product.sizes} selectedSize={selectedSize} onSelect={setSelectedSize} mobileSheet />

        <button
          type="button"
          className="site-product-detail__add-to-cart"
          onClick={() => {
            if (!selectedSize) {
              return;
            }

            addItem(buildSiteCartItemFromProduct(product, selectedSize, selectedSourceId));
          }}
          disabled={selectedSize === null}
        >
          ДОБАВИТЬ В КОРЗИНУ
        </button>

        <SiteProductDescription description={product.description} onExpand={() => setIsDescriptionExpanded(true)} />

        {product.sourceUrl || hasMultipleSourceVariants ? (
          hasMultipleSourceVariants ? (
            <button type="button" className="site-product-detail__source-button" onClick={openSourcesDialog}>
              Открыть источник товара
            </button>
          ) : (
            <a
              href={resolveSiteProductDetailSourceUrl(product, selectedSize, selectedSourceId) ?? product.sourceUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="site-product-detail__source-button"
            >
              Открыть источник товара
            </a>
          )
        ) : null}
      </div>

      {isSourcesDialogOpen ? (
        <SiteProductSourcesDialog
          product={product}
          selectedSize={selectedSize}
          onChooseSource={(size, sourceId) => {
            setSelectedSize(size);
            setSelectedSourceId(sourceId);
          }}
          onClose={closeSourcesDialog}
        />
      ) : null}
    </section>
  );
}
