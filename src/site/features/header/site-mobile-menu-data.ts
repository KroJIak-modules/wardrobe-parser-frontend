import { buildCatalogHref } from "../catalog/site-catalog-query";
import type { SiteApiNavigation, SiteApiNavigationMenuEntry, SiteApiRouteTarget } from "../../runtime/site-public-api";
import { buildHrefFromTarget } from "../../runtime/use-site-navigation";

export type SiteMobileMenuGender = "men" | "women";
export type SiteMobileMenuPanel = "overview" | "root" | "new" | "designers" | `root-group:${string}`;

export type SiteMobileMenuAction = {
  label: string;
  to?: string;
  navigationState?: unknown;
  panel?: SiteMobileMenuPanel;
  presentation: "heading" | "item";
};

export type SiteMobileMenuGroup = {
  id: string;
  actions: readonly SiteMobileMenuAction[];
};

/**
 * Подставляет выбранный в бургере пол в ссылку каталога.
 *
 * Пол в бургере переключается вкладками «Мужское»/«Женское», поэтому он должен
 * доезжать до каталога — иначе фильтр «ПОЛ» в каталоге оказывается пустым,
 * хотя в меню пол выбран.
 */
function withGenderTarget(
  target: SiteApiRouteTarget | null | undefined,
  gender: SiteMobileMenuGender,
): SiteApiRouteTarget | null | undefined {
  if (!target) {
    return target;
  }

  const query = { ...(target.query ?? {}) };
  if (!query.gender) {
    query.gender = gender;
  }

  return { ...target, query };
}

function toAction(entry: SiteApiNavigationMenuEntry): SiteMobileMenuAction {
  return {
    label: entry.label,
    presentation: entry.presentation,
    to: buildHrefFromTarget(entry.target) ?? undefined,
  };
}

function toActionWithGender(entry: SiteApiNavigationMenuEntry, gender: SiteMobileMenuGender): SiteMobileMenuAction {
  return {
    label: entry.label,
    presentation: entry.presentation,
    to: buildHrefFromTarget(withGenderTarget(entry.target, gender)) ?? undefined,
  };
}

function createNewActions(payload: SiteApiNavigation, gender: SiteMobileMenuGender): readonly SiteMobileMenuAction[] {
  const menu = payload.desktop_menus.new;
  if (!menu) {
    return [];
  }

  const collections = menu.columns.find((column) => column.id === "new-availability");
  if (!collections) {
    return [];
  }

  return [
    ...(collections.title
      ? [{ label: collections.title.label, presentation: "heading" as const }]
      : []),
    ...collections.entries.map((entry) => toActionWithGender(entry, gender)),
  ];
}

const MOBILE_DESIGNER_LIMIT = 10;

function createDesignerActions(payload: SiteApiNavigation): readonly SiteMobileMenuAction[] {
  const menu = payload.desktop_menus.designers;
  if (!menu) {
    return [];
  }
  return [
    ...(menu.footer_link
      ? [
          {
            label: menu.footer_link.label,
            presentation: "heading" as const,
            to: buildHrefFromTarget(menu.footer_link.target) ?? undefined,
          },
        ]
      : []),
    ...menu.columns.flatMap((column) => column.entries).slice(0, MOBILE_DESIGNER_LIMIT).map((entry) => toAction(entry)),
  ];
}

function genderRootGroups(payload: SiteApiNavigation, gender: SiteMobileMenuGender) {
  return payload.mobile_menu.groups_by_gender[gender] ?? [];
}

function createRootActions(payload: SiteApiNavigation, gender: SiteMobileMenuGender): readonly SiteMobileMenuAction[] {
  return [
    { label: "Новинки", presentation: "heading", panel: "new" },
    { label: "Дизайнеры", presentation: "heading", panel: "designers" },
    ...genderRootGroups(payload, gender).map((group) => ({
      label: group.label,
      presentation: "heading" as const,
      panel: `root-group:${group.id}` as const,
    })),
  ];
}

function createRootGroupActions(payload: SiteApiNavigation, groupId: string, gender: SiteMobileMenuGender): readonly SiteMobileMenuGroup[] {
  const rootGroup = genderRootGroups(payload, gender).find((group) => group.id === groupId);
  if (!rootGroup) {
    return [];
  }

  return [{ id: rootGroup.id, actions: rootGroup.entries.map((entry) => toActionWithGender(entry, gender)) }];
}

export function getSiteMobileMenuGroups(
  payload: SiteApiNavigation | null,
  panel: SiteMobileMenuPanel,
  gender: SiteMobileMenuGender,
): readonly SiteMobileMenuGroup[] {
  if (!payload) {
    return [];
  }

  if (panel === "new") {
    return [{ id: "new", actions: createNewActions(payload, gender) }];
  }

  if (panel === "designers") {
    return [{ id: "designers", actions: createDesignerActions(payload) }];
  }

  if (panel.startsWith("root-group:")) {
    return createRootGroupActions(payload, panel.slice("root-group:".length), gender);
  }

  if (panel === "root") {
    return [{ id: "root", actions: createRootActions(payload, gender) }];
  }

  return [];
}

export function getSiteMobileMenuPanelTitle(payload: SiteApiNavigation | null, panel: SiteMobileMenuPanel, gender: SiteMobileMenuGender): string | null {
  if (!payload) {
    return null;
  }

  if (panel === "new") {
    return "Новинки";
  }

  if (panel === "designers") {
    return "Дизайнеры";
  }

  if (panel.startsWith("root-group:")) {
    return genderRootGroups(payload, gender).find((group) => group.id === panel.slice("root-group:".length))?.label ?? null;
  }

  return null;
}

export function buildSiteMobileSearchHref(query: string) {
  return buildCatalogHref({
    q: query,
    top: null,
    collection: null,
    multi: null,
    availability: null,
    section: null,
    designer: null,
    gender: null,
    sort: null,
  });
}
