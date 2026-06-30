import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { API_BASE, authFetch } from "./admin-auth";
import { useLiveDataAdminCore } from "./hooks/use-live-data-admin-core";
import { useLiveDataAdminReference } from "./hooks/use-live-data-admin-reference";
import { useLiveDataCategoryDedupActions } from "./hooks/use-live-data-category-dedup-actions";
import { useLiveDataBootstrap } from "./hooks/use-live-data-bootstrap";
import { useLiveJobPolling } from "./hooks/use-live-job-polling";
import { useLiveDataProductActions } from "./hooks/use-live-data-product-actions";
import { useLiveDataSourceSettingsActions } from "./hooks/use-live-data-source-settings-actions";
import { normalizeServiceProduct } from "./live-product-normalizer";

import type {
  AdminCategoryNode,
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
    dedupCandidatesTotal,
    loadingDedupCandidates,
    dedupScanStatus,
    dedupDecisions,
    dedupDecisionsTotal,
    loadingDedupDecisions,
    dedupDecisionsLoaded,
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
    refreshDedupStatusOnly,
    refreshDedupDecisionCountOnly,
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
    setDedupCandidates,
    setDedupDecisions,
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
    const res = await authFetch(`${API_BASE}/admin/products/table?limit=${PRODUCTS_PAGE_SIZE}&offset=0`);
    if (!res.ok) {
      throw new Error(`Products API error: ${res.status}`);
    }
    const payload = (await res.json()) as { items: ServiceProduct[]; total: number; limit: number; offset: number };
    const normalizedItems = (payload.items || []).map((item) => normalizeServiceProduct(item as never));
    setProducts(normalizedItems);
    setProductsTotal(payload.total || 0);
    setProductsHasMore(normalizedItems.length + (payload.offset || 0) < (payload.total || 0));
  }, []);

  const refreshAfterDedupMutation = useCallback(async (affectedProductIds?: number[]) => {
    if (Array.isArray(affectedProductIds) && affectedProductIds.length > 0) {
      const affectedIds = new Set(
        affectedProductIds
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0)
      );
      if (affectedIds.size > 0) {
        setDedupCandidates((previous) =>
          previous.filter(
            (candidate) => !affectedIds.has(Number(candidate.left?.id)) && !affectedIds.has(Number(candidate.right?.id))
          )
        );
      }
    }
    try {
      await Promise.all([refreshDedupOnly(), refreshDedupDecisionsOnly()]);
      void refreshProductsOnly().catch((e) => {
        setError(e instanceof Error ? e.message : "Unknown error");
      });
      void refreshCategoriesOnly({ includeCounts: true, silent: true }).catch((e) => {
        setError(e instanceof Error ? e.message : "Unknown error");
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshCategoriesOnly, refreshDedupDecisionsOnly, refreshDedupOnly, refreshProductsOnly, setDedupCandidates]);

  const {
    runDedupScan,
    mergeDedupProducts,
    rejectDedupProducts,
    undoDedupDecision,
  } = useLiveDataCategoryDedupActions({
    refreshAfterDedupMutation,
    refreshDedupOnly,
    refreshDedupStatusOnly,
    setDedupDecisions,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, sourcesRes, latestJobRes] = await Promise.all([
        authFetch(`${API_BASE}/admin/products/table?limit=${PRODUCTS_PAGE_SIZE}&offset=0`),
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
      const normalizedItems = (productsPayload.items || []).map((item) => normalizeServiceProduct(item as never));
      const latestPayload = (await latestJobRes.json()) as JobsLatest;

      setProducts(normalizedItems);
      setProductsTotal(productsPayload.total || 0);
      setProductsHasMore(normalizedItems.length + (productsPayload.offset || 0) < (productsPayload.total || 0));
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
    deleteProduct,
    uploadProductImage,
    uploadProductImageByUrl,
    bulkUpdateProducts,
    updateProductOverrides,
    updateManualProductVariants,
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
    toggleSourceDedupEnabled,
    toggleSourceAutoHideProducts,
    reorderSources,
    uploadSourceLogo,
    clearSourceLogo,
    updateSourceAttributeVisibility,
    assignSourceSupplier,
    createWeightRule,
    updateWeightRule,
    deleteWeightRule,
    addWeightKeyword,
    removeWeightKeyword,
    updatePricingSettings,
    updateAdminUiSettings,
    fetchPricingExampleProduct,
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
      const res = await authFetch(`${API_BASE}/admin/products/table?limit=${PRODUCTS_PAGE_SIZE}&offset=${offset}`);
      if (!res.ok) {
        throw new Error(`Products API error: ${res.status}`);
      }
      const payload = (await res.json()) as { items: ServiceProduct[]; total: number; offset: number };
      const nextItems = (payload.items || []).map((item) => normalizeServiceProduct(item as never));
      const known = new Set(products.map((item) => item.id));
      const toAdd = nextItems.filter((item) => !known.has(item.id));
      setProducts((prev) => {
        const known = new Set(prev.map((item) => item.id));
        const toAdd = nextItems.filter((item) => !known.has(item.id));
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
        return existing;
      }

      const res = await authFetch(`${API_BASE}/admin/products/${id}`);
      if (!res.ok) {
        return null;
      }
      const payload = normalizeServiceProduct((await res.json()) as never);
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
        if (latestPayload && ["queued", "running"].includes(String(latestPayload.status || ""))) {
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
        if (latestPayload && ["queued", "running"].includes(String(latestPayload.status || ""))) {
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


  const ensureAllProductsLoaded = useCallback(async () => {
    try {
      let offset = 0;
      let total = 0;
      const loaded: ServiceProduct[] = [];
      const seen = new Set<number>();
      let guard = 0;

      while (guard < 1000) {
        guard += 1;
        const res = await authFetch(`${API_BASE}/admin/products/table?limit=${PRODUCTS_PAGE_SIZE}&offset=${offset}`);
        if (!res.ok) {
          throw new Error(`Products API error: ${res.status}`);
        }
        const payload = (await res.json()) as { items: ServiceProduct[]; total: number };
        const items = (payload.items || []).map((item) => normalizeServiceProduct(item as never));
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
      dedupCandidatesTotal,
      loadingDedupCandidates,
      dedupScanStatus,
      dedupDecisions,
      dedupDecisionsTotal,
      loadingDedupDecisions,
      dedupDecisionsLoaded,
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
      refreshDedupStatusOnly,
      refreshDedupDecisionCountOnly,
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
      deleteProduct,
      uploadProductImage,
      uploadProductImageByUrl,
      runDedupScan,
      mergeDedupProducts,
      rejectDedupProducts,
      undoDedupDecision,
      bulkUpdateProducts,
      setProductStatus,
      updateProductOverrides,
      updateManualProductVariants,
      getProductStarredCategories,
      setProductStarredCategories,
      getStarredCategoryOptions,
      ensureAllProductsLoaded,
      toggleSourceEnabled,
      toggleSourceSyncEnabled,
      toggleSourceDedupEnabled,
      toggleSourceAutoHideProducts,
      reorderSources,
      uploadSourceLogo,
      clearSourceLogo,
      updateSourceAttributeVisibility,
      assignSourceSupplier,
      createWeightRule,
      updateWeightRule,
      deleteWeightRule,
      addWeightKeyword,
      removeWeightKeyword,
      fetchPricingExampleProduct,
      updatePricingSettings,
      updateAdminUiSettings,
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
      dedupCandidatesTotal,
      loadingDedupCandidates,
      dedupScanStatus,
      dedupDecisions,
      dedupDecisionsTotal,
      loadingDedupDecisions,
      dedupDecisionsLoaded,
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
      refreshDedupStatusOnly,
      refreshDedupDecisionCountOnly,
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
      deleteProduct,
      uploadProductImage,
      uploadProductImageByUrl,
      runDedupScan,
      mergeDedupProducts,
      rejectDedupProducts,
      undoDedupDecision,
      bulkUpdateProducts,
      setProductStatus,
      updateProductOverrides,
      updateManualProductVariants,
      getProductStarredCategories,
      setProductStarredCategories,
      ensureAllProductsLoaded,
      toggleSourceEnabled,
      toggleSourceSyncEnabled,
      toggleSourceDedupEnabled,
      toggleSourceAutoHideProducts,
      reorderSources,
      uploadSourceLogo,
      clearSourceLogo,
      updateSourceAttributeVisibility,
      assignSourceSupplier,
      createWeightRule,
      updateWeightRule,
      deleteWeightRule,
      addWeightKeyword,
      removeWeightKeyword,
      fetchPricingExampleProduct,
      updatePricingSettings,
      updateAdminUiSettings,
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
