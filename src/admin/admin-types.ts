import type { ProductPriceSummary } from "../shared/live-data-types";

export type AdminTab = "products" | "dedup" | "showcase-structure" | "designers" | "sources" | "pricing" | "weight" | "content" | "security";

export type UploadPreview = {
  file: File;
  url: string;
};

export type PricingFieldKey =
  | "weight_tolerance"
  | "customs_duty_rate"
  | "customs_processing_rate"
  | "customs_fixed_rub"
  | "payment_fee_rate"
  | "tax_rate"
  | "eur_to_rub_rate"
  | "usd_to_rub_rate"
  | "usdt_to_rub_rate"
  | "usdt_extra_rub";

export type FinalRoundingMode = "none" | "unit" | "ten" | "hundred" | "thousand";
export type CurrencyCode = "RUB" | "USD" | "EUR" | "GBP" | "JPY";
export type SupplierCategory = "main" | "alternate";

export type TriCurrencyDraft = {
  currency: CurrencyCode;
  rub: string;
  usd: string;
  eur: string;
  gbp: string;
};

export type TriCurrencyAmountKey = "rub" | "usd" | "eur" | "gbp";

export type PricingExampleView = {
  productId: number | null;
  title: string;
  url: string | null;
  sourceName: string | null;
  imageUrl: string | null;
  finalPrice: number;
  sourcePrice: number;
  sourcePriceRub: number;
  sourceCurrency: CurrencyCode;
  sourceHasRange: boolean;
  finalHasRange: boolean;
  isSample: boolean;
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

export type SvcRuleMode = "fixed_rub" | "percent";

export type SvcRuleDraft = {
  id: string;
  min_rub: string;
  max_rub: string;
  mode: SvcRuleMode;
  value: string;
};

export type SvcRulePayload = {
  min_rub: number;
  max_rub: number | null;
  mode: SvcRuleMode;
  value: number;
};

export type SvcRuleFieldError = {
  min: boolean;
  max: boolean;
  value: boolean;
};

export type AdminProductsTableItem = {
  id: number;
  created_at?: string;
  source_id: number | null;
  source_sort_priority?: number | null;
  source_name?: string | null;
  title: string;
  gender?: "male" | "female" | "unisex" | null;
  designer_name?: string | null;
  source_designer_name?: string | null;
  display_designer_name?: string | null;
  url: string;
  source_category_name: string | null;
  source_tags?: string[];
  visibility_status?: string | null;
  availability_mode?: string | null;
  orderability_status?: string | null;
  status_reason?: string | null;
  lifecycle_status?: string | null;
  image_count: number;
  image_urls: string[];
  image_ids: number[];
  price_summary?: ProductPriceSummary | null;
  pricing_reason?: string | null;
  pricing_manual_required?: boolean | null;
  internal_category_name?: string | null;
  internal_category_names?: string[];
};

export type AdminFilterFacetOption = {
  value: string;
  label: string;
  count: number;
  disabled?: boolean;
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
  auto_sync_period_minutes?: number;
};
