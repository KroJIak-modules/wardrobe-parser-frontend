import { buildCatalogHref } from "../catalog/site-catalog-query";
import type { SiteApiNavigation } from "../../runtime/site-public-api";
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

function buildGenderPatch(gender: SiteMobileMenuGender) {
  return {
    gender: [gender],
    sort: null,
    q: null,
  };
}

function buildRootGroupHref(gender: SiteMobileMenuGender, multiId: string, sectionIds: readonly string[]) {
  return buildCatalogHref({
    ...buildGenderPatch(gender),
    top: gender,
    collection: null,
    multi: null,
    availability: null,
    section: sectionIds,
    designer: null,
    ctx: "menu_filter",
    ctx_ref: `mobile:${multiId}`,
  });
}

function buildSectionHref(gender: SiteMobileMenuGender, sectionId: string) {
  return buildCatalogHref({
    ...buildGenderPatch(gender),
    top: gender,
    collection: null,
    multi: null,
    availability: null,
    section: [sectionId],
    designer: null,
  });
}

function createNewActions(payload: SiteApiNavigation): readonly SiteMobileMenuAction[] {
  const menu = payload.desktop_menus.new;
  if (!menu) {
    return [];
  }
  return menu.columns.flatMap((column) => {
    const actions: SiteMobileMenuAction[] = [];
    if (column.title) {
      actions.push({
        label: column.title.label,
        presentation: "heading",
        to: buildHrefFromTarget(column.title.target) ?? undefined,
      });
    }
    actions.push(
      ...column.entries.map((entry) => ({
        label: entry.label,
        presentation: entry.presentation,
        to: buildHrefFromTarget(entry.target) ?? undefined,
      })),
    );
    return actions;
  });
}

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
    ...menu.columns.flatMap((column) =>
      column.entries.map((entry) => ({
        label: entry.label,
        presentation: "item" as const,
        to: buildHrefFromTarget(entry.target) ?? undefined,
      })),
    ),
  ];
}

function createRootActions(payload: SiteApiNavigation): readonly SiteMobileMenuAction[] {
  return [
    { label: "Новинки", presentation: "heading", panel: "new" },
    { label: "Дизайнеры", presentation: "heading", panel: "designers" },
    ...payload.mobile_menu.root_groups.map((group) => ({
      label: group.label,
      presentation: "heading" as const,
      panel: `root-group:${group.id}` as const,
    })),
  ];
}

function createRootGroupActions(payload: SiteApiNavigation, groupId: string, gender: SiteMobileMenuGender): readonly SiteMobileMenuGroup[] {
  const rootGroup = payload.mobile_menu.root_groups.find((group) => group.id === groupId);
  if (!rootGroup) {
    return [];
  }

  return rootGroup.children.map((child) => ({
    id: child.multi_filter.id,
    actions: [
      {
        label: child.multi_filter.label,
        presentation: "heading",
        to: buildRootGroupHref(gender, child.multi_filter.id, child.sections.map((section) => section.id)),
      },
      ...child.sections.map((section) => ({
        label: section.label,
        presentation: "item" as const,
        to: buildSectionHref(gender, section.id),
      })),
    ],
  }));
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
    return [{ id: "new", actions: createNewActions(payload) }];
  }

  if (panel === "designers") {
    return [{ id: "designers", actions: createDesignerActions(payload) }];
  }

  if (panel.startsWith("root-group:")) {
    return createRootGroupActions(payload, panel.slice("root-group:".length), gender);
  }

  if (panel === "root") {
    return [{ id: "root", actions: createRootActions(payload) }];
  }

  return [];
}

export function getSiteMobileMenuPanelTitle(payload: SiteApiNavigation | null, panel: SiteMobileMenuPanel): string | null {
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
    return payload.mobile_menu.root_groups.find((group) => group.id === panel.slice("root-group:".length))?.label ?? null;
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
