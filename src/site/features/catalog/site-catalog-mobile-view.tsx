import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { storefrontHomeState } from "../../app/site-home-entry";
import { SiteMobileHomeHeader } from "../header/site-mobile-home-header";
import { SiteProductsGrid } from "../storefront/site-products-section";
import { SiteFooterSection } from "../storefront/site-storefront-sections";
import type { SiteCatalogFilterGroup, SiteCatalogHeaderSource, SiteCatalogProduct } from "./site-catalog-contracts";
import type { SiteApiNavigation } from "../../runtime/site-public-api";
import {
  clearCatalogGroupSelection,
  getCatalogSelectedValues,
  getCatalogTriggerLabel,
  toggleCatalogGroupOption,
} from "./site-catalog-logic";
import {
  SiteCatalogMobileFiltersDrawer,
  type SiteCatalogMobileFiltersDrawerHandle,
} from "./site-catalog-mobile-filters-drawer";
import { SiteCatalogMobileDescription } from "./site-catalog-mobile-description";
import { SiteCatalogPagination } from "./site-catalog-pagination";
import "./site-catalog-mobile-view.css";

const MOBILE_HEADER_MAX_TITLE_LENGTH = 25;

function getMobileCatalogTitle(title: string, source: SiteCatalogHeaderSource) {
  if (source !== "search" || title.length <= MOBILE_HEADER_MAX_TITLE_LENGTH) {
    return title;
  }

  return `${title.slice(0, MOBILE_HEADER_MAX_TITLE_LENGTH - 1).trimEnd()}…`;
}

function SortChevron({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={isOpen ? "site-catalog-mobile__sort-chevron site-catalog-mobile__sort-chevron--open" : "site-catalog-mobile__sort-chevron"}
      viewBox="0 0 9 7"
      fill="none"
    >
      <path d="M1 1L4.5 5.5L8 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function orderMobileSortOptions(group: SiteCatalogFilterGroup) {
  const pinnedOptions = group.options.filter((option) => option.keepAtBottom);
  if (pinnedOptions.length === 0) {
    return group.options;
  }

  return [...group.options.filter((option) => !option.keepAtBottom), ...pinnedOptions];
}

export function SiteCatalogMobileView({
  navigation,
  title,
  titleSource,
  description,
  filterGroups,
  searchParams,
  onSearchParamsChange,
  products,
  currentPage,
  totalPages,
  loading = false,
  errorMessage = null,
  onPageChange,
}: {
  navigation: SiteApiNavigation | null;
  title: string;
  titleSource: SiteCatalogHeaderSource;
  description: string | null;
  filterGroups: readonly SiteCatalogFilterGroup[];
  searchParams: URLSearchParams;
  onSearchParamsChange: (next: URLSearchParams) => void;
  products: readonly SiteCatalogProduct[];
  currentPage: number;
  totalPages: number;
  loading?: boolean;
  errorMessage?: string | null;
  onPageChange: (page: number) => void;
}) {
  const navigate = useNavigate();
  const [openPanel, setOpenPanel] = useState<"filters" | "sort" | null>(null);
  const [isFiltersClosing, setIsFiltersClosing] = useState(false);
  const filtersDrawerRef = useRef<SiteCatalogMobileFiltersDrawerHandle | null>(null);
  const mobileTitle = useMemo(() => getMobileCatalogTitle(title, titleSource), [title, titleSource]);
  const sortGroup = useMemo(() => filterGroups.find((group) => group.key === "sort") ?? null, [filterGroups]);
  const hasSortControl = sortGroup !== null && sortGroup.options.length > 0;
  const filterPanelGroups = useMemo(() => filterGroups.filter((group) => group.key !== "sort"), [filterGroups]);
  const selectedSortValues = sortGroup ? getCatalogSelectedValues(searchParams, sortGroup, { mode: "effective" }) : [];
  const sortTriggerLabel = sortGroup ? getCatalogTriggerLabel(searchParams, sortGroup, selectedSortValues) : null;
  const orderedSortOptions = useMemo(() => (sortGroup ? orderMobileSortOptions(sortGroup) : []), [sortGroup]);

  useEffect(() => {
    if (hasSortControl || openPanel !== "sort") {
      return;
    }

    setOpenPanel(null);
  }, [hasSortControl, openPanel]);

  const openFilters = () => {
    setOpenPanel("filters");
    setIsFiltersClosing(false);
  };

  const closeFilters = () => {
    if (openPanel !== "filters" || isFiltersClosing) {
      return;
    }

    setIsFiltersClosing(true);
  };

  return (
    <div className="site-catalog-mobile">
      <SiteMobileHomeHeader
        navigation={navigation}
        onLogoActivate={() => {
          navigate("/", { state: storefrontHomeState() });
        }}
      />

      <div className="site-catalog-mobile__topbar">
        <h1 className="site-catalog-mobile__title">{mobileTitle}</h1>
        {description ? <SiteCatalogMobileDescription description={description} source={titleSource} /> : null}

        <div className="site-catalog-mobile__toolbar">
          <button
            type="button"
            className={openPanel === "filters" ? "site-catalog-mobile__toolbar-button site-catalog-mobile__toolbar-button--active" : "site-catalog-mobile__toolbar-button"}
            onClick={() => {
              if (openPanel === "filters") {
                filtersDrawerRef.current?.applyAndClose();
                return;
              }

              openFilters();
            }}
          >
            ФИЛЬТРЫ
          </button>

          {hasSortControl && sortGroup && sortTriggerLabel ? (
            <div className="site-catalog-mobile__sort-control">
              <button
                type="button"
                className={openPanel === "sort" ? "site-catalog-mobile__toolbar-button site-catalog-mobile__toolbar-button--active" : "site-catalog-mobile__toolbar-button"}
                onClick={() => setOpenPanel((current) => (current === "sort" ? null : "sort"))}
              >
                <SortChevron isOpen={openPanel === "sort"} />
                <span>{sortTriggerLabel}</span>
              </button>

              {openPanel === "sort" ? (
                <section className="site-catalog-mobile__sort-flyout" aria-label="Сортировка каталога">
                  <div className="site-catalog-mobile__sort-options">
                    {orderedSortOptions.map((option) => {
                      const isSelected = selectedSortValues.includes(option.value);
                      const isDecorative = Boolean(option.keepAtBottom);

                      return isDecorative ? (
                        <div key={option.id} className="site-catalog-mobile__sort-option site-catalog-mobile__sort-option--strong">
                          {option.label}
                        </div>
                      ) : (
                        <button
                          key={option.id}
                          type="button"
                          className={isSelected ? "site-catalog-mobile__sort-option site-catalog-mobile__sort-option--selected" : "site-catalog-mobile__sort-option"}
                          onClick={() => {
                            onSearchParamsChange(
                              isSelected
                                ? clearCatalogGroupSelection(searchParams, sortGroup)
                                : toggleCatalogGroupOption(searchParams, sortGroup, option.value)
                            );
                            setOpenPanel(null);
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {openPanel === "filters" ? (
        <SiteCatalogMobileFiltersDrawer
          ref={filtersDrawerRef}
          filterGroups={filterPanelGroups}
          searchParams={searchParams}
          isClosing={isFiltersClosing}
          onApply={(next) => {
            onSearchParamsChange(next);
            closeFilters();
          }}
          onClose={closeFilters}
          onCloseAnimationEnd={() => {
            setOpenPanel((current) => (current === "filters" ? null : current));
            setIsFiltersClosing(false);
          }}
        />
      ) : null}

      <div className="site-catalog-mobile__content">
        <section className="site-catalog-mobile__products" aria-label="Товары каталога">
          <SiteProductsGrid products={[...products]} layout="mobile" loading={loading} errorMessage={errorMessage} />
        </section>

        <div className="site-catalog-mobile__pagination">
          <SiteCatalogPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} layout="mobile" />
        </div>

        <div className="site-catalog-mobile__footer">
          <SiteFooterSection layout="mobile" />
        </div>
      </div>
    </div>
  );
}
