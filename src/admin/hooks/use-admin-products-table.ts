import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE, authFetch } from "../auth-fetch";
import { PAGE_SIZE } from "../admin-constants";
import { buildProductsApiQuery, type ProductsQueryState } from "../products-query";
import type { AdminFilterFacetOption, AdminProductsTableItem } from "../admin-types";
import { useDebouncedValue } from "../../shared/hooks/use-debounced-value";
import { normalizeServiceProduct } from "../../shared/live-product-normalizer";
import type { ProductWriteState } from "../../shared/product-state";
import { readAdminProductsTableCache, saveAdminProductsTableCache } from "../admin-products-table-cache";
import { markAdminProductsReturnStateRestored, readAdminProductsReturnState } from "../admin-products-return-state";

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
    created_at: normalized.created_at,
    source_id: normalized.source_id,
    source_sort_priority: normalized.source_sort_priority ?? null,
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
    price_summary: normalized.price_summary ?? null,
    pricing_reason: String(raw.pricing_reason || normalized.pricing_reason || "").trim() || null,
    pricing_manual_required:
      typeof raw.pricing_manual_required === "boolean" ? raw.pricing_manual_required : normalized.pricing_manual_required ?? null,
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

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json();
    if (payload && typeof payload.detail === "string" && payload.detail.trim()) {
      return payload.detail.trim();
    }
  } catch {
    // Ignore invalid error payloads and keep fallback.
  }
  return fallback;
}

function matchesAdminTableMutationFilters(item: AdminProductsTableItem, query: ProductsQueryState): boolean {
  const visibilityStatus = String(item.visibility_status || "").trim().toLowerCase();
  const availabilityMode = String(item.availability_mode || "").trim().toLowerCase();
  if (query.visibilityStatus && visibilityStatus !== String(query.visibilityStatus).trim().toLowerCase()) {
    return false;
  }
  if (query.availabilityMode && availabilityMode !== String(query.availabilityMode).trim().toLowerCase()) {
    return false;
  }
  return true;
}

export function useAdminProductsTable(params: UseAdminProductsTableParams) {
  const { tab, latestJobStatus, query, pushToast } = params;
  const location = useLocation();
  const debouncedQuery = useDebouncedValue(query, 220);

  const productsSentinelRef = useRef<HTMLDivElement | null>(null);
  const [tableProducts, setTableProducts] = useState<AdminProductsTableItem[]>([]);
  const [tableTotal, setTableTotal] = useState<number>(0);
  const [tableOverallTotal, setTableOverallTotal] = useState<number>(0);
  const [tableHasMore, setTableHasMore] = useState<boolean>(false);
  const [tableOffset, setTableOffset] = useState<number>(0);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [tableLoadingMore, setTableLoadingMore] = useState<boolean>(false);
  const [tableLoadedOnce, setTableLoadedOnce] = useState<boolean>(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [statusUpdatingProductId, setStatusUpdatingProductId] = useState<number | null>(null);
  const [productSources, setProductSources] = useState<AdminFilterFacetOption[]>([]);
  const [productDesigners, setProductDesigners] = useState<AdminFilterFacetOption[]>([]);
  const [productCatalogs, setProductCatalogs] = useState<AdminFilterFacetOption[]>([]);
  const [productSections, setProductSections] = useState<AdminFilterFacetOption[]>([]);
  const [productGenders, setProductGenders] = useState<AdminFilterFacetOption[]>([]);
  const requestSeqRef = useRef(0);
  const facetsRequestSeqRef = useRef(0);
  const tableOffsetRef = useRef(0);
  const loadMoreInFlightRef = useRef(false);
  const fullReloadInFlightRef = useRef(false);
  const backgroundReloadInFlightRef = useRef(false);
  const previousJobStatusRef = useRef<string | null>(latestJobStatus ?? null);
  const restoreRequestInFlightRef = useRef(false);
  const cachedReturnState = useRef(false);

  useEffect(() => {
    if (tab !== "products") {
      return;
    }
    const href = `${location.pathname}${location.search}`;
    const returnState = readAdminProductsReturnState();
    const cached = returnState?.pending && returnState.href === href
      ? readAdminProductsTableCache(href)
      : null;
    if (!cached) {
      return;
    }
    cachedReturnState.current = true;
    tableOffsetRef.current = cached.offset;
    setTableProducts(cached.items);
    setTableTotal(cached.total);
    setTableOverallTotal(cached.overallTotal);
    setTableOffset(cached.offset);
    setTableHasMore(cached.hasMore);
    setTableLoadedOnce(true);
  }, [location.pathname, location.search, tab]);

  const loadMoreTableProducts = useCallback(async () => {
    if (!tableHasMore || loadMoreInFlightRef.current) {
      return;
    }
    loadMoreInFlightRef.current = true;
    const offset = tableOffsetRef.current;
    try {
      setTableLoadingMore(true);
      const queryParams = buildProductsApiQuery(debouncedQuery, { includeLimit: true, limit: PAGE_SIZE });
      queryParams.set("offset", String(offset));
      const response = await authFetch(`${API_BASE}/admin/products/table?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`Products table API error: ${response.status}`);
      }
      const payload = (await response.json()) as ProductsTablePayload;
      const nextItems = (payload.items || []).map((item) => mapAdminTableItem(item));
      setTableProducts((previous) => {
        const known = new Set(previous.map((item) => item.id));
        return [...previous, ...nextItems.filter((item) => !known.has(item.id))];
      });
      setTableTotal(payload.total || 0);
      const nextOffset = offset + nextItems.length;
      tableOffsetRef.current = nextOffset;
      setTableOffset(nextOffset);
      setTableHasMore(nextOffset < Number(payload.total || 0));
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Ошибка догрузки");
    } finally {
      loadMoreInFlightRef.current = false;
      setTableLoadingMore(false);
    }
  }, [tableHasMore, debouncedQuery, pushToast]);

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
      setTableTotal(payload.total || 0);
      setTableOverallTotal(payload.total || 0);
      setTableProducts((previous) => {
        const returnState = readAdminProductsReturnState();
        const currentHref = `${location.pathname}${location.search}`;
        const shouldKeepRestoredPages = returnState?.pending
          && returnState.href === currentHref
          && previous.length > items.length;
        if (shouldKeepRestoredPages) {
          return previous;
        }
        return items;
      });
      const loadedCount = items.length;
      const returnState = readAdminProductsReturnState();
      const currentHref = `${location.pathname}${location.search}`;
      const shouldKeepRestoredPages = returnState?.pending
        && returnState.href === currentHref
        && tableOffsetRef.current > loadedCount;
      if (!shouldKeepRestoredPages) {
        tableOffsetRef.current = loadedCount;
        setTableOffset(loadedCount);
        setTableHasMore(loadedCount < Number(payload.total || 0));
      }
      setTableLoadedOnce(true);
      return payload;
    } finally {
      if (!silent && requestSeq === requestSeqRef.current) {
        setTableLoading(false);
      }
    }
  }, [debouncedQuery]);

  const reloadTableFacets = useCallback(async (signal?: AbortSignal) => {
    const requestSeq = ++facetsRequestSeqRef.current;
    const facetsQuery = buildProductsApiQuery(debouncedQuery, { includeLimit: false });
    const facetsResponse = await authFetch(`${API_BASE}/admin/products/table/facets?${facetsQuery.toString()}`, { signal });
    if (requestSeq !== facetsRequestSeqRef.current) {
      return null;
    }
    if (!facetsResponse.ok) {
      throw new Error(`Products facets API error: ${facetsResponse.status}`);
    }
    const facetsPayload = (await facetsResponse.json()) as ProductsTableFacetsPayload;
    if (requestSeq !== facetsRequestSeqRef.current) {
      return null;
    }
    startTransition(() => {
      setTableTotal(facetsPayload.total || 0);
      setTableOverallTotal(facetsPayload.overall_total || 0);
      setProductSources(facetsPayload.sources || []);
      setProductDesigners(facetsPayload.designers || []);
      setProductCatalogs(facetsPayload.catalogs || []);
      setProductSections(facetsPayload.sections || []);
      setProductGenders(facetsPayload.genders || []);
    });
    return facetsPayload;
  }, [debouncedQuery]);

  const reloadTableData = useCallback(async (signal?: AbortSignal) => {
    fullReloadInFlightRef.current = true;
    try {
      const productsPayload = await reloadTableProducts({ signal });
      if (productsPayload === null) {
        return;
      }
      const facetsPayload = await reloadTableFacets(signal);
      if (facetsPayload === null) {
        return;
      }
      startTransition(() => {
        setTableTotal(facetsPayload.total || productsPayload.total || 0);
        setTableOverallTotal(facetsPayload.overall_total || productsPayload.total || 0);
      });
    } finally {
      fullReloadInFlightRef.current = false;
    }
  }, [reloadTableFacets, reloadTableProducts]);

  useEffect(() => {
    if (tab !== "products") {
      return;
    }
    if (cachedReturnState.current) {
      cachedReturnState.current = false;
      void reloadTableFacets().catch((error) => {
        pushToast(error instanceof Error ? error.message : "Ошибка обновления фильтров товаров");
      });
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

  useEffect(() => {
    if (tab !== "products" || tableLoading || !tableLoadedOnce) {
      return;
    }
    const currentHref = `${location.pathname}${location.search}`;
    const returnState = readAdminProductsReturnState();
    if (!returnState?.pending || returnState.href !== currentHref) {
      restoreRequestInFlightRef.current = false;
      return;
    }
    const viewportBottom = returnState.scrollY + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;
    const needsMoreRows = tableProducts.length < returnState.loadedCount;
    const needsMoreHeight = pageHeight + 24 < viewportBottom;
    if ((needsMoreRows || needsMoreHeight) && tableHasMore) {
      if (!tableLoadingMore && !restoreRequestInFlightRef.current) {
        restoreRequestInFlightRef.current = true;
        void loadMoreTableProducts().finally(() => {
          restoreRequestInFlightRef.current = false;
        });
      }
      return;
    }
    if (tableLoadingMore) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo({ top: Math.min(returnState.scrollY, maxScrollTop), left: 0, behavior: "auto" });
      markAdminProductsReturnStateRestored();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [
    tab,
    tableLoading,
    tableLoadedOnce,
    tableLoadingMore,
    tableHasMore,
    tableProducts.length,
    loadMoreTableProducts,
    location.pathname,
    location.search,
  ]);

  const deleteTableProduct = useCallback(async (productId: number) => {
    const normalizedProductId = Number(productId);
    if (!Number.isFinite(normalizedProductId) || normalizedProductId <= 0) {
      pushToast("Некорректный ID товара");
      return false;
    }
    setDeletingProductId(normalizedProductId);
    try {
      const response = await authFetch(`${API_BASE}/products/manual/${normalizedProductId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Не удалось удалить товар"));
      }
      startTransition(() => {
        setTableProducts((previous) => previous.filter((item) => item.id !== normalizedProductId));
        setTableTotal((previous) => Math.max(0, previous - 1));
        setTableOverallTotal((previous) => Math.max(0, previous - 1));
        setTableOffset((previous) => {
          const nextOffset = Math.max(0, previous - 1);
          tableOffsetRef.current = nextOffset;
          return nextOffset;
        });
      });
      void reloadTableFacets().catch((error) => {
        pushToast(error instanceof Error ? error.message : "Ошибка обновления фильтров товаров");
      });
      pushToast("Товар удален");
      return true;
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Не удалось удалить товар");
      return false;
    } finally {
      setDeletingProductId((current) => (current === normalizedProductId ? null : current));
    }
  }, [pushToast, reloadTableFacets]);

  const updateTableProductStatus = useCallback(async (productId: number, state: ProductWriteState) => {
    const normalizedProductId = Number(productId);
    if (!Number.isFinite(normalizedProductId) || normalizedProductId <= 0) {
      pushToast("Некорректный ID товара");
      return false;
    }
    setStatusUpdatingProductId(normalizedProductId);
    try {
      const response = await authFetch(`${API_BASE}/products/${normalizedProductId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Не удалось обновить состояние товара"));
      }
      const payload = (await response.json()) as Record<string, unknown>;
      const nextItem = mapAdminTableItem(payload);
      const matchesFilters = matchesAdminTableMutationFilters(nextItem, debouncedQuery);
      startTransition(() => {
        if (!matchesFilters) {
          setTableProducts((previous) => previous.filter((item) => item.id !== normalizedProductId));
          setTableTotal((previous) => Math.max(0, previous - 1));
          setTableOffset((previous) => {
            const nextOffset = Math.max(0, previous - 1);
            tableOffsetRef.current = nextOffset;
            return nextOffset;
          });
          return;
        }
        setTableProducts((previous) => previous.map((item) => (
          item.id === normalizedProductId ? nextItem : item
        )));
      });
      void reloadTableFacets().catch((error) => {
        pushToast(error instanceof Error ? error.message : "Ошибка обновления фильтров товаров");
      });
      pushToast("Состояние товара обновлено");
      return true;
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Не удалось обновить состояние товара");
      return false;
    } finally {
      setStatusUpdatingProductId((current) => (current === normalizedProductId ? null : current));
    }
  }, [debouncedQuery, pushToast, reloadTableFacets]);

  useEffect(() => {
    if (tab !== "products" || tableProducts.length === 0) {
      return;
    }
    saveAdminProductsTableCache(`${location.pathname}${location.search}`, {
      items: tableProducts,
      total: tableTotal,
      overallTotal: tableOverallTotal,
      offset: tableOffset,
      hasMore: tableHasMore,
    });
  }, [location.pathname, location.search, tab, tableHasMore, tableOffset, tableOverallTotal, tableProducts, tableTotal]);

  const refreshProductsTable = useCallback(async () => {
    if (tab !== "products") {
      return;
    }
    try {
      await reloadTableData();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Ошибка загрузки таблицы товаров");
    }
  }, [tab, reloadTableData, pushToast]);

  return {
    productsSentinelRef,
    tableProducts,
    tableTotal,
    tableOverallTotal,
    tableLoading,
    initialTableLoading: tableLoading && !tableLoadedOnce,
    tableLoadingMore,
    productSources,
    productDesigners,
    productCatalogs,
    productSections,
    productGenders,
    deletingProductId,
    statusUpdatingProductId,
    deleteTableProduct,
    updateTableProductStatus,
    refreshProductsTable,
  };
}
