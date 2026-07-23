import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { optimizeImageUrl } from "../shared/product-image";
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

export function AdminShowcaseProductCard({ product }: { product: ShowcaseCatalogProduct }) {
  const href = `/product/${product.id}`;
  const designerHref = product.brand.slug
    ? `/catalog/designers?designer=${encodeURIComponent(product.brand.slug)}`
    : null;

  return (
    <article className="showcase-product-card">
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
