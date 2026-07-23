import { useCallback, useState, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AdminShowcaseProductCard, AdminShowcaseProductCardSkeleton } from "./admin-showcase-product-card";
import { useAdminShowcaseCatalog } from "./hooks/use-admin-showcase-catalog";
import type { CatalogFilterGroup, CatalogFilterOption, CatalogViewKey } from "./showcase-contracts";
import {
  clearShowcaseGroupSelection,
  getShowcaseFlyoutOptions,
  getShowcaseGroupSelection,
  getShowcaseTriggerLabel,
  toggleShowcaseGroupOption,
} from "./showcase-catalog-filter-logic";
import { buildRouteTargetHref, buildRouteTargetHrefWithCarry } from "./showcase-url-state";
import "./admin-showcase-catalog-page.css";

const SKELETON_COUNT = 12;

function ShowcaseFilterFlyout({
  group,
  selectedValues,
  currentSearchParams,
  onToggle,
  onReset,
  onNavigate,
}: {
  group: CatalogFilterGroup;
  selectedValues: readonly string[];
  currentSearchParams: URLSearchParams;
  onToggle: (option: CatalogFilterOption) => void;
  onReset: () => void;
  onNavigate: (href: string) => void;
}) {
  const flyoutOptions = getShowcaseFlyoutOptions(group, selectedValues);
  const hasResettableSelection =
    group.key === "sort"
      ? selectedValues.some((value) => value !== "featured")
      : selectedValues.length > 0;
  const panelClassName =
    group.panelWidth === "wide" ? "showcase-filters__panel showcase-filters__panel--wide" : "showcase-filters__panel";
  const flyoutClassName =
    group.panelWidth === "wide" ? "showcase-filters__flyout showcase-filters__flyout--wide" : "showcase-filters__flyout";

  // Section: scroll only when more than 20 options; otherwise show the full list.
  const sectionScrollThreshold = 20;
  const shouldScroll =
    group.key === "section"
      ? flyoutOptions.length > sectionScrollThreshold
      : Boolean(group.maxVisibleOptions && flyoutOptions.length > group.maxVisibleOptions && group.key !== "designer");
  const scrollVisibleCount =
    group.key === "section" ? sectionScrollThreshold : (group.maxVisibleOptions ?? flyoutOptions.length);
  const listClassName = shouldScroll ? "showcase-filters__list showcase-filters__list--scrollable" : "showcase-filters__list";
  const listStyle = shouldScroll
    ? ({
        "--showcase-filter-visible-options": String(scrollVisibleCount),
      } as CSSProperties)
    : undefined;

  const actionHref = group.actionItem
    ? group.key === "designer"
      // Public filter action opens the directory in catalog-filter mode: preserve
      // the complete catalog query, not just the selected designers.
      ? (() => {
          const targetHref = buildRouteTargetHref(group.actionItem.target);
          const currentQuery = currentSearchParams.toString();
          if (!currentQuery) {
            return targetHref;
          }
          return `${targetHref}${targetHref.includes("?") ? "&" : "?"}${currentQuery}`;
        })()
      : group.actionItem.carryKeys?.length
        ? buildRouteTargetHrefWithCarry(group.actionItem.target, currentSearchParams, group.actionItem.carryKeys)
        : buildRouteTargetHref(group.actionItem.target)
    : null;

  return (
    <div className={flyoutClassName}>
      <div className={panelClassName}>
        {flyoutOptions.length > 0 || group.actionItem ? (
          <ul className={listClassName} style={listStyle}>
            {flyoutOptions.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              if (!option.interactive) {
                return (
                  <li key={option.id}>
                    <div
                      className={
                        option.strong
                          ? "showcase-filters__item showcase-filters__item--static showcase-filters__item--action-strong"
                          : "showcase-filters__item showcase-filters__item--static"
                      }
                    >
                      <span>{option.label}</span>
                    </div>
                  </li>
                );
              }

              return (
                <li key={option.id}>
                  <button
                    type="button"
                    className={isSelected ? "showcase-filters__item showcase-filters__item--selected" : "showcase-filters__item"}
                    onClick={() => onToggle(option)}
                  >
                    <span>{option.label}</span>
                  </button>
                </li>
              );
            })}
            {group.actionItem && actionHref ? (
              <li key={`${group.key}-action`}>
                <button
                  type="button"
                  className={
                    group.actionItem.emphasis === "strong"
                      ? "showcase-filters__item showcase-filters__item--action-strong"
                      : "showcase-filters__item"
                  }
                  onClick={() => onNavigate(actionHref)}
                >
                  <span>{group.actionItem.label}</span>
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
      {hasResettableSelection ? (
        <button type="button" className="showcase-filters__reset" onClick={onReset}>
          Сбросить все
        </button>
      ) : null}
    </div>
  );
}

type ShowcasePaginationItem = number | "ellipsis";

function buildShowcasePaginationItems(currentPage: number, totalPages: number): ShowcasePaginationItem[] {
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

function ShowcaseCatalogPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pageItems = buildShowcasePaginationItems(currentPage, totalPages);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="showcase-catalog-pagination" aria-label="Страницы каталога">
      <button
        type="button"
        className="showcase-catalog-pagination__arrow showcase-catalog-pagination__arrow--left"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        aria-label="Предыдущая страница"
      >
        <svg viewBox="0 0 10 18" aria-hidden="true">
          <path d="M8.5 1.5 2 9l6.5 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {pageItems.map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="showcase-catalog-pagination__ellipsis" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={
              item === currentPage
                ? "showcase-catalog-pagination__page showcase-catalog-pagination__page--active"
                : "showcase-catalog-pagination__page"
            }
            onClick={() => onPageChange(item)}
            aria-current={item === currentPage ? "page" : undefined}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className="showcase-catalog-pagination__arrow showcase-catalog-pagination__arrow--right"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        aria-label="Следующая страница"
      >
        <svg viewBox="0 0 10 18" aria-hidden="true">
          <path d="M1.5 1.5 8 9l-6.5 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </nav>
  );
}

export function AdminShowcaseCatalogPage({ viewKey }: { viewKey: CatalogViewKey }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);
  const { header, filterGroups, products, currentPage, totalPages, loading, errorMessage } = useAdminShowcaseCatalog(
    viewKey,
    searchParams,
  );

  const applyFilterSearchParams = useCallback(
    (nextParams: URLSearchParams) => {
      const normalized = new URLSearchParams(nextParams);
      normalized.delete("page");
      setSearchParams(normalized);
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    },
    [setSearchParams],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const nextParams = new URLSearchParams(searchParams);
      if (page <= 1) {
        nextParams.delete("page");
      } else {
        nextParams.set("page", String(page));
      }
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams],
  );

  return (
    <section className="showcase-catalog-page" aria-label="Страница листинга витрины">
      <header className="showcase-catalog-page__header">
        <h1 className="showcase-catalog-page__title">{header.title}</h1>
        {header.description ? <p className="showcase-catalog-page__description">{header.description}</p> : null}
      </header>

      <div className="showcase-filters" onMouseLeave={() => setActiveGroupKey(null)}>
        {filterGroups.map((group) => {
          const isActive = activeGroupKey === group.key;
          const selectedValues = getShowcaseGroupSelection(searchParams, group);
          const triggerLabel = getShowcaseTriggerLabel(group, selectedValues);
          const shouldShowCount =
            group.selectionMode === "multiple" &&
            (group.key === "section" || group.key === "designer"
              ? selectedValues.length > 0
              : selectedValues.length > 1);
          const optionsReady = group.options.length > 0 || Boolean(group.actionItem);

          return (
            <section
              key={group.key}
              className="showcase-filters__group"
              onMouseEnter={() => setActiveGroupKey(group.key)}
              onFocus={() => setActiveGroupKey(group.key)}
            >
              <button
                type="button"
                className={isActive ? "showcase-filters__trigger showcase-filters__trigger--active" : "showcase-filters__trigger"}
                aria-expanded={isActive && optionsReady}
              >
                <span>{triggerLabel}</span>
                {shouldShowCount ? <span className="showcase-filters__trigger-note">({selectedValues.length})</span> : null}
              </button>
              <div className="showcase-filters__safe-zone" aria-hidden="true" />
              {isActive && optionsReady ? (
                <ShowcaseFilterFlyout
                  group={group}
                  selectedValues={selectedValues}
                  currentSearchParams={searchParams}
                  onToggle={(option) =>
                    applyFilterSearchParams(toggleShowcaseGroupOption(searchParams, group, option.value))
                  }
                  onReset={() => applyFilterSearchParams(clearShowcaseGroupSelection(searchParams, group))}
                  onNavigate={(href) => navigate(href, { state: group.key === "designer" ? { designersEntryMode: "catalog-filter" } : undefined })}
                />
              ) : null}
            </section>
          );
        })}
      </div>

      <div className="showcase-catalog-products">
        {loading && products.length === 0 ? (
          <div className="showcase-catalog-products__grid">
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <AdminShowcaseProductCardSkeleton key={`showcase-catalog-skeleton-${index}`} />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="showcase-catalog-products__empty">{errorMessage}</div>
        ) : products.length === 0 ? (
          <div className="showcase-catalog-products__empty">Ничего не найдено</div>
        ) : (
          <div className="showcase-catalog-products__grid">
            {products.map((product) => (
              <AdminShowcaseProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {!errorMessage ? <ShowcaseCatalogPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /> : null}
    </section>
  );
}
