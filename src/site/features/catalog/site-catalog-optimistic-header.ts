import type { SiteApiNavigation } from "../../runtime/site-public-api";
import { readCatalogListParam } from "./site-catalog-query";
import type { SiteCatalogFilterGroup, SiteCatalogHeader, SiteCatalogTopKey } from "./site-catalog-contracts";

const NON_RESTRICTIVE_QUERY_KEYS = new Set(["sort", "page", "ctx", "ctx_ref", "top"]);

function normalizeText(value: string | null) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function hasRestrictiveFilters(searchParams: URLSearchParams) {
  for (const [key, rawValue] of searchParams.entries()) {
    if (NON_RESTRICTIVE_QUERY_KEYS.has(key)) {
      continue;
    }
    if (normalizeText(rawValue) !== "") {
      return true;
    }
  }
  return false;
}

function findDesignerContext(navigation: SiteApiNavigation | null, slug: string) {
  return navigation?.catalog_contexts.designers.find((item) => item.slug === slug) ?? null;
}

function findCustomCatalogContext(navigation: SiteApiNavigation | null, slug: string) {
  return navigation?.catalog_contexts.custom_catalogs.find((item) => item.slug === slug) ?? null;
}

function findMenuFilterLabel(
  navigation: SiteApiNavigation | null,
  { ctxRef }: { ctxRef: string },
) {
  if (!navigation) {
    return null;
  }

  for (const menu of Object.values(navigation.desktop_menus)) {
    if (!menu) {
      continue;
    }
    for (const column of menu.columns) {
      if (column.title?.target?.query?.ctx === "menu_filter" && column.title.target.query?.ctx_ref === ctxRef) {
        return column.title.label;
      }
      for (const entry of column.entries) {
        if (entry.target?.query?.ctx === "menu_filter" && entry.target.query?.ctx_ref === ctxRef) {
          return entry.label;
        }
      }
    }
  }

  if (!ctxRef.startsWith("mobile:")) {
    return null;
  }

  const multiFilterId = ctxRef.slice("mobile:".length);
  for (const group of navigation.mobile_menu.root_groups) {
    for (const rootFilter of group.root_multi_filters) {
      if (rootFilter.id === multiFilterId) {
        return rootFilter.label;
      }
    }
    for (const child of group.children) {
      if (child.multi_filter.id === multiFilterId) {
        return child.multi_filter.label;
      }
    }
  }

  return null;
}

function findDesignerLabel(filterGroups: readonly SiteCatalogFilterGroup[], slug: string) {
  const designerGroup = filterGroups.find((group) => group.key === "designer");
  return designerGroup?.options.find((option) => option.value === slug)?.label ?? null;
}

export function resolveOptimisticCatalogHeader({
  searchParams,
  forcedTop,
  navigation,
  filterGroups,
  fallbackHeader,
}: {
  searchParams: URLSearchParams;
  forcedTop?: SiteCatalogTopKey;
  navigation: SiteApiNavigation | null;
  filterGroups: readonly SiteCatalogFilterGroup[];
  fallbackHeader: SiteCatalogHeader;
}): SiteCatalogHeader {
  const query = normalizeText(searchParams.get("q"));
  if (query) {
    return {
      title: `Поиск: ${query}`,
      description: null,
      source: "search",
    };
  }

  const effectiveTop = forcedTop ?? normalizeText(searchParams.get("top"));
  const context = normalizeText(searchParams.get("ctx")).toLowerCase();
  const contextRef = normalizeText(searchParams.get("ctx_ref"));

  if (effectiveTop === "sale" || context === "sale") {
    return {
      title: "Скидки",
      description: null,
      source: "sale",
    };
  }

  if (context === "custom" && contextRef) {
    const catalog = findCustomCatalogContext(navigation, contextRef);
    if (catalog) {
      return {
        title: catalog.label,
        description: catalog.description,
        source: "custom_catalog",
      };
    }
  }

  if (context === "menu_filter" && contextRef) {
    const label = findMenuFilterLabel(navigation, { ctxRef: contextRef });
    if (label) {
      return {
        title: label,
        description: null,
        source: "menu_filter",
      };
    }
  }

  const selectedDesigners = readCatalogListParam(searchParams, "designer");
  if (selectedDesigners.length === 1) {
    const designer = findDesignerContext(navigation, selectedDesigners[0]);
    if (designer) {
      return {
        title: designer.label,
        description: designer.description,
        source: "designer",
      };
    }

    const label = findDesignerLabel(filterGroups, selectedDesigners[0]);
    if (label) {
      return {
        title: label,
        description: null,
        source: "designer",
      };
    }
  }

  if (effectiveTop === "designers" || selectedDesigners.length > 1) {
    return {
      title: "Дизайнеры",
      description: null,
      source: "multiple_designers",
    };
  }

  if (!hasRestrictiveFilters(searchParams)) {
    return {
      title: "Все товары",
      description: null,
      source: "all_products",
    };
  }

  return {
    title: "Каталог",
    description: null,
    source: "catalog",
  };
}
