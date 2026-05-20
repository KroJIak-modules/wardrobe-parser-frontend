import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE, authFetch } from "../auth-fetch";
import { PAGE_SIZE } from "../admin-constants";
import { buildProductsApiQuery, type ProductsQueryState } from "../products-query";
import type { AdminFilterFacetOption, AdminProductsTableItem } from "../admin-types";
import { useDebouncedValue } from "../../shared/hooks/use-debounced-value";

type ProductsTablePayload = {
  items: AdminProductsTableItem[];
  total: number;
  overall_total?: number;
  next_offset?: number | null;
  offset?: number;
  has_more?: boolean;
};

type ProductsTableFacetsPayload = {
  vendors?: AdminFilterFacetOption[];
  local_categories?: AdminFilterFacetOption[];
  total?: number;
  overall_total?: number;
};

type UseAdminProductsTableParams = {
  tab: string;
  latestJobStatus?: string | null;
  query: ProductsQueryState;
  pushToast: (message: string) => void;
};

function getStatusRank(rawStatus: string | null | undefined): number {
  const value = String(rawStatus || "").trim().toLowerCase();
  if (value === "available") {
    return 0;
  }
  if (value === "hidden") {
    return 1;
  }
  if (value === "out_of_stock") {
    return 2;
  }
  if (value === "unavailable") {
    return 3;
  }
  return 4;
}

function getVendorSortValue(item: AdminProductsTableItem): string {
  return String(item.vendor_display || item.vendor_mapped || item.vendor || item.vendor_original || "")
    .trim()
    .toLocaleLowerCase("ru");
}

function sortProductsForAdminTable(items: AdminProductsTableItem[]): AdminProductsTableItem[] {
  return [...items].sort((a, b) => {
    const byVendor = getVendorSortValue(a).localeCompare(getVendorSortValue(b), "ru");
    if (byVendor !== 0) {
      return byVendor;
    }
    const byStatus = getStatusRank(a.status) - getStatusRank(b.status);
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
  const [productVendors, setProductVendors] = useState<AdminFilterFacetOption[]>([]);
  const [productTypes, setProductTypes] = useState<AdminFilterFacetOption[]>([]);
  const requestSeqRef = useRef(0);

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
      const nextItems = payload.items || [];
      setTableProducts((previous) => {
        const known = new Set(previous.map((item) => item.id));
        const toAdd = nextItems.filter((item) => !known.has(item.id));
        return sortProductsForAdminTable([...previous, ...toAdd]);
      });
      setTableTotal(payload.total || 0);
      setTableOverallTotal(payload.overall_total || 0);
      const nextOffset = Number(payload.next_offset ?? tableOffset + nextItems.length);
      setTableOffset(Number.isFinite(nextOffset) ? nextOffset : tableOffset + nextItems.length);
      setTableHasMore(Boolean(payload.has_more));
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Ошибка догрузки");
    } finally {
      setTableLoadingMore(false);
    }
  }, [tableHasMore, tableLoadingMore, tableOffset, debouncedQuery, pushToast]);

  const reloadTableData = useCallback(async (signal?: AbortSignal) => {
    const requestSeq = ++requestSeqRef.current;
    setTableLoading(true);
    try {
      const productsQuery = buildProductsApiQuery(debouncedQuery, { includeLimit: true, limit: PAGE_SIZE });
      const facetsQuery = buildProductsApiQuery(debouncedQuery, { includeLimit: false });
      const [productsResponse, facetsResponse] = await Promise.all([
        authFetch(`${API_BASE}/admin/products/table?${productsQuery.toString()}`, { signal }),
        authFetch(`${API_BASE}/admin/products/table/facets?${facetsQuery.toString()}`, { signal }),
      ]);

      if (!productsResponse.ok) {
        throw new Error(`Products table API error: ${productsResponse.status}`);
      }
      if (!facetsResponse.ok) {
        throw new Error(`Products facets API error: ${facetsResponse.status}`);
      }

      const payload = (await productsResponse.json()) as ProductsTablePayload;
      const facetsPayload = (await facetsResponse.json()) as ProductsTableFacetsPayload;

      if (requestSeq !== requestSeqRef.current) {
        return;
      }

      setTableProducts(sortProductsForAdminTable(payload.items || []));
      setTableTotal(payload.total || facetsPayload.total || 0);
      setTableOverallTotal(payload.overall_total || facetsPayload.overall_total || 0);
      const loadedCount = (payload.items || []).length;
      const nextOffset = Number(payload.next_offset ?? loadedCount);
      setTableOffset(Number.isFinite(nextOffset) ? nextOffset : loadedCount);
      setTableHasMore(Boolean(payload.has_more));
      setProductVendors(facetsPayload.vendors || []);
      setProductTypes(facetsPayload.local_categories || []);
    } finally {
      if (requestSeq === requestSeqRef.current) {
        setTableLoading(false);
      }
    }
  }, [debouncedQuery]);

  useEffect(() => {
    if (tab !== "products") {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      try {
        if (cancelled) {
          return;
        }
        await reloadTableData(controller.signal);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        if (!cancelled) {
          pushToast(error instanceof Error ? error.message : "Ошибка загрузки таблицы товаров");
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [tab, reloadTableData, pushToast]);

  useEffect(() => {
    if (tab !== "products") {
      return;
    }
    if (!latestJobStatus || !["pending", "in_progress"].includes(latestJobStatus)) {
      return;
    }
    const timer = window.setInterval(() => {
      void reloadTableData();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [tab, latestJobStatus, reloadTableData]);

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
    productVendors,
    productTypes,
  };
}
