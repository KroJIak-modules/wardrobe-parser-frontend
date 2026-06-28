import type { SiteCatalogFilterGroup, SiteCatalogFilterOption } from "./site-catalog-contracts";
import { SHOW_ALL_DESIGNERS_VALUE } from "./site-catalog-filter-constants";
import { getCatalogDesignerMap } from "./site-catalog-logic";

function resolveFlyoutOptions(group: SiteCatalogFilterGroup, selectedValues: readonly string[]) {
  const selectedSet = new Set(selectedValues);
  if (group.key !== "designer") {
    return group.options;
  }

  const designerMap = getCatalogDesignerMap();
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
}

export function getOrderedCatalogFilterOptions(group: SiteCatalogFilterGroup, selectedValues: readonly string[]) {
  const selectedSet = new Set(selectedValues);
  const effectiveOptions = resolveFlyoutOptions(group, selectedValues);
  const orderedOptions =
    group.prioritizeSelected && selectedSet.size > 0
      ? [
          ...effectiveOptions.filter((option) => selectedSet.has(option.value)),
          ...effectiveOptions.filter((option) => !selectedSet.has(option.value)),
        ]
      : effectiveOptions;
  const pinnedToBottom = orderedOptions.filter((option) => option.keepAtBottom);
  if (pinnedToBottom.length === 0) {
    return orderedOptions;
  }

  return [...orderedOptions.filter((option) => !option.keepAtBottom), ...pinnedToBottom];
}
