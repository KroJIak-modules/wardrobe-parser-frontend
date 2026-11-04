import type { KeyboardEvent, MouseEvent } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
  disabled?: boolean;
  chooseAction?: { label: string; direction: "left" | "right"; onChoose: () => void; busy: boolean };
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
  disabled = false,
  chooseAction,
}: Props) {
  const hasExternalProductUrl = Boolean(url && !String(url).startsWith("manual://"));
  const cardClassName = `dedup-col dedup-card${disabled ? " dedup-card--disabled" : " dedup-card--clickable"}`;
  const normalizedCurrency = String(priceSummary?.source_currency || "").trim().toUpperCase() || "RUB";
  const priceLabel = formatSourcePriceLabel(
    priceSummary?.source_display_price ?? null,
    normalizedCurrency,
    Boolean(priceSummary?.source_has_range),
  );
  return (
    <article
      className={cardClassName}
      onClick={(event) => { if (!disabled) onOpen(event, id); }}
      onMouseDown={(event) => {
        if (!disabled && event.button === 1) {
          onOpen(event, id);
        }
      }}
      onKeyDown={(event) => {
        if (!disabled && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onOpen(event, id);
        }
      }}
      role={disabled ? undefined : "button"}
      tabIndex={disabled ? undefined : 0}
      aria-disabled={disabled || undefined}
    >
      <div className="dedup-card-image">
      <ImageWithFallback
        src={getProductPrimaryImageUrl({ image_urls: imageUrls, image_ids: imageIds }, { w: 390, h: 520, q: 55 })}
        alt={title}
        className="dedup-card-media"
        placeholderClassName="dedup-card-media dedup-card-media--placeholder photo-placeholder"
        placeholderText={imageCount > 0 ? `${imageCount} фото` : "Нет фото"}
      />
        {hasExternalProductUrl && !disabled ? (
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
      {chooseAction && !disabled ? (
        <button type="button" className="dedup-card-choose" aria-label={chooseAction.label} data-tooltip={chooseAction.label} disabled={chooseAction.busy} onClick={(event) => { event.stopPropagation(); chooseAction.onChoose(); }}>
          {chooseAction.direction === "left" ? <ArrowLeft size={22} /> : <ArrowRight size={22} />}
        </button>
      ) : null}
      <div className="dedup-card-body">
        <strong className="dedup-card-title">{title}</strong>
        <p className="muted dedup-card-meta">{designerName || "-"}</p>
        <p className="muted dedup-card-meta">{priceLabel}</p>
      </div>
    </article>
  );
}
