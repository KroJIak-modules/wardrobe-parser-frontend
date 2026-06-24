import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { API_BASE, authFetch } from "../auth-fetch";
import { PAGE_SIZE } from "../admin-constants";
import { buildProductsApiQuery, type ProductsQueryState } from "../products-query";
import type { AdminFilterFacetOption, AdminProductsTableItem } from "../admin-types";
import { useDebouncedValue } from "../../shared/hooks/use-debounced-value";
import { normalizeServiceProduct } from "../../shared/live-product-normalizer";

type ProductsTablePayload = {
  items: Record<string, unknown>[];
  total: number;
  offset?: number;
};

type ProductsTableFacetsPayload = {
  sources?: AdminFilterFacetOption[];
  designers?: AdminFilterFacetOption[];
  catalogs?: AdminFilterFacetOption[];
  sections?: AdminFilterFacetOption[];
  genders?: AdminFilterFacetOption[];
  total?: number;
  overall_total?: number;
};

function mapAdminTableItem(raw: Record<string, unknown>): AdminProductsTableItem {
  const normalized = normalizeServiceProduct(raw as never);
  const internalCategoryNames = Array.isArray(raw.internal_category_names)
    ? raw.internal_category_names.map((item) => String(item))
    : [];
  const sourceTags = Array.isArray(raw.source_tags)
    ? raw.source_tags.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  return {
    id: normalized.id,
    source_id: normalized.source_id,
    source_name: String(raw.source_name || normalized.source_name || "").trim() || null,
    title: normalized.title,
    gender:
      normalized.gender === "female" || normalized.gender === "male" || normalized.gender === "unisex"
        ? normalized.gender
        : null,
    designer_name: normalized.designer_name ?? null,
    source_designer_name: normalized.source_designer_name ?? normalized.display_designer_name ?? null,
    display_designer_name: normalized.display_designer_name ?? normalized.designer_name ?? normalized.source_designer_name ?? null,
    url: normalized.url,
    source_category_name: String(raw.source_category_name || normalized.source_category_name || "").trim() || null,
    source_tags: sourceTags,
    visibility_status: normalized.visibility_status ?? null,
    availability_mode: normalized.availability_mode ?? null,
    orderability_status: normalized.orderability_status ?? null,
    status_reason: String(raw.status_reason || "").trim() || null,
    lifecycle_status: normalized.lifecycle_status ?? null,
    image_count: normalized.image_count,
    image_urls: normalized.image_urls,
    image_ids: Array.isArray(normalized.image_ids) ? normalized.image_ids : [],
    source_price: normalized.source_price ?? null,
    source_currency: normalized.source_currency ?? null,
    final_price: normalized.final_price ?? null,
    final_currency: normalized.final_currency ?? null,
    pricing_reason: String(raw.pricing_reason || "").trim() || null,
    pricing_manual_required:
      typeof raw.pricing_manual_required === "boolean" ? raw.pricing_manual_required : null,
    internal_category_name: String(raw.internal_category_name || internalCategoryNames[0] || "").trim() || null,
    internal_category_names: internalCategoryNames,
  };
}

type UseAdminProductsTableParams = {
  tab: string;
  latestJobStatus?: string | null;
  query: ProductsQueryState;
  pushToast: (message: string) => void;
};

function getStatusRank(item: AdminProductsTableItem): number {
  const lifecycle = String(item.lifecycle_status || "").trim().toLowerCase();
  const visibility = String(item.visibility_status || "").trim().toLowerCase();
  const orderability = String(item.orderability_status || "").trim().toLowerCase();
  const availability = String(item.availability_mode || "").trim().toLowerCase();
  if (lifecycle === "merged") {
    return 5;
  }
  if (visibility === "hidden") {
    return 4;
  }
  if (orderability === "unavailable") {
    return 3;
  }
  if (orderability === "sold_out") {
    return 2;
  }
  if (availability === "by_order") {
    return 1;
  }
  if (availability === "in_stock") {
    return 0;
  }
  return 6;
}

function getDesignerSortValue(item: AdminProductsTableItem): string {
  return String(item.display_designer_name || item.designer_name || item.source_designer_name || "")
    .trim()
    .toLocaleLowerCase("ru");
}

function sortProductsForAdminTable(items: AdminProductsTableItem[]): AdminProductsTableItem[] {
  return [...items].sort((a, b) => {
    const byDesigner = getDesignerSortValue(a).localeCompare(getDesignerSortValue(b), "ru");
    if (byDesigner !== 0) {
      return byDesigner;
    }
    const byStatus = getStatusRank(a) - getStatusRank(b);
    if (byStatus !== 0) {
      return byStatus;
    }
    const byTitle = String(a.title || "").localeCompare(String(b.title || ""), "ru");
    if (byTitle !== 0) {
      return byTitle;
    }
    return Number(a.id || 0) - Number(b.id || 0);
  });
}

export function useAdminProductsTable(params: UseAdminProductsTableParams) {
  const { tab, latestJobStatus, query, pushToast } = params;
  const debouncedQuery = useDebouncedValue(query, 220);

  const productsSentinelRef = useRef<HTMLDivElement | null>(null);
  const [tableProducts, setTableProducts] = useState<AdminProductsTableItem[]>([]);
  const [tableTotal, setTableTotal] = useState<number>(0);
  const [tableOverallTotal, setTableOverallTotal] = useState<number>(0);
  const [tableHasMore, setTableHasMore] = useState<boolean>(false);
  const [tableOffset, setTableOffset] = useState<number>(0);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [tableLoadingMore, setTableLoadingMore] = useState<boolean>(false);
  const [productSources, setProductSources] = useState<AdminFilterFacetOption[]>([]);
  const [productDesigners, setProductDesigners] = useState<AdminFilterFacetOption[]>([]);
  const [productCatalogs, setProductCatalogs] = useState<AdminFilterFacetOption[]>([]);
  const [productSections, setProductSections] = useState<AdminFilterFacetOption[]>([]);
  const [productGenders, setProductGenders] = useState<AdminFilterFacetOption[]>([]);
  const requestSeqRef = useRef(0);
  const fullReloadInFlightRef = useRef(false);
  const backgroundReloadInFlightRef = useRef(false);
  const previousJobStatusRef = useRef<string | null>(latestJobStatus ?? null);

  const loadMoreTableProducts = useCallback(async () => {
    if (!tableHasMore || tableLoadingMore) {
      return;
    }
    try {
      setTableLoadingMore(true);
      const queryParams = buildProductsApiQuery(debouncedQuery, { includeLimit: true, limit: PAGE_SIZE });
      queryParams.set("offset", String(tableOffset));
      const response = await authFetch(`${API_BASE}/admin/products/table?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`Products table API error: ${response.status}`);
      }
      const payload = (await response.json()) as ProductsTablePayload;
      const nextItems = (payload.items || []).map((item) => mapAdminTableItem(item));
      setTableProducts((previous) => {
        const known = new Set(previous.map((item) => item.id));
        const toAdd = nextItems.filter((item) => !known.has(item.id));
        return sortProductsForAdminTable([...previous, ...toAdd]);
      });
      setTableTotal(payload.total || 0);
      const nextOffset = tableOffset + nextItems.length;
      setTableOffset(nextOffset);
      setTableHasMore(nextOffset < Number(payload.total || 0));
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Ошибка догрузки");
    } finally {
      setTableLoadingMore(false);
    }
  }, [tableHasMore, tableLoadingMore, tableOffset, debouncedQuery, pushToast]);

  const reloadTableProducts = useCallback(async (options?: { signal?: AbortSignal; silent?: boolean }) => {
    const signal = options?.signal;
    const silent = options?.silent === true;
    const requestSeq = ++requestSeqRef.current;
    if (!silent) {
      setTableLoading(true);
    }
    try {
      const productsQuery = buildProductsApiQuery(debouncedQuery, { includeLimit: true, limit: PAGE_SIZE });
      const productsResponse = await authFetch(`${API_BASE}/admin/products/table?${productsQuery.toString()}`, { signal });
      if (!productsResponse.ok) {
        throw new Error(`Products table API error: ${productsResponse.status}`);
      }
      const payload = (await productsResponse.json()) as ProductsTablePayload;
      if (requestSeq !== requestSeqRef.current) {
        return null;
      }
      const items = (payload.items || []).map((item) => mapAdminTableItem(item));
      setTableProducts(sortProductsForAdminTable(items));
      setTableTotal(payload.total || 0);
      setTableOverallTotal(payload.total || 0);
      const loadedCount = items.length;
      setTableOffset(loadedCount);
      setTableHasMore(loadedCount < Number(payload.total || 0));
      return payload;
    } finally {
      if (!silent && requestSeq === requestSeqRef.current) {
        setTableLoading(false);
      }
    }
  }, [debouncedQuery]);

  const reloadTableData = useCallback(async (signal?: AbortSignal) => {
    fullReloadInFlightRef.current = true;
    try {
      const productsPayload = await reloadTableProducts({ signal });
      if (productsPayload === null) {
        return;
      }
      const requestSeq = requestSeqRef.current;
      const facetsQuery = buildProductsApiQuery(debouncedQuery, { includeLimit: false });
      const facetsResponse = await authFetch(`${API_BASE}/admin/products/table/facets?${facetsQuery.toString()}`, { signal });
      if (requestSeq !== requestSeqRef.current) {
        return;
      }
      if (!facetsResponse.ok) {
        throw new Error(`Products facets API error: ${facetsResponse.status}`);
      }
      const facetsPayload = (await facetsResponse.json()) as ProductsTableFacetsPayload;
      if (requestSeq !== requestSeqRef.current) {
        return;
      }
      startTransition(() => {
        setTableTotal(facetsPayload.total || productsPayload.total || 0);
        setTableOverallTotal(facetsPayload.overall_total || productsPayload.total || 0);
        setProductSources(facetsPayload.sources || []);
        setProductDesigners(facetsPayload.designers || []);
        setProductCatalogs(facetsPayload.catalogs || []);
        setProductSections(facetsPayload.sections || []);
        setProductGenders(facetsPayload.genders || []);
      });
    } finally {
      fullReloadInFlightRef.current = false;
    }
  }, [debouncedQuery, reloadTableProducts]);

  useEffect(() => {
    if (tab !== "products") {
      return;
    }

    let aborted = false;
    const controller = new AbortController();

    const run = async () => {
      try {
        if (aborted) {
          return;
        }
        await reloadTableData(controller.signal);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        if (!aborted) {
          pushToast(error instanceof Error ? error.message : "Ошибка загрузки таблицы товаров");
        }
      }
    };

    void run();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [tab, reloadTableData, pushToast]);

  useEffect(() => {
    if (tab !== "products") {
      return;
    }
    if (!latestJobStatus || !["queued", "running"].includes(latestJobStatus)) {
      return;
    }
    const runBackgroundReload = async () => {
      if (backgroundReloadInFlightRef.current || fullReloadInFlightRef.current) {
        return;
      }
      backgroundReloadInFlightRef.current = true;
      try {
        await reloadTableProducts({ silent: true });
      } catch (error) {
        pushToast(error instanceof Error ? error.message : "Ошибка обновления таблицы товаров");
      } finally {
        backgroundReloadInFlightRef.current = false;
      }
    };
    const timer = window.setInterval(() => {
      void runBackgroundReload();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [tab, latestJobStatus, pushToast, reloadTableProducts]);

  useEffect(() => {
    const previousStatus = previousJobStatusRef.current;
    previousJobStatusRef.current = latestJobStatus ?? null;
    if (tab !== "products") {
      return;
    }
    const wasActive = !!previousStatus && ["queued", "running"].includes(previousStatus);
    const isActive = !!latestJobStatus && ["queued", "running"].includes(latestJobStatus);
    if (!wasActive || isActive) {
      return;
    }
    void reloadTableData().catch((error) => {
      pushToast(error instanceof Error ? error.message : "Ошибка загрузки таблицы товаров");
    });
  }, [tab, latestJobStatus, pushToast, reloadTableData]);

  useEffect(() => {
    if (tab !== "products") {
      return;
    }
    const node = productsSentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        if (!tableHasMore || tableLoadingMore) {
          return;
        }
        void loadMoreTableProducts();
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [tab, tableHasMore, tableLoadingMore, loadMoreTableProducts]);

  return {
    productsSentinelRef,
    tableProducts,
    tableTotal,
    tableOverallTotal,
    tableLoading,
    tableLoadingMore,
    productSources,
    productDesigners,
    productCatalogs,
    productSections,
    productGenders,
  };
}
