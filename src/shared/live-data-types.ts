export type Source = {
  key: string;
  source_id: number | null;
  name: string;
  base_url: string;
  parser_type: string;
  enabled: boolean;
  sync_enabled: boolean;
  hide_auto_added_products?: boolean;
  show_description?: boolean;
  show_images?: boolean;
  currency_priority?: string[];
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

export type ProductVariant = {
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
  hidden_source_image_urls: string[];
  manual_image_urls: string[];
  manual_image_order: string[];
  source_image_urls: string[];
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

export type JobsLatest = {
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

export type PricingExampleFetchResult = {
  product: PricingExampleProduct | null;
  errorMessage: string | null;
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
  jpy_to_usd_rate: number;
  final_rounding_mode: string;
  payment_fee_rate: number;
  customs_processing_rate: number;
  customs_fixed_rub: number;
  shipping_alt_threshold_eur: number;
  tax_rate: number;
  dedup_only_available_products: boolean;
  show_product_description: boolean;
  svc_rules: Array<Record<string, unknown>>;
  insurance_rules: Array<Record<string, unknown>>;
  service_fee_rules: Array<Record<string, unknown>>;
  shipping_rules: Record<string, Record<string, Array<Record<string, unknown>>>>;
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

export type AdminUiSettings = {
  designers_min_products: number;
  designers_exclude_store_vendors: boolean;
  showcase_hero_image_asset_id?: number | null;
  showcase_carousel_image_asset_ids?: number[];
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
  jpy_to_usd_rate: number;
  final_rounding_mode: string;
  payment_fee_rate: number;
  customs_processing_rate: number;
  customs_fixed_rub: number;
  shipping_alt_threshold_eur: number;
  tax_rate: number;
  dedup_only_available_products: boolean;
  show_product_description: boolean;
  svc_rules: Array<Record<string, unknown>>;
  insurance_rules: Array<Record<string, unknown>>;
  service_fee_rules: Array<Record<string, unknown>>;
  shipping_rules: Record<string, Record<string, Array<Record<string, unknown>>>>;
};

export type SettingsTransferAdminUiSettings = {
  designers_min_products: number;
  designers_exclude_store_vendors: boolean;
  showcase_hero_image_asset_id?: number | null;
  showcase_carousel_image_asset_ids?: number[];
};

export type SettingsTransferPayload = {
  schema_version: number;
  exported_at: string | null;
  project: string | null;
  pricing_settings: SettingsTransferPricingSettings;
  admin_ui_settings: SettingsTransferAdminUiSettings;
  suppliers: SettingsTransferSupplierEntry[];
  sources: SettingsTransferSourceEntry[];
  weight_rules: SettingsTransferWeightRuleEntry[];
  categories: SettingsTransferCategoryEntry[];
  category_keywords: SettingsTransferCategoryKeywordEntry[];
};

export type LiveDataContextValue = {
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
  adminUiSettings: AdminUiSettings | null;
  sources: Source[];
  latestJob: JobsLatest;
  loading: boolean;
  loadingCategoriesTree: boolean;
  loadingCategoryCounts: boolean;
  loadingMoreProducts: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  ensurePricingLoaded: (force?: boolean) => Promise<void>;
  ensureAdminUiLoaded: (force?: boolean) => Promise<void>;
  ensureWeightLoaded: (force?: boolean) => Promise<void>;
  ensureDedupLoaded: (force?: boolean) => Promise<void>;
  ensureDedupDecisionsLoaded: () => Promise<void>;
  ensureCategoriesLoaded: (force?: boolean) => Promise<void>;
  refreshSourcesOnly: () => Promise<void>;
  loadMoreProducts: () => Promise<void>;
  getProductById: (id: number, opts?: { forceFetch?: boolean }) => Promise<ServiceProduct | null>;
  runSync: () => Promise<{ ok: boolean; message: string }>;
  runSyncForSource: (sourceKey: string) => Promise<{ ok: boolean; message: string }>;
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
  uploadProductImage: (file: File) => Promise<{ ok: boolean; message: string; imageAssetId: number | null }>;
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
        hidden_source_image_urls?: string[];
        manual_image_urls?: string[];
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
  updateSourceAttributeVisibility: (
    sourceKey: string,
    payload: { show_description?: boolean; show_images?: boolean }
  ) => Promise<{ ok: boolean; message: string }>;
  updateSourceCurrencyPriority: (sourceKey: string, currencyPriority: string[]) => Promise<{ ok: boolean; message: string }>;
  createWeightRule: (weightGrams: number) => Promise<{ ok: boolean; message: string }>;
  updateWeightRule: (id: number, weightGrams: number) => Promise<{ ok: boolean; message: string }>;
  deleteWeightRule: (id: number) => Promise<{ ok: boolean; message: string }>;
  addWeightKeyword: (ruleId: number, keyword: string) => Promise<{ ok: boolean; message: string }>;
  removeWeightKeyword: (ruleId: number, keyword: string) => Promise<{ ok: boolean; message: string }>;
  fetchPricingExampleProduct: () => Promise<PricingExampleFetchResult>;
  updatePricingSettings: (payload: Partial<PricingSettings>) => Promise<{ ok: boolean; message: string }>;
  updateAdminUiSettings: (payload: Partial<AdminUiSettings>) => Promise<{ ok: boolean; message: string }>;
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
  resetSettings: () => Promise<{ ok: boolean; message: string }>;
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
