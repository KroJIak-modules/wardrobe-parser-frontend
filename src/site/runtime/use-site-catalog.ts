import { useEffect, useMemo, useState } from "react";
import type { SiteCatalogFilterGroup, SiteCatalogHeader, SiteCatalogProduct } from "../features/catalog/site-catalog-contracts";
import { SHOW_ALL_DESIGNERS_VALUE } from "../features/catalog/site-catalog-filter-constants";
import { readCatalogListParam } from "../features/catalog/site-catalog-query";
import { siteApiJson, type SiteApiCatalogExperience, type SiteApiCatalogProductsResponse } from "./site-public-api";

const LEGACY_AVAILABILITY_OPTION_ORDER = ["preorder", "in-stock"] as const;
const LEGACY_SORT_OPTION_ORDER = ["price-asc", "price-desc", "featured"] as const;

const FILTER_UI_PRESETS: Record<string, Partial<SiteCatalogFilterGroup>> = {
  sort: {
    triggerWidthPx: 140,
    panelHeightPx: 65,
    panelListWidthPx: 112,
    panelFlyoutWidthPx: 134,
    panelListTopPx: 7,
    panelListLeftPx: 11,
    panelListHeightPx: 45,
    panelListAlign: "start",
  },
  availability: {
    triggerWidthPx: 80,
    panelHeightPx: 46,
    panelListWidthPx: 72,
    panelFlyoutWidthPx: 134,
    panelListTopPx: 7,
    panelListHeightPx: 32,
    panelListAlign: "center",
  },
  section: {
    triggerWidthPx: 65,
    panelHeightPx: 369,
    panelListWidthPx: 117,
    panelFlyoutWidthPx: 133,
    panelListTopPx: 7,
    panelListLeftPx: 7,
    panelListHeightPx: 355,
    panelListAlign: "start",
    panelWidth: "wide",
    maxVisibleOptions: 19,
    prioritizeSelected: true,
  },
  designer: {
    triggerWidthPx: 105,
    panelHeightPx: 160,
    panelListWidthPx: 120,
    panelFlyoutWidthPx: 134,
    panelListTopPx: 7,
    panelListLeftPx: 7,
    panelListHeightPx: 146,
    panelListAlign: "start",
    panelWidth: "wide",
    maxVisibleOptions: 8,
    prioritizeSelected: true,
  },
  gender: {
    triggerWidthPx: 35,
    panelHeightPx: 46,
    panelListWidthPx: 72,
    panelFlyoutWidthPx: 134,
    panelListTopPx: 7,
    panelListHeightPx: 32,
    panelListAlign: "center",
  },
};

function adaptFilterOptionValue(groupKey: string, value: string) {
  if (groupKey === "availability" && value === "by_order") {
    return "preorder";
  }
  if (groupKey === "availability" && value === "in_stock") {
    return "in-stock";
  }
  if (groupKey === "sort" && value === "price_asc") {
    return "price-asc";
  }
  if (groupKey === "sort" && value === "price_desc") {
    return "price-desc";
  }
  return value;
}

function sortOptionsByLegacyOrder(
  groupKey: string,
  options: Array<{ id: string; label: string; value: string }>,
) {
  if (groupKey === "availability") {
    const order = new Map(LEGACY_AVAILABILITY_OPTION_ORDER.map((value, index) => [value, index]));
    return [...options].sort((left, right) => {
      const leftOrder = order.get(left.value);
      const rightOrder = order.get(right.value);
      if (leftOrder !== undefined && rightOrder !== undefined) {
        return leftOrder - rightOrder;
      }
      if (leftOrder !== undefined) {
        return -1;
      }
      if (rightOrder !== undefined) {
        return 1;
      }
      return left.label.localeCompare(right.label, "ru");
    });
  }

  if (groupKey === "sort") {
    const order = new Map(LEGACY_SORT_OPTION_ORDER.map((value, index) => [value, index]));
    return [...options].sort((left, right) => (order.get(left.value) ?? 99) - (order.get(right.value) ?? 99));
  }

  return options;
}

function statusLabel(status: "in_stock" | "preorder" | "sold_out") {
  if (status === "in_stock") {
    return "В наличии";
  }
  if (status === "sold_out") {
    return "Продано";
  }
  return "Под заказ";
}

function availabilityCode(status: "in_stock" | "preorder" | "sold_out"): "in-stock" | "preorder" | "sold-out" {
  if (status === "in_stock") {
    return "in-stock";
  }
  if (status === "sold_out") {
    return "sold-out";
  }
  return "preorder";
}

function adaptFilterGroups(payload: SiteApiCatalogExperience["filter_groups"]): SiteCatalogFilterGroup[] {
  return payload.map((group) => {
    const normalizedOptions = sortOptionsByLegacyOrder(
      group.key,
      group.options.map((option) => ({
        ...option,
        value: adaptFilterOptionValue(group.key, option.value),
        keepAtBottom: group.key === "sort" && adaptFilterOptionValue(group.key, option.value) === "featured" ? true : undefined,
      })),
    );

    const options =
      group.key === "designer" && !normalizedOptions.some((option) => option.value === SHOW_ALL_DESIGNERS_VALUE)
        ? [
            ...normalizedOptions,
            {
              id: "all-designers",
              label: "Смотреть все",
              value: SHOW_ALL_DESIGNERS_VALUE,
              keepAtBottom: true,
            },
          ]
        : normalizedOptions;

    return {
      key: group.key,
      label: group.label,
      queryParam: group.query_param,
      selectionMode: group.selection_mode,
      options,
      panelWidth: group.panel_width ?? undefined,
      maxVisibleOptions: group.max_visible_options ?? undefined,
      prioritizeSelected: group.prioritize_selected ?? undefined,
      ...FILTER_UI_PRESETS[group.key],
    };
  });
}

function adaptProducts(payload: SiteApiCatalogProductsResponse["items"], searchParams: URLSearchParams): SiteCatalogProduct[] {
  const topParam = String(searchParams.get("top") || "").trim();
  const selectedGenderValues = readCatalogListParam(searchParams, "gender").filter(
    (item): item is "men" | "women" => item === "men" || item === "women",
  );
  const effectiveGenderValues =
    selectedGenderValues.length === 0 && (topParam === "men" || topParam === "women")
      ? [topParam]
      : selectedGenderValues;
  const selectedSectionValues = readCatalogListParam(searchParams, "section");
  const selectedCatalogs = readCatalogListParam(searchParams, "collection");
  return payload.map((item) => ({
    id: String(item.id),
    path: item.path,
    brand: item.brand.name,
    designerId: item.brand.slug ?? "",
    name: item.name,
    priceRub: item.price_rub ?? 0,
    availability: statusLabel(item.status),
    availabilityCode: availabilityCode(item.status),
    imageSrc: item.image_url,
    imageAlt: "",
    genders: effectiveGenderValues,
    sectionIds: selectedSectionValues,
    customCatalogIds: selectedCatalogs,
    isSale: false,
  }));
}

function buildExperienceQuery(searchParams: URLSearchParams, forcedTop?: string) {
  const next = new URLSearchParams(searchParams);
  if (forcedTop === "sale") {
    next.delete("gender");
    next.delete("designer");
  }
  const top = forcedTop ?? next.get("top") ?? "";
  if ((top === "men" || top === "women") && readCatalogListParam(next, "gender").length === 0) {
    next.set("gender", top);
  }
  let viewKey = "default";
  if (top === "designers") {
    viewKey = "designers";
  } else if (forcedTop === "sale" || top === "sale") {
    viewKey = "sale";
  }
  next.delete("top");
  next.delete("page");
  next.delete("sort");
  next.set("view_key", viewKey);
  return next.toString();
}

function buildProductsQuery(searchParams: URLSearchParams, forcedTop?: string, currentPage = 1, pageSize = 48) {
  const next = new URLSearchParams(searchParams);
  const top = forcedTop ?? next.get("top") ?? "";
  const page = Math.max(1, currentPage);

  if ((top === "men" || top === "women") && readCatalogListParam(next, "gender").length === 0) {
    next.set("gender", top);
  }

  next.delete("top");
  next.delete("page");
  if (forcedTop === "sale" || top === "sale") {
    next.set("discounted_only", "true");
  } else {
    next.delete("discounted_only");
  }
  next.set("limit", String(pageSize));
  next.set("offset", String((page - 1) * pageSize));
  return next.toString();
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useSiteCatalog(searchParams: URLSearchParams, options?: { forcedTop?: string; pageSize?: number }) {
  const forcedTop = options?.forcedTop;
  const pageSize = options?.pageSize ?? 48;
  const pageParam = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const [header, setHeader] = useState<SiteCatalogHeader>({ title: "Каталог", description: null, source: "catalog" });
  const [filterGroups, setFilterGroups] = useState<SiteCatalogFilterGroup[]>([]);
  const [products, setProducts] = useState<SiteCatalogProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const searchKey = searchParams.toString();
  const experienceQuery = buildExperienceQuery(searchParams, forcedTop);
  const productsQuery = buildProductsQuery(searchParams, forcedTop, currentPage, pageSize);

  useEffect(() => {
    let isDisposed = false;
    const controller = new AbortController();

    siteApiJson<SiteApiCatalogExperience>(`/site/catalog/experience?${experienceQuery}`, {
      signal: controller.signal,
    })
      .then((experiencePayload) => {
        if (isDisposed) {
          return;
        }
        setHeader(experiencePayload.header);
        setFilterGroups(adaptFilterGroups(experiencePayload.filter_groups));
      })
      .catch((error: unknown) => {
        if (isDisposed || isAbortError(error)) {
          return;
        }
        setHeader({ title: "Каталог", description: null, source: "catalog" });
        setFilterGroups([]);
      });

    return () => {
      isDisposed = true;
      controller.abort();
    };
  }, [experienceQuery]);

  useEffect(() => {
    let isDisposed = false;
    const controller = new AbortController();
    setLoading(true);
    setErrorMessage(null);

    siteApiJson<SiteApiCatalogProductsResponse>(`/site/catalog/products?${productsQuery}`, {
      signal: controller.signal,
    })
      .then((productsPayload) => {
        if (isDisposed) {
          return;
        }
        setProducts(adaptProducts(productsPayload.items, searchParams));
        setTotal(productsPayload.total);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (isDisposed || isAbortError(error)) {
          return;
        }
        setProducts([]);
        setTotal(0);
        setErrorMessage(error instanceof Error ? error.message : "Не удалось загрузить каталог");
        setLoading(false);
      });

    return () => {
      isDisposed = true;
      controller.abort();
    };
  }, [productsQuery]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [pageSize, total]);

  return {
    header,
    filterGroups,
    products,
    total,
    currentPage: Math.min(currentPage, totalPages),
    totalPages,
    loading,
    errorMessage,
  };
}
