export type DescriptionMode = "hidden" | "text";
export type SourceMode = "auto" | "manual" | "personal";
export type ProductWriteState = {
  visibility_status: "visible" | "hidden";
  availability_mode?: "in_stock" | "by_order";
  orderability_status?: "orderable" | "sold_out" | "unavailable";
};

export type Source = {
  key: string;
  source_id: number | null;
  mode?: SourceMode;
  name: string;
  base_url: string;
  logo_image_asset_id?: number | null;
  sort_priority: number;
  enabled: boolean;
  sync_enabled: boolean;
  dedup_enabled: boolean;
  hide_auto_added_products?: boolean;
  description_mode?: DescriptionMode;
  show_images?: boolean;
  clean_public_titles?: boolean;
  products_count: number;
  manual_products_count?: number;
  bound_sync_products_count?: number;
  last_sync_at?: string | null;
  last_sync_duration_sec?: number | null;
  last_sync_status?: string | null;
  last_error_code?: string | null;
  last_error_message?: string | null;
  supplier_id: number | null;
  supplier_key: string | null;
  supplier_name: string | null;
  promo_factor: number;
  promo_only_no_discount: boolean;
  buyout_surcharge_value: number | null;
  buyout_surcharge_currency: string | null;
};

export type ProductVariant = {
  id?: number | null;
  title: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  available: boolean;
  price: string | number | null;
  currency?: string | null;
  compare_at_price?: number | string | null;
  final_price?: number | null;
  final_currency?: string | null;
  final_compare_at_price?: number | null;
  final_compare_at_currency?: string | null;
  pricing_mode?: string | null;
  pricing_manual_required?: boolean | null;
  pricing_reason?: string | null;
  pricing_components?: Record<string, unknown> | null;
  inventory_quantity: number;
  sku: string | null;
  source_id?: number | null;
  source_name?: string | null;
  listing_id?: number | null;
  source_ref_id?: string | null;
};

export type ProductPriceSummary = {
  source_display_price: number | null;
  source_currency: string | null;
  source_compare_at_price?: number | null;
  source_has_range: boolean;
  final_display_price: number | null;
  final_currency: string | null;
  final_compare_at_price?: number | null;
  final_has_range: boolean;
  pricing_manual_required?: boolean | null;
  pricing_reason?: string | null;
  representative_variant_id?: number | null;
  representative_listing_id?: number | null;
  representative_source_ref_id?: string | null;
};

export type ProductPresentationState = {
  title_override?: string | null;
  brand_override_name?: string | null;
  description_text?: string | null;
  description_html?: string | null;
  description_visibility?: boolean | null;
};

export type ProductGalleryRow = {
  position: number;
  origin_kind: "source_image" | "uploaded_asset";
  is_hidden: boolean;
  url: string | null;
  listing_image_id?: number | null;
  image_asset_id?: number | null;
};

export type ProductGalleryState = {
  display_image_urls: string[];
  hidden_source_image_urls: string[];
  uploaded_image_urls: string[];
  rows: ProductGalleryRow[];
  source_image_urls: string[];
  manual_image_urls: string[];
  manual_image_order: string[];
};

export type ProductListing = {
  id: number;
  source_id: number | null;
  source_name: string | null;
  ingest_mode: string;
  url: string | null;
  handle: string | null;
  source_title: string;
  source_description_text?: string | null;
  source_description_html?: string | null;
  source_weight_grams?: number | null;
  source_designer_name?: string | null;
  source_category_name?: string | null;
  orderability_status: string;
  status_reason?: string | null;
  image_urls: string[];
  gallery?: ProductGalleryState;
  variants?: ProductVariant[];
};

export type ServiceProduct = {
  id: number;
  source_id: number | null;
  source_sort_priority?: number | null;
  source_mode?: SourceMode | null;
  has_sync_listing?: boolean;
  primary_listing_id?: number | null;
  handle: string;
  title: string;
  gender?: string | null;
  designer_name: string | null;
  source_designer_name?: string | null;
  display_designer_name?: string | null;
  brand_name?: string | null;
  brand_name_is_manual?: boolean;
  source_category_name: string | null;
  url: string;
  price_summary?: ProductPriceSummary | null;
  pricing_manual_required?: boolean;
  pricing_reason?: string | null;
  pricing_components?: Record<string, unknown>;
  buyout_price_rub?: number | null;
  visibility_status?: string | null;
  availability_mode?: string | null;
  orderability_status?: string | null;
  status_reason?: string | null;
  lifecycle_status?: string | null;
  image_count: number;
  image_ids?: number[];
  image_urls: string[];
  variants: ProductVariant[];
  is_favorite?: boolean;
  internal_category_id?: number | null;
  internal_category_name?: string | null;
  internal_category_slug?: string | null;
  internal_category_ids?: number[];
  internal_category_names?: string[];
  internal_category_slugs?: string[];
  description?: string | null;
  description_mode?: DescriptionMode;
  description_public_visible?: boolean;
  description_text?: string | null;
  description_html?: string | null;
  source_name?: string | null;
  weight_grams?: number | null;
  manual_weight_grams?: number | null;
  auto_weight_grams?: number | null;
  gender_is_manual?: boolean;
  filter_slugs?: string[];
  filter_name?: string | null;
  custom_catalog_slugs?: string[];
  custom_catalog_names?: string[];
  internal_category_names?: string[];
  gallery?: ProductGalleryState;
  presentation?: ProductPresentationState;
  listings?: ProductListing[];
  created_at: string;
  updated_at: string;
};

export type JobsLatest = {
  job_id: string;
  status: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  total_sources: number;
  processed_sources: number;
  progress_percent: number;
  products_seen: number;
  products_applied: number;
  failed_products: number;
  warning_products?: number;
  source_issues?: SyncSourceIssue[];
  current_source_name?: string | null;
  current_stage?: {
    code: string | null;
    label: string | null;
    detail: string | null;
    updated_at: string | null;
  } | null;
  can_cancel: boolean;
  error: string | null;
} | null;

export type SyncSourceIssueReason = {
  code: string;
  label: string;
  count: number;
};

export type SyncSourceIssue = {
  source_id: string;
  source_name: string;
  kind: string;
  title: string;
  affected_products: number;
  reasons: SyncSourceIssueReason[];
};

export type SyncJobHistoryItem = {
  id: string;
  status: string;
  triggered_by: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  total_sources: number;
  processed_sources: number;
  progress_percent: number;
  products_seen: number;
  products_applied: number;
  failed_products: number;
  can_cancel: boolean;
  error: string | null;
};

export type SourceRunItem = {
  id: number;
  source_id: number | null;
  status: string;
  products_received: number;
  products_applied: number;
  failed_products: number;
  error_message: string | null;
  started_at?: string | null;
  finished_at?: string | null;
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
  slug: string;
  name: string;
};

export type DedupCandidate = {
  pair_key: string;
  score: number;
  reasons: string[];
  left: ServiceProduct;
  right: ServiceProduct;
};

export type DedupDecision = {
  id: number;
  pair_key: string;
  action: string;
  decided_at: string | null;
  members: ServiceProduct[];
  created_product?: ServiceProduct | null;
  can_undo?: boolean;
  undo_blocked_reason?: string | null;
};

export type DedupScanStatus = {
  is_running: boolean;
  started_at: string | null;
  finished_at: string | null;
  last_error: string | null;
  last_completed_candidates: number | null;
};

export type TaxonomyFilterNode = {
  slug: string | null;
  title: string;
  display_title?: string | null;
  mobile_pair_slug?: string | null;
  node_kind?: string;
  is_enabled: boolean;
  local_category_keywords: string[];
  title_keywords: string[];
  manual_product_ids: number[];
  children: TaxonomyFilterNode[];
};

export type TaxonomyCustomCatalog = {
  slug: string | null;
  title: string;
  description?: string | null;
  is_enabled: boolean;
  product_ids: number[];
};

export type TaxonomyShowcaseAttachment = {
  kind: "filter" | "custom_catalog";
  filter_slug?: string | null;
  custom_catalog_slug?: string | null;
  hidden_filter_slugs: string[];
};

export type TaxonomyShowcaseCategory = {
  code: string;
  title: string;
  attachments: TaxonomyShowcaseAttachment[];
};

export type TaxonomyState = {
  filters: TaxonomyFilterNode[];
  custom_catalogs: TaxonomyCustomCatalog[];
  showcase_categories: TaxonomyShowcaseCategory[];
};

export type ProductUrlPreview = {
  id?: number;
  source_id?: number;
  source_name?: string;
  visibility_status?: "visible" | "hidden" | null;
  availability_mode?: "in_stock" | "by_order" | null;
  orderability_status?: "orderable" | "sold_out" | "unavailable" | null;
  gender?: "male" | "female" | "unisex" | null;
  handle: string;
  title: string;
  description_text?: string | null;
  description_html?: string | null;
  source_weight_grams?: number | null;
  designer_name: string | null;
  source_category_name: string | null;
  product_url: string;
  price_summary?: ProductPriceSummary | null;
  buyer_total_price?: number | null;
  buyer_service_fee?: number | null;
  image_urls: string[];
  variants?: ProductVariant[];
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

export type WeightRecalcStatus = {
  status: "idle" | "queued" | "running";
  is_running: boolean;
  queued_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  last_error: string | null;
  total_products: number;
  processed_products: number;
};

export type PricingSvcRule = {
  min_rub: number;
  max_rub: number | null;
  mode: "fixed_rub" | "percent";
  value: number;
};

export type PricingSettings = {
  markup_multiplier: number;
  weight_tolerance: number;
  customs_threshold_eur: number;
  customs_duty_rate: number;
  eur_to_usd_rate: number;
  gbp_to_usd_rate: number;
  jpy_to_usd_rate: number;
  eur_to_rub_rate: number;
  usd_to_rub_rate: number;
  usdt_to_rub_rate: number;
  usdt_extra_rub: number;
  final_rounding_mode: string;
  payment_fee_rate: number;
  customs_processing_rate: number;
  customs_fixed_rub: number;
  tax_rate: number;
  bybit_rate_status?: string;
  bybit_rate_warning?: string | null;
  bybit_bucket_step_usdt?: number;
  bybit_bucket_max_usdt?: number;
  bybit_bucket_rates?: Array<Record<string, unknown>>;
  bybit_worker_auto_enabled?: boolean;
  bybit_worker_interval_sec?: number;
  bybit_last_updated_at?: string | null;
  bybit_last_error?: string | null;
  svc_rules: PricingSvcRule[];
  suppliers: PricingSupplier[];
  formula_latex: string;
  formula_lines: string[];
  formula_legend: Array<{ key: string; description: string }>;
};

export type AdminUiSettings = {
  auto_sync_period_minutes?: number;
  auto_sync_next_run_at?: string | null;
  auto_sync_last_started_at?: string | null;
  auto_sync_last_finished_at?: string | null;
  auto_sync_last_status?: string | null;
  auto_sync_last_error?: string | null;
};

export type PricingExampleProduct = {
  product_id: number | null;
  title: string;
  url: string | null;
  source_name: string | null;
  image_url: string | null;
  price_summary?: ProductPriceSummary | null;
  components: Record<string, unknown>;
  is_sample?: boolean;
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
  provider_kind: string;
  parent_supplier_id?: number | null;
  is_enabled: boolean;
  rate_currency: string;
  rates: PricingSupplierRate[];
};

export type SettingsTransferRoleEntry = {
  name: string;
  description: string | null;
  permissions: string[];
};

export type SettingsTransferSupplierRateEntry = {
  min_kg: number;
  max_kg: number | null;
  rub: number;
};

export type SettingsTransferSupplierEntry = {
  key: string;
  name: string;
  provider_kind: string;
  parent_supplier_key?: string | null;
  rate_currency: string;
  is_enabled: boolean;
  rates: SettingsTransferSupplierRateEntry[];
};

export type SettingsTransferSourceEntry = {
  key: string;
  name: string;
  url: string;
  adapter_key: string | null;
  parser_config: Record<string, unknown>;
  sort_priority: number;
  enabled: boolean;
  sync_enabled: boolean;
  dedup_enabled: boolean;
  hide_auto_added_products: boolean;
  description_mode: DescriptionMode;
  show_images: boolean;
  clean_public_titles: boolean;
  supplier_key: string | null;
  promo_factor: number;
  promo_only_no_discount: boolean;
  buyout_surcharge_value: number | null;
  buyout_surcharge_currency: string | null;
};

export type SettingsTransferWeightRuleEntry = {
  weight_grams: number;
  keywords: string[];
};

export type SettingsTransferTaxonomyFilterNode = {
  slug: string;
  title: string;
  display_title: string | null;
  mobile_pair_slug: string | null;
  default_weight_grams: number | null;
  node_kind: "filter" | "multifilter";
  is_enabled: boolean;
  restrict_by_gender: boolean;
  local_category_keywords: string[];
  title_keywords: string[];
  children: SettingsTransferTaxonomyFilterNode[];
};

export type SettingsTransferTaxonomyCustomCatalog = {
  slug: string;
  title: string;
  description: string | null;
  is_enabled: boolean;
};

export type SettingsTransferTaxonomyShowcaseAttachment = {
  kind: "filter" | "custom_catalog";
  filter_slug: string | null;
  custom_catalog_slug: string | null;
  hidden_filter_slugs: string[];
};

export type SettingsTransferTaxonomyShowcaseCategory = {
  code: string;
  title: string;
  attachments: SettingsTransferTaxonomyShowcaseAttachment[];
};

export type SettingsTransferTaxonomyState = {
  filters: SettingsTransferTaxonomyFilterNode[];
  custom_catalogs: SettingsTransferTaxonomyCustomCatalog[];
  showcase_categories: SettingsTransferTaxonomyShowcaseCategory[];
};

export type SettingsTransferSiteAbout = {
  text: string;
};

export type SettingsTransferSiteQuestionItem = {
  question: string;
  answer: string;
  is_enabled: boolean;
  is_expanded_by_default: boolean;
  position: number;
};

export type SettingsTransferSiteNotification = {
  title: string;
  description: string;
  button_text: string;
  button_url: string;
  version: number;
  position: number;
};

export type SettingsTransferSiteContent = {
  access: {
    enabled: boolean;
    title: string;
    description: string;
    password: string;
  };
  about: SettingsTransferSiteAbout;
  notifications: SettingsTransferSiteNotification[];
  questions: SettingsTransferSiteQuestionItem[];
};

export type SettingsTransferPricingSettings = {
  markup_multiplier: number;
  weight_tolerance: number;
  customs_threshold_eur: number;
  customs_duty_rate: number;
  eur_to_usd_rate: number;
  gbp_to_usd_rate: number;
  jpy_to_usd_rate: number;
  eur_to_rub_rate: number;
  usd_to_rub_rate: number;
  usdt_to_rub_rate: number;
  usdt_extra_rub: number;
  final_rounding_mode: string;
  payment_fee_rate: number;
  customs_processing_rate: number;
  customs_fixed_rub: number;
  tax_rate: number;
  svc_rules: PricingSvcRule[];
};

export type SettingsTransferAdminUiSettings = {
  auto_sync_period_minutes?: number;
};

export type SettingsTransferPayload = {
  schema_version: number;
  exported_at: string | null;
  project: string | null;
  pricing_settings: SettingsTransferPricingSettings;
  admin_ui_settings: SettingsTransferAdminUiSettings;
  roles: SettingsTransferRoleEntry[];
  suppliers: SettingsTransferSupplierEntry[];
  sources: SettingsTransferSourceEntry[];
  weight_rules: SettingsTransferWeightRuleEntry[];
  taxonomy: SettingsTransferTaxonomyState;
  site_content: SettingsTransferSiteContent;
};

export type LiveDataContextValue = {
  products: ServiceProduct[];
  productsTotal: number;
  productsHasMore: boolean;
  categories: CategoryView[];
  adminCategories: AdminCategoryNode[];
  dedupCandidates: DedupCandidate[];
  dedupCandidatesTotal: number;
  loadingDedupCandidates: boolean;
  dedupScanStatus: DedupScanStatus;
  dedupCandidatesHasMore: boolean;
  loadingMoreDedupCandidates: boolean;
  dedupDecisions: DedupDecision[];
  dedupDecisionsTotal: number;
  loadingDedupDecisions: boolean;
  dedupDecisionsLoaded: boolean;
  dedupDecisionsHasMore: boolean;
  loadingMoreDedupDecisions: boolean;
  weightRules: WeightRule[];
  weightMissingProducts: WeightMissingProduct[];
  weightRecalcStatus: WeightRecalcStatus;
  hasMoreWeightMissing: boolean;
  loadingMoreWeightMissing: boolean;
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
  refreshWeightRecalcStatusOnly: () => Promise<void>;
  loadMoreWeightMissingProducts: () => Promise<void>;
  loadMoreDedupCandidates: () => Promise<void>;
  loadMoreDedupDecisions: () => Promise<void>;
  ensureDedupLoaded: (force?: boolean) => Promise<void>;
  refreshDedupStatusOnly: () => Promise<void>;
  refreshDedupDecisionCountOnly: () => Promise<void>;
  ensureDedupDecisionsLoaded: () => Promise<void>;
  ensureCategoriesLoaded: (force?: boolean) => Promise<void>;
  refreshSourcesOnly: () => Promise<void>;
  loadMoreProducts: () => Promise<void>;
  getProductById: (id: number, opts?: { forceFetch?: boolean }) => Promise<ServiceProduct | null>;
  runSync: () => Promise<{ ok: boolean; message: string }>;
  runSyncForSource: (sourceKey: string) => Promise<{ ok: boolean; message: string }>;
  cancelSync: (jobId: string) => Promise<{ ok: boolean; message: string }>;
  previewProductByUrl: (url: string) => Promise<{ ok: boolean; message: string; preview: ProductUrlPreview | null }>;
  probeProductByUrl: (url: string) => Promise<{ ok: boolean; message: string; preview: ProductUrlPreview | null }>;
  addProductByUrl: (
    url: string,
    payload?: {
      title?: string;
      designer_name?: string | null;
      source_category_name?: string | null;
      image_count?: number;
    }
  ) => Promise<{ ok: boolean; message: string }>;
  createManualProduct: (payload: {
    title: string;
    description?: string | null;
    description_html?: string | null;
    designer_name?: string | null;
    source_category_name: string | null;
    gender?: "male" | "female" | "unisex" | null;
    variants: Array<{ title: string; price: number | null; compare_at_price?: number | null; currency: string; pricing_mode?: string | null; available: boolean }>;
    manual_image_asset_ids: number[];
    manual_weight_grams?: number | null;
    state?: ProductWriteState;
    custom_catalog_slugs?: string[];
    bind_sync?: boolean;
    bind_url?: string | null;
  }) => Promise<{ ok: boolean; message: string; id: number | null }>;
  updateManualProduct: (productId: number, payload: {
    title: string;
    description?: string | null;
    description_html?: string | null;
    designer_name?: string | null;
    source_category_name: string | null;
    gender?: "male" | "female" | "unisex" | null;
    variants: Array<{ title: string; price: number | null; compare_at_price?: number | null; currency: string; pricing_mode?: string | null; available: boolean }>;
    manual_image_asset_ids: number[];
    manual_weight_grams?: number | null;
    state?: ProductWriteState;
    custom_catalog_slugs?: string[];
    bind_sync?: boolean;
    bind_url?: string | null;
  }) => Promise<{ ok: boolean; message: string; id: number | null }>;
  deleteProduct: (productId: number) => Promise<{ ok: boolean; message: string }>;
  uploadProductImage: (file: File) => Promise<{ ok: boolean; message: string; imageAssetId: number | null }>;
  uploadProductImageByUrl: (url: string) => Promise<{ ok: boolean; message: string; imageAssetId: number | null }>;
  mergeDedupProducts: (payload: {
    product_ids: number[];
    primary_product_id?: number | null;
    primary_listing_id?: number | null;
    merge_mode?: "combine" | "keep_left" | "keep_right" | null;
  }) => Promise<{ ok: boolean; message: string }>;
  rejectDedupProducts: (productIds: number[]) => Promise<{ ok: boolean; message: string }>;
  undoDedupDecision: (decisionId: number) => Promise<{ ok: boolean; message: string }>;
  runDedupScan: () => Promise<{ ok: boolean; message: string }>;
  bulkUpdateProducts: (payload: {
    product_ids: number[];
    gender?: "male" | "female" | "unisex" | null;
  }) => Promise<{ ok: boolean; message: string; updatedProductIds: number[] }>;
  setProductStatus: (productId: number, state: ProductWriteState) => Promise<{ ok: boolean; message: string }>;
  updateProductOverrides: (
    productId: number,
    payload: {
      title?: string;
      brand_override_name?: string | null;
      description?: string;
      description_text?: string;
      description_html?: string;
      description_visible?: boolean | null;
      gender?: "male" | "female" | "unisex" | null;
      availability_mode?: "in_stock" | "by_order" | null;
      manual_weight_grams?: number | null;
      gallery_listing_id?: number | null;
      images?: {
        hidden_source_image_urls?: string[];
        manual_image_urls?: string[];
        manual_image_order?: string[];
      };
      reset_to_default?: Array<"title" | "brand_override_name" | "description" | "images" | "description_visibility" | "manual_weight_grams">;
    }
  ) => Promise<{ ok: boolean; message: string; product: ServiceProduct | null }>;
  updateManualProductVariants: (
    productId: number,
    variants: Array<{ title: string; price: number | null; compare_at_price?: number | null; currency: string; pricing_mode?: string | null; available: boolean }>
  ) => Promise<{ ok: boolean; message: string; product: ServiceProduct | null }>;
  getProductStarredCategories: (
    productId: number
  ) => Promise<{ ok: boolean; message: string; assignedCatalogSlugs: string[]; availableCategories: ProductStarredCategoryOption[] }>;
  setProductStarredCategories: (
    productId: number,
    catalogSlugs: string[]
  ) => Promise<{ ok: boolean; message: string; assignedCatalogSlugs: string[] }>;
  getStarredCategoryOptions: () => Promise<{ ok: boolean; items: Array<{ slug: string; name: string }> }>;
  ensureAllProductsLoaded: () => Promise<void>;
  toggleSourceEnabled: (sourceKey: string, enabled: boolean) => Promise<{ ok: boolean; message: string }>;
  toggleSourceSyncEnabled: (sourceKey: string, syncEnabled: boolean) => Promise<{ ok: boolean; message: string }>;
  updateSourceMode: (sourceKey: string, mode: "auto" | "manual") => Promise<{ ok: boolean; message: string }>;
  deleteSourceProducts: (sourceKey: string) => Promise<{ ok: boolean; message: string }>;
  toggleSourceDedupEnabled: (sourceKey: string, dedupEnabled: boolean) => Promise<{ ok: boolean; message: string }>;
  toggleSourceAutoHideProducts: (sourceKey: string, hideAutoAddedProducts: boolean) => Promise<{ ok: boolean; message: string }>;
  reorderSources: (sourceKeys: string[]) => Promise<{ ok: boolean; message: string }>;
  uploadSourceLogo: (sourceKey: string, file: File) => Promise<{ ok: boolean; message: string }>;
  clearSourceLogo: (sourceKey: string) => Promise<{ ok: boolean; message: string }>;
  updateSourceDisplaySettings: (
    sourceKey: string,
    payload: { description_mode?: DescriptionMode; show_images?: boolean; clean_public_titles?: boolean }
  ) => Promise<{ ok: boolean; message: string }>;
  createWeightRule: (weightGrams: number) => Promise<{ ok: boolean; message: string }>;
  updateWeightRule: (id: number, weightGrams: number) => Promise<{ ok: boolean; message: string }>;
  deleteWeightRule: (id: number) => Promise<{ ok: boolean; message: string }>;
  addWeightKeyword: (ruleId: number, keyword: string) => Promise<{ ok: boolean; message: string }>;
  removeWeightKeyword: (ruleId: number, keyword: string) => Promise<{ ok: boolean; message: string }>;
  startWeightRecalculation: () => Promise<{ ok: boolean; message: string }>;
  fetchPricingExampleProduct: (productId?: number | null) => Promise<PricingExampleFetchResult>;
  updatePricingSettings: (payload: Partial<PricingSettings>) => Promise<{ ok: boolean; message: string }>;
  updateAdminUiSettings: (payload: Partial<AdminUiSettings>) => Promise<{ ok: boolean; message: string }>;
  updatePricingSupplier: (
    supplierId: number,
    payload: {
      name?: string;
      provider_kind?: string;
      rate_currency?: string;
      is_enabled?: boolean;
      rates?: Array<{ min_kg: number; max_kg: number | null; rub: number }>;
    }
  ) => Promise<{ ok: boolean; message: string }>;
  createPricingSupplier: (payload: {
    key?: string;
    name: string;
    provider_kind: string;
    parent_supplier_id?: number | null;
    is_enabled?: boolean;
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
