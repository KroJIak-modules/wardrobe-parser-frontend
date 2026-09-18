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

export type SiteHeaderDropdownMenuKind = "new" | "designers" | "men" | "women";

export type SiteHeaderDropdownMenu = {
  kind: SiteHeaderDropdownMenuKind;
  columns: readonly SiteHeaderDropdownColumn[];
  footerLink?: {
    label: string;
    to: string;
    navigationState?: unknown;
  };
};
