import type { CatalogPageHeader, CatalogViewKey } from "./showcase-contracts";

type CatalogHeaderContextKey = "all" | "custom" | "designer" | "menu_filter" | "sale";

export type CatalogHeaderCustomCatalogEntry = {
  slug: string;
  label: string;
};

export type CatalogHeaderMenuFilterEntry = {
  id: string;
  label: string;
  sectionValues: readonly string[];
};

export type CatalogHeaderDesignerEntry = {
  id: string;
  label: string;
  catalogTitle: string;
  catalogDescription: string | null;
};

export type CatalogHeaderRegistry = {
  customCatalogs: readonly CatalogHeaderCustomCatalogEntry[];
  menuFilters: readonly CatalogHeaderMenuFilterEntry[];
  designers: readonly CatalogHeaderDesignerEntry[];
};

export type ResolveCatalogHeaderInput = {
  viewKey: CatalogViewKey;
  searchParams: URLSearchParams;
  registry: CatalogHeaderRegistry;
};

const NON_RESTRICTIVE_QUERY_KEYS = new Set(["sort", "ctx", "ctx_ref"]);

function readQueryValues(searchParams: URLSearchParams, key: string) {
  return String(searchParams.get(key) || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readContext(searchParams: URLSearchParams): CatalogHeaderContextKey | null {
  const value = String(searchParams.get("ctx") || "").trim();
  if (value === "all" || value === "custom" || value === "designer" || value === "menu_filter" || value === "sale") {
    return value;
  }
  return null;
}

function hasRestrictiveFilters(searchParams: URLSearchParams) {
  for (const [key, value] of searchParams.entries()) {
    if (NON_RESTRICTIVE_QUERY_KEYS.has(key)) {
      continue;
    }
    if (String(value).trim()) {
      return true;
    }
  }
  return false;
}

function hasSameSelection(left: readonly string[], right: readonly string[]) {
  if (left.length !== right.length) {
    return false;
  }
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

function buildDesignerHeader(designer: CatalogHeaderDesignerEntry | null): CatalogPageHeader {
  return {
    title: designer?.catalogTitle || designer?.label || "Дизайнер",
    description: designer?.catalogDescription || null,
    source: "designer",
  };
}

export function resolveCatalogPageHeader({ viewKey, searchParams, registry }: ResolveCatalogHeaderInput): CatalogPageHeader {
  const context = readContext(searchParams);
  const contextRef = String(searchParams.get("ctx_ref") || "").trim();
  const selectedDesigners = readQueryValues(searchParams, "designer");
  const selectedSections = readQueryValues(searchParams, "section");

  if (viewKey === "sale" || context === "sale") {
    return {
      title: "Скидки",
      description: null,
      source: "sale",
    };
  }

  if (context === "custom" && contextRef) {
    const customCatalog = registry.customCatalogs.find((catalog) => catalog.slug === contextRef) ?? null;
    if (customCatalog) {
      return {
        title: customCatalog.label,
        description: null,
        source: "custom_catalog",
      };
    }
  }

  if (context === "menu_filter" && contextRef) {
    const menuFilter = registry.menuFilters.find((filter) => filter.id === contextRef) ?? null;
    if (menuFilter && hasSameSelection(selectedSections, menuFilter.sectionValues)) {
      return {
        title: menuFilter.label,
        description: null,
        source: "menu_filter",
      };
    }
  }

  if (selectedDesigners.length === 1) {
    const designer = registry.designers.find((entry) => entry.id === selectedDesigners[0]) ?? null;
    return buildDesignerHeader(designer);
  }

  if (viewKey === "designers" || selectedDesigners.length > 1) {
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
