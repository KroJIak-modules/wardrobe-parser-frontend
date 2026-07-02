import { useCallback, useEffect, useRef, useState } from "react";
import { formatSiteRubles } from "../../app/site-format";
import type { SiteProductDetailItem } from "../../runtime/site-product-detail";
import {
  resolveSiteProductDetailInitialSourceVariant,
  resolveSiteProductDetailSourceVariant,
} from "../../runtime/site-product-detail";
import { SiteImage } from "../image/site-image";
import { useSitePageScrollLock } from "../shared/use-site-page-scroll-lock";
import { SiteWindowCloseButton, SiteWindowShell, SiteWindowTitlebar } from "../window-shell/site-window-shell";
import { SiteSizeSelector } from "./site-size-selector";

const SITE_PRODUCT_SOURCES_DIALOG_EXIT_MS = 220;

export function SiteProductSourcesDialog({
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
  const initialVariant = resolveSiteProductDetailInitialSourceVariant(product, selectedSize);
  const [modalSize, setModalSize] = useState<string | null>(initialVariant?.size ?? product.sizes[0] ?? null);
  const [showsSelectedSize, setShowsSelectedSize] = useState(selectedSize !== null);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const activeVariant = resolveSiteProductDetailSourceVariant(product, modalSize);

  useSitePageScrollLock(true);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  }, []);

  const requestClose = useCallback(() => {
    clearCloseTimeout();
    setIsClosing(true);
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;
      onClose();
    }, SITE_PRODUCT_SOURCES_DIALOG_EXIT_MS);
  }, [clearCloseTimeout, onClose]);

  useEffect(() => {
    const nextVariant = resolveSiteProductDetailInitialSourceVariant(product, selectedSize);
    setModalSize(nextVariant?.size ?? product.sizes[0] ?? null);
    setShowsSelectedSize(selectedSize !== null);
  }, [product, selectedSize]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        requestClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [requestClose]);

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, [clearCloseTimeout]);

  return (
    <div
      className={isClosing ? "site-product-detail__sources-overlay site-product-detail__sources-overlay--closing" : "site-product-detail__sources-overlay"}
      role="presentation"
      onClick={requestClose}
    >
      <div
        className={isClosing ? "site-product-detail__sources-dialog site-product-detail__sources-dialog--closing" : "site-product-detail__sources-dialog"}
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-product-detail-sources-title"
        onClick={(event) => event.stopPropagation()}
      >
        <SiteWindowShell className="site-product-detail__sources-window" frameClassName="site-product-detail__sources-frame">
          <SiteWindowTitlebar
            title="ИСТОЧНИКИ"
            titleId="site-product-detail-sources-title"
            className="site-product-detail__sources-titlebar"
            titleClassName="site-product-detail__sources-title"
            closeButton={
              <SiteWindowCloseButton
                className="site-product-detail__sources-close"
                ariaLabel="Закрыть окно источников"
                onClick={requestClose}
              />
            }
          />
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
                        data-source-id={source.id}
                        data-source-label={source.label}
                        aria-label={source.label}
                        role="img"
                      >
                        <SiteImage
                          src={source.logoSrc}
                          alt=""
                          aria-hidden="true"
                          className="site-product-detail__source-logo-image"
                          fillContainer
                        />
                      </div>
                    ) : (
                      <p className="site-product-detail__source-label">{source.label}</p>
                    )}
                    <p className="site-product-detail__source-price">{formatSiteRubles(source.priceRub)} ₽</p>
                  </div>

                  <div className="site-product-detail__source-actions">
                    <button
                      type="button"
                      className="site-product-detail__source-action-button"
                      onClick={() => {
                        onChooseSource(activeVariant.size, source.id);
                        window.open(source.url, "_blank", "noopener,noreferrer");
                        requestClose();
                      }}
                    >
                      Открыть источник
                    </button>
                    <button
                      type="button"
                      className="site-product-detail__source-action-button"
                      onClick={() => {
                        onChooseSource(activeVariant.size, source.id);
                        requestClose();
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
