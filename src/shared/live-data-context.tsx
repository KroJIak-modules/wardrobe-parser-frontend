import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toSlug } from "./utils";

type Source = {
  key: string;
  name: string;
  base_url: string;
  parser_type: string;
  enabled: boolean;
  notes: string | null;
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
  created_at: string;
  updated_at: string;
};

type JobsLatest = {
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  next_scheduled_at: string | null;
  total_products: number | null;
  new_products: number;
  updated_products: number;
  new_images: number;
} | null;

type CategoryView = {
  slug: string;
  name: string;
  count: number;
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

type LiveDataContextValue = {
  products: ServiceProduct[];
  categories: CategoryView[];
  adminCategories: AdminCategoryNode[];
  sources: Source[];
  latestJob: JobsLatest;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  runSync: () => Promise<{ ok: boolean; message: string }>;
  addProductByUrl: (url: string) => Promise<{ ok: boolean; message: string }>;
  createManualProduct: (payload: {
    title: string;
    price: number | null;
    currency: string;
    product_type: string | null;
    image_count: number;
  }) => Promise<{ ok: boolean; message: string }>;
  uploadProductImage: (file: File) => Promise<{ ok: boolean; message: string }>;
  createCategory: (name: string, parentId: number | null) => Promise<{ ok: boolean; message: string }>;
  updateCategory: (id: number, payload: { name?: string; parent_id?: number | null }) => Promise<{ ok: boolean; message: string }>;
  deleteCategory: (id: number) => Promise<{ ok: boolean; message: string }>;
  addCategoryKeyword: (id: number, keyword: string) => Promise<{ ok: boolean; message: string }>;
  removeCategoryKeyword: (id: number, keyword: string) => Promise<{ ok: boolean; message: string }>;
};

const API_BASE =
  import.meta.env.VITE_SERVICE_API_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:10520";

const LiveDataContext = createContext<LiveDataContextValue | undefined>(undefined);

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ServiceProduct[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [adminCategories, setAdminCategories] = useState<AdminCategoryNode[]>([]);
  const [latestJob, setLatestJob] = useState<JobsLatest>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo<CategoryView[]>(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      const raw = product.product_type?.trim() || "Other";
      counts.set(raw, (counts.get(raw) || 0) + 1);
    }
    return [...counts.entries()].map(([name, count]) => ({
      name,
      slug: toSlug(name),
      count,
    }));
  }, [products]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, sourcesRes, latestJobRes, categoriesRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/products?limit=500`),
        fetch(`${API_BASE}/api/v1/shopify/sources`),
        fetch(`${API_BASE}/api/v1/jobs/latest`),
        fetch(`${API_BASE}/api/v1/categories/tree`),
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

      const productsPayload = (await productsRes.json()) as { items: ServiceProduct[] };
      const sourcesPayload = (await sourcesRes.json()) as Source[];
      const latestPayload = (await latestJobRes.json()) as JobsLatest;
      const categoriesPayload = (await categoriesRes.json()) as AdminCategoryNode[];

      setProducts(productsPayload.items || []);
      setSources(sourcesPayload || []);
      setLatestJob(latestPayload);
      setAdminCategories(categoriesPayload || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const runSync = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/jobs`, {
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

  const addProductByUrl = useCallback(
    async (url: string) => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/products/add-by-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
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
        const res = await fetch(`${API_BASE}/api/v1/products/manual`, {
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

      const res = await fetch(`${API_BASE}/api/v1/products/upload-image`, {
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
        const res = await fetch(`${API_BASE}/api/v1/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, parent_id: parentId }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await refresh();
        return { ok: true, message: "Категория создана" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refresh]
  );

  const updateCategory = useCallback(
    async (id: number, payload: { name?: string; parent_id?: number | null }) => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/categories/${id}`, {
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
        const res = await fetch(`${API_BASE}/api/v1/categories/${id}`, {
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
        const res = await fetch(`${API_BASE}/api/v1/categories/${id}/keywords`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await refresh();
        return { ok: true, message: "Ключевое слово добавлено" };
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
        const res = await fetch(`${API_BASE}/api/v1/categories/${id}/keywords/${encodedKeyword}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await refresh();
        return { ok: true, message: "Ключевое слово удалено" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refresh]
  );

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const value = useMemo(
    () => ({
      products,
      categories,
      adminCategories,
      sources,
      latestJob,
      loading,
      error,
      refresh,
      runSync,
      addProductByUrl,
      createManualProduct,
      uploadProductImage,
      createCategory,
      updateCategory,
      deleteCategory,
      addCategoryKeyword,
      removeCategoryKeyword,
    }),
    [
      products,
      categories,
      adminCategories,
      sources,
      latestJob,
      loading,
      error,
      refresh,
      runSync,
      addProductByUrl,
      createManualProduct,
      uploadProductImage,
      createCategory,
      updateCategory,
      deleteCategory,
      addCategoryKeyword,
      removeCategoryKeyword,
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
