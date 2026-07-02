import type { SiteNavItem } from "../storefront/site-storefront-contracts";
import type { SiteHeaderDropdownMenu } from "./site-header-data";

export type SiteHeaderProps = {
  theme: "light" | "dark";
  menuItems: SiteNavItem[];
  dropdownMenus?: Record<string, SiteHeaderDropdownMenu>;
  actionItems: SiteNavItem[];
  mode?: "fixed" | "preview";
  searchValue?: string;
  allowEmptySearchSubmit?: boolean;
  onSearchValueChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
};

export type IndicatorState = {
  left: number;
  width: number;
  opacity: number;
};
