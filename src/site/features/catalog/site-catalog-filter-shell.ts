import type { SiteCatalogFilterGroup } from "./site-catalog-contracts";

/**
 * Stable filter-bar skeleton for first paint.
 * Labels/keys/query params mirror the catalog-experience contract;
 * options arrive from API and only then rename single-select triggers.
 */
const FILTER_UI_PRESETS: Record<string, Partial<SiteCatalogFilterGroup>> = {
  sort: {
    triggerWidthPx: 140,
    panelHeightPx: 65,
    panelListWidthPx: 112,
    panelFlyoutWidthPx: 134,
    panelListTopPx: 7,
    panelListLeftPx: 11,
    panelListHeightPx: 45,
    panelListAlign: "start",
  },
  availability: {
    triggerWidthPx: 80,
    panelHeightPx: 46,
    panelListWidthPx: 72,
    panelFlyoutWidthPx: 134,
    panelListTopPx: 7,
    panelListHeightPx: 32,
    panelListAlign: "center",
  },
  section: {
    triggerWidthPx: 65,
    panelHeightPx: 369,
    panelListWidthPx: 117,
    panelFlyoutWidthPx: 133,
    panelListTopPx: 7,
    panelListLeftPx: 7,
    panelListHeightPx: 355,
    panelListAlign: "start",
    panelWidth: "wide",
    maxVisibleOptions: 19,
    prioritizeSelected: true,
  },
  designer: {
    triggerWidthPx: 105,
    panelHeightPx: 160,
    panelListWidthPx: 120,
    panelFlyoutWidthPx: 134,
    panelListTopPx: 7,
    panelListLeftPx: 7,
    panelListHeightPx: 146,
    panelListAlign: "start",
    panelWidth: "wide",
    maxVisibleOptions: 8,
    prioritizeSelected: true,
  },
  gender: {
    triggerWidthPx: 35,
    panelHeightPx: 46,
    panelListWidthPx: 72,
    panelFlyoutWidthPx: 134,
    panelListTopPx: 7,
    panelListHeightPx: 32,
    panelListAlign: "center",
  },
};

const FILTER_SHELL_BLUEPRINT: ReadonlyArray<Omit<SiteCatalogFilterGroup, "options"> & { options?: never }> = [
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
    maxVisibleOptions: 19,
    prioritizeSelected: true,
  },
  {
    key: "designer",
    label: "ДИЗАЙНЕРЫ",
    queryParam: "designer",
    selectionMode: "multiple",
    panelWidth: "wide",
    maxVisibleOptions: 8,
    prioritizeSelected: true,
  },
  {
    key: "gender",
    label: "ПОЛ",
    queryParam: "gender",
    selectionMode: "single",
  },
];

export function createSiteCatalogFilterShell(): SiteCatalogFilterGroup[] {
  return FILTER_SHELL_BLUEPRINT.map((group) => ({
    ...group,
    options: [],
    ...FILTER_UI_PRESETS[group.key],
  }));
}

export function getSiteCatalogFilterUiPreset(key: string): Partial<SiteCatalogFilterGroup> {
  return FILTER_UI_PRESETS[key] ?? {};
}
