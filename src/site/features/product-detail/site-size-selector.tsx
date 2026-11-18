import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { resolveSitePublicAssetUrl } from "../../app/site-public-asset";
import { useSiteMediaQuery } from "../../runtime/use-site-media-query";
import { useSitePageScrollLock } from "../shared/use-site-page-scroll-lock";

const SITE_SIZE_SELECTOR_MOBILE_QUERY = "(max-width: 640px)";
const SITE_SIZE_SELECTOR_SHEET_EXIT_MS = 220;
const SITE_SIZE_OPTION_HEIGHT = 21;
const SITE_SIZE_OPTION_GAP = 10;
const SITE_SIZE_LIST_TOP_INSET = 22;
const SITE_SIZE_LIST_BOTTOM_INSET = 7;
// Минимальная высота выпадающего списка и отступ от края окна.
const SITE_SIZE_MENU_MIN_HEIGHT = 180;
const SITE_SIZE_MENU_VIEWPORT_MARGIN = 24;

export function SiteSizeSelector({
  sizes,
  selectedSize,
  onSelect,
  placeholder = "РАЗМЕР",
  sheetTitle = "ВЫБРАТЬ РАЗМЕР",
  displayValue,
  className = "",
  triggerClassName = "",
  mobileSheet = false,
}: {
  sizes: readonly string[];
  selectedSize: string | null;
  onSelect: (size: string) => void;
  placeholder?: string;
  sheetTitle?: string;
  displayValue?: string | null;
  className?: string;
  triggerClassName?: string;
  mobileSheet?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeSize, setActiveSize] = useState<string | null>(sizes[0] ?? null);
  const [menuHeightPx, setMenuHeightPx] = useState<number | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const isMobileViewport = useSiteMediaQuery(SITE_SIZE_SELECTOR_MOBILE_QUERY);
  const shouldUseMobileSheet = mobileSheet && isMobileViewport;
  const isSingleOption = sizes.length <= 1;

  useSitePageScrollLock(isOpen && shouldUseMobileSheet);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  }, []);

  // Высота списка ограничивается свободным местом под триггером, иначе длинный
  // список вариантов вылезает за экран и скроллится вся страница.
  const measureMenuHeight = useCallback(() => {
    const listHeight = sizes.length > 0 ? sizes.length * SITE_SIZE_OPTION_HEIGHT + (sizes.length - 1) * SITE_SIZE_OPTION_GAP : 0;
    const panelHeight = SITE_SIZE_LIST_TOP_INSET + listHeight + SITE_SIZE_LIST_BOTTOM_INSET;
    const trigger = triggerRef.current;
    const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight;
    if (!trigger || viewportHeight <= 0) {
      setMenuHeightPx(panelHeight);
      return;
    }

    const spaceBelow = viewportHeight - trigger.getBoundingClientRect().bottom - SITE_SIZE_MENU_VIEWPORT_MARGIN;
    // Минимальная высота нужна только длинному списку. Короткий список
    // растягивать незачем: пункты тогда разъезжаются по пустому месту.
    const capped =
      panelHeight > SITE_SIZE_MENU_MIN_HEIGHT
        ? Math.max(SITE_SIZE_MENU_MIN_HEIGHT, Math.floor(spaceBelow))
        : panelHeight;
    setMenuHeightPx(capped);
  }, [sizes.length]);

  const openSizeSelector = useCallback(() => {
    clearCloseTimeout();
    setIsClosing(false);
    measureMenuHeight();
    setIsOpen(true);
  }, [clearCloseTimeout, measureMenuHeight]);

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

  useEffect(() => {
    if (!isOpen || shouldUseMobileSheet) {
      return;
    }

    const handleResize = () => measureMenuHeight();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, shouldUseMobileSheet, measureMenuHeight]);

  const optionHeight = SITE_SIZE_OPTION_HEIGHT;
  const optionGap = SITE_SIZE_OPTION_GAP;
  const listTopInset = SITE_SIZE_LIST_TOP_INSET;
  const listBottomInset = SITE_SIZE_LIST_BOTTOM_INSET;
  const listHeight = sizes.length > 0 ? sizes.length * optionHeight + (sizes.length - 1) * optionGap : 0;
  const panelHeight = listTopInset + listHeight + listBottomInset;
  const menuHeight = menuHeightPx ?? panelHeight;
  const isMenuScrollable = menuHeight < panelHeight;
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
              "--site-size-menu-height": `${menuHeight}px`,
            } as CSSProperties)
          : undefined
      }
    >
      <button
        type="button"
        ref={triggerRef}
        className={`${triggerClassName} site-product-detail__size-trigger${isSingleOption ? " site-product-detail__size-trigger--static" : ""}`.trim()}
        aria-haspopup={isSingleOption ? undefined : "listbox"}
        aria-expanded={isSingleOption ? undefined : isOpen}
        onClick={() => {
          if (isSingleOption) {
            return;
          }

          if (isOpen) {
            closeSizeSelector();
            return;
          }

          openSizeSelector();
        }}
      >
        <span>{displayValue !== undefined ? (displayValue ?? placeholder) : (selectedSize ?? placeholder)}</span>
        {isSingleOption ? null : (
          <img
            src={resolveSitePublicAssetUrl("/site-mock/product-detail/size-arrow.svg")}
            alt=""
            aria-hidden="true"
            className="site-product-detail__size-arrow"
          />
        )}
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
              <p className="site-product-detail__size-sheet-title">{sheetTitle}</p>
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
          <div className="site-product-detail__size-menu-surface">
            <div className={`site-product-detail__size-menu-list${isMenuScrollable ? " site-product-detail__size-menu-list--scrollable" : ""}`}>
              {renderedOptions}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
