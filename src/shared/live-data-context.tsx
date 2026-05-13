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
  const syncMockEnabled = String(import.meta.env.VITE_SYNC_MOCK || "").toLowerCase() === "true";
  const mockJobRef = useRef<JobsLatest>(null);
  const mockTickTimerRef = useRef<number | null>(null);
  const loadingMoreLockRef = useRef<boolean>(false);
  const productsRef = useRef<ServiceProduct[]>([]);

  const {
    adminCategories,
    dedupCandidates,
    loadingDedupCandidates,
    dedupDecisions,
    loadingDedupDecisions,
    weightRules,
    weightMissingProducts,
    pricingSettings,
    refreshDedupOnly,
    refreshPricingOnly,
    refreshCategoriesOnly,
    refreshWeightOnly,
    ensurePricingLoaded,
    ensureWeightLoaded,
    ensureDedupLoaded,
    ensureCategoriesLoaded,
    loadingCategoriesTree,
    loadingCategoryCounts,
    setAdminCategories,
  } = useLiveDataAdminReference((message) => setError(message));

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

  const stopMockTicker = useCallback(() => {
    if (mockTickTimerRef.current !== null) {
      window.clearInterval(mockTickTimerRef.current);
      mockTickTimerRef.current = null;
    }
  }, []);

  const getSyncEnabledSourcesSnapshot = useCallback((): Source[] => {
    const syncSources = sources.filter((source) => source.enabled && source.sync_enabled);
    return syncSources;
  }, [sources]);

  const startMockTicker = useCallback((enabledSources: Source[]) => {
    stopMockTicker();
    mockTickTimerRef.current = window.setInterval(() => {
      const current = mockJobRef.current;
      if (!current || current.status !== "in_progress") {
        stopMockTicker();
        return;
      }
      const totalSources = Math.max(1, current.total_sources || enabledSources.length || 1);
      const expectedProducts = Math.max(1000, current.expected_products || 5000);
      const sourceSize = Math.max(1, Math.floor(expectedProducts / totalSources));
      const nextProcessedProducts = Math.min(
        expectedProducts,
        (current.processed_products || 0) + 100 + Math.floor(Math.random() * 100)
      );
      const nextFailed = (current.failed_products || 0) + (Math.random() < 0.2 ? 1 : 0);
      const nextProcessedSources = Math.min(totalSources, Math.floor(nextProcessedProducts / sourceSize));
      const currentSourceIndex = Math.min(totalSources, Math.max(1, nextProcessedSources + 1));
      const currentSource = enabledSources[currentSourceIndex - 1] || enabledSources[enabledSources.length - 1];
      const currentSourceProcessed = Math.max(0, nextProcessedProducts - nextProcessedSources * sourceSize);
      const isDone = nextProcessedProducts >= expectedProducts;
      const stage = currentSourceProcessed < sourceSize * 0.3
        ? "discovering_urls"
        : currentSourceProcessed < sourceSize * 0.95
          ? "syncing_products"
          : "source_finished";
      const progressPercent = Math.round((nextProcessedProducts / expectedProducts) * 1000) / 10;
      const nextJob: JobsLatest = {
        ...current,
        status: isDone ? "completed" : "in_progress",
        completed_at: isDone ? new Date().toISOString() : null,
        can_cancel: !isDone,
        processed_products: nextProcessedProducts,
        failed_products: nextFailed,
        processed_sources: isDone ? totalSources : nextProcessedSources,
        current_source_index: currentSourceIndex,
        current_source_name: currentSource?.name || currentSource?.key || current.current_source_name,
        current_source_parser_type: "mock_strategy",
        current_stage: isDone ? "source_finished" : stage,
        current_source_processed_products: Math.min(sourceSize, currentSourceProcessed),
        current_source_total_products: sourceSize,
        progress_percent: isDone ? 100 : progressPercent,
        products_progress_percent: isDone ? 100 : progressPercent,
        updated_products: Math.floor(nextProcessedProducts * 0.52),
        new_products: Math.floor(nextProcessedProducts * 0.48),
      };
      mockJobRef.current = nextJob;
      setLatestJob(nextJob);
      if (isDone) {
        stopMockTicker();
      }
    }, 1200);
  }, [stopMockTicker]);

  const {
    previewProductByUrl,
    addProductByUrl,
    createManualProduct,
    uploadProductImage,
    updateProductOverrides,
    setProductStatus,
    getProductStarredCategories,
    setProductStarredCategories,
  } = useLiveDataProductActions({
    setProducts,
    refresh,
  });

  const {
    toggleSourceEnabled,
    toggleSourceSyncEnabled,
    toggleSourceAutoHideProducts,
    assignSourceSupplier,
    createWeightRule,
    updateWeightRule,
    deleteWeightRule,
    addWeightKeyword,
    removeWeightKeyword,
    updatePricingSettings,
    fetchPricingExampleProduct,
    updateShowcaseMediaSettings,
    updatePricingSupplier,
    createPricingSupplier,
    deletePricingSupplier,
    exportSettings,
    importSettings,
  } = useLiveDataSourceSettingsActions({
    setSources,
    setPricingSettings: (next) => setPricingSettings(next),
    refresh,
    refreshSourcesOnly,
    refreshPricingOnly,
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
    const startMock = () => {
      const enabledSources = getSyncEnabledSourcesSnapshot();
      const now = new Date().toISOString();
      const sourceCount = Math.max(1, enabledSources.length);
      const expectedProducts = sourceCount * 1500;
      const first = enabledSources[0];
      const mockJob: JobsLatest = {
        job_id: `mock-${Date.now()}`,
        status: "in_progress",
        created_at: now,
        started_at: now,
        completed_at: null,
        next_scheduled_at: null,
        total_products: null,
        new_products: 0,
        updated_products: 0,
        new_images: 0,
        total_sources: sourceCount,
        processed_sources: 0,
        progress_percent: 0,
        processed_products: 0,
        expected_products: expectedProducts,
        failed_products: 0,
        products_progress_percent: 0,
        current_source_name: first?.name || first?.key || "Источник 1",
        current_source_parser_type: "mock_strategy",
        current_source_index: 1,
        current_stage: "discovering_urls",
        current_source_processed_products: 0,
        current_source_total_products: Math.max(1, Math.floor(expectedProducts / sourceCount)),
        current_product_title: null,
        site_products_total: 0,
        can_cancel: true,
        sync_period_minutes: 0,
      };
      mockJobRef.current = mockJob;
      setLatestJob(mockJob);
      startMockTicker(enabledSources);
      return { ok: true, message: "Синхронизация запущена (mock)" };
    };

    if (syncMockEnabled) {
      return startMock();
    }
    try {
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
      return startMock();
    }
  }, [getSyncEnabledSourcesSnapshot, refresh, startMockTicker, syncMockEnabled]);

  const cancelSync = useCallback(async (jobId: string) => {
    if (syncMockEnabled && mockJobRef.current && mockJobRef.current.job_id === jobId) {
      stopMockTicker();
      const cancelled: JobsLatest = {
        ...mockJobRef.current,
        status: "cancelled",
        can_cancel: false,
        completed_at: new Date().toISOString(),
      };
      mockJobRef.current = cancelled;
      setLatestJob(cancelled);
      return { ok: true, message: "Синхронизация отменена" };
    }
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
  }, [refresh, stopMockTicker, syncMockEnabled]);


  const uploadShowcaseImage = useCallback(async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await authFetch(`${API_BASE}/settings/showcase/upload-image`, {
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

  useLiveJobPolling({
    latestJob,
    setLatestJob,
    refresh,
    syncMockEnabled,
    readMockJob: () => mockJobRef.current,
  });

  useEffect(() => {
    return () => stopMockTicker();
  }, [stopMockTicker]);

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
      pricingSettings,
      sources,
      latestJob,
      loading,
      loadingCategoriesTree,
      loadingCategoryCounts,
      loadingMoreProducts,
      error,
      refresh,
      ensurePricingLoaded,
      ensureWeightLoaded,
      ensureDedupLoaded,
      ensureCategoriesLoaded,
      refreshSourcesOnly,
      loadMoreProducts,
      getProductById,
      runSync,
      cancelSync,
      previewProductByUrl,
      addProductByUrl,
      createManualProduct,
      uploadProductImage,
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
      assignSourceSupplier,
      createWeightRule,
      updateWeightRule,
      deleteWeightRule,
      addWeightKeyword,
      removeWeightKeyword,
      fetchPricingExampleProduct,
      updatePricingSettings,
      updateShowcaseMediaSettings,
      updatePricingSupplier,
      createPricingSupplier,
      deletePricingSupplier,
      exportSettings,
      importSettings,
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
      pricingSettings,
      sources,
      latestJob,
      loading,
      loadingCategoriesTree,
      loadingCategoryCounts,
      loadingMoreProducts,
      error,
      refresh,
      ensurePricingLoaded,
      ensureWeightLoaded,
      ensureDedupLoaded,
      ensureCategoriesLoaded,
      refreshSourcesOnly,
      loadMoreProducts,
      getProductById,
      runSync,
      cancelSync,
      previewProductByUrl,
      addProductByUrl,
      createManualProduct,
      uploadProductImage,
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
      assignSourceSupplier,
      createWeightRule,
      updateWeightRule,
      deleteWeightRule,
      addWeightKeyword,
      removeWeightKeyword,
      fetchPricingExampleProduct,
      updatePricingSettings,
      updateShowcaseMediaSettings,
      updatePricingSupplier,
      createPricingSupplier,
      deletePricingSupplier,
      exportSettings,
      importSettings,
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
