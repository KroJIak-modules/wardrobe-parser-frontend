export type AdminTab = "products" | "dedup" | "showcase-structure" | "designers" | "sources" | "pricing" | "weight" | "settings";

export type UploadPreview = {
  file: File;
  url: string;
};

export type ShowcaseImageItem = {
  id: number;
};

export type PricingFieldKey =
  | "weight_tolerance"
  | "customs_duty_rate"
  | "customs_processing_rate"
  | "customs_fixed_rub"
  | "payment_fee_rate"
  | "tax_rate"
  | "shipping_alt_threshold_eur"
  | "bybit_extra_rub"
  | "eur_to_usd_rate"
  | "gbp_to_usd_rate"
  | "jpy_to_usd_rate";

export type FinalRoundingMode = "none" | "unit" | "ten" | "hundred" | "thousand";
export type CurrencyCode = "RUB" | "USD" | "EUR" | "GBP" | "JPY";
export type SupplierCategory = "main" | "alt";

export type TriCurrencyDraft = {
  currency: CurrencyCode;
  rub: string;
  usd: string;
  eur: string;
  gbp: string;
};

export type SvcRuleDraft = {
  id: string;
  min_rub: string;
  max_rub: string;
  mode: "fixed_rub" | "percent";
  value: string;
};

export type SvcRulePayload = {
  min_rub: number;
  max_rub: number | null;
  mode: "fixed_rub" | "percent";
  value: number;
};

export type SvcRuleFieldError = {
  min: boolean;
  max: boolean;
  value: boolean;
};

export type TriCurrencyAmountKey = "rub" | "usd" | "eur" | "gbp";

export type PricingExampleView = {
  productId: number;
  title: string;
  url: string;
  sourceName: string | null;
  imageUrl: string;
  finalPrice: number;
  sourcePrice: number;
  sourcePriceRub: number;
  sourceCurrency: CurrencyCode;
  summarySpLatex: string;
  summaryFpLatex: string;
  summaryRubLatex: string;
  marginRub: number;
  legendDim: Record<string, boolean>;
  formulaHtml: string;
};

export type BybitWorkerInfo = {
  stateLabel: string;
  stateClass: string;
  intervalSec: number;
  intervalLabel: string;
  ageLabel: string;
  errorMessage: string | null;
};

export type AdminProductsTableItem = {
  id: number;
  source_id: number;
  source_name?: string | null;
  title: string;
  vendor?: string | null;
  vendor_original?: string | null;
  vendor_mapped?: string | null;
  vendor_display?: string | null;
  url: string;
  product_type: string | null;
  status: string;
  image_count: number;
  image_urls: string[];
  image_ids: number[];
  source_price?: number | null;
  source_currency?: string | null;
  final_price?: number | null;
  final_currency?: string | null;
  internal_category_name?: string | null;
};

export type AdminFilterFacetOption = {
  value: string;
  label: string;
  count: number;
};

export type AdminDesignerSourceRow = {
  source_brand: string;
  source_product_count: number;
  designer_name: string;
  include_in_designers: boolean;
};

export type AdminFinalDesigner = {
  id: string;
  name: string;
  description: string;
};

export type AdminUiSettings = {
  designers_min_products: number;
  designers_exclude_store_vendors: boolean;
  auto_sync_period_minutes?: number;
  showcase_hero_image_asset_id?: number | null;
  showcase_carousel_image_asset_ids?: number[];
};
