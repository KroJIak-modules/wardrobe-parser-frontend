import { useEffect, useState } from "react";
import { EyeOff, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { optimizeImageUrl } from "../shared/product-image";
import { fetchShowcaseProductSources, type ShowcaseProductSource } from "./showcase-api";
import type { ShowcaseCatalogProduct } from "./showcase-contracts";

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
}: {
  imageUrl: string | null;
  alt: string;
}) {
  const imageSrc = optimizeImageUrl(imageUrl, { width: 480, height: 640, quality: 60 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
  }, [imageSrc]);

  const showEmpty = !imageSrc || imageFailed;
  // Same pulse layer as catalog skeleton — stays until the real photo paints.
  const showSkeleton = !showEmpty && !imageLoaded;

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
      {imageSrc && !imageFailed ? (
        <img
          src={imageSrc}
          alt={alt}
          className={
            imageLoaded
              ? "showcase-product-card__image showcase-product-card__image--ready"
              : "showcase-product-card__image"
          }
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageFailed(true);
            setImageLoaded(false);
          }}
        />
      ) : null}
    </div>
  );
}

export function AdminShowcaseProductCard({
  product,
  hidden = false,
  updating = false,
  onHide,
}: {
  product: ShowcaseCatalogProduct;
  hidden?: boolean;
  updating?: boolean;
  onHide: (productId: number) => void;
}) {
  const href = `/product/${product.id}`;
  const [sources, setSources] = useState<ShowcaseProductSource[] | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const designerHref = product.brand.slug
    ? `/catalog/designers?designer=${encodeURIComponent(product.brand.slug)}`
    : null;

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
  const availableSources = sources || [];

  return (
    <article className={hidden ? "showcase-product-card showcase-product-card--hidden" : "showcase-product-card"}>
      <Link to={href} className="showcase-product-card__media-link" aria-label={`${product.brand.name} ${product.name}`}>
        <ShowcaseProductCardMedia imageUrl={product.image_url} alt={product.name} />
      </Link>
      <div className="showcase-product-card__meta">
        {designerHref ? (
          <Link to={designerHref} className="showcase-product-card__brand">
            {product.brand.name || "—"}
          </Link>
        ) : (
          <p className="showcase-product-card__brand showcase-product-card__brand--static">{product.brand.name || "—"}</p>
        )}
        <Link to={href} className="showcase-product-card__title-link">
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
            disabled={hidden || updating}
            aria-label={hidden ? "Товар скрыт" : "Скрыть товар"}
            title={hidden ? "Товар скрыт" : "Скрыть товар"}
          >
            <EyeOff size={18} aria-hidden="true" />
          </button>
          <div className="showcase-product-card__source-menu">
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
