import { useCallback, useState } from "react";
import { API_BASE } from "../admin-auth";
import { apiJson } from "../api-client";
import type {
  AdminCategoryNode,
  DedupCandidate,
  DedupDecision,
  PricingSettings,
  WeightMissingProduct,
  WeightRule,
} from "../live-data-types";

export function useLiveDataAdminReference(onError: (message: string) => void) {
  const [adminCategories, setAdminCategories] = useState<AdminCategoryNode[]>([]);
  const [dedupCandidates, setDedupCandidates] = useState<DedupCandidate[]>([]);
  const [loadingDedupCandidates, setLoadingDedupCandidates] = useState<boolean>(false);
  const [dedupDecisions, setDedupDecisions] = useState<DedupDecision[]>([]);
  const [loadingDedupDecisions, setLoadingDedupDecisions] = useState<boolean>(false);
  const [weightRules, setWeightRules] = useState<WeightRule[]>([]);
  const [weightMissingProducts, setWeightMissingProducts] = useState<WeightMissingProduct[]>([]);
  const [pricingSettings, setPricingSettings] = useState<PricingSettings | null>(null);
  const [pricingLoaded, setPricingLoaded] = useState<boolean>(false);
  const [weightLoaded, setWeightLoaded] = useState<boolean>(false);
  const [dedupLoaded, setDedupLoaded] = useState<boolean>(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState<boolean>(false);
  const [loadingCategoriesTree, setLoadingCategoriesTree] = useState<boolean>(false);
  const [loadingCategoryCounts, setLoadingCategoryCounts] = useState<boolean>(false);

  const fetchDedupCandidates = useCallback(async () => {
    setLoadingDedupCandidates(true);
    try {
      const dedupPayload = await apiJson<{ items: DedupCandidate[] }>(`${API_BASE}/dedup/candidates?limit=80`);
      setDedupCandidates(dedupPayload.items || []);
      setDedupLoaded(true);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingDedupCandidates(false);
    }
  }, [onError]);

  const fetchDedupDecisions = useCallback(async () => {
    setLoadingDedupDecisions(true);
    try {
      const payload = await apiJson<{ items: DedupDecision[] }>(`${API_BASE}/dedup/decisions?limit=200`);
      setDedupDecisions(payload.items || []);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingDedupDecisions(false);
    }
  }, [onError]);

  const refreshDedupOnly = useCallback(async () => {
    await Promise.all([fetchDedupCandidates(), fetchDedupDecisions()]);
    setDedupLoaded(true);
  }, [fetchDedupCandidates, fetchDedupDecisions]);

  const refreshPricingOnly = useCallback(async () => {
    const payload = await apiJson<PricingSettings>(`${API_BASE}/settings/pricing`);
    setPricingSettings(payload || null);
    setPricingLoaded(true);
  }, []);

  const refreshCategoriesOnly = useCallback(async (options?: { includeCounts?: boolean; silent?: boolean }) => {
    const includeCounts = options?.includeCounts ?? true;
    const silent = options?.silent ?? false;
    if (!silent) {
      includeCounts ? setLoadingCategoryCounts(true) : setLoadingCategoriesTree(true);
    }
    try {
      const params = new URLSearchParams();
      params.set("include_counts", includeCounts ? "1" : "0");
      const payload = await apiJson<AdminCategoryNode[]>(`${API_BASE}/categories/tree?${params.toString()}`);
      setAdminCategories(payload || []);
      setCategoriesLoaded(true);
    } finally {
      if (!silent) {
        includeCounts ? setLoadingCategoryCounts(false) : setLoadingCategoriesTree(false);
      }
    }
  }, []);

  const refreshWeightOnly = useCallback(async () => {
    const [rulesPayload, missingPayload] = await Promise.all([
      apiJson<WeightRule[]>(`${API_BASE}/settings/weight-rules`),
      apiJson<WeightMissingProduct[]>(`${API_BASE}/settings/weight-rules/missing-products?limit=100`),
    ]);
    setWeightRules(rulesPayload || []);
    setWeightMissingProducts(missingPayload || []);
    setWeightLoaded(true);
  }, []);

  const ensurePricingLoaded = useCallback(async (force = false) => {
    if (!force && pricingLoaded) return;
    await refreshPricingOnly();
  }, [pricingLoaded, refreshPricingOnly]);

  const ensureWeightLoaded = useCallback(async (force = false) => {
    if (!force && weightLoaded) return;
    await refreshWeightOnly();
  }, [weightLoaded, refreshWeightOnly]);

  const ensureDedupLoaded = useCallback(async (force = false) => {
    if (!force && dedupLoaded) return;
    await refreshDedupOnly();
  }, [dedupLoaded, refreshDedupOnly]);

  const ensureCategoriesLoaded = useCallback(async (force = false) => {
    if (!force && categoriesLoaded) return;
    await refreshCategoriesOnly({ includeCounts: true });
  }, [categoriesLoaded, refreshCategoriesOnly]);

  return {
    adminCategories,
    dedupCandidates,
    loadingDedupCandidates,
    dedupDecisions,
    loadingDedupDecisions,
    weightRules,
    weightMissingProducts,
    pricingSettings,
    pricingLoaded,
    weightLoaded,
    dedupLoaded,
    categoriesLoaded,
    loadingCategoriesTree,
    loadingCategoryCounts,
    refreshDedupOnly,
    refreshPricingOnly,
    refreshCategoriesOnly,
    refreshWeightOnly,
    ensurePricingLoaded,
    ensureWeightLoaded,
    ensureDedupLoaded,
    ensureCategoriesLoaded,
    setAdminCategories,
  };
}
