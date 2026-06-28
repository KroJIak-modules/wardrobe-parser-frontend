import { useState } from "react";

export function SiteProductDescription({
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
