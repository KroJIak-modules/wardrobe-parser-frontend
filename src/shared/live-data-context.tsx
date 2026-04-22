import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Source = {
  key: string;
  source_id: number | null;
  name: string;
  base_url: string;
  parser_type: string;
  enabled: boolean;
  sync_enabled: boolean;
  hide_auto_added_products?: boolean;
  notes: string | null;
  status_label: string | null;
  products_count: number;
  categories_count: number;
  last_sync_at?: string | null;
  last_sync_duration_sec?: number | null;
  last_sync_status?: string | null;
  supplier_id: number | null;
  supplier_key: string | null;
  supplier_name: string | null;
  promo_factor: number;
  promo_only_no_discount: boolean;
  buyout_surcharge_value: number;
  buyout_surcharge_currency: string;
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

export type ProductEditState = {
  title_sync_locked: boolean;
  description_sync_locked: boolean;
  description_visible_override?: boolean | null;
  description_visible_effective?: boolean;
  images_sync_locked: boolean;
  title_override?: string | null;
  description_override?: string | null;
  hidden_source_image_ids: number[];
  manual_image_ids: number[];
  manual_image_order: string[];
  source_image_ids: number[];
};

export type ServiceProduct = {
  id: number;
  source_id: number;
  handle: string;
  title: string;
  vendor: string | null;
  vendor_original?: string | null;
  vendor_mapped?: string | null;
  vendor_display?: string | null;
  product_type: string | null;
  url: string;
  price: number | null;
  currency: string;
  source_price?: number | null;
  source_currency?: string | null;
  final_price?: number | null;
  final_currency?: string | null;
  pricing_manual_required?: boolean;
  pricing_reason?: string | null;
  pricing_components?: Record<string, unknown>;
  buyout_price_rub?: number | null;
  status: string;
  image_count: number;
  image_urls: string[];
  image_ids: number[];
  variants: ProductVariant[];
  is_favorite?: boolean;
  starred_category_ids?: number[];
  internal_category_id?: number | null;
  internal_category_name?: string | null;
  internal_category_slug?: string | null;
  internal_category_ids?: number[];
  internal_category_names?: string[];
  internal_category_slugs?: string[];
  description?: string | null;
  product_edit?: ProductEditState;
  created_at: string;
  updated_at: string;
};

export function toImageGatewayUrl(
  imageId: number | null | undefined,
  opts?: { w?: number; h?: number; q?: number }
) {
  if (!imageId || imageId <= 0) {
    return null;
  }
  const params = new URLSearchParams();
  if (opts?.w && Number.isFinite(opts.w)) {
    params.set("w", String(Math.max(16, Math.round(opts.w))));
  }
  if (opts?.h && Number.isFinite(opts.h)) {
    params.set("h", String(Math.max(16, Math.round(opts.h))));
  }
  if (opts?.q && Number.isFinite(opts.q)) {
    params.set("q", String(Math.max(25, Math.min(95, Math.round(opts.q)))));
  }
  const query = params.toString();
  return query ? `/api/v1/images/${imageId}?${query}` : `/api/v1/images/${imageId}`;
}

export function normalizeImageSourceUrl(url: string | null | undefined): string | null {
  const raw = (url || "").trim();
  if (!raw) {
    return null;
  }
  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("/")) {
    return raw;
  }
  return null;
}

export function getProductPrimaryImageUrl(product: {
  image_ids?: number[] | null;
  image_urls?: string[] | null;
}, opts?: { w?: number; h?: number; q?: number }): string | null {
  const byId = toImageGatewayUrl(product.image_ids?.[0], opts);
  if (byId) {
    return byId;
  }
  return normalizeImageSourceUrl(product.image_urls?.[0]);
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
  current_source_parser_type: string | null;
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

export type CategoryView = {
  id: number;
  slug: string;
  name: string;
  parent_id: number | null;
  count: number;
  is_enabled: boolean;
  is_system: boolean;
  is_designers_root: boolean;
  is_in_designers_branch: boolean;
  is_fallback: boolean;
  is_favorite: boolean;
  children: CategoryView[];
};

export type AdminCategoryNode = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  is_fallback: boolean;
  is_favorite: boolean;
  is_enabled: boolean;
  is_system: boolean;
  has_children: boolean;
  keywords_editable: boolean;
  keywords_locked_reason?: string | null;
  is_designers_root: boolean;
  is_in_designers_branch: boolean;
  product_count: number;
  keywords: string[];
  title_keywords: string[];
  status_keywords: string[];
  effective_keywords: string[];
  children: AdminCategoryNode[];
};

export type CategoryManualProduct = {
  product_id: number;
  source_id: number;
  source_name?: string | null;
  title: string;
  url: string;
  status: string;
  image_url?: string | null;
  category_names: string[];
};

export type ProductStarredCategoryOption = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
};

export type DedupCandidate = {
  pair_key: string;
  score: number;
  reasons: string[];
  left: ServiceProduct;
  right: ServiceProduct;
};

export type DedupDecision = {
  pair_key: string;
  action: string;
  decided_at: string | null;
  can_undo: boolean;
  undo_block_reason: string | null;
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

export type WeightRule = {
  id: number;
  weight_grams: number;
  keywords: string[];
};

export type WeightMissingProduct = {
  id: number;
  title: string;
  url: string;
  source_id: number;
  source_name: string;
};

export type PricingSettings = {
  markup_multiplier: number;
  weight_tolerance: number;
  promo_factor: number;
  customs_threshold_eur: number;
  customs_threshold_currency: string;
  customs_duty_rate: number;
  bybit_usdt_to_rub: number;
  bybit_extra_rub: number;
  eur_to_usd_rate: number;
  gbp_to_usd_rate: number;
  final_rounding_mode: string;
  payment_fee_rate: number;
  customs_processing_rate: number;
  customs_fixed_rub: number;
  shipping_alt_threshold_eur: number;
  tax_rate: number;
  designers_min_products: number;
  designers_exclude_store_vendors: boolean;
  dedup_only_available_products: boolean;
  show_product_description: boolean;
  svc_rules: Array<Record<string, unknown>>;
  insurance_rules: Array<Record<string, unknown>>;
  service_fee_rules: Array<Record<string, unknown>>;
  shipping_rules: Record<string, Record<string, Array<Record<string, unknown>>>>;
  showcase_hero_image_asset_id?: number | null;
  showcase_carousel_image_asset_ids?: number[];
  bybit_rate_status?: string;
  bybit_rate_warning?: string | null;
  bybit_bucket_step_usdt?: number;
  bybit_bucket_max_usdt?: number;
  bybit_bucket_rates?: Array<Record<string, unknown>>;
  bybit_worker_auto_enabled?: boolean;
  bybit_worker_interval_sec?: number;
  bybit_last_updated_at?: string | null;
  bybit_last_error?: string | null;
  suppliers: PricingSupplier[];
  formula_latex: string;
  formula_lines: string[];
  formula_legend: Array<{ key: string; description: string }>;
};

export type PricingExampleProduct = {
  product_id: number;
  title: string;
  url: string;
  source_name: string | null;
  image_url: string | null;
  source_price: number | null;
  source_currency: string | null;
  final_price: number | null;
  components: Record<string, unknown>;
};

export type PricingSupplierRate = {
  min_kg: number;
  max_kg: number | null;
  rub: number;
};

export type PricingSupplier = {
  id: number;
  key: string;
  name: string;
  category: string;
  parent_supplier_id?: number | null;
  alt_position?: number;
  rate_currency: string;
  rates: PricingSupplierRate[];
};

export type SettingsTransferSupplierRateEntry = {
  min_kg: number;
  max_kg: number | null;
  rub: number;
};

export type SettingsTransferSupplierEntry = {
  key: string;
  name: string;
  category: string;
  rate_currency: string;
  rates: SettingsTransferSupplierRateEntry[];
};

export type SettingsTransferSourceEntry = {
  name: string;
  url: string;
  enabled: boolean;
  supplier_key: string | null;
  promo_factor: number;
  promo_only_no_discount: boolean;
  buyout_surcharge_value: number;
  buyout_surcharge_currency: string;
};

export type SettingsTransferWeightRuleEntry = {
  weight_grams: number;
  sort_order: number;
  keywords: string[];
};

export type SettingsTransferCategoryEntry = {
  slug: string;
  name: string;
  parent_slug: string | null;
  is_fallback: boolean;
  is_favorite: boolean;
  is_enabled: boolean;
};

export type SettingsTransferCategoryKeywordEntry = {
  category_slug: string;
  keyword: string;
  scope: "local" | "title" | "status";
};

export type SettingsTransferPricingSettings = {
  markup_multiplier: number;
  weight_tolerance: number;
  promo_factor: number;
  customs_threshold_eur: number;
  customs_threshold_currency: string;
  customs_duty_rate: number;
  bybit_extra_rub: number;
  eur_to_usd_rate: number;
  gbp_to_usd_rate: number;
  final_rounding_mode: string;
  payment_fee_rate: number;
  customs_processing_rate: number;
  customs_fixed_rub: number;
  shipping_alt_threshold_eur: number;
  tax_rate: number;
  designers_min_products: number;
  designers_exclude_store_vendors: boolean;
  dedup_only_available_products: boolean;
  show_product_description: boolean;
  svc_rules: Array<Record<string, unknown>>;
  insurance_rules: Array<Record<string, unknown>>;
  service_fee_rules: Array<Record<string, unknown>>;
  shipping_rules: Record<string, Record<string, Array<Record<string, unknown>>>>;
  showcase_hero_image_asset_id?: number | null;
  showcase_carousel_image_asset_ids?: number[];
};

export type SettingsTransferPayload = {
  schema_version: number;
  exported_at: string | null;
  project: string | null;
  pricing_settings: SettingsTransferPricingSettings;
  suppliers: SettingsTransferSupplierEntry[];
  sources: SettingsTransferSourceEntry[];
  weight_rules: SettingsTransferWeightRuleEntry[];
  categories: SettingsTransferCategoryEntry[];
  category_keywords: SettingsTransferCategoryKeywordEntry[];
};

type LiveDataContextValue = {
  products: ServiceProduct[];
  productsTotal: number;
  productsHasMore: boolean;
  categories: CategoryView[];
  adminCategories: AdminCategoryNode[];
  dedupCandidates: DedupCandidate[];
  loadingDedupCandidates: boolean;
  dedupDecisions: DedupDecision[];
  loadingDedupDecisions: boolean;
  weightRules: WeightRule[];
  weightMissingProducts: WeightMissingProduct[];
  pricingSettings: PricingSettings | null;
  sources: Source[];
  latestJob: JobsLatest;
  loading: boolean;
  loadingCategoriesTree: boolean;
  loadingCategoryCounts: boolean;
  loadingMoreProducts: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  ensurePricingLoaded: (force?: boolean) => Promise<void>;
  ensureWeightLoaded: (force?: boolean) => Promise<void>;
  ensureDedupLoaded: (force?: boolean) => Promise<void>;
  ensureCategoriesLoaded: (force?: boolean) => Promise<void>;
  loadMoreProducts: () => Promise<void>;
  getProductById: (id: number, opts?: { forceFetch?: boolean }) => Promise<ServiceProduct | null>;
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
  uploadShowcaseImage: (file: File) => Promise<{ ok: boolean; message: string; imageAssetId: number | null }>;
  createCategory: (name: string, parentId: number | null) => Promise<{ ok: boolean; message: string; categoryId?: number }>;
  updateCategory: (
    id: number,
    payload: { name?: string; parent_id?: number | null; is_enabled?: boolean; is_favorite?: boolean }
  ) => Promise<{ ok: boolean; message: string }>;
  deleteCategory: (id: number) => Promise<{ ok: boolean; message: string }>;
  addCategoryKeyword: (id: number, keyword: string, scope?: "local" | "title" | "status") => Promise<{ ok: boolean; message: string }>;
  removeCategoryKeyword: (id: number, keyword: string, scope?: "local" | "title" | "status") => Promise<{ ok: boolean; message: string }>;
  getCategoryManualProducts: (categoryId: number) => Promise<{ ok: boolean; message: string; items: CategoryManualProduct[] }>;
  searchCategoryManualProducts: (categoryId: number, query: string, limit?: number) => Promise<{ ok: boolean; message: string; items: CategoryManualProduct[] }>;
  addCategoryManualProduct: (categoryId: number, productId: number) => Promise<{ ok: boolean; message: string }>;
  removeCategoryManualProduct: (categoryId: number, productId: number) => Promise<{ ok: boolean; message: string }>;
  mergeDedupPair: (primaryProductId: number, duplicateProductId: number) => Promise<{ ok: boolean; message: string }>;
  rejectDedupPair: (productAId: number, productBId: number) => Promise<{ ok: boolean; message: string }>;
  combineDedupPair: (productAId: number, productBId: number) => Promise<{ ok: boolean; message: string }>;
  undoDedupDecision: (pairKey: string) => Promise<{ ok: boolean; message: string }>;
  setProductStatus: (productId: number, status: "available" | "out_of_stock" | "hidden") => Promise<{ ok: boolean; message: string }>;
  updateProductOverrides: (
    productId: number,
    payload: {
      title?: string;
      description?: string;
      description_visible?: boolean | null;
      images?: {
        hidden_source_image_ids?: number[];
        manual_image_ids?: number[];
        manual_image_order?: string[];
      };
      reset_to_default?: Array<"title" | "description" | "images" | "description_visibility">;
    }
  ) => Promise<{ ok: boolean; message: string; product: ServiceProduct | null }>;
  getProductStarredCategories: (
    productId: number
  ) => Promise<{ ok: boolean; message: string; assignedCategoryIds: number[]; availableCategories: ProductStarredCategoryOption[] }>;
  setProductStarredCategories: (
    productId: number,
    categoryIds: number[]
  ) => Promise<{ ok: boolean; message: string; assignedCategoryIds: number[] }>;
  ensureAllProductsLoaded: () => Promise<void>;
  toggleSourceEnabled: (sourceKey: string, enabled: boolean) => Promise<{ ok: boolean; message: string }>;
  toggleSourceSyncEnabled: (sourceKey: string, syncEnabled: boolean) => Promise<{ ok: boolean; message: string }>;
  toggleSourceAutoHideProducts: (sourceKey: string, hideAutoAddedProducts: boolean) => Promise<{ ok: boolean; message: string }>;
  createWeightRule: (weightGrams: number) => Promise<{ ok: boolean; message: string }>;
  updateWeightRule: (id: number, weightGrams: number) => Promise<{ ok: boolean; message: string }>;
  deleteWeightRule: (id: number) => Promise<{ ok: boolean; message: string }>;
  addWeightKeyword: (ruleId: number, keyword: string) => Promise<{ ok: boolean; message: string }>;
  removeWeightKeyword: (ruleId: number, keyword: string) => Promise<{ ok: boolean; message: string }>;
  fetchPricingExampleProduct: () => Promise<PricingExampleProduct | null>;
  updatePricingSettings: (payload: Partial<PricingSettings>) => Promise<{ ok: boolean; message: string }>;
  updateShowcaseMediaSettings: (payload: {
    showcase_hero_image_asset_id?: number | null;
    showcase_carousel_image_asset_ids?: number[];
  }) => Promise<{ ok: boolean; message: string }>;
  updatePricingSupplier: (
    supplierId: number,
    payload: {
      name?: string;
      category?: string;
      rate_currency?: string;
      rates?: Array<{ min_kg: number; max_kg: number | null; rub: number }>;
    }
  ) => Promise<{ ok: boolean; message: string }>;
  createPricingSupplier: (payload: {
    key?: string;
    name: string;
    category: string;
    parent_supplier_id?: number | null;
    alt_position?: number;
    rate_currency: string;
  }) => Promise<{ ok: boolean; message: string }>;
  deletePricingSupplier: (supplierId: number) => Promise<{ ok: boolean; message: string }>;
  exportSettings: () => Promise<{ ok: boolean; message: string; payload: SettingsTransferPayload | null }>;
  importSettings: (payload: SettingsTransferPayload) => Promise<{ ok: boolean; message: string }>;
  assignSourceSupplier: (
    sourceKey: string,
      payload: {
        supplier_id?: number;
        promo_factor?: number;
        promo_only_no_discount?: boolean;
        buyout_surcharge_value?: number;
        buyout_surcharge_currency?: string;
      }
  ) => Promise<{ ok: boolean; message: string }>;
};

const API_BASE = "/api/v1";
const PRODUCTS_PAGE_SIZE = 100;
const isUnavailableStatus = (status: unknown): boolean => String(status || "").trim().toLowerCase() === "unavailable";
const ADMIN_ACCESS_TOKEN_KEY = "admin_access_token";
const ADMIN_REFRESH_TOKEN_KEY = "admin_refresh_token";

async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const isApiRequest = requestUrl.startsWith(API_BASE);
  const isAuthEndpoint = requestUrl.startsWith(`${API_BASE}/auth/`);
  const accessToken = window.localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
  const headers = new Headers(init?.headers ?? undefined);
  if (isApiRequest && !isAuthEndpoint && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  const response = await globalThis.fetch(input, { ...init, headers });
  if (!isApiRequest || isAuthEndpoint || response.status !== 401) {
    return response;
  }
  const refreshToken = window.localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    window.localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    return response;
  }
  const refreshResponse = await globalThis.fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!refreshResponse.ok) {
    window.localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    return response;
  }
  const refreshedPayload = (await refreshResponse.json()) as { access_token: string; refresh_token: string };
  window.localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, refreshedPayload.access_token || "");
  window.localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshedPayload.refresh_token || "");
  const retryHeaders = new Headers(init?.headers ?? undefined);
  retryHeaders.set("Authorization", `Bearer ${refreshedPayload.access_token}`);
  return globalThis.fetch(input, { ...init, headers: retryHeaders });
}

const LiveDataContext = createContext<LiveDataContextValue | undefined>(undefined);

export function LiveDataProvider({ children, routePath }: { children: ReactNode; routePath?: string }) {
  const [products, setProducts] = useState<ServiceProduct[]>([]);
  const [productsTotal, setProductsTotal] = useState<number>(0);
  const [productsHasMore, setProductsHasMore] = useState<boolean>(false);
  const [sources, setSources] = useState<Source[]>([]);
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
  const [latestJob, setLatestJob] = useState<JobsLatest>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingCategoriesTree, setLoadingCategoriesTree] = useState<boolean>(false);
  const [loadingCategoryCounts, setLoadingCategoryCounts] = useState<boolean>(false);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const loadingMoreLockRef = useRef<boolean>(false);
  const lastRouteKindRef = useRef<"admin" | "site" | null>(null);
  const productsRef = useRef<ServiceProduct[]>([]);

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

  const fetchDedupCandidates = useCallback(async () => {
    setLoadingDedupCandidates(true);
    try {
      const dedupRes = await authFetch(`${API_BASE}/dedup/candidates?limit=80`);
      if (!dedupRes.ok) {
        throw new Error(`Dedup API error: ${dedupRes.status}`);
      }
      const dedupPayload = (await dedupRes.json()) as { items: DedupCandidate[] };
      setDedupCandidates(dedupPayload.items || []);
      setDedupLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingDedupCandidates(false);
    }
  }, []);

  const fetchDedupDecisions = useCallback(async () => {
    setLoadingDedupDecisions(true);
    try {
      const res = await authFetch(`${API_BASE}/dedup/decisions?limit=200`);
      if (!res.ok) {
        throw new Error(`Dedup decisions API error: ${res.status}`);
      }
      const payload = (await res.json()) as { items: DedupDecision[] };
      setDedupDecisions(payload.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingDedupDecisions(false);
    }
  }, []);

  const refreshDedupOnly = useCallback(async () => {
    await Promise.all([fetchDedupCandidates(), fetchDedupDecisions()]);
    setDedupLoaded(true);
  }, [fetchDedupCandidates, fetchDedupDecisions]);

  const refreshPricingOnly = useCallback(async () => {
    const res = await authFetch(`${API_BASE}/settings/pricing`);
    if (!res.ok) {
      throw new Error(`Pricing settings API error: ${res.status}`);
    }
    const payload = (await res.json()) as PricingSettings;
    setPricingSettings(payload || null);
    setPricingLoaded(true);
  }, []);

  const refreshCategoriesOnly = useCallback(async (options?: { includeCounts?: boolean; silent?: boolean }) => {
    const includeCounts = options?.includeCounts ?? true;
    const silent = options?.silent ?? false;
    if (!silent) {
      if (includeCounts) {
        setLoadingCategoryCounts(true);
      } else {
        setLoadingCategoriesTree(true);
      }
    }
    try {
      const params = new URLSearchParams();
      params.set("include_counts", includeCounts ? "1" : "0");
      const res = await authFetch(`${API_BASE}/categories/tree?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Categories API error: ${res.status}`);
      }
      const payload = (await res.json()) as AdminCategoryNode[];
      setAdminCategories(payload || []);
      setCategoriesLoaded(true);
    } finally {
      if (!silent) {
        if (includeCounts) {
          setLoadingCategoryCounts(false);
        } else {
          setLoadingCategoriesTree(false);
        }
      }
    }
  }, []);

  const refreshSourcesOnly = useCallback(async () => {
    const res = await authFetch(`${API_BASE}/shopify/sources-admin`);
    if (!res.ok) {
      throw new Error(`Sources API error: ${res.status}`);
    }
    const payload = (await res.json()) as Source[];
    setSources(payload || []);
  }, []);

  const refreshWeightOnly = useCallback(async () => {
    const [rulesRes, missingRes] = await Promise.all([
      authFetch(`${API_BASE}/settings/weight-rules`),
      authFetch(`${API_BASE}/settings/weight-rules/missing-products?limit=100`),
    ]);
    if (!rulesRes.ok) {
      throw new Error(`Weight rules API error: ${rulesRes.status}`);
    }
    if (!missingRes.ok) {
      throw new Error(`Missing weight API error: ${missingRes.status}`);
    }
    const rulesPayload = (await rulesRes.json()) as WeightRule[];
    const missingPayload = (await missingRes.json()) as WeightMissingProduct[];
    setWeightRules(rulesPayload || []);
    setWeightMissingProducts(missingPayload || []);
    setWeightLoaded(true);
  }, []);

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

  const refreshAdminCoreOnly = useCallback(async () => {
    const [sourcesRes, latestJobRes] = await Promise.all([
      authFetch(`${API_BASE}/shopify/sources-admin`),
      authFetch(`${API_BASE}/jobs/latest`),
    ]);

    if (!sourcesRes.ok) {
      throw new Error(`Sources API error: ${sourcesRes.status}`);
    }
    if (!latestJobRes.ok) {
      throw new Error(`Jobs API error: ${latestJobRes.status}`);
    }

    const sourcesPayload = (await sourcesRes.json()) as Source[];
    const latestPayload = (await latestJobRes.json()) as JobsLatest;
    setSources(sourcesPayload || []);
    setLatestJob(latestPayload);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, sourcesRes, latestJobRes] = await Promise.all([
        authFetch(`${API_BASE}/products?limit=${PRODUCTS_PAGE_SIZE}&offset=0`),
        authFetch(`${API_BASE}/shopify/sources-admin`),
        authFetch(`${API_BASE}/jobs/latest`),
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
      const productsPayload = (await productsRes.json()) as { items: ServiceProduct[]; total: number; limit: number; offset: number };
      const sourcesPayload = (await sourcesRes.json()) as Source[];
      const latestPayload = (await latestJobRes.json()) as JobsLatest;

      setProducts((productsPayload.items || []).filter((item) => !isUnavailableStatus(item.status)));
      setProductsTotal(productsPayload.total || 0);
      setProductsHasMore((productsPayload.items || []).length + (productsPayload.offset || 0) < (productsPayload.total || 0));
      setSources(sourcesPayload || []);
      setLatestJob(latestPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const ensurePricingLoaded = useCallback(async (force = false) => {
    if (!force && pricingLoaded) {
      return;
    }
    await refreshPricingOnly();
  }, [pricingLoaded, refreshPricingOnly]);

  const ensureWeightLoaded = useCallback(async (force = false) => {
    if (!force && weightLoaded) {
      return;
    }
    await refreshWeightOnly();
  }, [refreshWeightOnly, weightLoaded]);

  const ensureDedupLoaded = useCallback(async (force = false) => {
    if (!force && dedupLoaded) {
      return;
    }
    await refreshDedupOnly();
  }, [dedupLoaded, refreshDedupOnly]);

  const ensureCategoriesLoaded = useCallback(async (force = false) => {
    if (!force && categoriesLoaded) {
      return;
    }
    await refreshCategoriesOnly({ includeCounts: true });
  }, [categoriesLoaded, refreshCategoriesOnly]);

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
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
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

  const previewProductByUrl = useCallback(async (url: string) => {
    try {
      const res = await authFetch(`${API_BASE}/products/preview-by-url`, {
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
        const res = await authFetch(`${API_BASE}/products/add-by-url`, {
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
        const res = await authFetch(`${API_BASE}/products/manual`, {
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

      const res = await authFetch(`${API_BASE}/products/upload-image`, {
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

  const createCategory = useCallback(
    async (name: string, parentId: number | null) => {
      try {
        const res = await authFetch(`${API_BASE}/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, parent_id: parentId }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        const created = (await res.json()) as AdminCategoryNode;
        if (created && typeof created.id === "number") {
          const insertNode = (nodes: AdminCategoryNode[]): AdminCategoryNode[] => {
            if (created.parent_id === null) {
              return [...nodes, created];
            }
            return nodes.map((node) => {
              if (node.id === created.parent_id) {
                return {
                  ...node,
                  has_children: true,
                  children: [...node.children, created],
                };
              }
              if (!node.children || node.children.length === 0) {
                return node;
              }
              return {
                ...node,
                children: insertNode(node.children),
              };
            });
          };
          setAdminCategories((prev) => insertNode(prev));
        }
        void refreshCategoriesOnly({ includeCounts: true, silent: true });
        return { ok: true, message: "Категория создана", categoryId: created?.id };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshCategoriesOnly]
  );

  const updateCategory = useCallback(
    async (id: number, payload: { name?: string; parent_id?: number | null; is_enabled?: boolean; is_favorite?: boolean }) => {
      try {
        const res = await authFetch(`${API_BASE}/categories/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }

        const updatedNode = (await res.json().catch(() => null)) as AdminCategoryNode | null;
        if (updatedNode && typeof updatedNode.id === "number") {
          const patchNodeById = (nodes: AdminCategoryNode[]): AdminCategoryNode[] =>
            nodes.map((node) => {
              if (node.id === updatedNode.id) {
                return {
                  ...node,
                  name: updatedNode.name,
                  slug: updatedNode.slug,
                  parent_id: updatedNode.parent_id,
                  is_enabled: updatedNode.is_enabled,
                  is_favorite: updatedNode.is_favorite,
                  keywords_editable: updatedNode.keywords_editable,
                  keywords_locked_reason: updatedNode.keywords_locked_reason,
                  is_designers_root: updatedNode.is_designers_root,
                  is_in_designers_branch: updatedNode.is_in_designers_branch,
                  product_count: updatedNode.product_count,
                };
              }
              if (!node.children || node.children.length === 0) {
                return node;
              }
              return {
                ...node,
                children: patchNodeById(node.children),
              };
            });
          setAdminCategories((prev) => patchNodeById(prev));
        }

        const touchedStructuralField = Boolean(payload.parent_id !== undefined);
        if (touchedStructuralField) {
          void refreshCategoriesOnly({ includeCounts: true, silent: true });
        }
        return { ok: true, message: "Категория обновлена" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshCategoriesOnly]
  );

  const deleteCategory = useCallback(
    async (id: number) => {
      try {
        const res = await authFetch(`${API_BASE}/categories/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        const dropNodeById = (nodes: AdminCategoryNode[]): AdminCategoryNode[] =>
          nodes
            .filter((node) => node.id !== id)
            .map((node) => {
              if (!node.children || node.children.length === 0) {
                return node;
              }
              const nextChildren = dropNodeById(node.children);
              return {
                ...node,
                has_children: nextChildren.length > 0,
                children: nextChildren,
              };
            });
        setAdminCategories((prev) => dropNodeById(prev));
        void refreshCategoriesOnly({ includeCounts: true, silent: true });
        return { ok: true, message: "Категория удалена" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshCategoriesOnly]
  );

  const addCategoryKeyword = useCallback(
    async (id: number, keyword: string, scope: "local" | "title" | "status" = "local") => {
      try {
        const res = await authFetch(`${API_BASE}/categories/${id}/keywords`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword, scope }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await refreshCategoriesOnly();
        return { ok: true, message: "OK" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshCategoriesOnly]
  );

  const removeCategoryKeyword = useCallback(
    async (id: number, keyword: string, scope: "local" | "title" | "status" = "local") => {
      try {
        const encodedKeyword = encodeURIComponent(keyword);
        const res = await authFetch(`${API_BASE}/categories/${id}/keywords/${encodedKeyword}?scope=${scope}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await refreshCategoriesOnly();
        return { ok: true, message: "OK" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshCategoriesOnly]
  );

  const getCategoryManualProducts = useCallback(async (categoryId: number) => {
    try {
      const res = await authFetch(`${API_BASE}/categories/${categoryId}/manual-products`);
      if (!res.ok) {
        const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
        return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}`, items: [] };
      }
      const payload = (await res.json()) as CategoryManualProduct[];
      return { ok: true, message: "OK", items: payload || [] };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error", items: [] };
    }
  }, []);

  const searchCategoryManualProducts = useCallback(async (categoryId: number, query: string, limit: number = 3) => {
    try {
      const params = new URLSearchParams({
        query,
        limit: String(limit),
      });
      const res = await authFetch(`${API_BASE}/categories/${categoryId}/manual-products/search?${params.toString()}`);
      if (!res.ok) {
        const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
        return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}`, items: [] };
      }
      const payload = (await res.json()) as CategoryManualProduct[];
      return { ok: true, message: "OK", items: payload || [] };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error", items: [] };
    }
  }, []);

  const addCategoryManualProduct = useCallback(
    async (categoryId: number, productId: number) => {
      try {
        const res = await authFetch(`${API_BASE}/categories/${categoryId}/manual-products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await Promise.all([refreshProductsOnly(), refreshCategoriesOnly()]);
        return { ok: true, message: "Товар добавлен в категорию" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshCategoriesOnly, refreshProductsOnly]
  );

  const removeCategoryManualProduct = useCallback(
    async (categoryId: number, productId: number) => {
      try {
        const res = await authFetch(`${API_BASE}/categories/${categoryId}/manual-products/${productId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await Promise.all([refreshProductsOnly(), refreshCategoriesOnly()]);
        return { ok: true, message: "Товар убран из категории" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshCategoriesOnly, refreshProductsOnly]
  );

  const mergeDedupPair = useCallback(
    async (primaryProductId: number, duplicateProductId: number) => {
      try {
        const res = await authFetch(`${API_BASE}/dedup/merge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ primary_product_id: primaryProductId, duplicate_product_id: duplicateProductId }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        refreshAfterDedupMutation();
        return { ok: true, message: "Дубликаты объединены" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshAfterDedupMutation]
  );

  const rejectDedupPair = useCallback(
    async (productAId: number, productBId: number) => {
      try {
        const res = await authFetch(`${API_BASE}/dedup/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_a_id: productAId, product_b_id: productBId }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        refreshAfterDedupMutation();
        return { ok: true, message: "Пара помечена как не дубль" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshAfterDedupMutation]
  );

  const combineDedupPair = useCallback(
    async (productAId: number, productBId: number) => {
      try {
        const res = await authFetch(`${API_BASE}/dedup/combine`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_a_id: productAId, product_b_id: productBId }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        refreshAfterDedupMutation();
        return { ok: true, message: "Дубликаты соединены" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshAfterDedupMutation]
  );

  const undoDedupDecision = useCallback(
    async (pairKey: string) => {
      try {
        const res = await authFetch(`${API_BASE}/dedup/undo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pair_key: pairKey }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        refreshAfterDedupMutation();
        return { ok: true, message: "Решение отменено" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshAfterDedupMutation]
  );

  const setProductStatus = useCallback(
    async (productId: number, status: "available" | "out_of_stock" | "hidden") => {
      try {
        const res = await authFetch(`${API_BASE}/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        const payload = (await res.json().catch(() => null)) as ServiceProduct | null;
        if (payload && typeof payload.id === "number") {
          const isStatusOnlyPatch = String((payload.pricing_components as { reason?: unknown } | null | undefined)?.reason || "") === "status-only-patch";
          if (isStatusOnlyPatch) {
            setProducts((prev) => prev.map((item) => (item.id === payload.id ? { ...item, status: payload.status } : item)));
          } else {
            setProducts((prev) => prev.map((item) => (item.id === payload.id ? { ...item, ...payload } : item)));
          }
        } else {
          setProducts((prev) => prev.map((item) => (item.id === productId ? { ...item, status } : item)));
        }
        return { ok: true, message: "Статус товара обновлен" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    []
  );

  const updateProductOverrides = useCallback(
    async (
      productId: number,
      payload: {
        title?: string;
        description?: string;
        images?: {
          hidden_source_image_ids?: number[];
          manual_image_ids?: number[];
          manual_image_order?: string[];
        };
        reset_to_default?: Array<"title" | "description" | "images">;
      }
    ) => {
      try {
        const res = await authFetch(`${API_BASE}/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}`, product: null };
        }
        const nextProduct = (await res.json().catch(() => null)) as ServiceProduct | null;
        if (nextProduct && typeof nextProduct.id === "number") {
          setProducts((prev) => prev.map((item) => (item.id === nextProduct.id ? { ...item, ...nextProduct } : item)));
        }
        return { ok: true, message: "Товар обновлен", product: nextProduct };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error", product: null };
      }
    },
    []
  );

  const getProductStarredCategories = useCallback(async (productId: number) => {
    try {
      const res = await authFetch(`${API_BASE}/products/${productId}/starred-categories`);
      if (!res.ok) {
        const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
        return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}`, assignedCategoryIds: [], availableCategories: [] };
      }
      const payload = (await res.json()) as {
        assigned_category_ids?: number[];
        available_categories?: ProductStarredCategoryOption[];
      };
      return {
        ok: true,
        message: "OK",
        assignedCategoryIds: Array.isArray(payload.assigned_category_ids) ? payload.assigned_category_ids.map((item) => Number(item)).filter((item) => Number.isFinite(item)) : [],
        availableCategories: Array.isArray(payload.available_categories) ? payload.available_categories : [],
      };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error", assignedCategoryIds: [], availableCategories: [] };
    }
  }, []);

  const setProductStarredCategories = useCallback(
    async (productId: number, categoryIds: number[]) => {
      try {
        const normalizedCategoryIds = [...new Set(categoryIds.filter((item) => Number.isFinite(item)).map((item) => Number(item)))];
        const res = await authFetch(`${API_BASE}/products/${productId}/starred-categories`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category_ids: normalizedCategoryIds }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}`, assignedCategoryIds: [] };
        }
        const payload = (await res.json().catch(() => null)) as { assigned_category_ids?: number[] } | null;
        const assigned = Array.isArray(payload?.assigned_category_ids)
          ? payload!.assigned_category_ids.map((item) => Number(item)).filter((item) => Number.isFinite(item))
          : normalizedCategoryIds;
        setProducts((prev) =>
          prev.map((item) =>
            item.id === productId
              ? {
                  ...item,
                  starred_category_ids: assigned,
                  is_favorite: assigned.length > 0,
                }
              : item
          )
        );
        return { ok: true, message: "Избранные категории сохранены", assignedCategoryIds: assigned };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error", assignedCategoryIds: [] };
      }
    },
    []
  );

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

  const toggleSourceEnabled = useCallback(
    async (sourceKey: string, enabled: boolean) => {
      try {
        const res = await authFetch(`${API_BASE}/shopify/sources/${sourceKey}/enabled`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        const updated = (await res.json()) as Source;
        setSources((prev) => prev.map((item) => (item.key === sourceKey ? updated : item)));
        return { ok: true, message: enabled ? "Источник включен" : "Источник выключен" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    []
  );

  const toggleSourceSyncEnabled = useCallback(
    async (sourceKey: string, syncEnabled: boolean) => {
      try {
        const res = await authFetch(`${API_BASE}/shopify/sources/${sourceKey}/sync-enabled`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sync_enabled: syncEnabled }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        const updated = (await res.json()) as Source;
        setSources((prev) => prev.map((item) => (item.key === sourceKey ? updated : item)));
        return { ok: true, message: syncEnabled ? "Источник участвует в синхронизации" : "Источник исключен из синхронизации" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    []
  );

  const toggleSourceAutoHideProducts = useCallback(
    async (sourceKey: string, hideAutoAddedProducts: boolean) => {
      try {
        const res = await authFetch(`${API_BASE}/shopify/sources/${sourceKey}/hide-auto-added-products`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hide_auto_added_products: hideAutoAddedProducts }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        const updated = (await res.json()) as Source;
        setSources((prev) => prev.map((item) => (item.key === sourceKey ? updated : item)));
        return { ok: true, message: hideAutoAddedProducts ? "Автотовары скрываются глобально" : "Автотовары снова показываются" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    []
  );

  const assignSourceSupplier = useCallback(
    async (
      sourceKey: string,
      payload: {
        supplier_id?: number;
        promo_factor?: number;
        promo_only_no_discount?: boolean;
        buyout_surcharge_value?: number;
        buyout_surcharge_currency?: string;
      }
    ) => {
      try {
        const res = await authFetch(`${API_BASE}/shopify/sources/${sourceKey}/supplier`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        const updated = (await res.json()) as Source;
        setSources((prev) => prev.map((item) => (item.key === sourceKey ? updated : item)));
        return { ok: true, message: "Настройки источника обновлены" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    []
  );

  const createWeightRule = useCallback(
    async (weightGrams: number) => {
      try {
        const res = await authFetch(`${API_BASE}/settings/weight-rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weight_grams: weightGrams }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await refreshWeightOnly();
        return { ok: true, message: "Правило веса добавлено" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshWeightOnly]
  );

  const updateWeightRule = useCallback(
    async (id: number, weightGrams: number) => {
      try {
        const res = await authFetch(`${API_BASE}/settings/weight-rules/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weight_grams: weightGrams }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await refreshWeightOnly();
        return { ok: true, message: "Вес правила обновлен" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshWeightOnly]
  );

  const deleteWeightRule = useCallback(
    async (id: number) => {
      try {
        const res = await authFetch(`${API_BASE}/settings/weight-rules/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await refreshWeightOnly();
        return { ok: true, message: "Правило веса удалено" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshWeightOnly]
  );

  const addWeightKeyword = useCallback(
    async (ruleId: number, keyword: string) => {
      try {
        const res = await authFetch(`${API_BASE}/settings/weight-rules/${ruleId}/keywords`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword }),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await refreshWeightOnly();
        return { ok: true, message: "Ключевое слово добавлено" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshWeightOnly]
  );

  const removeWeightKeyword = useCallback(
    async (ruleId: number, keyword: string) => {
      try {
        const encodedKeyword = encodeURIComponent(keyword);
        const res = await authFetch(`${API_BASE}/settings/weight-rules/${ruleId}/keywords/${encodedKeyword}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await refreshWeightOnly();
        return { ok: true, message: "Ключевое слово удалено" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshWeightOnly]
  );

  const fetchPricingExampleProduct = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/products/pricing-example`);
      if (!res.ok) {
        return null;
      }
      const payload = (await res.json()) as PricingExampleProduct;
      return payload || null;
    } catch {
      return null;
    }
  }, []);

  const updatePricingSettings = useCallback(
    async (payload: Partial<PricingSettings>) => {
      try {
        const res = await authFetch(`${API_BASE}/settings/pricing`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        const updated = (await res.json()) as PricingSettings;
        setPricingSettings(updated || null);
        if (Object.prototype.hasOwnProperty.call(payload, "dedup_only_available_products")) {
          void refreshDedupOnly().catch((e) => {
            setError(e instanceof Error ? e.message : "Unknown error");
          });
        }
        return { ok: true, message: "Параметры формулы сохранены" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshDedupOnly]
  );

  const updateShowcaseMediaSettings = useCallback(
    async (payload: {
      showcase_hero_image_asset_id?: number | null;
      showcase_carousel_image_asset_ids?: number[];
    }) => {
      try {
        const res = await authFetch(`${API_BASE}/settings/showcase-media`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        const updated = (await res.json()) as {
          showcase_hero_image_asset_id?: number | null;
          showcase_carousel_image_asset_ids?: number[];
        };
        setPricingSettings((prev) => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            showcase_hero_image_asset_id: updated?.showcase_hero_image_asset_id ?? null,
            showcase_carousel_image_asset_ids: Array.isArray(updated?.showcase_carousel_image_asset_ids)
              ? updated.showcase_carousel_image_asset_ids
              : [],
          };
        });
        return { ok: true, message: "Медиа витрины сохранены" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    []
  );

  const updatePricingSupplier = useCallback(
    async (
      supplierId: number,
      payload: {
        name?: string;
        category?: string;
        rate_currency?: string;
        rates?: Array<{ min_kg: number; max_kg: number | null; rub: number }>;
      }
    ) => {
      try {
        const res = await authFetch(`${API_BASE}/settings/pricing/suppliers/${supplierId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await Promise.all([refreshPricingOnly(), refreshSourcesOnly()]);
        return { ok: true, message: "Тариф обновлен" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshPricingOnly, refreshSourcesOnly]
  );

  const createPricingSupplier = useCallback(
    async (payload: {
      key?: string;
      name: string;
      category: string;
      parent_supplier_id?: number | null;
      alt_position?: number;
      rate_currency: string;
    }) => {
      try {
        const res = await authFetch(`${API_BASE}/settings/pricing/suppliers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await Promise.all([refreshPricingOnly(), refreshSourcesOnly()]);
        return { ok: true, message: "Тариф добавлен" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshPricingOnly, refreshSourcesOnly]
  );

  const deletePricingSupplier = useCallback(
    async (supplierId: number) => {
      try {
        const res = await authFetch(`${API_BASE}/settings/pricing/suppliers/${supplierId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка: ${res.status}` };
        }
        await Promise.all([refreshPricingOnly(), refreshSourcesOnly()]);
        return { ok: true, message: "Тариф удален" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refreshPricingOnly, refreshSourcesOnly]
  );

  const exportSettings = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/settings/export`);
      if (!res.ok) {
        const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
        return { ok: false, message: errorPayload?.detail || `Ошибка экспорта: ${res.status}`, payload: null };
      }
      const payload = (await res.json()) as SettingsTransferPayload;
      return { ok: true, message: "Настройки экспортированы", payload };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error", payload: null };
    }
  }, []);

  const importSettings = useCallback(
    async (payload: SettingsTransferPayload) => {
      try {
        const res = await authFetch(`${API_BASE}/settings/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errorPayload = (await res.json().catch(() => null)) as { detail?: string } | null;
          return { ok: false, message: errorPayload?.detail || `Ошибка импорта: ${res.status}` };
        }
        await Promise.all([
          refresh(),
          refreshPricingOnly(),
          refreshWeightOnly(),
          refreshCategoriesOnly({ includeCounts: true, silent: true }),
          refreshSourcesOnly(),
        ]);
        return { ok: true, message: "Настройки импортированы" };
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
      }
    },
    [refresh, refreshCategoriesOnly, refreshPricingOnly, refreshSourcesOnly, refreshWeightOnly]
  );

  useEffect(() => {
    let cancelled = false;
    const currentPath = routePath ?? (typeof window !== "undefined" ? window.location.pathname : "/");
    const isManagementRoute = currentPath.startsWith("/control");
    const routeKind: "admin" | "site" = isManagementRoute ? "admin" : "site";
    const shouldBootstrap = lastRouteKindRef.current !== routeKind;
    if (!shouldBootstrap) {
      return undefined;
    }
    lastRouteKindRef.current = routeKind;

    const run = async () => {
      setError(null);
      try {
        if (routeKind === "admin") {
          setLoading(true);
          await refreshAdminCoreOnly();
          if (!cancelled) {
            setLoading(false);
          }
          return;
        }
        setLoading(true);
        await refreshSourcesOnly();
        if (!cancelled) {
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unknown error");
          setLoading(false);
        }
      }
    };
    void run();

    return () => {
      cancelled = true;
    };
  }, [refreshAdminCoreOnly, refreshSourcesOnly, routePath]);

  useEffect(() => {
    if (!latestJob || !["pending", "in_progress"].includes(latestJob.status)) {
      return undefined;
    }

    const timer = window.setInterval(async () => {
      try {
        const res = await authFetch(`${API_BASE}/jobs/latest`);
        if (!res.ok) {
          return;
        }
        const payload = (await res.json()) as JobsLatest;
        setLatestJob(payload);
        if (payload && !["pending", "in_progress"].includes(payload.status)) {
          await refresh();
        }
      } catch {
        // Keep silent; next poll tick will retry.
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [latestJob?.status, refresh]);

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
