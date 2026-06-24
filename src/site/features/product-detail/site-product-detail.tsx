import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { buildDesignerCatalogHref } from "../catalog/site-catalog-query";
import { SiteWindowShell } from "../window-shell/site-window-shell";
import type { SiteProductDetailItem } from "../../runtime/site-product-detail-mock";
import {
  buildSiteCartItemFromProduct,
  resolveSiteProductDetailInitialSourceVariant,
  resolveSiteProductDetailSourceUrl,
  resolveSiteProductDetailSourceVariant,
} from "../../runtime/site-product-detail-mock";
import { useSiteCart } from "../../runtime/use-site-cart";
import { SiteProductCard } from "../product-card/site-product-card";
import "./site-product-detail.css";

function formatRubles(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function SiteSizeSelector({
  sizes,
  selectedSize,
  onSelect,
  placeholder = "РАЗМЕР",
  displayValue,
  className = "",
  triggerClassName = "",
}: {
  sizes: readonly string[];
  selectedSize: string | null;
  onSelect: (size: string) => void;
  placeholder?: string;
  displayValue?: string | null;
  className?: string;
  triggerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSize, setActiveSize] = useState<string | null>(sizes[0] ?? null);
  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!shellRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setActiveSize(selectedSize ?? sizes[0] ?? null);
  }, [isOpen, selectedSize, sizes]);

  const optionHeight = 21;
  const optionGap = 10;
  const listTopInset = 22;
  const listBottomInset = 7;
  const listHeight = sizes.length > 0 ? sizes.length * optionHeight + (sizes.length - 1) * optionGap : 0;
  const panelHeight = Math.max(134, listTopInset + listHeight + listBottomInset);
  const shellHeight = panelHeight + 2;

  return (
    <div
      ref={shellRef}
      className={`${className} site-product-detail__size-select${isOpen ? " site-product-detail__size-select--open" : ""}`.trim()}
      style={
        isOpen
          ? ({
              "--site-size-shell-height": `${shellHeight}px`,
              "--site-size-panel-height": `${panelHeight}px`,
            } as CSSProperties)
          : undefined
      }
    >
      <button
        type="button"
        className={`${triggerClassName} site-product-detail__size-trigger`.trim()}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{displayValue !== undefined ? (displayValue ?? placeholder) : (selectedSize ?? placeholder)}</span>
        <img src="/site-mock/product-detail/size-arrow.svg" alt="" aria-hidden="true" className="site-product-detail__size-arrow" />
      </button>
      {isOpen ? (
        <div className="site-product-detail__size-menu" role="listbox" aria-label="Выбор размера">
          <div className="site-product-detail__size-menu-shell" aria-hidden="true" />
          <div className="site-product-detail__size-menu-surface" aria-hidden="true" />
          <div className="site-product-detail__size-menu-cap" aria-hidden="true" />
          <div className="site-product-detail__size-menu-list">
            {sizes.map((size) => {
              const isActive = activeSize === size;

              return (
                <button
                  key={size}
                  type="button"
                  role="option"
                  aria-selected={selectedSize === size}
                  className={isActive ? "site-product-detail__size-option site-product-detail__size-option--active" : "site-product-detail__size-option"}
                  onMouseEnter={() => setActiveSize(size)}
                  onFocus={() => setActiveSize(size)}
                  onClick={() => {
                    onSelect(size);
                    setActiveSize(size);
                    setIsOpen(false);
                  }}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SiteProductSourcesDialog({
  product,
  selectedSize,
  onChooseSource,
  onClose,
}: {
  product: SiteProductDetailItem;
  selectedSize: string | null;
  onChooseSource: (size: string, sourceId: string) => void;
  onClose: () => void;
}) {
  const sourceVariants = product.sourceVariants ?? [];
  const initialVariant = resolveSiteProductDetailInitialSourceVariant(product, selectedSize);
  const [modalSize, setModalSize] = useState<string | null>(initialVariant?.size ?? product.sizes[0] ?? null);
  const [showsSelectedSize, setShowsSelectedSize] = useState(selectedSize !== null);
  const activeVariant = resolveSiteProductDetailSourceVariant(product, modalSize);

  useEffect(() => {
    const nextVariant = resolveSiteProductDetailInitialSourceVariant(product, selectedSize);
    setModalSize(nextVariant?.size ?? product.sizes[0] ?? null);
    setShowsSelectedSize(selectedSize !== null);
  }, [product, selectedSize]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="site-product-detail__sources-overlay" role="presentation" onClick={onClose}>
      <div
        className="site-product-detail__sources-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-product-detail-sources-title"
        onClick={(event) => event.stopPropagation()}
      >
        <SiteWindowShell className="site-product-detail__sources-window" frameClassName="site-product-detail__sources-frame">
          <div className="site-product-detail__sources-titlebar">
            <p id="site-product-detail-sources-title" className="site-product-detail__sources-title">
              ИСТОЧНИКИ
            </p>
            <button type="button" className="site-product-detail__sources-close" aria-label="Закрыть окно источников" onClick={onClose}>
              <img
                src="/site-mock/product-detail/sources-modal/close-icon.svg"
                alt=""
                aria-hidden="true"
                className="site-product-detail__sources-close-icon"
              />
            </button>
          </div>
          <div className="site-product-detail__sources-panel">
            <SiteSizeSelector
              sizes={product.sizes}
              selectedSize={modalSize}
              displayValue={showsSelectedSize ? modalSize : null}
              onSelect={(size) => {
                setModalSize(size);
                setShowsSelectedSize(true);
              }}
              className="site-product-detail__sources-size-select"
              triggerClassName="site-product-detail__sources-size-trigger"
            />

            <div className="site-product-detail__sources-list">
              {activeVariant ? activeVariant.sources.map((source) => (
                <article key={source.id} className="site-product-detail__source-card">
                  <div className="site-product-detail__source-row">
                    {source.logoSrc ? (
                      <div
                        className="site-product-detail__source-logo-frame"
                        aria-label={source.logoAlt ?? source.label}
                        role="img"
                        style={{
                          width: source.logoWidth ? `${source.logoWidth}px` : undefined,
                          height: source.logoHeight ? `${source.logoHeight}px` : undefined,
                        }}
                      >
                        <img
                          src={source.logoSrc}
                          alt=""
                          aria-hidden="true"
                          className="site-product-detail__source-logo-image"
                          style={{
                            width: source.logoImageWidthPercent ? `${source.logoImageWidthPercent}%` : undefined,
                            height: source.logoImageHeightPercent ? `${source.logoImageHeightPercent}%` : undefined,
                            left: source.logoImageLeftPercent ? `${source.logoImageLeftPercent}%` : undefined,
                            top: source.logoImageTopPercent ? `${source.logoImageTopPercent}%` : undefined,
                          }}
                        />
                      </div>
                    ) : (
                      <p className="site-product-detail__source-label">{source.label}</p>
                    )}
                    <p className="site-product-detail__source-price">{formatRubles(source.priceRub)} ₽</p>
                  </div>

                  <div className="site-product-detail__source-actions">
                    <button
                      type="button"
                      className="site-product-detail__source-action-button"
                      onClick={() => {
                        onChooseSource(activeVariant.size, source.id);
                        window.open(source.url, "_blank", "noopener,noreferrer");
                        onClose();
                      }}
                    >
                      Открыть источник
                    </button>
                    <button
                      type="button"
                      className="site-product-detail__source-action-button"
                      onClick={() => {
                        onChooseSource(activeVariant.size, source.id);
                        onClose();
                      }}
                    >
                      Выбрать
                    </button>
                  </div>
                </article>
              )) : (
                <div className="site-product-detail__sources-empty">
                  Источники для этого размера пока не привязаны
                </div>
              )}
            </div>
          </div>
        </SiteWindowShell>
      </div>
    </div>
  );
}

function SiteProductDescription({
  description,
  previewDescription,
}: {
  description: string;
  previewDescription?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const collapsedText = previewDescription?.trim() ? previewDescription : description;
  const hasOverflow = collapsedText !== description || description.trim().length > 240;

  return (
    <div className="site-product-detail__description-block">
      <div className={isExpanded ? "site-product-detail__description site-product-detail__description--expanded" : "site-product-detail__description"}>
        <p className="site-product-detail__description-text">{isExpanded ? description : collapsedText}</p>
        {!isExpanded && hasOverflow ? <div className="site-product-detail__description-fade" aria-hidden="true" /> : null}
      </div>
      {!isExpanded && hasOverflow ? (
        <button type="button" className="site-product-detail__read-more" onClick={() => setIsExpanded(true)}>
          ...Читать дальше
        </button>
      ) : null}
    </div>
  );
}

function SiteProductHero({
  product,
}: {
  product: SiteProductDetailItem;
}) {
  const [selectedGalleryItemId, setSelectedGalleryItemId] = useState(product.gallery[0]?.id ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isSourcesDialogOpen, setIsSourcesDialogOpen] = useState(false);
  const { addItem } = useSiteCart();
  const mainImageViewportRef = useRef<HTMLDivElement | null>(null);
  const designerHref = product.designerId ? buildDesignerCatalogHref(product.designerId) : null;
  const selectedGalleryIndex = Math.max(
    0,
    product.gallery.findIndex((item) => item.id === selectedGalleryItemId),
  );
  const selectedGalleryItem =
    product.gallery.find((item) => item.id === selectedGalleryItemId) ?? product.gallery[0] ?? null;
  const hasMultipleSourceVariants = Boolean(product.sourceVariants?.some((variant) => variant.sources.length > 1));
  const wheelThrottleRef = useRef<number | null>(null);

  useEffect(() => {
    if (!selectedSize) {
      setSelectedSourceId(null);
      return;
    }

    const activeVariant = resolveSiteProductDetailSourceVariant(product, selectedSize);
    if (!activeVariant) {
      setSelectedSourceId(null);
      return;
    }

    setSelectedSourceId((current) =>
      current && activeVariant.sources.some((source) => source.id === current) ? current : (activeVariant.sources[0]?.id ?? null)
    );
  }, [product, selectedSize]);

  useEffect(() => {
    return () => {
      if (wheelThrottleRef.current !== null) {
        window.clearTimeout(wheelThrottleRef.current);
      }
    };
  }, []);

  const handleWheel = useCallback(
    (deltaX: number, deltaY: number) => {
      if (wheelThrottleRef.current !== null) {
        return true;
      }

      if (Math.abs(deltaY) < Math.abs(deltaX) && Math.abs(deltaX) < 8) {
        return false;
      }

      if (deltaY === 0) {
        return false;
      }

      const nextIndex = deltaY > 0 ? selectedGalleryIndex + 1 : selectedGalleryIndex - 1;
      if (nextIndex < 0 || nextIndex >= product.gallery.length) {
        return true;
      }

      wheelThrottleRef.current = window.setTimeout(() => {
        wheelThrottleRef.current = null;
      }, 240);
      setSelectedGalleryItemId(product.gallery[nextIndex]?.id ?? null);
      return true;
    },
    [product.gallery, selectedGalleryIndex],
  );

  useEffect(() => {
    const viewport = mainImageViewportRef.current;
    if (!viewport) {
      return undefined;
    }

    const handleViewportWheel = (event: globalThis.WheelEvent) => {
      if (!handleWheel(event.deltaX, event.deltaY)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    viewport.addEventListener("wheel", handleViewportWheel, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", handleViewportWheel);
    };
  }, [handleWheel]);

  return (
    <section className="site-product-detail__hero">
      <div className="site-product-detail__thumbs" aria-label="Миниатюры товара">
        {product.gallery.map((item, index) => {
          const isActive = item.id === selectedGalleryItem?.id;
          return (
            <button
              key={item.id}
              type="button"
              className={isActive ? "site-product-detail__thumb site-product-detail__thumb--active" : "site-product-detail__thumb"}
              onClick={() => {
                setSelectedGalleryItemId(item.id);
              }}
              aria-label={`Фотография ${index + 1}`}
            >
              <img
                src={item.thumbSrc}
                alt=""
                aria-hidden="true"
                className="site-product-detail__thumb-image"
                style={{ width: `${item.thumbWidth}px`, height: `${item.thumbHeight}px` }}
              />
            </button>
          );
        })}
      </div>

      <div className="site-product-detail__main-image-shell">
        <div className="site-product-detail__main-image-viewport" ref={mainImageViewportRef}>
          <div
            className="site-product-detail__main-image-container"
            style={{ transform: `translate3d(0, -${selectedGalleryIndex * 100}%, 0)` }}
          >
            {product.gallery.map((item, index) => (
              <figure key={item.id} className="site-product-detail__main-image-slide" aria-hidden={selectedGalleryItem?.id === item.id ? "false" : "true"}>
                <img
                  src={item.imageSrc}
                  alt={item.alt}
                  className="site-product-detail__main-image"
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={index === 0 ? "high" : "auto"}
                />
              </figure>
            ))}
          </div>
        </div>
      </div>

      <div className="site-product-detail__summary">
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
            <span className="site-product-detail__price">{formatRubles(product.priceRub)} ₽</span>
            <span className="site-product-detail__price-divider">-</span>
            <span className="site-product-detail__availability">{product.availability}</span>
          </div>
        </div>

        <SiteSizeSelector sizes={product.sizes} selectedSize={selectedSize} onSelect={setSelectedSize} />

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

        <SiteProductDescription description={product.description} previewDescription={product.descriptionPreview} />

        {product.availabilityCode !== "in-stock" && (product.sourceUrl || hasMultipleSourceVariants) ? (
          hasMultipleSourceVariants ? (
            <button type="button" className="site-product-detail__source-button" onClick={() => setIsSourcesDialogOpen(true)}>
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
          onClose={() => setIsSourcesDialogOpen(false)}
        />
      ) : null}
    </section>
  );
}

export function SiteProductDetailView({
  product,
  recommendations,
  returnTarget,
}: {
  product: SiteProductDetailItem | null;
  recommendations: readonly SiteProductDetailItem[];
  returnTarget: { pathname: string; search: string } | null;
}) {
  const recommendationCards = useMemo(() => recommendations.slice(0, 8), [recommendations]);

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
    <section className="site-product-detail">
      <SiteProductHero product={product} />

      <section className="site-product-detail__recommendations" aria-labelledby="site-product-detail-recommendations-title">
        <h2 id="site-product-detail-recommendations-title" className="site-product-detail__recommendations-title">
          РЕКОМЕНДУЮ
        </h2>
        <div className="site-product-detail__recommendations-grid">
          {recommendationCards.map((item) => (
            <SiteProductCard key={item.id} product={item} imageLoading="eager" />
          ))}
        </div>
      </section>
    </section>
  );
}
