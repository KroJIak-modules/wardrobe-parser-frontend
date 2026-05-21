import { useCallback, useState } from "react";
import { API_BASE } from "../admin-auth";
import { apiJson } from "../api-client";
import type {
  AdminUiSettings,
  AdminCategoryNode,
  DedupCandidate,
  DedupDecision,
  PricingSettings,
  WeightMissingProduct,
  WeightRule,
} from "../live-data-types";

export function useLiveDataAdminReference(onError: (message: string) => void) {
  const MISSING_WEIGHT_PAGE_SIZE = 100;
  const DEDUP_PAGE_SIZE = 20;
  const [adminCategories, setAdminCategories] = useState<AdminCategoryNode[]>([]);
  const [dedupCandidates, setDedupCandidates] = useState<DedupCandidate[]>([]);
  const [loadingDedupCandidates, setLoadingDedupCandidates] = useState<boolean>(false);
  const [dedupDecisions, setDedupDecisions] = useState<DedupDecision[]>([]);
  const [loadingDedupDecisions, setLoadingDedupDecisions] = useState<boolean>(false);
  const [weightRules, setWeightRules] = useState<WeightRule[]>([]);
  const [weightMissingProducts, setWeightMissingProducts] = useState<WeightMissingProduct[]>([]);
  const [pricingSettings, setPricingSettings] = useState<PricingSettings | null>(null);
  const [adminUiSettings, setAdminUiSettings] = useState<AdminUiSettings | null>(null);
  const [pricingLoaded, setPricingLoaded] = useState<boolean>(false);
  const [adminUiLoaded, setAdminUiLoaded] = useState<boolean>(false);
  const [weightLoaded, setWeightLoaded] = useState<boolean>(false);
  const [weightMissingOffset, setWeightMissingOffset] = useState<number>(0);
  const [loadingMoreWeightMissing, setLoadingMoreWeightMissing] = useState<boolean>(false);
  const [hasMoreWeightMissing, setHasMoreWeightMissing] = useState<boolean>(true);
  const [dedupLoaded, setDedupLoaded] = useState<boolean>(false);
  const [dedupCandidatesOffset, setDedupCandidatesOffset] = useState<number>(0);
  const [dedupCandidatesHasMore, setDedupCandidatesHasMore] = useState<boolean>(true);
  const [loadingMoreDedupCandidates, setLoadingMoreDedupCandidates] = useState<boolean>(false);
  const [dedupDecisionsOffset, setDedupDecisionsOffset] = useState<number>(0);
  const [dedupDecisionsHasMore, setDedupDecisionsHasMore] = useState<boolean>(true);
  const [loadingMoreDedupDecisions, setLoadingMoreDedupDecisions] = useState<boolean>(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState<boolean>(false);
  const [loadingCategoriesTree, setLoadingCategoriesTree] = useState<boolean>(false);
  const [loadingCategoryCounts, setLoadingCategoryCounts] = useState<boolean>(false);

  const fetchDedupCandidates = useCallback(async () => {
    setLoadingDedupCandidates(true);
    try {
      const dedupPayload = await apiJson<{ items: DedupCandidate[]; total?: number; limit?: number; offset?: number }>(
        `${API_BASE}/dedup/candidates?limit=${DEDUP_PAGE_SIZE}&offset=0`
      );
      const items = dedupPayload.items || [];
      const total = Number(dedupPayload.total || 0);
      setDedupCandidates(items);
      setDedupCandidatesOffset(items.length);
      setDedupCandidatesHasMore(items.length < total);
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
      const payload = await apiJson<{ items: DedupDecision[]; total?: number; limit?: number; offset?: number }>(
        `${API_BASE}/dedup/decisions?limit=${DEDUP_PAGE_SIZE}&offset=0`
      );
      const items = payload.items || [];
      const total = Number(payload.total || 0);
      setDedupDecisions(items);
      setDedupDecisionsOffset(items.length);
      setDedupDecisionsHasMore(items.length < total);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingDedupDecisions(false);
    }
  }, [onError]);

  const loadMoreDedupCandidates = useCallback(async () => {
    if (loadingMoreDedupCandidates || !dedupCandidatesHasMore) return;
    setLoadingMoreDedupCandidates(true);
    try {
      const payload = await apiJson<{ items: DedupCandidate[]; total?: number; limit?: number; offset?: number }>(
        `${API_BASE}/dedup/candidates?limit=${DEDUP_PAGE_SIZE}&offset=${dedupCandidatesOffset}`
      );
      const nextItems = payload.items || [];
      const total = Number(payload.total || 0);
      setDedupCandidates((prev) => {
        const known = new Set(prev.map((item) => item.pair_key));
        const toAdd = nextItems.filter((item) => !known.has(item.pair_key));
        return [...prev, ...toAdd];
      });
      setDedupCandidatesOffset((prev) => prev + nextItems.length);
      setDedupCandidatesHasMore(dedupCandidatesOffset + nextItems.length < total);
    } finally {
      setLoadingMoreDedupCandidates(false);
    }
  }, [dedupCandidatesHasMore, dedupCandidatesOffset, loadingMoreDedupCandidates]);

  const loadMoreDedupDecisions = useCallback(async () => {
    if (loadingMoreDedupDecisions || !dedupDecisionsHasMore) return;
    setLoadingMoreDedupDecisions(true);
    try {
      const payload = await apiJson<{ items: DedupDecision[]; total?: number; limit?: number; offset?: number }>(
        `${API_BASE}/dedup/decisions?limit=${DEDUP_PAGE_SIZE}&offset=${dedupDecisionsOffset}`
      );
      const nextItems = payload.items || [];
      const total = Number(payload.total || 0);
      setDedupDecisions((prev) => {
        const known = new Set(prev.map((item) => item.pair_key));
        const toAdd = nextItems.filter((item) => !known.has(item.pair_key));
        return [...prev, ...toAdd];
      });
      setDedupDecisionsOffset((prev) => prev + nextItems.length);
      setDedupDecisionsHasMore(dedupDecisionsOffset + nextItems.length < total);
    } finally {
      setLoadingMoreDedupDecisions(false);
    }
  }, [dedupDecisionsHasMore, dedupDecisionsOffset, loadingMoreDedupDecisions]);

  const refreshDedupOnly = useCallback(async () => {
    await fetchDedupCandidates();
    setDedupLoaded(true);
  }, [fetchDedupCandidates]);

  const refreshDedupDecisionsOnly = useCallback(async () => {
    await fetchDedupDecisions();
  }, [fetchDedupDecisions]);

  const refreshPricingOnly = useCallback(async () => {
    const payload = await apiJson<PricingSettings>(`${API_BASE}/settings/pricing`);
    setPricingSettings(payload || null);
    setPricingLoaded(true);
  }, []);

  const refreshAdminUiOnly = useCallback(async () => {
    const payload = await apiJson<AdminUiSettings>(`${API_BASE}/settings/admin-ui`);
    setAdminUiSettings(payload || null);
    setAdminUiLoaded(true);
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
      apiJson<WeightMissingProduct[]>(`${API_BASE}/settings/weight-rules/missing-products?limit=${MISSING_WEIGHT_PAGE_SIZE}&offset=0`),
    ]);
    setWeightRules(rulesPayload || []);
    const chunk = missingPayload || [];
    setWeightMissingProducts(chunk);
    setWeightMissingOffset(chunk.length);
    setHasMoreWeightMissing(chunk.length >= MISSING_WEIGHT_PAGE_SIZE);
    setWeightLoaded(true);
  }, []);

  const loadMoreWeightMissingProducts = useCallback(async () => {
    if (loadingMoreWeightMissing || !hasMoreWeightMissing) return;
    setLoadingMoreWeightMissing(true);
    try {
      const chunk = await apiJson<WeightMissingProduct[]>(
        `${API_BASE}/settings/weight-rules/missing-products?limit=${MISSING_WEIGHT_PAGE_SIZE}&offset=${weightMissingOffset}`
      );
      const nextChunk = chunk || [];
      setWeightMissingProducts((prev) => [...prev, ...nextChunk]);
      setWeightMissingOffset((prev) => prev + nextChunk.length);
      setHasMoreWeightMissing(nextChunk.length >= MISSING_WEIGHT_PAGE_SIZE);
    } finally {
      setLoadingMoreWeightMissing(false);
    }
  }, [hasMoreWeightMissing, loadingMoreWeightMissing, weightMissingOffset]);

  const ensurePricingLoaded = useCallback(async (force = false) => {
    if (!force && pricingLoaded) return;
    await refreshPricingOnly();
  }, [pricingLoaded, refreshPricingOnly]);

  const ensureAdminUiLoaded = useCallback(async (force = false) => {
    if (!force && adminUiLoaded) return;
    await refreshAdminUiOnly();
  }, [adminUiLoaded, refreshAdminUiOnly]);

  const ensureWeightLoaded = useCallback(async (force = false) => {
    if (!force && weightLoaded) return;
    await refreshWeightOnly();
  }, [weightLoaded, refreshWeightOnly]);

  const ensureDedupLoaded = useCallback(async (force = false) => {
    if (!force && dedupLoaded) return;
    await refreshDedupOnly();
  }, [dedupLoaded, refreshDedupOnly]);

  const ensureDedupDecisionsLoaded = useCallback(async () => {
    await refreshDedupDecisionsOnly();
  }, [refreshDedupDecisionsOnly]);

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
    adminUiSettings,
    pricingLoaded,
    weightLoaded,
    dedupLoaded,
    categoriesLoaded,
    loadingCategoriesTree,
    loadingCategoryCounts,
    hasMoreWeightMissing,
    loadingMoreWeightMissing,
    dedupCandidatesHasMore,
    loadingMoreDedupCandidates,
    dedupDecisionsHasMore,
    loadingMoreDedupDecisions,
    refreshDedupOnly,
    refreshDedupDecisionsOnly,
    refreshPricingOnly,
    refreshAdminUiOnly,
    refreshCategoriesOnly,
    refreshWeightOnly,
    ensurePricingLoaded,
    ensureAdminUiLoaded,
    ensureWeightLoaded,
    ensureDedupLoaded,
    ensureDedupDecisionsLoaded,
    ensureCategoriesLoaded,
    loadMoreWeightMissingProducts,
    loadMoreDedupCandidates,
    loadMoreDedupDecisions,
    setAdminCategories,
    setAdminUiSettings,
  };
}
