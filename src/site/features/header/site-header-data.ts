export type SiteHeaderMenuEntryPresentation = "heading" | "item";

export type SiteHeaderMenuEntry = {
  id: string;
  label: string;
  presentation: SiteHeaderMenuEntryPresentation;
  to?: string;
  navigationState?: unknown;
};

export type SiteHeaderDropdownColumn = {
  id: string;
  title?: {
    label: string;
    to?: string;
    navigationState?: unknown;
  };
  align: "start" | "center";
  entries: readonly SiteHeaderMenuEntry[];
};

export type SiteHeaderDropdownMenu = {
  kind: "new" | "designers" | "men" | "women";
  columns: readonly SiteHeaderDropdownColumn[];
  footerLink?: {
    label: string;
    to: string;
    navigationState?: unknown;
  };
};
