export type ShowcaseTopSectionKey = "new" | "designers" | "men" | "women" | "sale";

export type CatalogViewKey = "default" | "designers" | "sale";

export type ShowcaseQueryValue = string | readonly string[];

export type ShowcaseQueryPatch = Record<string, ShowcaseQueryValue | null | undefined>;

export type ShowcaseRouteTarget = {
  pathname: "/" | "/catalog" | "/catalog/designers" | "/catalog/sale" | "/designers";
  query?: ShowcaseQueryPatch;
};

export type ShowcaseNavigationMenuItemKind = "curated_listing" | "system_link" | "filter_link" | "filter_bundle";

export type ShowcaseNavigationMenuItem = {
  id: string;
  kind: ShowcaseNavigationMenuItemKind;
  label: string;
  target: ShowcaseRouteTarget;
  presentation?: "default" | "heading";
};

export type ShowcaseNavigationMenuBlock = {
  id: string;
  title?: string;
  titleTarget?: ShowcaseRouteTarget | null;
  items: readonly ShowcaseNavigationMenuItem[];
};

export type ShowcaseNavigationMenuLayout = "new" | "designers" | "category_columns";

export type ShowcaseNavigationMenu = {
  id: string;
  layout: ShowcaseNavigationMenuLayout;
  blocks: readonly ShowcaseNavigationMenuBlock[];
  footerLink?: {
    label: string;
    target: ShowcaseRouteTarget;
  };
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

export type CatalogFilterOption = {
  id: string;
  label: string;
  value: string;
};

export type CatalogFilterGroup = {
  key: string;
  label: string;
  queryParam: string;
  selectionMode: CatalogFilterSelectionMode;
  options: readonly CatalogFilterOption[];
  emptyState?: string;
  panelWidth?: "compact" | "wide";
  maxVisibleOptions?: number;
  prioritizeSelected?: boolean;
};

export type CatalogPageHeaderSource =
  | "sale"
  | "custom_catalog"
  | "designer"
  | "menu_filter"
  | "all_products"
  | "multiple_designers"
  | "catalog";

export type CatalogPageHeader = {
  title: string;
  description: string | null;
  source: CatalogPageHeaderSource;
};

export type CatalogViewContext = {
  key: CatalogViewKey;
  header: CatalogPageHeader;
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

export type ShowcaseDesignersDirectoryEntry = {
  id: string;
  label: string;
  letter: string;
};

export type ShowcaseDesignersDirectoryResponse = {
  alphabet: readonly string[];
  entries: readonly ShowcaseDesignersDirectoryEntry[];
};
