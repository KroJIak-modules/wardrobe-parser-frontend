import type { CSSProperties } from "react";
import type { SiteCatalogFilterGroup, SiteCatalogFilterOption } from "./site-catalog-contracts";
import { SHOW_ALL_DESIGNERS_VALUE } from "./site-catalog-filter-constants";
import { getOrderedCatalogFilterOptions } from "./site-catalog-filter-options";

export function SiteCatalogFilterFlyout({
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
  const finalOptions = getOrderedCatalogFilterOptions(group, selectedValues);
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
