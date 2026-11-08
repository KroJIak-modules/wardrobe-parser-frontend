import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Eye, EyeOff, ExternalLink, Globe2, Star } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { getShopifyImageSrcSet, optimizeImageUrl } from "../shared/product-image";
import { FloatingPopover } from "./floating-popover";
import {
  fetchShowcaseProductCustomCatalogs,
  fetchShowcaseProductSources,
  setShowcaseProductCustomCatalogMembership,
  type ShowcaseCustomCatalogMembership,
  type ShowcaseProductSource,
} from "./showcase-api";
import type { ShowcaseCatalogProduct } from "./showcase-contracts";
import { saveAdminRouteScroll } from "./admin-route-scroll";
import { publicProductUrl, publicSiteLabel } from "../shared/public-product-links";

function statusLabel(status: ShowcaseCatalogProduct["status"]): string {
  if (status === "in_stock") {
    return "В наличии";
  }
  if (status === "sold_out") {
    return "Продано";
  }
  return "Под заказ";
}

function formatPriceRub(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

function ShowcaseProductCardMedia({
  imageUrl,
  alt,
  priority = false,
}: {
  imageUrl: string | null;
  alt: string;
  priority?: boolean;
}) {
  const imageSrc = optimizeImageUrl(imageUrl, { width: 480, height: 640, quality: 60 });
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageState, setImageState] = useState<{ src: string | null; status: "loading" | "loaded" | "failed" }>({
    src: imageSrc,
    status: "loading",
  });
  const status = imageState.src === imageSrc ? imageState.status : "loading";

  useLayoutEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      setImageState({ src: imageSrc, status: "loaded" });
    }
  }, [imageSrc]);

  const showEmpty = !imageSrc || status === "failed";
  // Same pulse layer as catalog skeleton — stays until the real photo paints.
  const showSkeleton = !showEmpty && status !== "loaded";

  return (
    <div className="showcase-product-card__media">
      {showSkeleton || showEmpty ? (
        <div
          className={
            showEmpty
              ? "showcase-product-card__media-fill showcase-product-card__media-fill--empty"
              : "showcase-product-card__media-fill showcase-product-card__media-fill--skeleton"
          }
          aria-hidden={showSkeleton ? true : undefined}
        >
          {showEmpty ? "Нет фото" : null}
        </div>
      ) : null}
      {imageSrc && status !== "failed" ? (
        <img
          ref={imageRef}
          key={imageSrc}
          src={imageSrc}
          srcSet={getShopifyImageSrcSet(imageUrl)}
          sizes="(max-width: 760px) 50vw, (max-width: 1180px) 33vw, 25vw"
          alt={alt}
          className={
            status === "loaded"
              ? "showcase-product-card__image showcase-product-card__image--ready"
              : "showcase-product-card__image"
          }
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setImageState({ src: imageSrc, status: "loaded" })}
          onError={() => setImageState({ src: imageSrc, status: "failed" })}
        />
      ) : null}
    </div>
  );
}

function updateMembership(
  catalogs: readonly ShowcaseCustomCatalogMembership[],
  slug: string,
  isAssigned: boolean,
): ShowcaseCustomCatalogMembership[] {
  return catalogs.map((catalog) => catalog.slug === slug ? { ...catalog, is_assigned: isAssigned } : catalog);
}

export function AdminShowcaseProductCard({
  product,
  priority = false,
  hidden = false,
  updating = false,
  onHide,
}: {
  product: ShowcaseCatalogProduct;
  priority?: boolean;
  hidden?: boolean;
  updating?: boolean;
  onHide: (productId: number) => void;
}) {
  const location = useLocation();
  const href = `/product/${product.id}`;
  const productNavigationState = {
    showcaseReturnHref: `${location.pathname}${location.search}${location.hash}`,
    showcaseReturnIndex: typeof window.history.state?.idx === "number" ? window.history.state.idx : null,
  };
  const rememberScroll = () => saveAdminRouteScroll(location.key, window.scrollY);
  const [sources, setSources] = useState<ShowcaseProductSource[] | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [customCatalogs, setCustomCatalogs] = useState<ShowcaseCustomCatalogMembership[] | null>(null);
  const [customCatalogsOpen, setCustomCatalogsOpen] = useState(false);
  const [customCatalogsLoading, setCustomCatalogsLoading] = useState(false);
  const [customCatalogsError, setCustomCatalogsError] = useState<string | null>(null);
  const [updatingCatalogSlugs, setUpdatingCatalogSlugs] = useState<ReadonlySet<string>>(() => new Set());
  const customCatalogTriggerRef = useRef<HTMLButtonElement | null>(null);
  const catalogLoadSequenceRef = useRef(0);
  const catalogMutationSequenceRef = useRef(new Map<string, number>());
  const customCatalogPopoverId = useId();
  const designerHref = product.brand.slug
    ? `/catalog/designers?designer=${encodeURIComponent(product.brand.slug)}`
    : null;

  useEffect(() => {
    catalogLoadSequenceRef.current += 1;
    catalogMutationSequenceRef.current.clear();
    setSources(null);
    setSourcesOpen(false);
    setCustomCatalogs(null);
    setCustomCatalogsOpen(false);
    setCustomCatalogsLoading(false);
    setCustomCatalogsError(null);
    setUpdatingCatalogSlugs(new Set());
  }, [product.id]);

  const openSources = async () => {
    if (sourcesOpen) {
      setSourcesOpen(false);
      return;
    }
    setSourcesLoading(true);
    try {
      const nextSources = sources ?? await fetchShowcaseProductSources(product.id);
      setSources(nextSources);
      if (nextSources.length === 1) {
        window.open(nextSources[0].url, "_blank", "noreferrer");
        return;
      }
      setSourcesOpen(true);
    } catch {
      setSources([]);
      setSourcesOpen(true);
    } finally {
      setSourcesLoading(false);
    }
  };

  const loadCustomCatalogs = async () => {
    const requestSequence = catalogLoadSequenceRef.current + 1;
    catalogLoadSequenceRef.current = requestSequence;
    setCustomCatalogsLoading(true);
    setCustomCatalogsError(null);
    try {
      const nextCatalogs = await fetchShowcaseProductCustomCatalogs(product.id);
      if (catalogLoadSequenceRef.current === requestSequence) {
        setCustomCatalogs(nextCatalogs);
      }
    } catch (error) {
      if (catalogLoadSequenceRef.current === requestSequence) {
        setCustomCatalogsError(error instanceof Error ? error.message : "Не удалось загрузить каталоги");
      }
    } finally {
      if (catalogLoadSequenceRef.current === requestSequence) {
        setCustomCatalogsLoading(false);
      }
    }
  };

  const toggleCustomCatalogs = () => {
    if (customCatalogsOpen) {
      setCustomCatalogsOpen(false);
      return;
    }
    setCustomCatalogsOpen(true);
    if (customCatalogs === null && !customCatalogsLoading) {
      void loadCustomCatalogs();
    }
  };

  const setCatalogMembership = async (catalog: ShowcaseCustomCatalogMembership, isAssigned: boolean) => {
    if (updatingCatalogSlugs.has(catalog.slug)) {
      return;
    }
    const requestSequence = (catalogMutationSequenceRef.current.get(catalog.slug) || 0) + 1;
    catalogMutationSequenceRef.current.set(catalog.slug, requestSequence);
    setUpdatingCatalogSlugs((previous) => new Set(previous).add(catalog.slug));
    try {
      const result = await setShowcaseProductCustomCatalogMembership(product.id, catalog.slug, isAssigned);
      if (catalogMutationSequenceRef.current.get(catalog.slug) === requestSequence) {
        setCustomCatalogs((previous) => previous ? updateMembership(previous, result.slug, result.is_assigned) : previous);
      }
    } catch (error) {
      if (catalogMutationSequenceRef.current.get(catalog.slug) === requestSequence) {
        setCustomCatalogsError(error instanceof Error ? error.message : "Не удалось сохранить выбор каталога");
      }
    } finally {
      if (catalogMutationSequenceRef.current.get(catalog.slug) === requestSequence) {
        setUpdatingCatalogSlugs((previous) => {
          const next = new Set(previous);
          next.delete(catalog.slug);
          return next;
        });
      }
    }
  };

  const availableSources = sources || [];

  return (
    <article className={hidden ? "showcase-product-card showcase-product-card--hidden" : "showcase-product-card"}>
      <Link to={href} state={productNavigationState} onClick={rememberScroll} className="showcase-product-card__media-link" aria-label={`${product.brand.name} ${product.name}`}>
        <ShowcaseProductCardMedia imageUrl={product.image_url} alt={product.name} priority={priority} />
      </Link>
      <div className="showcase-product-card__meta">
        {designerHref ? (
          <Link to={designerHref} className="showcase-product-card__brand">
            {product.brand.name || "—"}
          </Link>
        ) : (
          <p className="showcase-product-card__brand showcase-product-card__brand--static">{product.brand.name || "—"}</p>
        )}
        <Link to={href} state={productNavigationState} onClick={rememberScroll} className="showcase-product-card__title-link">
          <p className="showcase-product-card__title">{product.name}</p>
          <p className="showcase-product-card__statusline">
            <span className="showcase-product-card__price">{formatPriceRub(product.price_rub)}</span>
            <span className="showcase-product-card__divider">·</span>
            <span className="showcase-product-card__availability">{statusLabel(product.status)}</span>
          </p>
        </Link>
        <div className="showcase-product-card__quick-actions">
          <button
            type="button"
            className="showcase-product-card__quick-action"
            onClick={() => onHide(product.id)}
            disabled={updating}
            aria-label={hidden ? "Показать товар" : "Скрыть товар"}
            title={hidden ? "Показать товар" : "Скрыть товар"}
          >
            {hidden ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
          <button
            ref={customCatalogTriggerRef}
            type="button"
            className={customCatalogsOpen ? "showcase-product-card__quick-action showcase-product-card__quick-action--active" : "showcase-product-card__quick-action"}
            onClick={toggleCustomCatalogs}
            aria-expanded={customCatalogsOpen}
            aria-controls={customCatalogPopoverId}
            aria-label="Кастомные каталоги"
            title="Кастомные каталоги"
          >
            <Star size={18} aria-hidden="true" />
          </button>
          <FloatingPopover
            anchorRef={customCatalogTriggerRef}
            open={customCatalogsOpen}
            className="showcase-product-card__custom-catalog-popover"
            onClose={() => setCustomCatalogsOpen(false)}
          >
            <div id={customCatalogPopoverId} aria-label="Кастомные каталоги">
              <p className="showcase-product-card__custom-catalog-title">Кастомные каталоги</p>
              {customCatalogsLoading ? <p className="showcase-product-card__custom-catalog-state">Загружаем…</p> : null}
              {!customCatalogsLoading && customCatalogsError && customCatalogs === null ? (
                <div className="showcase-product-card__custom-catalog-error">
                  <p>{customCatalogsError}</p>
                  <button type="button" onClick={() => void loadCustomCatalogs()}>Повторить</button>
                </div>
              ) : null}
              {!customCatalogsLoading && customCatalogs !== null && customCatalogs.length === 0 ? (
                <p className="showcase-product-card__custom-catalog-state">Кастомных каталогов пока нет</p>
              ) : null}
              {customCatalogs !== null && customCatalogs.length > 0 ? (
                <fieldset className="showcase-product-card__custom-catalog-list">
                  <legend className="sr-only">Выберите каталоги товара</legend>
                  {customCatalogs.map((catalog) => {
                    const isUpdating = updatingCatalogSlugs.has(catalog.slug);
                    return (
                      <label key={catalog.slug} className="showcase-product-card__custom-catalog-option">
                        <input
                          type="checkbox"
                          checked={catalog.is_assigned}
                          disabled={isUpdating}
                          onChange={(event) => void setCatalogMembership(catalog, event.target.checked)}
                        />
                        <span>{catalog.label}</span>
                      </label>
                    );
                  })}
                </fieldset>
              ) : null}
              {customCatalogsError && customCatalogs !== null ? (
                <p className="showcase-product-card__custom-catalog-inline-error" role="alert">{customCatalogsError}</p>
              ) : null}
            </div>
          </FloatingPopover>
          <div className="showcase-product-card__source-menu">
            <a
              className="showcase-product-card__quick-action"
              href={publicProductUrl(product.id)}
              target="_blank"
              rel="noreferrer"
              aria-label={`Открыть ${publicSiteLabel()}`}
              title={`Открыть ${publicSiteLabel()}`}
            >
              <Globe2 size={18} aria-hidden="true" />
            </a>
            <button
              type="button"
              className="showcase-product-card__quick-action"
              onClick={() => void openSources()}
              aria-expanded={sourcesOpen}
              aria-label="Перейти в источник"
              title="Перейти в источник"
            >
              <ExternalLink size={18} aria-hidden="true" />
            </button>
            {sourcesOpen ? (
              <div className="showcase-product-card__source-options">
                {sourcesLoading ? <span>Загружаем…</span> : availableSources.length > 0 ? availableSources.map((source) => (
                  <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                    {source.label}
                  </a>
                )) : <span>Источник не указан</span>}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export function AdminShowcaseProductCardSkeleton() {
  return (
    <article className="showcase-product-card showcase-product-card--skeleton" aria-hidden="true">
      <div className="showcase-product-card__media">
        <div className="showcase-product-card__media-fill showcase-product-card__media-fill--skeleton" />
      </div>
      <div className="showcase-product-card__meta">
        <div className="showcase-product-card__skeleton-line showcase-product-card__skeleton-line--brand" />
        <div className="showcase-product-card__skeleton-line showcase-product-card__skeleton-line--title" />
        <div className="showcase-product-card__skeleton-line showcase-product-card__skeleton-line--price" />
      </div>
    </article>
  );
}
