import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toSlug } from "./utils";

type Source = {
  key: string;
  source_id: number | null;
  name: string;
  base_url: string;
  parser_type: string;
  enabled: boolean;
  notes: string | null;
  products_count: number;
  categories_count: number;
};

type ProductVariant = {
  title: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  available: boolean;
  price: string | number | null;
  inventory_quantity: number;
  sku: string | null;
};

type ServiceProduct = {
  id: number;
  handle: string;
  title: string;
  vendor: string | null;
  product_type: string | null;
  url: string;
  price: number | null;
  currency: string;
  status: string;
  image_count: number;
  image_urls: string[];
  image_ids: number[];
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
};

export function toImageGatewayUrl(imageId: number | null | undefined) {
  if (!imageId || imageId <= 0) {
    return null;
  }
  return `/api/v1/images/${imageId}`;
}

type JobsLatest = {
  job_id: string;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  next_scheduled_at: string | null;
  total_products: number | null;
  new_products: number;
  updated_products: number;
  new_images: number;
  total_sources: number;
  processed_sources: number;
  progress_percent: number;
  processed_products: number;
  expected_products: number;
  failed_products: number;
  products_progress_percent: number;
  current_source_name: string | null;
  current_source_index: number;
  current_stage: string | null;
  current_source_processed_products: number;
  current_source_total_products: number;
  current_product_title: string | null;
  site_products_total: number;
  can_cancel: boolean;
  sync_period_minutes: number;
} | null;

export type SyncJobHistoryItem = {
  id: string;
  status: string;
  triggered_by: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  total_products: number | null;
  new_products: number;
  updated_products: number;
  new_images: number;
  error_count: number;
  http_429_count: number;
  http_5xx_count: number;
};

export type SourceRunItem = {
  id: number;
  source_id: number;
  status: string;
  products_discovered: number;
  products_fetched: number;
  products_failed: number;
  error_message: string | null;
  discovery_mode: string | null;
  started_at?: string | null;
  completed_at?: string | null;
};

export type SyncJobDetails = SyncJobHistoryItem & {
  source_runs: SourceRunItem[];
};

type CategoryView = {
  id: number;
  slug: string;
  name: string;
  parent_id: number | null;
  count: number;
  children: CategoryView[];
};

export type AdminCategoryNode = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  is_fallback: boolean;
  keywords: string[];
  effective_keywords: string[];
  children: AdminCategoryNode[];
};

export type DedupCandidate = {
  pair_key: string;
  score: number;
  reasons: string[];
  left: ServiceProduct;
  right: ServiceProduct;
};

export type ProductUrlPreview = {
  handle: string;
  title: string;
  vendor: string | null;
  product_type: string | null;
  product_url: string;
  price: number | null;
  currency: string;
  image_urls: string[];
};

type LiveDataContextValue = {
  products: ServiceProduct[];
  productsTotal: number;
  productsHasMore: boolean;
  categories: CategoryView[];
  adminCategories: AdminCategoryNode[];
  dedupCandidates: DedupCandidate[];
  jobsHistory: SyncJobHistoryItem[];
  latestJobDetails: SyncJobDetails | null;
  sources: Source[];
  latestJob: JobsLatest;
  loading: boolean;
  loadingMoreProducts: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMoreProducts: () => Promise<void>;
  getProductById: (id: number) => Promise<ServiceProduct | null>;
  runSync: () => Promise<{ ok: boolean; message: string }>;
  cancelSync: (jobId: string) => Promise<{ ok: boolean; message: string }>;
  previewProductByUrl: (url: string) => Promise<{ ok: boolean; message: string; preview: ProductUrlPreview | null }>;
  addProductByUrl: (
    url: string,
    payload?: {
      title?: string;
      vendor?: string | null;
      product_type?: string | null;
      price?: number | null;
      currency?: string;
      image_count?: number;
    }
  ) => Promise<{ ok: boolean; message: string }>;
  createManualProduct: (payload: {
    title: string;
    price: number | null;
    currency: string;
    product_type: string | null;
    image_count: number;
  }) => Promise<{ ok: boolean; message: string }>;
  uploadProductImage: (file: File) => Promise<{ ok: boolean; message: string }>;
  createCategory: (name: string, parentId: number | null) => Promise<{ ok: boolean; message: string; categoryId?: number }>;
  updateCategory: (id: number, payload: { name?: string; parent_id?: number | null }) => Promise<{ ok: boolean; message: string }>;
  deleteCategory: (id: number) => Promise<{ ok: boolean; message: string }>;
  addCategoryKeyword: (id: number, keyword: string) => Promise<{ ok: boolean; message: string }>;
  removeCategoryKeyword: (id: number, keyword: string) => Promise<{ ok: boolean; message: string }>;
  mergeDedupPair: (primaryProductId: number, duplicateProductId: number) => Promise<{ ok: boolean; message: string }>;
  rejectDedupPair: (productAId: number, productBId: number) => Promise<{ ok: boolean; message: string }>;
  toggleSourceEnabled: (sourceKey: string, enabled: boolean) => Promise<{ ok: boolean; message: string }>;
};

const API_BASE = "/api/v1";
const PRODUCTS_PAGE_SIZE = 200;

const LiveDataContext = createContext<LiveDataContextValue | undefined>(undefined);

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ServiceProduct[]>([]);
  const [productsTotal, setProductsTotal] = useState<number>(0);
  const [productsHasMore, setProductsHasMore] = useState<boolean>(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [adminCategories, setAdminCategories] = useState<AdminCategoryNode[]>([]);
  const [dedupCandidates, setDedupCandidates] = useState<DedupCandidate[]>([]);
  const [jobsHistory, setJobsHistory] = useState<SyncJobHistoryItem[]>([]);
  const [latestJobDetails, setLatestJobDetails] = useState<SyncJobDetails | null>(null);
  const [latestJob, setLatestJob] = useState<JobsLatest>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo<CategoryView[]>(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      const raw = product.product_type?.trim() || "Прочее";
      counts.set(raw, (counts.get(raw) || 0) + 1);
    }

    const build = (nodes: AdminCategoryNode[]): CategoryView[] => {
      return nodes.map((node) => {
        const nodeCount = counts.get(node.name) || 0;
        return {
          id: node.id,
          slug: node.slug || toSlug(node.name),
          name: node.name,
          parent_id: node.parent_id,
          count: nodeCount,
          children: build(node.children || []),
        };
      });
    };

    return build(adminCategories);
  }, [products, adminCategories]);

  const fetchJobDetails = useCallback(async (jobId: string | null | undefined) => {
    if (!jobId) {
      setLatestJobDetails(null);
      return;
    }

    const res = await fetch(`${API_BASE}/jobs/${jobId}`);
    if (!res.ok) {
      throw new Error(`Job details API error: ${res.status}`);
    }

    const payload = (await res.json()) as SyncJobDetails;
    setLatestJobDetails(payload);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, sourcesRes, latestJobRes, categoriesRes, dedupRes, jobsHistoryRes] = await Promise.all([
        fetch(`${API_BASE}/products?limit=${PRODUCTS_PAGE_SIZE}&offset=0`),
        fetch(`${API_BASE}/shopify/sources-admin`),
        fetch(`${API_BASE}/jobs/latest`),
        fetch(`${API_BASE}/categories/tree`),
        fetch(`${API_BASE}/dedup/candidates?limit=80`),
        fetch(`${API_BASE}/jobs?limit=15&offset=0`),
      ]);

      if (!productsRes.ok) {
        throw new Error(`Products API error: ${productsRes.status}`);
      }
      if (!sourcesRes.ok) {
        throw new Error(`Sources API error: ${sourcesRes.status}`);
      }
      if (!latestJobRes.ok) {
        throw new Error(`Jobs API error: ${latestJobRes.status}`);
      }
      if (!categoriesRes.ok) {
        throw new Error(`Categories API error: ${categoriesRes.status}`);
      }
      if (!dedupRes.ok) {
        throw new Error(`Dedup API error: ${dedupRes.status}`);
      }
      if (!jobsHistoryRes.ok) {
        throw new Error(`Jobs history API error: ${jobsHistoryRes.status}`);
      }

      const productsPayload = (await productsRes.json()) as { items: ServiceProduct[]; total: number; limit: number; offset: number };
      const sourcesPayload = (await sourcesRes.json()) as Source[];
      const latestPayload = (await latestJobRes.json()) as JobsLatest;
      const categoriesPayload = (await categoriesRes.json()) as AdminCategoryNode[];
      const dedupPayload = (await dedupRes.json()) as { items: DedupCandidate[] };
      const jobsHistoryPayload = (await jobsHistoryRes.json()) as SyncJobHistoryItem[];

      setProducts(productsPayload.items || []);
      setProductsTotal(productsPayload.total || 0);
      setProductsHasMore((productsPayload.items || []).length + (productsPayload.offset || 0) < (productsPayload.total || 0));
      setSources(sourcesPayload || []);
      setLatestJob(latestPayload);
      setAdminCategories(categoriesPayload || []);
      setDedupCandidates(dedupPayload.items || []);
      setJobsHistory(jobsHistoryPayload || []);
      await fetchJobDetails(latestPayload?.job_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [fetchJobDetails]);

  const loadMoreProducts = useCallback(async () => {
    if (!productsHasMore || loadingMoreProducts) {
      return;
    }
    try {
      setLoadingMoreProducts(true);
      const offset = products.length;
      const res = await fetch(`${API_BASE}/products?limit=${PRODUCTS_PAGE_SIZE}&offset=${offset}`);
      if (!res.ok) {
        throw new Error(`Products API error: ${res.status}`);
      }
      const payload = (await res.json()) as { items: ServiceProduct[]; total: number; offset: number };
      const nextItems = payload.items || [];
      setProducts((prev) => {
        const known = new Set(prev.map((item) => item.id));
        const toAdd = nextItems.filter((item) => !known.has(item.id));
        return [...prev, ...toAdd];
      });
      setProductsTotal(payload.total || 0);
      setProductsHasMore(nextItems.length + (payload.offset || 0) < (payload.total || 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingMoreProducts(false);
    }
  }, [productsHasMore, products.length, loadingMoreProducts]);

  const getProductById = useCallback(async (id: number) => {
    try {
      const existing = products.find((item) => item.id === id);
      if (existing) {
        return existing;
      }

      const res = await fetch(`${API_BASE}/products/${id}`);
      if (!res.ok) {
        return null;
      }
      const payload = (await res.json()) as ServiceProduct;
      setProducts((prev) => {
        if (prev.some((item) => item.id === payload.id)) {
          return prev;
        }
        return [...prev, payload];
      });
      return payload;
    } catch {
      return null;
    }
  }, [products]);

  const runSync = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ triggered_by: "manual" }),
      });

      if (res.status === 409) {
        return { ok: false, message: "Синхронизация уже запущена" };
      }
      if (!res.ok) {
        return { ok: false, message: `Ошибка запуска: ${res.status}` };
      }

      await refresh();
      return { ok: true, message: "Синхронизация запущена" };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
    }
  }, [refresh]);

  const cancelSync = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}/cancel`, {
        method: "POST",
      });

      if (!res.ok) {
        return { ok: false, message: `Ошибка отмены: ${res.status}` };
      }

      await refresh();
      return { ok: true, message: "Синхронизация отменена" };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
    }
  }, [refresh]);

  const previewProductByUrl = useCallback(async (url: string) => {
    try {
      const res = await fetch(`${API_BASE}/products/preview-by-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
        return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}`, preview: null };
      }

      const payload = (await res.json()) as ProductUrlPreview;
      return { ok: true, message: "Preview получен", preview: payload };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error", preview: null };
    }
  }, []);

  const addProductByUrl = useCallback(
    async (
      url: string,
      payload?: {
        title?: string;
        vendor?: string | null;
        product_type?: string | null;
        price?: number | null;
        currency?: string;
        image_count?: number;
      }
    ) => {
      try {
        const res = await fetch(`${API_BASE}/products/add-by-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, ...(payload || {}) }),
        });

        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }

        await refresh();
        return { ok: true, message: "Товар добавлен по URL" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refresh]
  );

  const createManualProduct = useCallback(
    async (payload: {
      title: string;
      price: number | null;
      currency: string;
      product_type: string | null;
      image_count: number;
    }) => {
      try {
        const res = await fetch(`${API_BASE}/products/manual`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }

        await refresh();
        return { ok: true, message: "Ручной товар сохранен" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refresh]
  );

  const uploadProductImage = useCallback(async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/products/upload-image`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
        return { ok: false, message: errorPayload?.detail || `Ошибка upload: ${res.status}` };
      }
      return { ok: true, message: "Изображение загружено" };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
    }
  }, []);

  const createCategory = useCallback(
    async (name: string, parentId: number | null) => {
      try {
        const res = await fetch(`${API_BASE}/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, parent_id: parentId }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        const created = (await res.json()) as { id: number };
        await refresh();
        return { ok: true, message: "Категория создана", categoryId: created.id };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refresh]
  );

  const updateCategory = useCallback(
    async (id: number, payload: { name?: string; parent_id?: number | null }) => {
      try {
        const res = await fetch(`${API_BASE}/categories/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await refresh();
        return { ok: true, message: "Категория обновлена" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refresh]
  );

  const deleteCategory = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`${API_BASE}/categories/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await refresh();
        return { ok: true, message: "Категория удалена" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refresh]
  );

  const addCategoryKeyword = useCallback(
    async (id: number, keyword: string) => {
      try {
        const res = await fetch(`${API_BASE}/categories/${id}/keywords`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await refresh();
        return { ok: true, message: "OK" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refresh]
  );

  const removeCategoryKeyword = useCallback(
    async (id: number, keyword: string) => {
      try {
        const encodedKeyword = encodeURIComponent(keyword);
        const res = await fetch(`${API_BASE}/categories/${id}/keywords/${encodedKeyword}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await refresh();
        return { ok: true, message: "OK" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refresh]
  );

  const mergeDedupPair = useCallback(
    async (primaryProductId: number, duplicateProductId: number) => {
      try {
        const res = await fetch(`${API_BASE}/dedup/merge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ primary_product_id: primaryProductId, duplicate_product_id: duplicateProductId }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await refresh();
        return { ok: true, message: "Дубликаты объединены" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refresh]
  );

  const rejectDedupPair = useCallback(
    async (productAId: number, productBId: number) => {
      try {
        const res = await fetch(`${API_BASE}/dedup/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_a_id: productAId, product_b_id: productBId }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await refresh();
        return { ok: true, message: "Пара помечена как не дубль" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refresh]
  );

  const toggleSourceEnabled = useCallback(
    async (sourceKey: string, enabled: boolean) => {
      try {
        const res = await fetch(`${API_BASE}/shopify/sources/${sourceKey}/enabled`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await refresh();
        return { ok: true, message: enabled ? "Источник включен" : "Источник выключен" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refresh]
  );

  useEffect(() => {
    void refresh();
    return undefined;
  }, [refresh]);

  useEffect(() => {
    if (!latestJob || !["pending", "in_progress"].includes(latestJob.status)) {
      return undefined;
    }

    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/latest`);
        if (!res.ok) {
          return;
        }
        const payload = (await res.json()) as JobsLatest;
        setLatestJob(payload);
        await fetchJobDetails(payload?.job_id);
        if (payload && !["pending", "in_progress"].includes(payload.status)) {
          await refresh();
        }
      } catch {
        // Keep silent; next poll tick will retry.
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [fetchJobDetails, latestJob?.status, refresh]);

  const value = useMemo(
    () => ({
      products,
      productsTotal,
      productsHasMore,
      categories,
      adminCategories,
      dedupCandidates,
      jobsHistory,
      latestJobDetails,
      sources,
      latestJob,
      loading,
      loadingMoreProducts,
      error,
      refresh,
      loadMoreProducts,
      getProductById,
      runSync,
      cancelSync,
      previewProductByUrl,
      addProductByUrl,
      createManualProduct,
      uploadProductImage,
      createCategory,
      updateCategory,
      deleteCategory,
      addCategoryKeyword,
      removeCategoryKeyword,
      mergeDedupPair,
      rejectDedupPair,
      toggleSourceEnabled,
    }),
    [
      products,
      productsTotal,
      productsHasMore,
      categories,
      adminCategories,
      dedupCandidates,
      jobsHistory,
      latestJobDetails,
      sources,
      latestJob,
      loading,
      loadingMoreProducts,
      error,
      refresh,
      loadMoreProducts,
      getProductById,
      runSync,
      cancelSync,
      previewProductByUrl,
      addProductByUrl,
      createManualProduct,
      uploadProductImage,
      createCategory,
      updateCategory,
      deleteCategory,
      addCategoryKeyword,
      removeCategoryKeyword,
      mergeDedupPair,
      rejectDedupPair,
      toggleSourceEnabled,
    ]
  );

  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}

export function useLiveData() {
  const context = useContext(LiveDataContext);
  if (!context) {
    throw new Error("useLiveData must be used within LiveDataProvider");
  }
  return context;
}
