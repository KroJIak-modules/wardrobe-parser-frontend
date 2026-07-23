import type {
  CatalogFilterGroup,
  CatalogPageHeader,
  CatalogViewKey,
  ShowcaseNavigationMenu,
  ShowcaseNavigationSection,
  ShowcaseQueryPatch,
  ShowcaseRouteTarget,
} from "./showcase-contracts";

const NON_RESTRICTIVE_QUERY_KEYS = new Set(["sort", "page", "ctx", "ctx_ref", "top"]);

function normalizeText(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function readListParam(searchParams: URLSearchParams, key: string): string[] {
  const raw = normalizeText(searchParams.get(key));
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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

function findOptionLabel(filterGroups: readonly CatalogFilterGroup[], groupKey: string, value: string) {
  const group = filterGroups.find((item) => item.key === groupKey);
  return group?.options.find((option) => option.value === value)?.label ?? null;
}

function queryCtxRef(query: ShowcaseQueryPatch | null | undefined): string | null {
  if (!query) {
    return null;
  }
  const raw = query.ctx_ref;
  if (Array.isArray(raw)) {
    return normalizeText(raw[0] ?? "") || null;
  }
  const value = normalizeText(raw == null ? "" : String(raw));
  return value || null;
}

function queryCtx(query: ShowcaseQueryPatch | null | undefined): string | null {
  if (!query) {
    return null;
  }
  const raw = query.ctx;
  if (Array.isArray(raw)) {
    return normalizeText(raw[0] ?? "").toLowerCase() || null;
  }
  const value = normalizeText(raw == null ? "" : String(raw)).toLowerCase();
  return value || null;
}

function isMenuFilterTarget(target: ShowcaseRouteTarget | null | undefined, ctxRef: string): boolean {
  if (!target?.query) {
    return false;
  }
  return queryCtx(target.query) === "menu_filter" && queryCtxRef(target.query) === ctxRef;
}

/**
 * Resolve multi-filter / section titles from top-menu navigation by ctx_ref.
 * Same idea as public resolveOptimisticCatalogHeader + findMenuFilterLabel.
 */
export function findAdminMenuFilterLabel(
  sections: readonly ShowcaseNavigationSection[],
  ctxRef: string,
): string | null {
  const targetRef = normalizeText(ctxRef);
  if (!targetRef) {
    return null;
  }

  for (const section of sections) {
    const menu: ShowcaseNavigationMenu | undefined = section.menu;
    if (!menu) {
      continue;
    }

    for (const block of menu.blocks) {
      if (block.title && isMenuFilterTarget(block.titleTarget, targetRef)) {
        return block.title;
      }

      for (const group of block.groups ?? []) {
        if (group.title && isMenuFilterTarget(group.titleTarget, targetRef)) {
          return group.title;
        }
        for (const item of group.items) {
          if (isMenuFilterTarget(item.target, targetRef)) {
            return item.label;
          }
        }
      }

      for (const item of block.items) {
        if (isMenuFilterTarget(item.target, targetRef)) {
          return item.label;
        }
      }
    }
  }

  return null;
}

function findAdminCustomCatalogLabel(
  sections: readonly ShowcaseNavigationSection[],
  ctxRef: string,
): string | null {
  const targetRef = normalizeText(ctxRef);
  if (!targetRef) {
    return null;
  }

  for (const section of sections) {
    const menu = section.menu;
    if (!menu) {
      continue;
    }
    for (const block of menu.blocks) {
      for (const item of block.items) {
        if (queryCtx(item.target.query) === "custom" && queryCtxRef(item.target.query) === targetRef) {
          return item.label;
        }
      }
      for (const group of block.groups ?? []) {
        for (const item of group.items) {
          if (queryCtx(item.target.query) === "custom" && queryCtxRef(item.target.query) === targetRef) {
            return item.label;
          }
        }
      }
    }
  }

  return null;
}

/**
 * URL-first header for admin catalog.
 * Uses navigation menus for immediate multi-filter titles (public parity).
 */
export function resolveAdminCatalogHeader({
  viewKey,
  searchParams,
  filterGroups,
  navigationSections = [],
  fallbackHeader = null,
}: {
  viewKey: CatalogViewKey;
  searchParams: URLSearchParams;
  filterGroups: readonly CatalogFilterGroup[];
  navigationSections?: readonly ShowcaseNavigationSection[];
  fallbackHeader?: CatalogPageHeader | null;
}): CatalogPageHeader {
  const query = normalizeText(searchParams.get("q"));
  if (query) {
    return { title: `Поиск: ${query}`, description: null, source: "search" };
  }

  const context = normalizeText(searchParams.get("ctx")).toLowerCase();
  const contextRef = normalizeText(searchParams.get("ctx_ref"));

  if (viewKey === "sale" || context === "sale") {
    return { title: "Скидки", description: null, source: "sale" };
  }

  if (context === "custom" && contextRef) {
    const menuLabel = findAdminCustomCatalogLabel(navigationSections, contextRef);
    if (menuLabel) {
      return {
        title: menuLabel,
        description: fallbackHeader?.source === "custom_catalog" ? fallbackHeader.description : null,
        source: "custom_catalog",
      };
    }
    if (fallbackHeader?.source === "custom_catalog" && fallbackHeader.title) {
      return fallbackHeader;
    }
  }

  if (context === "menu_filter" && contextRef) {
    const menuLabel = findAdminMenuFilterLabel(navigationSections, contextRef);
    if (menuLabel) {
      return { title: menuLabel, description: null, source: "menu_filter" };
    }
    if (fallbackHeader?.source === "menu_filter" && fallbackHeader.title) {
      return fallbackHeader;
    }
    const selectedSections = readListParam(searchParams, "section");
    if (selectedSections.length === 1) {
      const sectionLabel = findOptionLabel(filterGroups, "section", selectedSections[0]);
      if (sectionLabel) {
        return { title: sectionLabel, description: null, source: "menu_filter" };
      }
    }
  }

  const selectedDesigners = readListParam(searchParams, "designer");
  if (selectedDesigners.length === 1) {
    const designerLabel = findOptionLabel(filterGroups, "designer", selectedDesigners[0]);
    if (designerLabel) {
      return {
        title: designerLabel,
        description: fallbackHeader?.source === "designer" ? fallbackHeader.description : null,
        source: "designer",
      };
    }
    if (fallbackHeader?.source === "designer" && fallbackHeader.title) {
      return fallbackHeader;
    }
    return { title: "Дизайнер", description: null, source: "designer" };
  }

  if (viewKey === "designers" || selectedDesigners.length > 1) {
    return { title: "Дизайнеры", description: null, source: "multiple_designers" };
  }

  if (!hasRestrictiveFilters(searchParams)) {
    return { title: "Все товары", description: null, source: "all_products" };
  }

  if (fallbackHeader && fallbackHeader.source !== "all_products") {
    return fallbackHeader;
  }

  return { title: "Каталог", description: null, source: "catalog" };
}
