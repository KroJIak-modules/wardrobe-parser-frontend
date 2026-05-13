import type { KeyboardEvent, MouseEvent } from "react";
import { IconExternalLink } from "../shared/mono-icons";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { getProductPrimaryImageUrl } from "../shared/product-image";

type Props = {
  id: number;
  title: string;
  vendor: string | null;
  price: number | null;
  currency: string;
  imageCount: number;
  imageUrls: string[];
  imageIds: number[];
  url: string;
  onOpen: (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>, productId: number) => void;
};

export function AdminDedupProductCard({
  id,
  title,
  vendor,
  price,
  currency,
  imageCount,
  imageUrls,
  imageIds,
  url,
  onOpen,
}: Props) {
  return (
    <article
      className="dedup-col dedup-card dedup-card--clickable"
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
        placeholderClassName="dedup-card-media dedup-card-media--placeholder"
        placeholderText={imageCount > 0 ? "Фото" : "Нет фото"}
      />
      <div className="dedup-card-body">
        <strong className="dedup-card-title">{title}</strong>
        <p className="muted dedup-card-meta">{vendor || "-"}</p>
        <p className="muted dedup-card-meta">
          {price ?? "-"} {currency}
        </p>
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
      </div>
    </article>
  );
}
