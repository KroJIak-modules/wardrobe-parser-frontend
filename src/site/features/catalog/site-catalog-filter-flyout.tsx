import type { CSSProperties } from "react";
import type { SiteCatalogFilterGroup, SiteCatalogFilterOption } from "./site-catalog-contracts";
import { SHOW_ALL_DESIGNERS_VALUE } from "./site-catalog-filter-constants";
import { getOrderedCatalogFilterOptions } from "./site-catalog-filter-options";

const FILTER_OPTION_HEIGHT_PX = 13;
const FILTER_OPTION_GAP_PX = 6;

function getListContentHeight(optionCount: number) {
  if (optionCount <= 0) {
    return 0;
  }
  return optionCount * FILTER_OPTION_HEIGHT_PX + (optionCount - 1) * FILTER_OPTION_GAP_PX;
}

export function SiteCatalogFilterFlyout({
  group,
  selectedValues,
  hasResettableSelection,
  onToggle,
  onReset,
}: {
  group: SiteCatalogFilterGroup;
  selectedValues: readonly string[];
  hasResettableSelection: boolean;
  onToggle: (option: SiteCatalogFilterOption) => void;
  onReset: () => void;
}) {
  const selectedSet = new Set(selectedValues);
  const finalOptions = getOrderedCatalogFilterOptions(group, selectedValues);
  const isAdaptiveSectionFlyout = group.key === "section";
  const naturalListHeightPx = getListContentHeight(finalOptions.length);
  const maxListHeightPx = group.panelListHeightPx ?? naturalListHeightPx;
  const computedListHeightPx = isAdaptiveSectionFlyout ? Math.min(naturalListHeightPx, maxListHeightPx) : group.panelListHeightPx;
  const panelChromeHeightPx =
    group.panelHeightPx !== undefined && group.panelListHeightPx !== undefined
      ? Math.max(0, group.panelHeightPx - group.panelListHeightPx)
      : undefined;
  const shouldScroll =
    isAdaptiveSectionFlyout && maxListHeightPx > 0 ? naturalListHeightPx > maxListHeightPx : Boolean(group.maxVisibleOptions && finalOptions.length > group.maxVisibleOptions);
  const listStyle = {
    /* The options share the panel's fixed 155px width, so every label has a
     * single, genuinely centred alignment regardless of legacy data offsets. */
    width: "100%",
    top: `${group.panelListTopPx ?? 7}px`,
    ...(computedListHeightPx ? { height: `${computedListHeightPx}px` } : group.panelListHeightPx ? { minHeight: `${group.panelListHeightPx}px` } : {}),
    left: "0",
    transform: "none",
    ...(shouldScroll && computedListHeightPx ? { "--site-catalog-list-height": `${computedListHeightPx}px` } : {}),
  } as CSSProperties;
  const panelStyle = {
    "--site-catalog-panel-height": `${isAdaptiveSectionFlyout && computedListHeightPx && panelChromeHeightPx !== undefined ? computedListHeightPx + panelChromeHeightPx : group.panelHeightPx ?? 46}px`,
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
            const isStrongAction = option.value === SHOW_ALL_DESIGNERS_VALUE || Boolean(option.keepAtBottom);
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
      {hasResettableSelection ? (
        <button type="button" className="site-catalog-filters__reset" onClick={onReset}>
          Сбросить все
        </button>
      ) : null}
    </div>
  );
}
