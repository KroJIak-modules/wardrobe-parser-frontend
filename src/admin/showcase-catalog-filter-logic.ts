import type { CatalogFilterGroup, CatalogFilterOption } from "./showcase-contracts";

const AVAILABILITY_URL_BY_API: Record<string, string> = {
  in_stock: "in-stock",
  "in-stock": "in-stock",
  by_order: "preorder",
  preorder: "preorder",
};

const SORT_URL_BY_API: Record<string, string> = {
  featured: "featured",
  price_asc: "price-asc",
  "price-asc": "price-asc",
  price_desc: "price-desc",
  "price-desc": "price-desc",
};

const AVAILABILITY_OPTION_ORDER = ["preorder", "in-stock"] as const;
const SORT_OPTION_ORDER = ["price-asc", "price-desc", "featured"] as const;

function normalizeValues(value: string): string[] {
  return value
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

export function normalizeCatalogFilterOptionValue(groupKey: string, value: string): string {
  if (groupKey === "availability") {
    return AVAILABILITY_URL_BY_API[value] ?? value;
  }
  if (groupKey === "sort") {
    return SORT_URL_BY_API[value] ?? value;
  }
  return value;
}

function sortOptionsByContractOrder(groupKey: string, options: CatalogFilterOption[]): CatalogFilterOption[] {
  if (groupKey === "availability") {
    const order = new Map(AVAILABILITY_OPTION_ORDER.map((value, index) => [value, index]));
    return [...options].sort((left, right) => (order.get(left.value as (typeof AVAILABILITY_OPTION_ORDER)[number]) ?? 99) - (order.get(right.value as (typeof AVAILABILITY_OPTION_ORDER)[number]) ?? 99));
  }

  if (groupKey === "sort") {
    const order = new Map(SORT_OPTION_ORDER.map((value, index) => [value, index]));
    return [...options].sort((left, right) => (order.get(left.value as (typeof SORT_OPTION_ORDER)[number]) ?? 99) - (order.get(right.value as (typeof SORT_OPTION_ORDER)[number]) ?? 99));
  }

  return options;
}

export function adaptShowcaseFilterGroups(groups: readonly CatalogFilterGroup[]): CatalogFilterGroup[] {
  return groups.map((group) => {
    const options = sortOptionsByContractOrder(
      group.key,
      group.options.map((option) => ({
        ...option,
        value: normalizeCatalogFilterOptionValue(group.key, option.value),
      })),
    );

    return {
      ...group,
      options,
    };
  });
}

export function getShowcaseGroupSelection(
  searchParams: URLSearchParams,
  group: Pick<CatalogFilterGroup, "key" | "queryParam" | "selectionMode">,
): string[] {
  if (group.selectionMode === "single") {
    const raw = String(searchParams.get(group.queryParam) || "").trim();
    if (raw !== "") {
      return [normalizeCatalogFilterOptionValue(group.key, raw)];
    }
    return group.key === "sort" ? ["featured"] : [];
  }

  const raw = String(searchParams.get(group.queryParam) || "").trim();
  return raw ? normalizeValues(raw).map((value) => normalizeCatalogFilterOptionValue(group.key, value)) : [];
}

export function getShowcaseTriggerLabel(group: CatalogFilterGroup, selectedValues: readonly string[]) {
  if (group.key === "section") {
    return group.label.toUpperCase();
  }
  if (group.key === "designer" && selectedValues.length > 0) {
    return group.label.toUpperCase();
  }
  if (group.key === "sort" && (selectedValues[0] === "featured" || selectedValues.length === 0)) {
    return group.label.toUpperCase();
  }
  if (group.selectionMode === "single" && selectedValues.length === 1) {
    return (group.options.find((option) => option.value === selectedValues[0])?.label ?? group.label).toUpperCase();
  }
  return group.label.toUpperCase();
}

export function toggleShowcaseGroupOption(
  searchParams: URLSearchParams,
  group: Pick<CatalogFilterGroup, "key" | "queryParam" | "selectionMode">,
  optionValue: string,
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  const normalizedOption = normalizeCatalogFilterOptionValue(group.key, optionValue);

  if (group.selectionMode === "single") {
    if (group.key === "sort") {
      // Featured is the default sort: keep URL clean, never store "featured".
      if (normalizedOption === "featured") {
        next.delete(group.queryParam);
        return next;
      }
      replaceParamValues(next, group.queryParam, [normalizedOption]);
      return next;
    }

    const current = getShowcaseGroupSelection(searchParams, group)[0] ?? "";
    if (current === normalizedOption) {
      next.delete(group.queryParam);
      return next;
    }
    replaceParamValues(next, group.queryParam, [normalizedOption]);
    return next;
  }

  const selected = getShowcaseGroupSelection(searchParams, group);
  const values = selected.includes(normalizedOption)
    ? selected.filter((item) => item !== normalizedOption)
    : [...selected, normalizedOption];
  replaceParamValues(next, group.queryParam, values);

  if (group.key === "section") {
    next.delete("ctx");
    next.delete("ctx_ref");
    next.delete("multi");
  }

  return next;
}

export function clearShowcaseGroupSelection(
  searchParams: URLSearchParams,
  group: Pick<CatalogFilterGroup, "key" | "queryParam">,
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  next.delete(group.queryParam);
  if (group.key === "section") {
    next.delete("ctx");
    next.delete("ctx_ref");
    next.delete("multi");
  }
  return next;
}

/**
 * Flyout options: no hard slice for section; designer shows selected + top rest + action.
 * Featured sort is pinned to the bottom and is not interactive (public behavior).
 */
export function getShowcaseFlyoutOptions(
  group: CatalogFilterGroup,
  selectedValues: readonly string[],
): Array<CatalogFilterOption & { interactive: boolean; strong?: boolean }> {
  const selectedSet = new Set(selectedValues);

  if (group.key === "designer") {
    const selectedOptions = selectedValues
      .map((value) => group.options.find((option) => option.value === value) ?? null)
      .filter((option): option is CatalogFilterOption => option !== null);
    const rest = group.options.filter((option) => !selectedSet.has(option.value));
    const limit = group.visibleOptionsLimit ?? 7;
    const visible = [...selectedOptions, ...rest].slice(0, limit);
    return visible.map((option) => ({ ...option, interactive: true }));
  }

  let ordered =
    group.prioritizeSelected && selectedSet.size > 0
      ? [
          ...group.options.filter((option) => selectedSet.has(option.value)),
          ...group.options.filter((option) => !selectedSet.has(option.value)),
        ]
      : [...group.options];

  if (group.key === "sort") {
    const featured = ordered.filter((option) => option.value === "featured");
    const rest = ordered.filter((option) => option.value !== "featured");
    ordered = [...rest, ...featured];
    return ordered.map((option) => ({
      ...option,
      interactive: option.value !== "featured",
      strong: option.value === "featured",
    }));
  }

  // Section / gender / availability: full list, scroll handled by CSS max height.
  return ordered.map((option) => ({ ...option, interactive: true }));
}
