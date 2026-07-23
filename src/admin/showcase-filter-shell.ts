import type { CatalogFilterGroup } from "./showcase-contracts";

/**
 * Stable filter-bar skeleton for first paint.
 * Shape matches admin showcase catalog-experience groups;
 * options and selected-state labels come from API afterwards.
 */
const FILTER_SHELL_BLUEPRINT: ReadonlyArray<Omit<CatalogFilterGroup, "options">> = [
  {
    key: "sort",
    label: "СОРТИРОВКА",
    queryParam: "sort",
    selectionMode: "single",
  },
  {
    key: "availability",
    label: "НАЛИЧИЕ",
    queryParam: "availability",
    selectionMode: "single",
  },
  {
    key: "section",
    label: "РАЗДЕЛ",
    queryParam: "section",
    selectionMode: "multiple",
    panelWidth: "wide",
    maxVisibleOptions: 12,
    prioritizeSelected: true,
  },
  {
    key: "designer",
    label: "ДИЗАЙНЕРЫ",
    queryParam: "designer",
    selectionMode: "multiple",
    panelWidth: "wide",
    prioritizeSelected: true,
  },
  {
    key: "gender",
    label: "ПОЛ",
    queryParam: "gender",
    selectionMode: "single",
  },
];

export function createShowcaseFilterShell(): CatalogFilterGroup[] {
  return FILTER_SHELL_BLUEPRINT.map((group) => ({
    ...group,
    options: [],
  }));
}
