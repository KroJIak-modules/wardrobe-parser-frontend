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
  next_cursor?: string | null;
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

export function useAdminProductsTable(params: UseAdminProductsTableParams) {
  const { tab, latestJobStatus, query, pushToast } = params;
  const debouncedQuery = useDebouncedValue(query, 220);

  const productsSentinelRef = useRef<HTMLDivElement | null>(null);
  const [tableProducts, setTableProducts] = useState<AdminProductsTableItem[]>([]);
  const [tableTotal, setTableTotal] = useState<number>(0);
  const [tableOverallTotal, setTableOverallTotal] = useState<number>(0);
  const [tableHasMore, setTableHasMore] = useState<boolean>(false);
  const [tableCursor, setTableCursor] = useState<string | null>(null);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [tableLoadingMore, setTableLoadingMore] = useState<boolean>(false);
  const [productVendors, setProductVendors] = useState<AdminFilterFacetOption[]>([]);
  const [productTypes, setProductTypes] = useState<AdminFilterFacetOption[]>([]);
  const requestSeqRef = useRef(0);

  const loadMoreTableProducts = useCallback(async () => {
    if (!tableHasMore || tableLoadingMore || !tableCursor) {
      return;
    }
    try {
      setTableLoadingMore(true);
      const queryParams = buildProductsApiQuery(debouncedQuery, { includeLimit: true, limit: PAGE_SIZE, cursor: tableCursor });
      const response = await authFetch(`${API_BASE}/admin/products/table?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`Products table API error: ${response.status}`);
      }
      const payload = (await response.json()) as ProductsTablePayload;
      const nextItems = payload.items || [];
      setTableProducts((previous) => {
        const known = new Set(previous.map((item) => item.id));
        const toAdd = nextItems.filter((item) => !known.has(item.id));
        return [...previous, ...toAdd];
      });
      setTableTotal(payload.total || 0);
      setTableOverallTotal(payload.overall_total || 0);
      setTableCursor(payload.next_cursor || null);
      setTableHasMore(Boolean(payload.has_more && payload.next_cursor));
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Ошибка догрузки");
    } finally {
      setTableLoadingMore(false);
    }
  }, [tableHasMore, tableLoadingMore, tableCursor, debouncedQuery, pushToast]);

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

      setTableProducts(payload.items || []);
      setTableTotal(payload.total || facetsPayload.total || 0);
      setTableOverallTotal(payload.overall_total || facetsPayload.overall_total || 0);
      setTableCursor(payload.next_cursor || null);
      setTableHasMore(Boolean(payload.has_more && payload.next_cursor));
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
