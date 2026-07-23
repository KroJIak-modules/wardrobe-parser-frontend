import type { CatalogFilterGroup, ShowcaseQueryPatch, ShowcaseQueryValue, ShowcaseRouteTarget } from "./showcase-contracts";

function normalizeValues(value: ShowcaseQueryValue): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function replaceParamValues(searchParams: URLSearchParams, key: string, values: readonly string[]) {
  searchParams.delete(key);
  if (values.length > 0) {
    searchParams.set(key, values.join(","));
  }
}

export function applyQueryPatch(patch?: ShowcaseQueryPatch | null): URLSearchParams {
  const next = new URLSearchParams();
  if (!patch) {
    return next;
  }
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined) {
      continue;
    }
    const normalizedValues = normalizeValues(value);
    if (normalizedValues.length > 0) {
      next.set(key, normalizedValues.join(","));
    }
  }
  return next;
}

function normalizeShowcasePathname(pathname: string): string {
  const raw = String(pathname || "").trim() || "/catalog";
  // Backend still emits /catalog/sale; admin UI uses clean /sale like public.
  if (raw === "/catalog/sale") {
    return "/sale";
  }
  return raw;
}

export function buildRouteTargetHref(target: ShowcaseRouteTarget | null | undefined): string {
  const pathname = normalizeShowcasePathname(String(target?.pathname || "").trim() || "/catalog");
  const next = applyQueryPatch(target?.query);
  if (pathname === "/sale") {
    // Public sale is a clean path without ctx/query noise.
    next.delete("ctx");
    next.delete("ctx_ref");
  }
  const search = next.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function buildRouteTargetHrefWithCarry(
  target: ShowcaseRouteTarget | null | undefined,
  currentSearchParams: URLSearchParams,
  carryKeys: readonly string[]
): string {
  const pathname = normalizeShowcasePathname(String(target?.pathname || "").trim() || "/catalog");
  const next = new URLSearchParams();

  for (const key of carryKeys) {
    const value = currentSearchParams.get(key);
    if (value) {
      next.set(key, value);
    }
  }

  for (const [key, value] of Object.entries(target?.query ?? {})) {
    if (value === null || value === undefined) {
      next.delete(key);
      continue;
    }
    const normalizedValues = normalizeValues(value);
    replaceParamValues(next, key, normalizedValues);
  }

  if (pathname === "/sale") {
    next.delete("ctx");
    next.delete("ctx_ref");
  }

  const search = next.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function getGroupSelection(searchParams: URLSearchParams, group: Pick<CatalogFilterGroup, "queryParam">): string[] {
  const value = searchParams.get(group.queryParam);
  return value ? normalizeValues(value) : [];
}

export function toggleGroupOption(
  searchParams: URLSearchParams,
  group: Pick<CatalogFilterGroup, "queryParam" | "selectionMode">,
  optionValue: string
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  const selected = getGroupSelection(searchParams, group);

  if (group.selectionMode === "multiple") {
    const values = selected.includes(optionValue) ? selected.filter((item) => item !== optionValue) : [...selected, optionValue];
    replaceParamValues(next, group.queryParam, values);
    return next;
  }

  if (selected[0] === optionValue) {
    next.delete(group.queryParam);
    return next;
  }

  replaceParamValues(next, group.queryParam, [optionValue]);
  return next;
}

export function clearGroupSelection(
  searchParams: URLSearchParams,
  group: Pick<CatalogFilterGroup, "queryParam">
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  next.delete(group.queryParam);
  return next;
}
