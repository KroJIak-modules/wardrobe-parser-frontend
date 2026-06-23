import { useCallback, useRef, useState } from "react";
import { API_BASE } from "../admin-auth";
import { apiJson } from "../api-client";
import { normalizeServiceProduct } from "../live-product-normalizer";
import { toSlug } from "../utils";
import type {
  AdminUiSettings,
  AdminCategoryNode,
  DedupCandidate,
  DedupDecision,
  DedupScanStatus,
  PricingSettings,
  TaxonomyFilterNode,
  TaxonomyState,
  WeightMissingProduct,
  WeightRule,
} from "../live-data-types";

function mapTaxonomyFiltersToAdminCategories(filters: TaxonomyFilterNode[]): AdminCategoryNode[] {
  let nextId = 1;
  const visit = (nodes: TaxonomyFilterNode[], parentId: number | null): AdminCategoryNode[] => (
    nodes.map((node, index) => {
      const id = nextId++;
      const fallbackSlug = toSlug(`${node.title}-${id}-${index + 1}`) || `taxonomy-${id}`;
      const children = visit(Array.isArray(node.children) ? node.children : [], id);
      const keywords = Array.isArray(node.local_category_keywords) ? node.local_category_keywords.map((item) => String(item)) : [];
      const titleKeywords = Array.isArray(node.title_keywords) ? node.title_keywords.map((item) => String(item)) : [];
      return {
        id,
        name: String(node.display_title || node.title || "").trim() || "Без названия",
        slug: String(node.slug || "").trim() || fallbackSlug,
        parent_id: parentId,
        is_fallback: false,
        is_favorite: false,
        is_enabled: Boolean(node.is_enabled),
        is_system: false,
        has_children: children.length > 0,
        keywords_editable: false,
        keywords_locked_reason: "Taxonomy state is managed via taxonomy editor",
        is_designers_root: false,
        is_in_designers_branch: false,
        product_count: Array.isArray(node.manual_product_ids) ? node.manual_product_ids.length : 0,
        keywords,
        title_keywords: titleKeywords,
        children,
      };
    })
  );
  return visit(filters, null);
}

export function useLiveDataAdminReference(onError: (message: string) => void) {
  const MISSING_WEIGHT_PAGE_SIZE = 100;
  const DEDUP_PAGE_SIZE = 8;
  const [adminCategories, setAdminCategories] = useState<AdminCategoryNode[]>([]);
  const [dedupCandidates, setDedupCandidates] = useState<DedupCandidate[]>([]);
  const [dedupCandidatesTotal, setDedupCandidatesTotal] = useState<number>(0);
  const [loadingDedupCandidates, setLoadingDedupCandidates] = useState<boolean>(false);
  const [dedupScanStatus, setDedupScanStatus] = useState<DedupScanStatus>({
    is_running: false,
    started_at: null,
    finished_at: null,
    last_error: null,
    last_completed_candidates: null,
  });
  const [dedupDecisions, setDedupDecisions] = useState<DedupDecision[]>([]);
  const [dedupDecisionsTotal, setDedupDecisionsTotal] = useState<number>(0);
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
  const [dedupDecisionsLoaded, setDedupDecisionsLoaded] = useState<boolean>(false);
  const [dedupCandidatesOffset, setDedupCandidatesOffset] = useState<number>(0);
  const [dedupCandidatesHasMore, setDedupCandidatesHasMore] = useState<boolean>(true);
  const [loadingMoreDedupCandidates, setLoadingMoreDedupCandidates] = useState<boolean>(false);
  const [dedupDecisionsOffset, setDedupDecisionsOffset] = useState<number>(0);
  const [dedupDecisionsHasMore, setDedupDecisionsHasMore] = useState<boolean>(true);
  const [loadingMoreDedupDecisions, setLoadingMoreDedupDecisions] = useState<boolean>(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState<boolean>(false);
  const [loadingCategoriesTree, setLoadingCategoriesTree] = useState<boolean>(false);
  const [loadingCategoryCounts, setLoadingCategoryCounts] = useState<boolean>(false);
  const dedupCandidatesLoadPromiseRef = useRef<Promise<void> | null>(null);
  const dedupDecisionsLoadPromiseRef = useRef<Promise<void> | null>(null);
  const dedupDecisionCountLoadPromiseRef = useRef<Promise<void> | null>(null);

  const fetchDedupCandidates = useCallback(async () => {
    setLoadingDedupCandidates(true);
    try {
      const dedupPayload = await apiJson<{ items: DedupCandidate[]; has_more?: boolean; total?: number; limit?: number; offset?: number }>(
        `${API_BASE}/dedup/candidates?limit=${DEDUP_PAGE_SIZE}&offset=0`
      );
      const items = (dedupPayload.items || []).map((item) => ({
        ...item,
        left: normalizeServiceProduct(item.left as never),
        right: normalizeServiceProduct(item.right as never),
      }));
      setDedupCandidates(items);
      setDedupCandidatesTotal(Number(dedupPayload.total || 0));
      setDedupCandidatesOffset(items.length);
      setDedupCandidatesHasMore(Boolean(dedupPayload.has_more));
      setDedupLoaded(true);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingDedupCandidates(false);
    }
  }, [onError]);

  const refreshDedupStatusOnly = useCallback(async () => {
    try {
      const payload = await apiJson<DedupScanStatus>(`${API_BASE}/dedup/status`);
      setDedupScanStatus({
        is_running: Boolean(payload?.is_running),
        started_at: payload?.started_at ?? null,
        finished_at: payload?.finished_at ?? null,
        last_error: payload?.last_error ?? null,
        last_completed_candidates: payload?.last_completed_candidates ?? null,
      });
    } catch (e) {
      onError(e instanceof Error ? e.message : "Unknown error");
    }
  }, [onError]);

  const fetchDedupDecisions = useCallback(async () => {
    setLoadingDedupDecisions(true);
    try {
      const payload = await apiJson<{ items: DedupDecision[]; has_more?: boolean; total?: number; limit?: number; offset?: number }>(
        `${API_BASE}/dedup/decisions?limit=${DEDUP_PAGE_SIZE}&offset=0`
      );
      const items = (payload.items || []).map((item) => ({
        ...item,
        members: Array.isArray(item.members) ? item.members.map((member) => normalizeServiceProduct(member as never)) : [],
        created_product: item.created_product ? normalizeServiceProduct(item.created_product as never) : null,
      }));
      setDedupDecisions(items);
      setDedupDecisionsTotal(Number(payload.total || 0));
      setDedupDecisionsOffset(items.length);
      setDedupDecisionsHasMore(Boolean(payload.has_more));
    } catch (e) {
      onError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingDedupDecisions(false);
    }
  }, [onError]);

  const refreshDedupDecisionCountOnly = useCallback(async () => {
    if (dedupDecisionCountLoadPromiseRef.current) return dedupDecisionCountLoadPromiseRef.current;
    const request = (async () => {
      try {
        const payload = await apiJson<{ total?: number }>(`${API_BASE}/dedup/decisions/count`);
        setDedupDecisionsTotal(Number(payload?.total || 0));
      } catch (e) {
        onError(e instanceof Error ? e.message : "Unknown error");
      }
    })().finally(() => {
      dedupDecisionCountLoadPromiseRef.current = null;
    });
    dedupDecisionCountLoadPromiseRef.current = request;
    return request;
  }, [onError]);

  const loadMoreDedupCandidates = useCallback(async () => {
    if (loadingMoreDedupCandidates || !dedupCandidatesHasMore) return;
    setLoadingMoreDedupCandidates(true);
    try {
      const payload = await apiJson<{ items: DedupCandidate[]; has_more?: boolean; total?: number; limit?: number; offset?: number }>(
        `${API_BASE}/dedup/candidates?limit=${DEDUP_PAGE_SIZE}&offset=${dedupCandidatesOffset}`
      );
      const nextItems = (payload.items || []).map((item) => ({
        ...item,
        left: normalizeServiceProduct(item.left as never),
        right: normalizeServiceProduct(item.right as never),
      }));
      setDedupCandidates((prev) => {
        const known = new Set(prev.map((item) => item.pair_key));
        const toAdd = nextItems.filter((item) => !known.has(item.pair_key));
        return [...prev, ...toAdd];
      });
      setDedupCandidatesTotal(Number(payload.total || 0));
      setDedupCandidatesOffset((prev) => prev + nextItems.length);
      setDedupCandidatesHasMore(Boolean(payload.has_more));
    } finally {
      setLoadingMoreDedupCandidates(false);
    }
  }, [dedupCandidatesHasMore, dedupCandidatesOffset, loadingMoreDedupCandidates]);

  const loadMoreDedupDecisions = useCallback(async () => {
    if (loadingMoreDedupDecisions || !dedupDecisionsHasMore) return;
    setLoadingMoreDedupDecisions(true);
    try {
      const payload = await apiJson<{ items: DedupDecision[]; has_more?: boolean; total?: number; limit?: number; offset?: number }>(
        `${API_BASE}/dedup/decisions?limit=${DEDUP_PAGE_SIZE}&offset=${dedupDecisionsOffset}`
      );
      const nextItems = (payload.items || []).map((item) => ({
        ...item,
        members: Array.isArray(item.members) ? item.members.map((member) => normalizeServiceProduct(member as never)) : [],
        created_product: item.created_product ? normalizeServiceProduct(item.created_product as never) : null,
      }));
      setDedupDecisions((prev) => {
        const known = new Set(prev.map((item) => item.pair_key));
        const toAdd = nextItems.filter((item) => !known.has(item.pair_key));
        return [...prev, ...toAdd];
      });
      setDedupDecisionsTotal(Number(payload.total || 0));
      setDedupDecisionsOffset((prev) => prev + nextItems.length);
      setDedupDecisionsHasMore(Boolean(payload.has_more));
    } finally {
      setLoadingMoreDedupDecisions(false);
    }
  }, [dedupDecisionsHasMore, dedupDecisionsOffset, loadingMoreDedupDecisions]);

  const refreshDedupOnly = useCallback(async () => {
    if (dedupCandidatesLoadPromiseRef.current) return dedupCandidatesLoadPromiseRef.current;
    const request = (async () => {
      await Promise.all([fetchDedupCandidates(), refreshDedupStatusOnly()]);
      setDedupLoaded(true);
    })().finally(() => {
      dedupCandidatesLoadPromiseRef.current = null;
    });
    dedupCandidatesLoadPromiseRef.current = request;
    return request;
  }, [fetchDedupCandidates, refreshDedupStatusOnly]);

  const refreshDedupDecisionsOnly = useCallback(async () => {
    if (dedupDecisionsLoadPromiseRef.current) return dedupDecisionsLoadPromiseRef.current;
    const request = (async () => {
      await fetchDedupDecisions();
      setDedupDecisionsLoaded(true);
    })().finally(() => {
      dedupDecisionsLoadPromiseRef.current = null;
    });
    dedupDecisionsLoadPromiseRef.current = request;
    return request;
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
    const silent = options?.silent ?? false;
    if (!silent) {
      (options?.includeCounts ?? true) ? setLoadingCategoryCounts(true) : setLoadingCategoriesTree(true);
    }
    try {
      const payload = await apiJson<TaxonomyState>(`${API_BASE}/taxonomy/state`);
      setAdminCategories(mapTaxonomyFiltersToAdminCategories(Array.isArray(payload?.filters) ? payload.filters : []));
      setCategoriesLoaded(true);
    } finally {
      if (!silent) {
        (options?.includeCounts ?? true) ? setLoadingCategoryCounts(false) : setLoadingCategoriesTree(false);
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

  const ensureDedupDecisionsLoaded = useCallback(async (force = false) => {
    if (!force && dedupDecisionsLoaded) return;
    await refreshDedupDecisionsOnly();
  }, [dedupDecisionsLoaded, refreshDedupDecisionsOnly]);

  const ensureCategoriesLoaded = useCallback(async (force = false) => {
    if (!force && categoriesLoaded) return;
    await refreshCategoriesOnly({ includeCounts: true });
  }, [categoriesLoaded, refreshCategoriesOnly]);

  return {
    adminCategories,
    dedupCandidates,
    dedupCandidatesTotal,
    loadingDedupCandidates,
    dedupScanStatus,
    dedupDecisions,
    dedupDecisionsTotal,
    loadingDedupDecisions,
    weightRules,
    weightMissingProducts,
    pricingSettings,
    adminUiSettings,
    pricingLoaded,
    weightLoaded,
    dedupLoaded,
    dedupDecisionsLoaded,
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
    ensureDedupLoaded,
    ensureDedupDecisionsLoaded,
    ensureCategoriesLoaded,
    loadMoreWeightMissingProducts,
    loadMoreDedupCandidates,
    loadMoreDedupDecisions,
    setAdminCategories,
    setDedupCandidates,
    setDedupDecisions,
    setAdminUiSettings,
  };
}
