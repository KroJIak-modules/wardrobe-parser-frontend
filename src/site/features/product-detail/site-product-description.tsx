import { useEffect, useRef, useState } from "react";

const DESCRIPTION_VISIBLE_LINES = 8;
const MEASURE_EPSILON_PX = 1;

function measureLastVisibleContentBottom(textNode: Text, visibleBottom: number): number | null {
  const content = textNode.textContent ?? "";
  if (!content.trim()) {
    return null;
  }

  const range = document.createRange();
  let bestBottom: number | null = null;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index] ?? "";
    if (!char.trim()) {
      continue;
    }

    range.setStart(textNode, index);
    range.setEnd(textNode, index + 1);
    const rect = range.getClientRects()[0] ?? null;
    if (!rect || rect.height <= 0 || rect.bottom > visibleBottom + MEASURE_EPSILON_PX) {
      continue;
    }
    if (bestBottom === null || rect.bottom > bestBottom) {
      bestBottom = rect.bottom;
    }
  }

  range.detach?.();
  return bestBottom;
}

export function SiteProductDescription({
  description,
}: {
  description: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const descriptionRef = useRef<HTMLDivElement | null>(null);
  const descriptionTextRef = useRef<HTMLParagraphElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [collapsedTailOffsetPx, setCollapsedTailOffsetPx] = useState(0);

  useEffect(() => {
    const node = descriptionRef.current;
    const textNode = descriptionTextRef.current;
    if (!node || !textNode) {
      return undefined;
    }

    let frameId = 0;
    const measureOverflow = () => {
      frameId = window.requestAnimationFrame(() => {
        setHasOverflow(node.scrollHeight - node.clientHeight > 1);

        if (isExpanded) {
          setCollapsedTailOffsetPx(0);
          return;
        }

        const computedStyle = window.getComputedStyle(textNode);
        const lineHeight = Number.parseFloat(computedStyle.lineHeight);
        if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
          setCollapsedTailOffsetPx(0);
          return;
        }

        const textRect = textNode.getBoundingClientRect();
        const visibleBottom = textRect.top + (lineHeight * DESCRIPTION_VISIBLE_LINES);
        const textContent = textNode.firstChild;
        if (!(textContent instanceof Text)) {
          setCollapsedTailOffsetPx(0);
          return;
        }

        const lastVisibleContentBottom = measureLastVisibleContentBottom(textContent, visibleBottom);
        if (lastVisibleContentBottom === null) {
          setCollapsedTailOffsetPx(0);
          return;
        }

        const trailingOffset = Math.max(0, visibleBottom - lastVisibleContentBottom);
        setCollapsedTailOffsetPx(trailingOffset > MEASURE_EPSILON_PX ? trailingOffset : 0);
      });
    };

    measureOverflow();

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measureOverflow);
    resizeObserver?.observe(node);
    resizeObserver?.observe(textNode);
    window.addEventListener("resize", measureOverflow);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", measureOverflow);
      resizeObserver?.disconnect();
    };
  }, [description, isExpanded]);

  return (
    <div className="site-product-detail__description-block">
      <div
        ref={descriptionRef}
        className={isExpanded ? "site-product-detail__description site-product-detail__description--expanded" : "site-product-detail__description"}
      >
        <p ref={descriptionTextRef} className="site-product-detail__description-text">{description}</p>
        {!isExpanded && hasOverflow ? (
          <div className="site-product-detail__description-fade" aria-hidden="true" style={{ bottom: `${collapsedTailOffsetPx}px` }} />
        ) : null}
      </div>
      {!isExpanded && hasOverflow ? (
        <button
          type="button"
          className="site-product-detail__read-more"
          style={{ bottom: `${collapsedTailOffsetPx}px` }}
          onClick={() => setIsExpanded(true)}
        >
          ...Читать дальше
        </button>
      ) : null}
    </div>
  );
}
