import { createSiteDesignersLocationState } from "../features/designers/site-designers-navigation";
import type { SiteHeaderDropdownColumn, SiteHeaderDropdownMenu, SiteHeaderMenuEntry } from "../features/header/site-header-data";
import type { SiteNavItem } from "../features/storefront/site-storefront-contracts";
import type { SiteApiNavigation, SiteApiNavigationMenu, SiteApiNavigationMenuColumn, SiteApiNavigationMenuEntry, SiteApiRouteTarget } from "./site-public-api";

const TOP_MENU_ITEMS: SiteNavItem[] = [
  { label: "Новинки" },
  { label: "Дизайнеры" },
  { label: "Мужское" },
  { label: "Женское" },
  { label: "Скидки", to: "/sale" },
];

const MENU_KEY_BY_LABEL = {
  Новинки: "new",
  Дизайнеры: "designers",
  Мужское: "men",
  Женское: "women",
} as const;

function buildHrefFromTarget(target: SiteApiRouteTarget | null | undefined) {
  if (!target) {
    return undefined;
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(target.query ?? {})) {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        query.set(key, value.join(","));
      }
      continue;
    }

    const normalized = String(value).trim();
    if (normalized !== "") {
      query.set(key, normalized);
    }
  }

  const search = query.toString();
  return search === "" ? target.pathname : `${target.pathname}?${search}`;
}

function adaptEntry(entry: SiteApiNavigationMenuEntry): SiteHeaderMenuEntry {
  const to = buildHrefFromTarget(entry.target);
  return {
    id: entry.id,
    label: entry.label,
    presentation: entry.presentation,
    to,
    navigationState:
      to?.startsWith("/designers")
        ? createSiteDesignersLocationState(entry.id === "designers-footer" ? "browse" : "catalog-filter")
        : undefined,
  };
}

function adaptGenderMenuEntry(entry: SiteApiNavigationMenuEntry): SiteHeaderMenuEntry {
  const adapted = adaptEntry(entry);
  return {
    ...adapted,
    presentation: adapted.presentation === "heading" ? "item" : adapted.presentation,
  };
}

function adaptColumn(column: SiteApiNavigationMenuColumn): SiteHeaderDropdownColumn {
  return {
    id: column.id,
    align: column.align,
    title: column.title
      ? {
          label: column.title.label,
          to: buildHrefFromTarget(column.title.target),
        }
      : undefined,
    entries: column.entries.map(adaptEntry),
  };
}

function createHeadingEntry(column: SiteApiNavigationMenuColumn): SiteHeaderMenuEntry | null {
  if (!column.title) {
    return null;
  }

  return {
    id: `${column.id}-title`,
    label: column.title.label,
    presentation: "heading",
    to: buildHrefFromTarget(column.title.target),
  };
}

function mergeGenderColumnsForDesktop(menu: SiteApiNavigationMenu): SiteHeaderDropdownColumn[] {
  const [leftColumn, ...rightColumns] = menu.columns;
  if (!leftColumn) {
    return [];
  }

  if (rightColumns.length <= 1) {
    return menu.columns.map(adaptColumn);
  }

  const firstRightColumn = rightColumns[0];
  const leftHeadingEntry = createHeadingEntry(leftColumn);
  const leftEntries = leftHeadingEntry
    ? [leftHeadingEntry, ...leftColumn.entries.map(adaptGenderMenuEntry)]
    : leftColumn.entries.map(adaptGenderMenuEntry);
  const mergedRightEntries = rightColumns.flatMap((column, index) => {
    const titleEntry = createHeadingEntry(column);
    return titleEntry ? [titleEntry, ...column.entries.map(adaptGenderMenuEntry)] : column.entries.map(adaptGenderMenuEntry);
  });

  return [
    {
      id: leftColumn.id,
      align: leftColumn.align,
      entries: leftEntries,
    },
    {
      id: rightColumns.map((column) => column.id).join("-"),
      align: firstRightColumn?.align ?? "start",
      entries: mergedRightEntries,
    },
  ];
}

function adaptDesktopMenuColumns(menu: SiteApiNavigationMenu): SiteHeaderDropdownColumn[] {
  if (menu.key === "men" || menu.key === "women") {
    return mergeGenderColumnsForDesktop(menu);
  }

  return menu.columns.map(adaptColumn);
}

export function getSiteDesktopMenuItems() {
  return TOP_MENU_ITEMS;
}

export function buildSiteDesktopDropdownMenus(navigation: SiteApiNavigation | null): Record<string, SiteHeaderDropdownMenu> {
  const menus = navigation?.desktop_menus ?? {};
  const result: Record<string, SiteHeaderDropdownMenu> = {};

  for (const item of TOP_MENU_ITEMS) {
    const key = MENU_KEY_BY_LABEL[item.label as keyof typeof MENU_KEY_BY_LABEL];
    if (!key) {
      continue;
    }

    const menu = menus[key];
    if (!menu) {
      continue;
    }

    result[item.label] = {
      kind: menu.key,
      columns: adaptDesktopMenuColumns(menu),
      footerLink: menu.footer_link
        ? {
            label: menu.footer_link.label,
            to: buildHrefFromTarget(menu.footer_link.target) ?? "/designers",
            navigationState: createSiteDesignersLocationState("browse"),
          }
        : undefined,
    };
  }

  return result;
}

export { buildHrefFromTarget };
