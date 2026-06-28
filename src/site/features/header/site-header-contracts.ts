import type { SiteNavItem } from "../storefront/site-storefront-contracts";

export type SiteHeaderProps = {
  theme: "light" | "dark";
  menuItems: SiteNavItem[];
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
