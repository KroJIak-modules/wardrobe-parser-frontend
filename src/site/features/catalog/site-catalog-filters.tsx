import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { createSiteDesignersLocationState } from "../designers/site-designers-navigation";
import type { SiteCatalogFilterGroup } from "./site-catalog-contracts";
import { SHOW_ALL_DESIGNERS_VALUE } from "./site-catalog-filter-constants";
import { SiteCatalogFilterFlyout } from "./site-catalog-filter-flyout";
import {
  clearCatalogGroupSelection,
  getCatalogSelectedValues,
  getCatalogTriggerLabel,
  toggleCatalogGroupOption,
} from "./site-catalog-logic";

export function SiteCatalogFilters({
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
        const selectedValues = getCatalogSelectedValues(searchParams, group, { mode: "effective" });
        const resettableValues = getCatalogSelectedValues(searchParams, group);
        const triggerLabel = getCatalogTriggerLabel(searchParams, group, selectedValues);
        const shouldShowCount =
          group.selectionMode === "multiple" &&
          (group.key === "section" || group.key === "designer"
            ? selectedValues.length > 0
            : selectedValues.length > 1);

        const optionsReady = group.options.length > 0;

        return (
          <section
            key={group.key}
            className="site-catalog-filters__group"
            style={
              ({
                ...(group.triggerWidthPx ? { "--site-catalog-trigger-width": `${group.triggerWidthPx}px` } : {}),
                "--site-catalog-flyout-width": "155px",
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
              aria-expanded={isActive && optionsReady}
              onClick={() => setActiveGroupKey((current) => (current === group.key ? null : group.key))}
            >
              <span>{triggerLabel}</span>
              {shouldShowCount ? <span className="site-catalog-filters__trigger-note">({selectedValues.length})</span> : null}
            </button>
            <div className="site-catalog-filters__safe-zone" aria-hidden="true" />
            {isActive && optionsReady ? (
              <SiteCatalogFilterFlyout
                group={group}
                selectedValues={selectedValues}
                hasResettableSelection={
                  group.key === "sort"
                    ? resettableValues.some((value) => value !== "featured")
                    : resettableValues.length > 0
                }
                onReset={() => onChange(clearCatalogGroupSelection(searchParams, group))}
                onToggle={(option) => {
                  if (group.key === "designer" && option.value === SHOW_ALL_DESIGNERS_VALUE) {
                    navigate(
                      {
                        pathname: "/designers",
                        search: searchParams.toString() ? `?${searchParams.toString()}` : "",
                      },
                      {
                        state: createSiteDesignersLocationState("catalog-filter"),
                      },
                    );
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
