import type { SiteCatalogAvailability } from "../catalog/site-catalog-contracts";
import { buildCatalogHref } from "../catalog/site-catalog-query";
import { createSiteDesignersLocationState, type SiteDesignersLocationState } from "../designers/site-designers-navigation";
import {
  siteCatalogCustomCatalogs,
  siteCatalogDesigners,
  siteCatalogFilterGroups,
  siteCatalogMobileMenuConfig,
  siteCatalogMultiFilters,
  siteCatalogProducts,
  siteCatalogSections,
} from "../../runtime/site-catalog-mock";

export type SiteMobileMenuGender = "men" | "women";
export type SiteMobileMenuPanel = "overview" | "root" | "new" | "designers" | `root-group:${string}`;

const SITE_MOBILE_MENU_TOP_DESIGNERS_LIMIT = 10;

export type SiteMobileMenuAction = {
  label: string;
  to?: string;
  navigationState?: SiteDesignersLocationState;
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

function buildAvailabilityHref(gender: SiteMobileMenuGender, availability: SiteCatalogAvailability) {
  return buildCatalogHref({
    ...buildGenderPatch(gender),
    top: "new",
    collection: null,
    multi: null,
    availability,
    section: null,
    designer: null,
  });
}

function buildCollectionHref(gender: SiteMobileMenuGender, collection: string | null) {
  return buildCatalogHref({
    ...buildGenderPatch(gender),
    top: "new",
    collection,
    multi: null,
    availability: null,
    section: null,
    designer: null,
  });
}

function buildMultiHref(gender: SiteMobileMenuGender, multiId: string, sectionIds: readonly string[]) {
  return buildCatalogHref({
    ...buildGenderPatch(gender),
    top: gender,
    collection: null,
    multi: multiId,
    availability: null,
    section: sectionIds,
    designer: null,
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

function buildDesignerHref(gender: SiteMobileMenuGender, designerId: string) {
  return buildCatalogHref({
    ...buildGenderPatch(gender),
    top: "designers",
    collection: null,
    multi: null,
    availability: null,
    section: null,
    designer: [designerId],
  });
}

function buildAllDesignersHref(gender: SiteMobileMenuGender) {
  const href = buildCatalogHref({
    ...buildGenderPatch(gender),
    top: null,
    collection: null,
    multi: null,
    availability: null,
    section: null,
    designer: null,
  });

  return href.replace(/^\/catalog/, "/designers");
}

function getAvailabilityLabel(availability: SiteCatalogAvailability) {
  const availabilityGroup = siteCatalogFilterGroups.find((group) => group.key === "availability");
  return availabilityGroup?.options.find((option) => option.value === availability)?.label ?? availability;
}

function getDesignerProductCount(designerId: string, gender: SiteMobileMenuGender) {
  return siteCatalogProducts.filter((product) => product.designerId === designerId && product.genders.includes(gender)).length;
}

function getTopDesigners(gender: SiteMobileMenuGender) {
  return [...siteCatalogDesigners]
    .map((designer) => ({
      designer,
      productCount: getDesignerProductCount(designer.id, gender),
    }))
    .sort((left, right) => {
      if (left.productCount !== right.productCount) {
        return right.productCount - left.productCount;
      }

      return left.designer.label.localeCompare(right.designer.label, "en", { numeric: true, sensitivity: "base" });
    })
    .slice(0, SITE_MOBILE_MENU_TOP_DESIGNERS_LIMIT)
    .map((entry) => entry.designer);
}

function getSectionsByIds(sectionIds: readonly string[]) {
  const sectionMap = new Map(siteCatalogSections.map((section) => [section.id, section]));
  return sectionIds.map((sectionId) => sectionMap.get(sectionId)).filter((section) => section !== undefined);
}

function createNewActions(gender: SiteMobileMenuGender): readonly SiteMobileMenuAction[] {
  return [
    { label: "Коллекции", presentation: "heading" },
    ...siteCatalogMobileMenuConfig.availabilityOrder.map((availability) => ({
      label: getAvailabilityLabel(availability),
      presentation: "item" as const,
      to: buildAvailabilityHref(gender, availability),
    })),
    ...siteCatalogCustomCatalogs.map((catalog) => ({
      label: catalog.label,
      presentation: "item" as const,
      to: buildCollectionHref(gender, catalog.id),
    })),
    {
      label: "Все товары",
      presentation: "item",
      to: buildCollectionHref(gender, null),
    },
  ];
}

function createDesignerActions(gender: SiteMobileMenuGender): readonly SiteMobileMenuAction[] {
  return [
    {
      label: "Смотреть все",
      presentation: "heading",
      to: buildAllDesignersHref(gender),
      navigationState: createSiteDesignersLocationState("browse"),
    },
    ...getTopDesigners(gender).map((designer) => ({
      label: designer.label,
      presentation: "item" as const,
      to: buildDesignerHref(gender, designer.id),
    })),
  ];
}

function createRootActions(): readonly SiteMobileMenuAction[] {
  return [
    { label: "Новинки", presentation: "heading", panel: "new" },
    { label: "Дизайнеры", presentation: "heading", panel: "designers" },
    ...siteCatalogMobileMenuConfig.rootGroups.map((group) => ({
      label: group.label,
      presentation: "heading" as const,
      panel: `root-group:${group.id}` as const,
    })),
  ];
}

function createRootGroupActions(groupId: string, gender: SiteMobileMenuGender): readonly SiteMobileMenuGroup[] {
  const rootGroup = siteCatalogMobileMenuConfig.rootGroups.find((group) => group.id === groupId);
  if (!rootGroup) {
    return [];
  }

  const multiMap = new Map(siteCatalogMultiFilters.map((multiFilter) => [multiFilter.id, multiFilter]));

  return rootGroup.children.map((child) => {
    const multi = multiMap.get(child.multiFilterId);
    const sections = getSectionsByIds(child.sectionIds);

    return {
      id: child.multiFilterId,
      actions: [
        {
          label: multi?.label ?? child.multiFilterId,
          presentation: "heading",
          to: buildMultiHref(gender, child.multiFilterId, child.sectionIds),
        },
        ...sections.map((section) => ({
          label: section.label,
          presentation: "item" as const,
          to: buildSectionHref(gender, section.id),
        })),
      ],
    };
  });
}

export function getSiteMobileMenuGroups(panel: SiteMobileMenuPanel, gender: SiteMobileMenuGender): readonly SiteMobileMenuGroup[] {
  if (panel === "new") {
    return [{ id: "new", actions: createNewActions(gender) }];
  }

  if (panel === "designers") {
    return [{ id: "designers", actions: createDesignerActions(gender) }];
  }

  if (panel.startsWith("root-group:")) {
    return createRootGroupActions(panel.slice("root-group:".length), gender);
  }

  if (panel === "root") {
    return [{ id: "root", actions: createRootActions() }];
  }

  return [];
}

export function getSiteMobileMenuPanelTitle(panel: SiteMobileMenuPanel): string | null {
  if (panel === "new") {
    return "Новинки";
  }

  if (panel === "designers") {
    return "Дизайнеры";
  }

  if (panel.startsWith("root-group:")) {
    return siteCatalogMobileMenuConfig.rootGroups.find((group) => group.id === panel.slice("root-group:".length))?.label ?? null;
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
