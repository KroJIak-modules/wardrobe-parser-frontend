export type ShowcaseTopSectionKey = "new" | "designers" | "men" | "women" | "sale";

export type CatalogViewKey = "default" | "designers" | "sale";

export type ShowcaseIconToken = "sort-desc" | "sort-asc" | "preorder" | "in-stock";

export type ShowcaseQueryValue = string | readonly string[];

export type ShowcaseQueryPatch = Record<string, ShowcaseQueryValue | null | undefined>;

export type ShowcaseRouteTarget = {
  pathname: "/" | "/catalog" | "/catalog/designers" | "/catalog/sale";
  query?: ShowcaseQueryPatch;
};

export type ShowcaseNavigationMenuItemKind = "curated_listing" | "system_link" | "filter_link" | "filter_bundle";

export type ShowcaseNavigationMenuItem = {
  id: string;
  kind: ShowcaseNavigationMenuItemKind;
  label: string;
  target: ShowcaseRouteTarget;
};

export type ShowcaseNavigationMenuBlock = {
  id: string;
  title: string;
  items: readonly ShowcaseNavigationMenuItem[];
};

export type ShowcaseNavigationMenu = {
  id: string;
  blocks: readonly ShowcaseNavigationMenuBlock[];
};

export type ShowcaseNavigationSection = {
  key: ShowcaseTopSectionKey;
  label: string;
  target: ShowcaseRouteTarget | null;
  menu?: ShowcaseNavigationMenu;
};

export type ShowcaseNavigationResponse = {
  sections: readonly ShowcaseNavigationSection[];
};

export type CatalogFilterSelectionMode = "single" | "multiple";

export type CatalogFilterIndicatorMode = "count" | "gender_short" | "selected_icon";

export type CatalogFilterOption = {
  id: string;
  label: string;
  value: string;
  icon?: ShowcaseIconToken;
};

export type CatalogFilterGroup = {
  key: string;
  label: string;
  queryParam: string;
  selectionMode: CatalogFilterSelectionMode;
  indicatorMode: CatalogFilterIndicatorMode;
  options: readonly CatalogFilterOption[];
  emptyState?: string;
  panelWidth?: "compact" | "wide";
};

export type CatalogViewContext = {
  key: CatalogViewKey;
  title: string;
  globalConstraints?: readonly string[];
};

export type CatalogPreviewMetric = {
  id: string;
  label: string;
  value: string;
};

export type CatalogExperienceResponse = {
  view: CatalogViewContext;
  filterGroups: readonly CatalogFilterGroup[];
  previewMetrics: readonly CatalogPreviewMetric[];
};
