import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { SiteProductCard } from "../product-card/site-product-card";
import type {
  SiteCatalogFilterGroup,
  SiteCatalogFilterOption,
  SiteCatalogHeaderSource,
  SiteCatalogProduct,
} from "./site-catalog-contracts";
import {
  clearCatalogGroupSelection,
  getCatalogDesignerMap,
  getCatalogSelectedValues,
  getCatalogTriggerLabel,
  normalizeCatalogProductsForGrid,
  toggleCatalogGroupOption,
} from "./site-catalog-logic";
import "./site-catalog.css";

const SHOW_ALL_DESIGNERS_VALUE = "__all-designers";

type SiteCatalogPaginationItem = number | "ellipsis";

function buildCatalogPaginationItems(currentPage: number, totalPages: number): SiteCatalogPaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}

function SiteCatalogFilterFlyout({
  group,
  selectedValues,
  onToggle,
  onReset,
}: {
  group: SiteCatalogFilterGroup;
  selectedValues: readonly string[];
  onToggle: (option: SiteCatalogFilterOption) => void;
  onReset: () => void;
}) {
  const selectedSet = new Set(selectedValues);
  const hasSelection = group.key === "sort" ? selectedValues.some((value) => value !== "featured") : selectedSet.size > 0;
  const designerMap = getCatalogDesignerMap();
  const effectiveOptions =
    group.key === "designer"
      ? (() => {
          const strongAction = group.options.find((option) => option.value === SHOW_ALL_DESIGNERS_VALUE) ?? null;
          const baseDesignerOptions = group.options.filter((option) => option.value !== SHOW_ALL_DESIGNERS_VALUE);
          const selectedDesignerOptions = selectedValues
            .map((value) => {
              const fromBase = baseDesignerOptions.find((option) => option.value === value);
              if (fromBase) {
                return fromBase;
              }

              const designer = designerMap.get(value);
              return designer
                ? ({
                    id: `designer-selected-${designer.id}`,
                    label: designer.label,
                    value: designer.id,
                  } satisfies SiteCatalogFilterOption)
                : null;
            })
            .filter((option): option is SiteCatalogFilterOption => option !== null);
          const fallbackDesignerOptions = baseDesignerOptions.filter((option) => !selectedSet.has(option.value));
          const visibleDesignerOptions = [...selectedDesignerOptions, ...fallbackDesignerOptions].slice(0, 7);

          return strongAction ? [...visibleDesignerOptions, strongAction] : visibleDesignerOptions;
        })()
      : group.options;
  const orderedOptions =
    group.prioritizeSelected && selectedSet.size > 0
      ? [
          ...effectiveOptions.filter((option) => selectedSet.has(option.value)),
          ...effectiveOptions.filter((option) => !selectedSet.has(option.value)),
        ]
      : effectiveOptions;
  const finalOptions = (() => {
    const pinnedToBottom = orderedOptions.filter((option) => option.keepAtBottom);
    if (pinnedToBottom.length === 0) {
      return orderedOptions;
    }

    return [...orderedOptions.filter((option) => !option.keepAtBottom), ...pinnedToBottom];
  })();
  const shouldScroll = Boolean(group.maxVisibleOptions && finalOptions.length > group.maxVisibleOptions);
  const listStyle = {
    width: `${group.panelListWidthPx ?? 90}px`,
    top: `${group.panelListTopPx ?? 7}px`,
    ...(group.panelListHeightPx ? { minHeight: `${group.panelListHeightPx}px` } : {}),
    ...(group.panelListLeftPx !== undefined
      ? {
          left: `${group.panelListLeftPx}px`,
          transform: "none",
        }
      : {
          left: "50%",
          transform: "translateX(-50%)",
        }),
    ...(shouldScroll && group.maxVisibleOptions
      ? { "--site-catalog-visible-options": String(group.maxVisibleOptions) }
      : {}),
  } as CSSProperties;
  const panelStyle = {
    "--site-catalog-panel-height": `${group.panelHeightPx ?? 46}px`,
  } as CSSProperties;

  return (
    <div className="site-catalog-filters__flyout">
      <div className="site-catalog-filters__panel" style={panelStyle}>
        <ul
          className={
            shouldScroll
              ? "site-catalog-filters__list site-catalog-filters__list--scrollable"
              : "site-catalog-filters__list"
          }
          style={listStyle}
        >
          {finalOptions.map((option) => {
            const isSelected = selectedSet.has(option.value);
            const isStrongAction = option.value === SHOW_ALL_DESIGNERS_VALUE;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  className={
                    isSelected
                      ? "site-catalog-filters__item site-catalog-filters__item--selected"
                      : isStrongAction
                        ? "site-catalog-filters__item site-catalog-filters__item--strong"
                        : "site-catalog-filters__item"
                  }
                  onClick={() => onToggle(option)}
                >
                  <span>{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {hasSelection ? (
        <button type="button" className="site-catalog-filters__reset" onClick={onReset}>
          Сбросить все
        </button>
      ) : null}
    </div>
  );
}

function SiteCatalogProductsGrid({ products }: { products: readonly SiteCatalogProduct[] }) {
  const normalizedProducts = useMemo(() => normalizeCatalogProductsForGrid(products), [products]);

  if (normalizedProducts.length === 0) {
    return <div className="site-catalog-products__empty">Ничего не найдено</div>;
  }

  return (
    <div className="site-catalog-products__grid">
      {normalizedProducts.map((product) => (
        <SiteProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function SiteCatalogHeaderDescription({
  description,
  source,
}: {
  description: string;
  source: SiteCatalogHeaderSource;
}) {
  const shouldUseExpandableLayout = source === "designer" || source === "custom_catalog";
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpandable, setIsExpandable] = useState(false);
  const [collapsedDescription, setCollapsedDescription] = useState(description);
  const textRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    setIsExpanded(false);
    setCollapsedDescription(description);
  }, [description, source]);

  useEffect(() => {
    if (!shouldUseExpandableLayout) {
      setIsExpandable(false);
      return undefined;
    }

    const element = textRef.current;
    if (!element) {
      return undefined;
    }

    let isDisposed = false;
    let firstFrameId = 0;
    let secondFrameId = 0;

    function measureExpandableState() {
      const availableWidth = element.clientWidth;
      if (availableWidth <= 0) {
        return;
      }
      const computedStyle = window.getComputedStyle(element);
      const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 18;
      const collapsedHeight = lineHeight * 2 + 1;

      const measurementNode = document.createElement("p");
      measurementNode.className = "site-catalog-shell__description";
      measurementNode.style.position = "absolute";
      measurementNode.style.visibility = "hidden";
      measurementNode.style.pointerEvents = "none";
      measurementNode.style.inset = "0 auto auto 0";
      measurementNode.style.height = "auto";
      measurementNode.style.minHeight = "0";
      measurementNode.style.maxHeight = "none";
      measurementNode.style.margin = "0";
      measurementNode.style.overflow = "visible";
      measurementNode.style.whiteSpace = "normal";
      measurementNode.style.display = "block";
      measurementNode.style.width = `${availableWidth}px`;

      document.body.appendChild(measurementNode);

      const renderCollapsedMeasurement = (previewText: string) => {
        measurementNode.textContent = "";
        measurementNode.append(document.createTextNode(previewText));

        const suffix = document.createElement("span");
        suffix.className = "site-catalog-shell__read-more-inline";
        suffix.textContent = "...Читать дальше";
        measurementNode.append(suffix);
      };

      measurementNode.textContent = description;
      const fullHeight = measurementNode.getBoundingClientRect().height;

      if (fullHeight <= collapsedHeight) {
        measurementNode.remove();
        setIsExpandable(false);
        setCollapsedDescription(description);
        return;
      }

      let low = 0;
      let high = description.length;
      let bestLength = 0;

      while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        renderCollapsedMeasurement(description.slice(0, middle).trimEnd());

        if (measurementNode.getBoundingClientRect().height <= collapsedHeight) {
          bestLength = middle;
          low = middle + 1;
        } else {
          high = middle - 1;
        }
      }

      let bestPreview = description.slice(0, bestLength).trimEnd();
      const safeSpaceIndex = bestPreview.lastIndexOf(" ");
      if (safeSpaceIndex >= bestPreview.length - 24) {
        bestPreview = bestPreview.slice(0, safeSpaceIndex).trimEnd();
      }

      measurementNode.remove();
      setIsExpandable(true);
      setCollapsedDescription(bestPreview.trimEnd());
    }

    function scheduleMeasurement() {
      cancelAnimationFrame(firstFrameId);
      cancelAnimationFrame(secondFrameId);
      firstFrameId = window.requestAnimationFrame(() => {
        secondFrameId = window.requestAnimationFrame(() => {
          if (!isDisposed) {
            measureExpandableState();
          }
        });
      });
    }

    scheduleMeasurement();

    const resizeObserver = new ResizeObserver(() => {
      scheduleMeasurement();
    });
    resizeObserver.observe(element);
    if (element.parentElement) {
      resizeObserver.observe(element.parentElement);
    }

    const handleWindowResize = () => {
      scheduleMeasurement();
    };
    window.addEventListener("resize", handleWindowResize);

    const fontFaceSet = "fonts" in document ? document.fonts : null;
    const handleFontsLoaded = () => {
      scheduleMeasurement();
    };
    fontFaceSet?.ready.then(() => {
      if (!isDisposed) {
        scheduleMeasurement();
      }
    });
    fontFaceSet?.addEventListener?.("loadingdone", handleFontsLoaded);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(firstFrameId);
      cancelAnimationFrame(secondFrameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleWindowResize);
      fontFaceSet?.removeEventListener?.("loadingdone", handleFontsLoaded);
    };
  }, [description, shouldUseExpandableLayout]);

  return (
    <div
      className={
        isExpanded
          ? "site-catalog-shell__description-block site-catalog-shell__description-block--expanded"
          : "site-catalog-shell__description-block"
      }
    >
      <p
        ref={textRef}
        className={
          shouldUseExpandableLayout && !isExpanded
            ? "site-catalog-shell__description site-catalog-shell__description--collapsed"
            : "site-catalog-shell__description"
        }
      >
        {shouldUseExpandableLayout && isExpandable && !isExpanded ? (
          <>
            <span>{collapsedDescription}</span>
            <button type="button" className="site-catalog-shell__read-more-inline" onClick={() => setIsExpanded(true)}>
              ...Читать дальше
            </button>
          </>
        ) : (
          description
        )}
      </p>
    </div>
  );
}

function SiteCatalogFilters({
  filterGroups,
  searchParams,
  onChange,
}: {
  filterGroups: readonly SiteCatalogFilterGroup[];
  searchParams: URLSearchParams;
  onChange: (next: URLSearchParams) => void;
}) {
  const navigate = useNavigate();
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);

  return (
    <div className="site-catalog-filters">
      {filterGroups.map((group) => {
        const isActive = activeGroupKey === group.key;
        const selectedValues = getCatalogSelectedValues(searchParams, group);
        const triggerLabel = getCatalogTriggerLabel(group, selectedValues);
        const shouldShowCount =
          group.selectionMode === "multiple" &&
          (group.key === "section" || group.key === "designer"
            ? selectedValues.length > 0
            : selectedValues.length > 1);

        return (
          <section
            key={group.key}
            className="site-catalog-filters__group"
            style={
              ({
                ...(group.triggerWidthPx ? { "--site-catalog-trigger-width": `${group.triggerWidthPx}px` } : {}),
                "--site-catalog-flyout-width": `${group.panelFlyoutWidthPx ?? Math.max(134, (group.panelListWidthPx ?? 90) + 14)}px`,
              } as CSSProperties)
            }
            onMouseEnter={() => setActiveGroupKey(group.key)}
            onMouseLeave={() => setActiveGroupKey((current) => (current === group.key ? null : current))}
            onFocus={() => setActiveGroupKey(group.key)}
          >
            <button
              type="button"
              className={
                isActive
                  ? "site-catalog-filters__trigger site-catalog-filters__trigger--active"
                  : "site-catalog-filters__trigger"
              }
              aria-expanded={isActive}
              onClick={() => setActiveGroupKey((current) => (current === group.key ? null : group.key))}
            >
              <span>{triggerLabel}</span>
              {shouldShowCount ? <span className="site-catalog-filters__trigger-note">({selectedValues.length})</span> : null}
            </button>
            <div className="site-catalog-filters__safe-zone" aria-hidden="true" />
            {isActive ? (
              <SiteCatalogFilterFlyout
                group={group}
                selectedValues={selectedValues}
                onReset={() => onChange(clearCatalogGroupSelection(searchParams, group))}
                onToggle={(option) => {
                  if (group.key === "designer" && option.value === SHOW_ALL_DESIGNERS_VALUE) {
                    navigate({
                      pathname: "/designers",
                      search: searchParams.toString() ? `?${searchParams.toString()}` : "",
                    });
                    return;
                  }

                  onChange(toggleCatalogGroupOption(searchParams, group, option.value));
                }}
              />
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

export function SiteCatalogExperienceView({
  title,
  description,
  descriptionSource,
  filterGroups,
  searchParams,
  onSearchParamsChange,
  products,
  currentPage,
  totalPages,
  onPageChange,
}: {
  title: string;
  description: string | null;
  descriptionSource: SiteCatalogHeaderSource;
  filterGroups: readonly SiteCatalogFilterGroup[];
  searchParams: URLSearchParams;
  onSearchParamsChange: (next: URLSearchParams) => void;
  products: readonly SiteCatalogProduct[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pageItems = useMemo(() => buildCatalogPaginationItems(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <section className="site-catalog-shell" aria-label="Каталог Anton Shell">
      <header className="site-catalog-shell__header">
        <h1 className="site-catalog-shell__title">{title}</h1>
        {description ? <SiteCatalogHeaderDescription description={description} source={descriptionSource} /> : null}
      </header>

      <div className="site-catalog-shell__filters">
        <SiteCatalogFilters
          filterGroups={filterGroups}
          searchParams={searchParams}
          onChange={onSearchParamsChange}
        />
      </div>

      <div className="site-catalog-shell__products">
        <SiteCatalogProductsGrid products={products} />
      </div>

      {totalPages > 1 ? (
        <nav className="site-catalog-pagination" aria-label="Страницы каталога">
          <button
            type="button"
            className="site-catalog-pagination__arrow site-catalog-pagination__arrow--left"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            aria-label="Предыдущая страница"
          >
            <svg viewBox="0 0 6 11" aria-hidden="true">
              <path d="M0.199636 10.8394C0.420545 11.0539 0.777818 11.0539 0.998182 10.8394L5.66891 6.29423C5.77346 6.19404 5.85671 6.07345 5.9136 5.9398C5.97049 5.80616 5.99982 5.66224 5.99982 5.5168C5.99982 5.37136 5.97049 5.22745 5.9136 5.0938C5.85671 4.96015 5.77346 4.83957 5.66891 4.73938L0.964364 0.160625C0.857593 0.0582965 0.716199 0.000780936 0.568897 -0.000240587C0.421595 -0.00126211 0.279429 0.054287 0.171273 0.155125C0.117694 0.204923 0.0748234 0.26528 0.0453167 0.332461C0.01581 0.399642 0.000294966 0.472216 -0.000267501 0.545689C-0.000829969 0.619161 0.0135721 0.691968 0.0420467 0.7596C0.0705214 0.827232 0.112462 0.88825 0.165273 0.938875L4.47109 5.12823C4.52341 5.17832 4.56507 5.23863 4.59354 5.30548C4.62201 5.37233 4.63669 5.44432 4.63669 5.51708C4.63669 5.58983 4.62201 5.66182 4.59354 5.72867C4.56507 5.79552 4.52341 5.85583 4.47109 5.90593L0.199636 10.0623C0.147333 10.1123 0.105681 10.1726 0.0772178 10.2394C0.0487547 10.3062 0.0340761 10.3781 0.0340761 10.4509C0.0340761 10.5236 0.0487547 10.5955 0.0772178 10.6623C0.105681 10.7291 0.147333 10.7894 0.199636 10.8394Z" />
            </svg>
          </button>

          {pageItems.map((item, index) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="site-catalog-pagination__ellipsis" aria-hidden="true">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={
                  item === currentPage
                    ? "site-catalog-pagination__page site-catalog-pagination__page--active"
                    : "site-catalog-pagination__page"
                }
                onClick={() => onPageChange(item)}
                aria-current={item === currentPage ? "page" : undefined}
              >
                {item}
              </button>
            )
          )}

          <button
            type="button"
            className="site-catalog-pagination__arrow site-catalog-pagination__arrow--right"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            aria-label="Следующая страница"
          >
            <svg viewBox="0 0 6 11" aria-hidden="true">
              <path d="M0.199636 10.8394C0.420545 11.0539 0.777818 11.0539 0.998182 10.8394L5.66891 6.29423C5.77346 6.19404 5.85671 6.07345 5.9136 5.9398C5.97049 5.80616 5.99982 5.66224 5.99982 5.5168C5.99982 5.37136 5.97049 5.22745 5.9136 5.0938C5.85671 4.96015 5.77346 4.83957 5.66891 4.73938L0.964364 0.160625C0.857593 0.0582965 0.716199 0.000780936 0.568897 -0.000240587C0.421595 -0.00126211 0.279429 0.054287 0.171273 0.155125C0.117694 0.204923 0.0748234 0.26528 0.0453167 0.332461C0.01581 0.399642 0.000294966 0.472216 -0.000267501 0.545689C-0.000829969 0.619161 0.0135721 0.691968 0.0420467 0.7596C0.0705214 0.827232 0.112462 0.88825 0.165273 0.938875L4.47109 5.12823C4.52341 5.17832 4.56507 5.23863 4.59354 5.30548C4.62201 5.37233 4.63669 5.44432 4.63669 5.51708C4.63669 5.58983 4.62201 5.66182 4.59354 5.72867C4.56507 5.79552 4.52341 5.85583 4.47109 5.90593L0.199636 10.0623C0.147333 10.1123 0.105681 10.1726 0.0772178 10.2394C0.0487547 10.3062 0.0340761 10.3781 0.0340761 10.4509C0.0340761 10.5236 0.0487547 10.5955 0.0772178 10.6623C0.105681 10.7291 0.147333 10.7894 0.199636 10.8394Z" />
            </svg>
          </button>
        </nav>
      ) : null}
    </section>
  );
}
