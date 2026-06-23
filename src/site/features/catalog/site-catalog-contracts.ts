import type { SiteNavItem, SiteProduct } from "../storefront/site-storefront-contracts";

export type SiteCatalogSort = "featured" | "price-asc" | "price-desc";

export type SiteCatalogTopKey = "new" | "designers" | "men" | "women" | "sale";

export type SiteCatalogAvailability = "in-stock" | "preorder";

export type SiteCatalogFilterSelectionMode = "single" | "multiple";

export type SiteCatalogFilterOption = {
  id: string;
  label: string;
  value: string;
  keepAtBottom?: boolean;
};

export type SiteCatalogFilterGroup = {
  key: string;
  label: string;
  queryParam: string;
  selectionMode: SiteCatalogFilterSelectionMode;
  triggerWidthPx?: number;
  options: readonly SiteCatalogFilterOption[];
  panelWidth?: "compact" | "wide";
  panelHeightPx?: number;
  panelListWidthPx?: number;
  panelFlyoutWidthPx?: number;
  panelListTopPx?: number;
  panelListLeftPx?: number;
  panelListHeightPx?: number;
  panelListAlign?: "center" | "start";
  maxVisibleOptions?: number;
  prioritizeSelected?: boolean;
};

export type SiteCatalogDesigner = {
  id: string;
  label: string;
  description: string | null;
};

export type SiteCatalogSection = {
  id: string;
  label: string;
  menuTopKeys: readonly SiteCatalogTopKey[];
  multiFilterIds: readonly string[];
};

export type SiteCatalogMultiFilter = {
  id: string;
  label: string;
};

export type SiteCatalogCustomCatalog = {
  id: string;
  label: string;
  description: string | null;
  productIds: readonly string[];
};

export type SiteCatalogProduct = SiteProduct & {
  designerId: string;
  availabilityCode: SiteCatalogAvailability;
  genders: readonly ("men" | "women")[];
  sectionIds: readonly string[];
  customCatalogIds: readonly string[];
  isSale: boolean;
};

export type SiteCatalogHeaderSource =
  | "sale"
  | "custom_catalog"
  | "designer"
  | "menu_filter"
  | "all_products"
  | "multiple_designers"
  | "catalog";

export type SiteCatalogHeader = {
  title: string;
  description: string | null;
  source: SiteCatalogHeaderSource;
};

export type SiteCatalogState = {
  top: SiteCatalogTopKey;
  collection: string | null;
  multi: string | null;
  sort: SiteCatalogSort;
  query: string;
  availability: SiteCatalogAvailability | null;
  sectionIds: string[];
  designerIds: string[];
  genderIds: string[];
};

export type SiteCatalogDropdownItem = {
  label: string;
  to: string;
};

export type SiteCatalogDropdownColumn = {
  title: string;
  items: readonly SiteCatalogDropdownItem[];
};

export type SiteCatalogDropdownMenuMap = Partial<Record<string, readonly SiteCatalogDropdownColumn[]>>;

export type SiteCatalogExperience = {
  header: SiteCatalogHeader;
  filterGroups: readonly SiteCatalogFilterGroup[];
  products: SiteCatalogProduct[];
};

export type SiteCatalogMenuConfig = {
  topMenuItems: SiteNavItem[];
  dropdownMenus: SiteCatalogDropdownMenuMap;
};
