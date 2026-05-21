import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { API_BASE, authFetch } from "./admin-auth";
import { useLiveDataAdminCore } from "./hooks/use-live-data-admin-core";
import { useLiveDataAdminReference } from "./hooks/use-live-data-admin-reference";
import { useLiveDataCategoryDedupActions } from "./hooks/use-live-data-category-dedup-actions";
import { useLiveDataBootstrap } from "./hooks/use-live-data-bootstrap";
import { useLiveJobPolling } from "./hooks/use-live-job-polling";
import { useLiveDataProductActions } from "./hooks/use-live-data-product-actions";
import { useLiveDataSourceSettingsActions } from "./hooks/use-live-data-source-settings-actions";

import type {
  AdminCategoryNode,
  CategoryManualProduct,
  CategoryView,
  DedupCandidate,
  DedupDecision,
  JobsLatest,
  LiveDataContextValue,
  PricingExampleProduct,
  PricingSettings,
  ProductStarredCategoryOption,
  ProductUrlPreview,
  ServiceProduct,
  SettingsTransferPayload,
  Source,
  WeightMissingProduct,
  WeightRule,
} from "./live-data-types";

const PRODUCTS_PAGE_SIZE = 100;
const isUnavailableStatus = (status: unknown): boolean => String(status || "").trim().toLowerCase() === "unavailable";

const LiveDataContext = createContext<LiveDataContextValue | undefined>(undefined);

export function LiveDataProvider({ children, routePath }: { children: ReactNode; routePath?: string }) {
  const [products, setProducts] = useState<ServiceProduct[]>([]);
  const [productsTotal, setProductsTotal] = useState<number>(0);
  const [productsHasMore, setProductsHasMore] = useState<boolean>(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [latestJob, setLatestJob] = useState<JobsLatest>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const loadingMoreLockRef = useRef<boolean>(false);
  const productsRef = useRef<ServiceProduct[]>([]);

  const onAdminReferenceError = useCallback((message: string) => {
    setError(message);
  }, []);

  const {
    adminCategories,
    dedupCandidates,
    loadingDedupCandidates,
    dedupDecisions,
    loadingDedupDecisions,
    weightRules,
    weightMissingProducts,
    hasMoreWeightMissing,
    loadingMoreWeightMissing,
    dedupCandidatesHasMore,
    loadingMoreDedupCandidates,
    dedupDecisionsHasMore,
    loadingMoreDedupDecisions,
    pricingSettings,
    adminUiSettings,
    refreshDedupOnly,
    refreshDedupDecisionsOnly,
    refreshPricingOnly,
    refreshAdminUiOnly,
    refreshCategoriesOnly,
    refreshWeightOnly,
    ensurePricingLoaded,
    ensureAdminUiLoaded,
    ensureWeightLoaded,
    loadMoreWeightMissingProducts,
    loadMoreDedupCandidates,
    loadMoreDedupDecisions,
    ensureDedupLoaded,
    ensureDedupDecisionsLoaded,
    ensureCategoriesLoaded,
    loadingCategoriesTree,
    loadingCategoryCounts,
    setAdminCategories,
    setAdminUiSettings,
  } = useLiveDataAdminReference(onAdminReferenceError);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const categories = useMemo<CategoryView[]>(() => {
    const build = (nodes: AdminCategoryNode[]): CategoryView[] => {
      return nodes.map((node) => ({
        id: node.id,
        slug: node.slug,
        name: node.name,
        parent_id: node.parent_id,
        count: Number(node.product_count || 0),
        is_enabled: Boolean(node.is_enabled),
        is_system: Boolean(node.is_system),
        is_designers_root: Boolean(node.is_designers_root),
        is_in_designers_branch: Boolean(node.is_in_designers_branch),
        is_fallback: Boolean(node.is_fallback),
        is_favorite: Boolean(node.is_favorite),
        children: build((node.children || []).filter((child) => child.is_enabled)),
      }));
    };
    const publicRoots = adminCategories.filter((node) => node.is_enabled);
    return build(publicRoots);
  }, [adminCategories]);


  const { refreshSourcesOnly, refreshAdminCoreOnly } = useLiveDataAdminCore({
    setSources,
    setLatestJob,
  });


  const refreshProductsOnly = useCallback(async () => {
    const res = await authFetch(`${API_BASE}/products?limit=${PRODUCTS_PAGE_SIZE}&offset=0`);
    if (!res.ok) {
      throw new Error(`Products API error: ${res.status}`);
    }
    const payload = (await res.json()) as { items: ServiceProduct[]; total: number; limit: number; offset: number };
    setProducts((payload.items || []).filter((item) => !isUnavailableStatus(item.status)));
    setProductsTotal(payload.total || 0);
    setProductsHasMore((payload.items || []).length + (payload.offset || 0) < (payload.total || 0));
  }, []);

  const refreshAfterDedupMutation = useCallback(() => {
    void Promise.all([refreshProductsOnly(), refreshCategoriesOnly(), refreshDedupOnly()]).catch((e) => {
      setError(e instanceof Error ? e.message : "Unknown error");
    });
  }, [refreshProductsOnly, refreshCategoriesOnly, refreshDedupOnly]);

  const {
    createCategory,
    updateCategory,
    deleteCategory,
    addCategoryKeyword,
    removeCategoryKeyword,
    getCategoryManualProducts,
    searchCategoryManualProducts,
    addCategoryManualProduct,
    removeCategoryManualProduct,
    mergeDedupPair,
    rejectDedupPair,
    combineDedupPair,
    undoDedupDecision,
  } = useLiveDataCategoryDedupActions({
    setAdminCategories,
    refreshCategoriesOnly,
    refreshProductsOnly,
    refreshAfterDedupMutation,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, sourcesRes, latestJobRes] = await Promise.all([
        authFetch(`${API_BASE}/products?limit=${PRODUCTS_PAGE_SIZE}&offset=0`),
        authFetch(`${API_BASE}/sources`),
        authFetch(`${API_BASE}/jobs/latest`),
      ]);

      if (!productsRes.ok) {
        throw new Error(`Products API error: ${productsRes.status}`);
      }
      if (!latestJobRes.ok) {
        throw new Error(`Jobs API error: ${latestJobRes.status}`);
      }
      const productsPayload = (await productsRes.json()) as { items: ServiceProduct[]; total: number; limit: number; offset: number };
      const latestPayload = (await latestJobRes.json()) as JobsLatest;

      setProducts((productsPayload.items || []).filter((item) => !isUnavailableStatus(item.status)));
      setProductsTotal(productsPayload.total || 0);
      setProductsHasMore((productsPayload.items || []).length + (productsPayload.offset || 0) < (productsPayload.total || 0));
      if (sourcesRes.ok) {
        const sourcesPayload = (await sourcesRes.json()) as Source[];
        setSources(sourcesPayload || []);
      }
      setLatestJob(latestPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const {
    previewProductByUrl,
    probeProductByUrl,
    addProductByUrl,
    createManualProduct,
    updateManualProduct,
    uploadProductImage,
    uploadProductImageByUrl,
    updateProductOverrides,
    setProductStatus,
    getProductStarredCategories,
    setProductStarredCategories,
    getStarredCategoryOptions,
  } = useLiveDataProductActions({
    setProducts,
    refreshProductsOnly,
    refreshSourcesOnly,
  });

  const {
    toggleSourceEnabled,
    toggleSourceSyncEnabled,
    toggleSourceAutoHideProducts,
    updateSourceAttributeVisibility,
    updateSourceCurrencyPriority,
    assignSourceSupplier,
    createWeightRule,
    updateWeightRule,
    deleteWeightRule,
    addWeightKeyword,
    removeWeightKeyword,
    updatePricingSettings,
    updateAdminUiSettings,
    fetchPricingExampleProduct,
    updateShowcaseMediaSettings,
    updatePricingSupplier,
    createPricingSupplier,
    deletePricingSupplier,
    exportSettings,
    importSettings,
    resetSettings,
  } = useLiveDataSourceSettingsActions({
    setSources,
    setPricingSettings: (next) => setPricingSettings(next),
    setAdminUiSettings: (next) => setAdminUiSettings(next),
    refresh,
    refreshSourcesOnly,
    refreshPricingOnly,
    refreshAdminUiOnly,
    refreshWeightOnly,
    refreshCategoriesOnly,
    refreshDedupOnly,
    setError,
  });

  const loadMoreProducts = useCallback(async () => {
    if (!productsHasMore || loadingMoreProducts || loadingMoreLockRef.current) {
      return;
    }
    loadingMoreLockRef.current = true;
    try {
      setLoadingMoreProducts(true);
      const offset = products.length;
      const res = await authFetch(`${API_BASE}/products?limit=${PRODUCTS_PAGE_SIZE}&offset=${offset}`);
      if (!res.ok) {
        throw new Error(`Products API error: ${res.status}`);
      }
      const payload = (await res.json()) as { items: ServiceProduct[]; total: number; offset: number };
      const nextItems = payload.items || [];
      const known = new Set(products.map((item) => item.id));
      const toAdd = nextItems.filter((item) => !known.has(item.id) && !isUnavailableStatus(item.status));
      setProducts((prev) => {
        const known = new Set(prev.map((item) => item.id));
        const toAdd = nextItems.filter((item) => !known.has(item.id) && !isUnavailableStatus(item.status));
        return [...prev, ...toAdd];
      });
      setProductsTotal(payload.total || 0);
      if (toAdd.length === 0) {
        setProductsHasMore(false);
      } else {
        setProductsHasMore(nextItems.length + (payload.offset || 0) < (payload.total || 0));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingMoreProducts(false);
      loadingMoreLockRef.current = false;
    }
  }, [productsHasMore, products, loadingMoreProducts]);

  const getProductById = useCallback(async (id: number, opts?: { forceFetch?: boolean }) => {
    try {
      const existing = productsRef.current.find((item) => item.id === id);
      if (existing && !opts?.forceFetch) {
        if (isUnavailableStatus(existing.status)) {
          return null;
        }
        return existing;
      }

      const res = await authFetch(`${API_BASE}/products/${id}`);
      if (!res.ok) {
        return null;
      }
      const payload = (await res.json()) as ServiceProduct;
      if (isUnavailableStatus(payload.status)) {
        return null;
      }
      setProducts((prev) => {
        const idx = prev.findIndex((item) => item.id === payload.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...payload };
          return next;
        }
        return [...prev, payload];
      });
      return payload;
    } catch {
      return null;
    }
  }, []);

  const runSync = useCallback(async () => {
    try {
      // Guard against stale UI when another admin has already started sync.
      const latestRes = await authFetch(`${API_BASE}/jobs/latest`);
      if (latestRes.ok) {
        const latestPayload = (await latestRes.json()) as JobsLatest;
        if (latestPayload && ["pending", "in_progress"].includes(String(latestPayload.status || ""))) {
          setLatestJob(latestPayload);
          return { ok: false, message: "Синхронизация уже запущена другим админом" };
        }
      }

      const res = await authFetch(`${API_BASE}/jobs`, {
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
      return { ok: false, message: e instanceof Error ? e.message : "Ошибка запуска синхронизации" };
    }
  }, [refresh]);

  const runSyncForSource = useCallback(async (sourceKey: string) => {
    try {
      const normalized = String(sourceKey || "").trim();
      if (!normalized) {
        return { ok: false, message: "Не указан источник" };
      }
      const latestRes = await authFetch(`${API_BASE}/jobs/latest`);
      if (latestRes.ok) {
        const latestPayload = (await latestRes.json()) as JobsLatest;
        if (latestPayload && ["pending", "in_progress"].includes(String(latestPayload.status || ""))) {
          setLatestJob(latestPayload);
          return { ok: false, message: "Синхронизация уже запущена другим админом" };
        }
      }
      const res = await authFetch(`${API_BASE}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggered_by: "manual", sources: [normalized] }),
      });
      if (res.status === 409) {
        return { ok: false, message: "Синхронизация уже запущена" };
      }
      if (!res.ok) {
        return { ok: false, message: `Ошибка запуска: ${res.status}` };
      }
      await refresh();
      return { ok: true, message: `Синхронизация запущена: ${normalized}` };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Ошибка запуска синхронизации" };
    }
  }, [refresh]);

  const cancelSync = useCallback(async (jobId: string) => {
    try {
      const res = await authFetch(`${API_BASE}/jobs/${jobId}/cancel`, {
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


  const uploadShowcaseImage = useCallback(async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await authFetch(`${API_BASE}/showcase/carousel/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
        return { ok: false, message: errorPayload?.detail || `Ошибка upload: ${res.status}`, imageAssetId: null };
      }
      const payload = (await res.json()) as { image_asset_id?: number };
      const imageAssetId = Number(payload?.image_asset_id);
      if (!Number.isFinite(imageAssetId) || imageAssetId <= 0) {
        return { ok: false, message: "Сервер вернул некорректный id изображения", imageAssetId: null };
      }
      return { ok: true, message: "Изображение загружено", imageAssetId };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error", imageAssetId: null };
    }
  }, []);

  const ensureAllProductsLoaded = useCallback(async () => {
    try {
      let offset = 0;
      let total = 0;
      const loaded: ServiceProduct[] = [];
      const seen = new Set<number>();
      let guard = 0;

      while (guard < 1000) {
        guard += 1;
        const res = await authFetch(`${API_BASE}/products?limit=${PRODUCTS_PAGE_SIZE}&offset=${offset}`);
        if (!res.ok) {
          throw new Error(`Products API error: ${res.status}`);
        }
        const payload = (await res.json()) as { items: ServiceProduct[]; total: number };
        const items = payload.items || [];
        total = Number(payload.total || 0);

        for (const item of items) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            loaded.push(item);
          }
        }

        offset = loaded.length;
        if (offset >= total || items.length === 0) {
          break;
        }
      }

      setProducts(loaded);
      setProductsTotal(total || loaded.length);
      setProductsHasMore((total || loaded.length) > loaded.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }, []);


  useLiveDataBootstrap({
    routePath,
    setError,
    setLoading,
    refreshAdminCoreOnly,
    refreshSourcesOnly,
  });

  const refreshAfterTerminal = useCallback(async () => {
    const path = routePath ?? (typeof window !== "undefined" ? window.location.pathname : "/");
    if (path.startsWith("/control/sources")) {
      await refreshSourcesOnly();
      return;
    }
    if (path.startsWith("/control/products")) {
      await refreshProductsOnly();
      return;
    }
    if (path.startsWith("/control")) {
      await refreshAdminCoreOnly();
      return;
    }
    await refreshAdminCoreOnly();
  }, [routePath, refreshSourcesOnly, refreshProductsOnly, refreshAdminCoreOnly]);

  useLiveJobPolling({
    latestJob,
    setLatestJob,
    refreshAfterTerminal,
    enabled: Boolean((routePath ?? (typeof window !== "undefined" ? window.location.pathname : "/")).startsWith("/control")),
  });

  const value = useMemo(
    () => ({
      products,
      productsTotal,
      productsHasMore,
      categories,
      adminCategories,
      dedupCandidates,
      loadingDedupCandidates,
      dedupDecisions,
      loadingDedupDecisions,
      weightRules,
      weightMissingProducts,
      hasMoreWeightMissing,
      loadingMoreWeightMissing,
      dedupCandidatesHasMore,
      loadingMoreDedupCandidates,
      dedupDecisionsHasMore,
      loadingMoreDedupDecisions,
      pricingSettings,
      adminUiSettings,
      sources,
      latestJob,
      loading,
      loadingCategoriesTree,
      loadingCategoryCounts,
      loadingMoreProducts,
      error,
      refresh,
      ensurePricingLoaded,
      ensureAdminUiLoaded,
      ensureWeightLoaded,
      loadMoreWeightMissingProducts,
      loadMoreDedupCandidates,
      loadMoreDedupDecisions,
      ensureDedupLoaded,
      ensureDedupDecisionsLoaded,
      ensureCategoriesLoaded,
      refreshSourcesOnly,
      loadMoreProducts,
      getProductById,
      runSync,
      runSyncForSource,
      cancelSync,
      previewProductByUrl,
      probeProductByUrl,
      addProductByUrl,
      createManualProduct,
      updateManualProduct,
      uploadProductImage,
      uploadProductImageByUrl,
      uploadShowcaseImage,
      createCategory,
      updateCategory,
      deleteCategory,
      addCategoryKeyword,
      removeCategoryKeyword,
      getCategoryManualProducts,
      searchCategoryManualProducts,
      addCategoryManualProduct,
      removeCategoryManualProduct,
      mergeDedupPair,
      rejectDedupPair,
      combineDedupPair,
      undoDedupDecision,
      setProductStatus,
      updateProductOverrides,
      getProductStarredCategories,
      setProductStarredCategories,
      getStarredCategoryOptions,
      ensureAllProductsLoaded,
      toggleSourceEnabled,
      toggleSourceSyncEnabled,
      toggleSourceAutoHideProducts,
      updateSourceAttributeVisibility,
      updateSourceCurrencyPriority,
      assignSourceSupplier,
      createWeightRule,
      updateWeightRule,
      deleteWeightRule,
      addWeightKeyword,
      removeWeightKeyword,
      fetchPricingExampleProduct,
      updatePricingSettings,
      updateAdminUiSettings,
      updateShowcaseMediaSettings,
      updatePricingSupplier,
      createPricingSupplier,
      deletePricingSupplier,
      exportSettings,
      importSettings,
      resetSettings,
    }),
    [
      products,
      productsTotal,
      productsHasMore,
      categories,
      adminCategories,
      dedupCandidates,
      loadingDedupCandidates,
      dedupDecisions,
      loadingDedupDecisions,
      weightRules,
      weightMissingProducts,
      hasMoreWeightMissing,
      loadingMoreWeightMissing,
      dedupCandidatesHasMore,
      loadingMoreDedupCandidates,
      dedupDecisionsHasMore,
      loadingMoreDedupDecisions,
      pricingSettings,
      adminUiSettings,
      sources,
      latestJob,
      loading,
      loadingCategoriesTree,
      loadingCategoryCounts,
      loadingMoreProducts,
      error,
      refresh,
      ensurePricingLoaded,
      ensureAdminUiLoaded,
      ensureWeightLoaded,
      loadMoreWeightMissingProducts,
      loadMoreDedupCandidates,
      loadMoreDedupDecisions,
      ensureDedupLoaded,
      ensureDedupDecisionsLoaded,
      ensureCategoriesLoaded,
      refreshSourcesOnly,
      loadMoreProducts,
      getProductById,
      runSync,
      runSyncForSource,
      cancelSync,
      previewProductByUrl,
      probeProductByUrl,
      addProductByUrl,
      createManualProduct,
      updateManualProduct,
      uploadProductImage,
      uploadProductImageByUrl,
      uploadShowcaseImage,
      createCategory,
      updateCategory,
      deleteCategory,
      addCategoryKeyword,
      removeCategoryKeyword,
      getCategoryManualProducts,
      searchCategoryManualProducts,
      addCategoryManualProduct,
      removeCategoryManualProduct,
      mergeDedupPair,
      rejectDedupPair,
      combineDedupPair,
      undoDedupDecision,
      setProductStatus,
      updateProductOverrides,
      getProductStarredCategories,
      setProductStarredCategories,
      ensureAllProductsLoaded,
      toggleSourceEnabled,
      toggleSourceSyncEnabled,
      toggleSourceAutoHideProducts,
      updateSourceAttributeVisibility,
      updateSourceCurrencyPriority,
      assignSourceSupplier,
      createWeightRule,
      updateWeightRule,
      deleteWeightRule,
      addWeightKeyword,
      removeWeightKeyword,
      fetchPricingExampleProduct,
      updatePricingSettings,
      updateAdminUiSettings,
      updateShowcaseMediaSettings,
      updatePricingSupplier,
      createPricingSupplier,
      deletePricingSupplier,
      exportSettings,
      importSettings,
      resetSettings,
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
