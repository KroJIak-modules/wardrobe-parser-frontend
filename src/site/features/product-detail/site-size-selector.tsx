import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { resolveSitePublicAssetUrl } from "../../app/site-public-asset";
import { useSiteMediaQuery } from "../../runtime/use-site-media-query";
import { useSitePageScrollLock } from "../shared/use-site-page-scroll-lock";

const SITE_SIZE_SELECTOR_MOBILE_QUERY = "(max-width: 640px)";
const SITE_SIZE_SELECTOR_SHEET_EXIT_MS = 220;

export function SiteSizeSelector({
  sizes,
  selectedSize,
  onSelect,
  placeholder = "РАЗМЕР",
  displayValue,
  className = "",
  triggerClassName = "",
  mobileSheet = false,
}: {
  sizes: readonly string[];
  selectedSize: string | null;
  onSelect: (size: string) => void;
  placeholder?: string;
  displayValue?: string | null;
  className?: string;
  triggerClassName?: string;
  mobileSheet?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeSize, setActiveSize] = useState<string | null>(sizes[0] ?? null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const isMobileViewport = useSiteMediaQuery(SITE_SIZE_SELECTOR_MOBILE_QUERY);
  const shouldUseMobileSheet = mobileSheet && isMobileViewport;

  useSitePageScrollLock(isOpen && shouldUseMobileSheet);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  }, []);

  const openSizeSelector = useCallback(() => {
    clearCloseTimeout();
    setIsClosing(false);
    setIsOpen(true);
  }, [clearCloseTimeout]);

  const closeSizeSelector = useCallback(() => {
    clearCloseTimeout();

    if (!shouldUseMobileSheet) {
      setIsClosing(false);
      setIsOpen(false);
      return;
    }

    setIsClosing(true);
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;
      setIsOpen(false);
      setIsClosing(false);
    }, SITE_SIZE_SELECTOR_SHEET_EXIT_MS);
  }, [clearCloseTimeout, shouldUseMobileSheet]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!shellRef.current?.contains(event.target as Node)) {
        closeSizeSelector();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeSizeSelector();
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeSizeSelector, isOpen]);

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, [clearCloseTimeout]);

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
  const handleClose = () => closeSizeSelector();
  const handleSelectSize = (size: string) => {
    onSelect(size);
    setActiveSize(size);
    closeSizeSelector();
  };
  const renderedOptions = sizes.map((size) => {
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
        onClick={() => handleSelectSize(size)}
      >
        {size}
      </button>
    );
  });

  return (
    <div
      ref={shellRef}
      className={`${className} site-product-detail__size-select${isOpen ? " site-product-detail__size-select--open" : ""}${
        shouldUseMobileSheet ? " site-product-detail__size-select--mobile-sheet" : ""
      }${isClosing ? " site-product-detail__size-select--closing" : ""}`.trim()}
      style={
        isOpen && !shouldUseMobileSheet
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
        onClick={() => {
          if (isOpen) {
            closeSizeSelector();
            return;
          }

          openSizeSelector();
        }}
      >
        <span>{displayValue !== undefined ? (displayValue ?? placeholder) : (selectedSize ?? placeholder)}</span>
        <img
          src={resolveSitePublicAssetUrl("/site-mock/product-detail/size-arrow.svg")}
          alt=""
          aria-hidden="true"
          className="site-product-detail__size-arrow"
        />
      </button>
      {isOpen && shouldUseMobileSheet ? (
        <div className="site-product-detail__size-sheet-layer" aria-label="Выбор размера">
          <button
            type="button"
            className="site-product-detail__size-sheet-backdrop"
            aria-label="Закрыть выбор размера"
            onClick={handleClose}
          />
          <div className="site-product-detail__size-sheet" role="dialog" aria-modal="true" aria-label="Выбор размера">
            <div className="site-product-detail__size-sheet-header">
              <p className="site-product-detail__size-sheet-title">ВЫБРАТЬ РАЗМЕР</p>
              <button type="button" className="site-product-detail__size-sheet-close" aria-label="Закрыть выбор размера" onClick={handleClose}>
                <img src={resolveSitePublicAssetUrl("/site-mock/product-detail/size-sheet-close.svg")} alt="" aria-hidden="true" />
              </button>
            </div>
            <div className="site-product-detail__size-sheet-options" role="listbox" aria-label="Выбор размера">
              {renderedOptions}
            </div>
          </div>
        </div>
      ) : isOpen ? (
        <div className="site-product-detail__size-menu" role="listbox" aria-label="Выбор размера">
          <div className="site-product-detail__size-menu-shell" aria-hidden="true" />
          <div className="site-product-detail__size-menu-surface" aria-hidden="true" />
          <div className="site-product-detail__size-menu-cap" aria-hidden="true" />
          <div className="site-product-detail__size-menu-list">
            {renderedOptions}
          </div>
        </div>
      ) : null}
    </div>
  );
}
