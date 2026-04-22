import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE, authFetch } from "../auth-fetch";
import { PAGE_SIZE } from "../admin-constants";
import type { AdminFilterFacetOption, AdminProductsTableItem } from "../admin-types";

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
  search: string;
  sourceId: string;
  vendor: string;
  productType: string;
  status: string;
  pushToast: (message: string) => void;
};

export function useAdminProductsTable(params: UseAdminProductsTableParams) {
  const { tab, search, sourceId, vendor, productType, status, pushToast } = params;

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

  const buildFilterQuery = useCallback((options?: { includeLimit?: boolean; cursor?: string | null }) => {
    const query = new URLSearchParams();
    if (options?.includeLimit ?? true) {
      query.set("limit", String(PAGE_SIZE));
    }
    if (search.trim()) {
      query.set("search", search.trim());
    }
    if (sourceId) {
      query.set("source_id", sourceId);
    }
    if (vendor) {
      query.set("vendor", vendor);
    }
    if (productType) {
      query.set("product_type", productType);
    }
    if (status) {
      query.set("status", status);
    }
    if (options?.cursor) {
      query.set("cursor", options.cursor);
    }
    return query;
  }, [search, sourceId, vendor, productType, status]);

  const loadMoreTableProducts = useCallback(async () => {
    if (!tableHasMore || tableLoadingMore || !tableCursor) {
      return;
    }
    try {
      setTableLoadingMore(true);
      const query = buildFilterQuery({ includeLimit: true, cursor: tableCursor });
      const response = await authFetch(`${API_BASE}/admin/products/table?${query.toString()}`);
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
  }, [tableHasMore, tableLoadingMore, tableCursor, buildFilterQuery, pushToast]);

  useEffect(() => {
    if (tab !== "products") {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      try {
        setTableLoading(true);
        const productsQuery = buildFilterQuery({ includeLimit: true });
        const facetsQuery = buildFilterQuery({ includeLimit: false });
        const [productsResponse, facetsResponse] = await Promise.all([
          authFetch(`${API_BASE}/admin/products/table?${productsQuery.toString()}`, { signal: controller.signal }),
          authFetch(`${API_BASE}/admin/products/table/facets?${facetsQuery.toString()}`, { signal: controller.signal }),
        ]);

        if (!productsResponse.ok) {
          throw new Error(`Products table API error: ${productsResponse.status}`);
        }
        if (!facetsResponse.ok) {
          throw new Error(`Products facets API error: ${facetsResponse.status}`);
        }

        const payload = (await productsResponse.json()) as ProductsTablePayload;
        const facetsPayload = (await facetsResponse.json()) as ProductsTableFacetsPayload;
        if (cancelled) {
          return;
        }

        setTableProducts(payload.items || []);
        setTableTotal(payload.total || facetsPayload.total || 0);
        setTableOverallTotal(payload.overall_total || facetsPayload.overall_total || 0);
        setTableCursor(payload.next_cursor || null);
        setTableHasMore(Boolean(payload.has_more && payload.next_cursor));
        setProductVendors(facetsPayload.vendors || []);
        setProductTypes(facetsPayload.local_categories || []);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        if (!cancelled) {
          pushToast(error instanceof Error ? error.message : "Ошибка загрузки таблицы товаров");
        }
      } finally {
        if (!cancelled) {
          setTableLoading(false);
        }
      }
    };

    const timer = window.setTimeout(() => {
      void run();
    }, 280);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [tab, buildFilterQuery, pushToast]);

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
