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

export function applyQueryPatch(patch: ShowcaseQueryPatch = {}): URLSearchParams {
  const next = new URLSearchParams();
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

export function buildRouteTargetHref(target: ShowcaseRouteTarget): string {
  const next = applyQueryPatch(target.query);
  const search = next.toString();
  return search ? `${target.pathname}?${search}` : target.pathname;
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
