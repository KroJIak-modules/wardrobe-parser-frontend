import type { KeyboardEvent, MouseEvent } from "react";
import { IconExternalLink } from "../shared/mono-icons";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { getProductPrimaryImageUrl } from "../shared/product-image";
import type { ProductPriceSummary } from "../shared/live-data-types";
import { withPriceRangePrefix } from "../shared/product-pricing";
import "./admin-dedup-product-card.css";

type Props = {
  id: number;
  title: string;
  designerName: string | null;
  priceSummary?: ProductPriceSummary | null;
  imageCount: number;
  imageUrls: string[];
  imageIds: number[];
  url: string;
  onOpen: (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>, productId: number) => void;
};

function formatSourcePriceLabel(value: number | null | undefined, currency: string, from: boolean): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  const amount = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
  return withPriceRangePrefix(`${amount} ${currency}`.trim(), from);
}

export function AdminDedupProductCard({
  id,
  title,
  designerName,
  priceSummary = null,
  imageCount,
  imageUrls,
  imageIds,
  url,
  onOpen,
}: Props) {
  const hasExternalProductUrl = Boolean(url && !String(url).startsWith("manual://"));
  const cardClassName = "dedup-col dedup-card dedup-card--clickable";
  const normalizedCurrency = String(priceSummary?.source_currency || "").trim().toUpperCase() || "RUB";
  const priceLabel = formatSourcePriceLabel(
    priceSummary?.source_display_price ?? null,
    normalizedCurrency,
    Boolean(priceSummary?.source_has_range),
  );
  return (
    <article
      className={cardClassName}
      onClick={(event) => onOpen(event, id)}
      onMouseDown={(event) => {
        if (event.button === 1) {
          onOpen(event, id);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(event, id);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <ImageWithFallback
        src={getProductPrimaryImageUrl({ image_urls: imageUrls, image_ids: imageIds }, { w: 520, h: 360, q: 55 })}
        alt={title}
        className="dedup-card-media"
        placeholderClassName="dedup-card-media dedup-card-media--placeholder photo-placeholder"
        placeholderText={imageCount > 0 ? `${imageCount} фото` : "Нет фото"}
      />
      <div className="dedup-card-body">
        <strong className="dedup-card-title">{title}</strong>
        <p className="muted dedup-card-meta">{designerName || "-"}</p>
        <p className="muted dedup-card-meta">{priceLabel}</p>
        {hasExternalProductUrl ? (
          <button
            type="button"
            className="icon-btn dedup-source-btn"
            title="Открыть источник"
            onClick={(event) => {
              event.stopPropagation();
              window.open(url, "_blank", "noreferrer");
            }}
          >
            <IconExternalLink className="icon-svg" />
          </button>
        ) : null}
      </div>
    </article>
  );
}
