import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { renderToString } from "katex";
import "katex/dist/katex.min.css";
import { useLiveData, type CategoryManualProduct, type PricingSettings, type SettingsTransferPayload } from "../shared/live-data-context";
import { getProductPrimaryImageUrl } from "../shared/live-data-context";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { IconChevronDown, IconClose, IconInfo, IconPlus } from "../shared/mono-icons";
import { AdminSectionSkeleton, AdminTableSkeleton } from "../shared/skeleton";
import { ToastStack } from "../shared/toast-stack";
import { useToasts } from "../shared/use-toasts";

type AdminTab = "products" | "dedup" | "categories" | "sources" | "pricing" | "weight" | "settings";

type UploadPreview = {
  file: File;
  url: string;
};

const tabs: { key: AdminTab; label: string }[] = [
  { key: "products", label: "Все товары" },
  { key: "dedup", label: "Дедубликация" },
  { key: "categories", label: "Категории" },
  { key: "sources", label: "Источники" },
  { key: "pricing", label: "Ценообразование" },
  { key: "weight", label: "Вес" },
  { key: "settings", label: "Настройки" },
];

const whitelist = [
  "jadedldn.com",
  "nofaithstudios.com",
  "professor-e.com",
  "essxnyc.com",
  "paradoxeparis.com",
  "driewgarments.com",
  "archived.co",
];

const currencyOptions = ["RUB", "EUR", "USD"];
const API_BASE = "/api/v1";
const PAGE_SIZE = 100;
const NO_BRAND_VALUE = "__NO_BRAND__";
const pricingNumericKeys = [
  "weight_tolerance",
  "customs_duty_rate",
  "customs_processing_rate",
  "customs_fixed_rub",
  "payment_fee_rate",
  "tax_rate",
  "shipping_alt_threshold_eur",
  "bybit_extra_rub",
  "eur_to_usd_rate",
  "gbp_to_usd_rate",
] as const;
type PricingFieldKey = (typeof pricingNumericKeys)[number];
type FinalRoundingMode = "none" | "unit" | "ten" | "hundred" | "thousand";

const finalRoundingOptions: Array<{ value: FinalRoundingMode; label: string }> = [
  { value: "none", label: "Не округлять" },
  { value: "unit", label: "До единицы" },
  { value: "ten", label: "До десяток" },
  { value: "hundred", label: "До сотен" },
  { value: "thousand", label: "До тысячи" },
];

const legendKeyToLatex: Record<string, string> = {
  SP: "SP",
  SPU: "SPU",
  SPE: "SPE",
  SPR: "SPR",
  BBR: "BBR",
  BEX: "BEX",
  BFX: "BFX",
  E2U: "E2U",
  G2U: "G2U",
  PRM: "PRM",
  BSC: "BSC",
  BUY: "BUY",
  PFR: "PFR",
  PFRP: "PFRP",
  THR: "THR",
  DUT: "DUT",
  CPR: "CPR",
  CFX: "CFX",
  CDR: "CDR",
  SSR: "SSR",
  SUP: "SUP",
  RNG: "RNG",
  INS: "INS",
  SVC: "SVC",
  SUB: "SUB",
  SUBM: "SUBM",
  TXR: "TXR",
  TAX: "TAX",
  MP: "MP",
  MUP: "MUP",
  RND: "RND",
  FPR: "FPR",
  // Backward compatibility for older payload keys:
  SP_USD: "SPU",
  SP_EUR: "SPE",
  SP_RUB: "SPR",
  THR_EUR: "THR",
  DUTY: "DUT",
  CUSTOMS_PROC: "CPR",
  CUSTOMS_FIXED: "CFX",
  CUSTOMS_RUB: "CDR",
  BYBIT_USDT_RUB: "BBR",
  BYBIT_EXTRA: "BEX",
  FX_USDT_RUB: "BFX",
  EUR2USD: "E2U",
  GBP2USD: "G2U",
  PROMO: "PRM",
  BSC_RUB: "BSC",
  BUYOUT_RUB: "BUY",
  PAYMENT_FEE_RUB: "PFR",
  PAYMENT_FEE_RATE: "PFRP",
  STC_RUB: "SSR",
  "SSR[SUPPLIER][STEP]": "SSR[SUP,RNG]",
  SUPPLIER: "SUP",
  STEP: "RNG",
  INSURANCE_RUB: "INS",
  SERVICE_FEE_RUB: "SVC",
  TAX_RATE: "TXR",
  TAX_RUB: "TAX",
  FP_RUB: "FPR",
};

const pricingFieldMeta: Array<{ key: PricingFieldKey; symbolLatex: string; label: string; hint: string; step?: string }> = [
  {
    key: "weight_tolerance",
    symbolLatex: "WT",
    label: "Запас по весу",
    hint: "Запас на случай, если фактический вес окажется больше ожидаемого. Чем выше значение, тем выше расчетная доставка.",
    step: "0.01",
  },
  {
    key: "customs_duty_rate",
    symbolLatex: "DUT",
    label: "Ставка пошлины",
    hint: "Процент пошлины на сумму выше порога. Пример: 0.15 = 15%.",
    step: "0.001",
  },
  {
    key: "customs_processing_rate",
    symbolLatex: "CPR",
    label: "Обработка пошлины",
    hint: "Дополнительная комиссия на саму пошлину. Пример: 0.08 = 8%.",
    step: "0.001",
  },
  {
    key: "customs_fixed_rub",
    symbolLatex: "CFX",
    label: "Фикс таможни (RUB)",
    hint: "Фиксированная добавка к таможне в рублях, если пошлина срабатывает.",
    step: "0.01",
  },
  {
    key: "payment_fee_rate",
    symbolLatex: "PFRP",
    label: "Комиссия платёжки",
    hint: "Комиссия платежной системы с суммы выкупа товара. Пример: 0.02 = 2%.",
    step: "0.001",
  },
  {
    key: "tax_rate",
    symbolLatex: "TXR",
    label: "Налог",
    hint: "Налог на полную итоговую сумму. Пример: 0.06 = 6%.",
    step: "0.001",
  },
  {
    key: "shipping_alt_threshold_eur",
    symbolLatex: "ATH",
    label: "Порог alt-доставки",
    hint: "Если цена товара выше этого порога, для US/EU применяется альтернативный тариф доставки.",
    step: "0.01",
  },
  {
    key: "bybit_extra_rub",
    symbolLatex: "BEX",
    label: "Надбавка к курсу",
    hint: "Надбавка к курсу Bybit в рублях.",
    step: "0.01",
  },
  {
    key: "eur_to_usd_rate",
    symbolLatex: "E2U",
    label: "EUR -> USD",
    hint: "Коэффициент перевода цены товара из EUR в USD.",
    step: "0.0001",
  },
  {
    key: "gbp_to_usd_rate",
    symbolLatex: "G2U",
    label: "GBP -> USD",
    hint: "Коэффициент перевода цены товара из GBP в USD.",
    step: "0.0001",
  },
];

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatCompactNumber = (value: number | null, maxFractionDigits = 4): string => {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }
  const rounded = Number(value.toFixed(maxFractionDigits));
  if (Number.isInteger(rounded)) {
    return String(Math.trunc(rounded));
  }
  return String(rounded);
};

const formatDisplayMoney = (value: number | null, currency?: string): string => {
  if (value === null || !Number.isFinite(value)) {
    return "-";
  }
  const amount = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${amount} ${currency || ""}`.trim();
};

const escapeLatexText = (value: string): string =>
  value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([{}$&#_^%~])/g, "\\$1");

type CurrencyCode = "RUB" | "USD" | "EUR" | "GBP";
type SupplierCategory = "main" | "alt";

const normalizeCurrencyCode = (value: string | null | undefined, fallback: CurrencyCode = "RUB"): CurrencyCode => {
  const upper = (value || "").trim().toUpperCase();
  if (upper === "RUB" || upper === "USD" || upper === "EUR" || upper === "GBP") {
    return upper;
  }
  return fallback;
};

const toRubByRates = (value: number, currency: CurrencyCode, usdToRub: number, eurToRub: number, gbpToRub: number): number => {
  if (currency === "RUB") {
    return value;
  }
  if (currency === "USD") {
    return value * usdToRub;
  }
  if (currency === "GBP") {
    return value * gbpToRub;
  }
  return value * eurToRub;
};

const fromRubByRates = (valueRub: number, currency: CurrencyCode, usdToRub: number, eurToRub: number, gbpToRub: number): number => {
  if (currency === "RUB") {
    return valueRub;
  }
  if (currency === "USD") {
    return usdToRub > 0 ? valueRub / usdToRub : 0;
  }
  if (currency === "GBP") {
    return gbpToRub > 0 ? valueRub / gbpToRub : 0;
  }
  return eurToRub > 0 ? valueRub / eurToRub : 0;
};

const normalizeSupplierCategory = (value: string | null | undefined, fallback: SupplierCategory = "main"): SupplierCategory => {
  const raw = (value || "").trim().toLowerCase();
  if (raw === "main" || raw === "alt") {
    return raw;
  }
  return fallback;
};

const normalizeFinalRoundingMode = (value: string | null | undefined, fallback: FinalRoundingMode = "unit"): FinalRoundingMode => {
  const raw = (value || "").trim().toLowerCase();
  if (raw === "none" || raw === "unit" || raw === "ten" || raw === "hundred" || raw === "thousand") {
    return raw;
  }
  return fallback;
};

const formatSupplierCategory = (value: string | null | undefined): string =>
  normalizeSupplierCategory(value) === "alt" ? "Alt" : "Main";

type TriCurrencyDraft = {
  currency: CurrencyCode;
  rub: string;
  usd: string;
  eur: string;
  gbp: string;
};

type SvcRuleDraft = {
  id: string;
  min_rub: string;
  max_rub: string;
  mode: "fixed_rub" | "percent";
  value: string;
};

type SvcRulePayload = {
  min_rub: number;
  max_rub: number | null;
  mode: "fixed_rub" | "percent";
  value: number;
};

type SvcRuleFieldError = {
  min: boolean;
  max: boolean;
  value: boolean;
};

type ShippingRegion = "US" | "EU" | "UK";
type ShippingMode = "normal" | "alt";

type ShippingRuleDraft = {
  id: string;
  region: ShippingRegion;
  mode: ShippingMode;
  min_kg: string;
  max_kg: string;
  rub: string;
};

type ShippingRulePayload = {
  min_kg: number;
  max_kg: number | null;
  rub: number;
};

type ShippingRuleFieldError = {
  min: boolean;
  max: boolean;
  rub: boolean;
};

type TriCurrencyAmountKey = "rub" | "usd" | "eur" | "gbp";

const currencyToAmountKey = (currency: CurrencyCode): TriCurrencyAmountKey => {
  if (currency === "RUB") {
    return "rub";
  }
  if (currency === "USD") {
    return "usd";
  }
  if (currency === "GBP") {
    return "gbp";
  }
  return "eur";
};

const amountKeyToCurrency = (key: TriCurrencyAmountKey): CurrencyCode => {
  if (key === "rub") {
    return "RUB";
  }
  if (key === "usd") {
    return "USD";
  }
  if (key === "gbp") {
    return "GBP";
  }
  return "EUR";
};

const parseNonNegativeNumber = (raw: string): number | null => {
  const parsed = Number((raw || "").trim());
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
};

const parseSvcRuleDraft = (rule: SvcRuleDraft): SvcRulePayload | null => {
  const minRub = Number((rule.min_rub || "").trim());
  const maxRaw = (rule.max_rub || "").trim();
  const maxRub = maxRaw ? Number(maxRaw) : null;
  const value = Number((rule.value || "").trim());
  if (!Number.isFinite(minRub) || !Number.isFinite(value)) {
    return null;
  }
  if (maxRub !== null && !Number.isFinite(maxRub)) {
    return null;
  }
  if (minRub < 0 || (maxRub !== null && maxRub <= minRub) || value < 0) {
    return null;
  }
  return {
    min_rub: Number(minRub.toFixed(6)),
    max_rub: maxRub === null ? null : Number(maxRub.toFixed(6)),
    mode: rule.mode === "percent" ? "percent" : "fixed_rub",
    value: Number(value.toFixed(6)),
  };
};

const shippingGroupOrder: Array<{ region: ShippingRegion; mode: ShippingMode; label: string }> = [
  { region: "US", mode: "normal", label: "Тариф США" },
  { region: "US", mode: "alt", label: "Альтернативный тариф США" },
  { region: "EU", mode: "normal", label: "Тариф ЕС" },
  { region: "EU", mode: "alt", label: "Альтернативный тариф ЕС" },
  { region: "UK", mode: "normal", label: "Великобритания" },
];

const parseShippingRuleDraft = (rule: ShippingRuleDraft): ShippingRulePayload | null => {
  const minKg = Number((rule.min_kg || "").trim());
  const rub = Number((rule.rub || "").trim());
  const maxRaw = (rule.max_kg || "").trim();
  const maxKg = maxRaw ? Number(maxRaw) : null;
  if (!Number.isFinite(minKg) || minKg < 0 || !Number.isFinite(rub) || rub < 0) {
    return null;
  }
  if (maxKg !== null) {
    if (!Number.isFinite(maxKg) || maxKg <= minKg) {
      return null;
    }
  }
  return {
    min_kg: Number(minKg.toFixed(6)),
    max_kg: maxKg === null ? null : Number(maxKg.toFixed(6)),
    rub: Number(rub.toFixed(6)),
  };
};

const buildTriCurrencyDraft = (
  activeCurrency: CurrencyCode,
  activeValue: number,
  usdToRub: number,
  eurToRub: number,
  gbpToRub: number
): TriCurrencyDraft => {
  const rub = toRubByRates(activeValue, activeCurrency, usdToRub, eurToRub, gbpToRub);
  const usd = fromRubByRates(rub, "USD", usdToRub, eurToRub, gbpToRub);
  const eur = fromRubByRates(rub, "EUR", usdToRub, eurToRub, gbpToRub);
  const gbp = fromRubByRates(rub, "GBP", usdToRub, eurToRub, gbpToRub);
  return {
    currency: activeCurrency,
    rub: formatCompactNumber(rub, 4),
    usd: formatCompactNumber(usd, 4),
    eur: formatCompactNumber(eur, 4),
    gbp: formatCompactNumber(gbp, 4),
  };
};

const renderLatexInline = (latex: string): string =>
  renderToString(latex, {
    throwOnError: false,
    displayMode: false,
    strict: "ignore",
  });

const renderLatexBlock = (latex: string): string =>
  renderToString(latex, {
    throwOnError: false,
    displayMode: true,
    strict: "ignore",
  });

const renderLegendSymbol = (key: string): string => {
  const fromMap = legendKeyToLatex[key];
  if (fromMap) {
    return renderLatexInline(fromMap);
  }
  return renderLatexInline(`\\text{${escapeLatexText(key)}}`);
};

function HelpHint({ text }: { text: string }) {
  return (
    <span className="help-hint" tabIndex={0} aria-label={text}>
      <IconInfo className="icon-svg icon-svg--sm" />
      <span className="help-hint-popup">{text}</span>
    </span>
  );
}

type AdminListProduct = {
  id: number;
  source_id: number;
  handle: string;
  title: string;
  vendor: string | null;
  product_type: string | null;
  url: string;
  price: number | null;
  currency: string;
  source_price?: number | null;
  source_currency?: string | null;
  final_price?: number | null;
  final_currency?: string | null;
  status: string;
  image_count: number;
  image_urls: string[];
  image_ids: number[];
  internal_category_id?: number | null;
  internal_category_name?: string | null;
  internal_category_slug?: string | null;
  internal_category_ids?: number[];
  internal_category_names?: string[];
  internal_category_slugs?: string[];
  created_at: string;
  updated_at: string;
};

export function AdminPage() {
  const {
    products,
    productsTotal,
    productsHasMore,
    sources,
    latestJob,
    loadingMoreProducts,
    loadingCategoriesTree,
    loadingCategoryCounts,
    error,
    ensurePricingLoaded,
    ensureWeightLoaded,
    ensureDedupLoaded,
    loadMoreProducts,
    runSync,
    cancelSync,
    previewProductByUrl,
    addProductByUrl,
    createManualProduct,
    uploadProductImage,
    adminCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    addCategoryKeyword,
    removeCategoryKeyword,
    getCategoryManualProducts,
    searchCategoryManualProducts,
    addCategoryManualProduct,
    removeCategoryManualProduct,
    dedupCandidates,
    loadingDedupCandidates,
    mergeDedupPair,
    rejectDedupPair,
    loading,
    toggleSourceEnabled,
    weightRules,
    weightMissingProducts,
    pricingSettings,
    createWeightRule,
    updateWeightRule,
    deleteWeightRule,
    addWeightKeyword,
    removeWeightKeyword,
    updatePricingSettings,
    updatePricingSupplier,
    createPricingSupplier,
    deletePricingSupplier,
    exportSettings,
    importSettings,
    assignSourceSupplier,
    refresh,
  } = useLiveData();

  const [tab, setTab] = useState<AdminTab>("products");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const { toasts, pushToast, closeToast } = useToasts();

  const [productUrl, setProductUrl] = useState<string>("");
  const [productTitle, setProductTitle] = useState<string>("");
  const [productVendor, setProductVendor] = useState<string>("");
  const [productCategory, setProductCategory] = useState<string>("");
  const [productPrice, setProductPrice] = useState<string>("");
  const [productCurrency, setProductCurrency] = useState<string>("USD");
  const [imagePreviews, setImagePreviews] = useState<UploadPreview[]>([]);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [renameCategoryName, setRenameCategoryName] = useState<string>("");
  const [lastSavedCategoryName, setLastSavedCategoryName] = useState<string>("");
  const [keywordInput, setKeywordInput] = useState<string>("");
  const [titleKeywordInput, setTitleKeywordInput] = useState<string>("");
  const [manualSearchInput, setManualSearchInput] = useState<string>("");
  const [manualSearchLoading, setManualSearchLoading] = useState<boolean>(false);
  const [manualSearchResults, setManualSearchResults] = useState<CategoryManualProduct[]>([]);
  const [manualAssignedProducts, setManualAssignedProducts] = useState<CategoryManualProduct[]>([]);
  const [manualAssignedLoading, setManualAssignedLoading] = useState<boolean>(false);
  const [createFormOpen, setCreateFormOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategoryParentId, setNewCategoryParentId] = useState<number | null>(null);
  const [newCategoryKeywords, setNewCategoryKeywords] = useState<string>("");

  const [productSearch, setProductSearch] = useState<string>("");
  const [productSourceFilter, setProductSourceFilter] = useState<string>("");
  const [productVendorFilter, setProductVendorFilter] = useState<string>("");
  const [productTypeFilter, setProductTypeFilter] = useState<string>("");
  const [productStatusFilter, setProductStatusFilter] = useState<string>("");

  const [newWeightRuleGrams, setNewWeightRuleGrams] = useState<string>("700");
  const [weightRuleDrafts, setWeightRuleDrafts] = useState<Record<number, string>>({});
  const [weightKeywordInputs, setWeightKeywordInputs] = useState<Record<number, string>>({});
  const [pricingDrafts, setPricingDrafts] = useState<Record<PricingFieldKey, string>>({} as Record<PricingFieldKey, string>);
  const [markupRateDraft, setMarkupRateDraft] = useState<string>("0");
  const [thresholdDraft, setThresholdDraft] = useState<TriCurrencyDraft | null>(null);
  const [svcRuleDrafts, setSvcRuleDrafts] = useState<SvcRuleDraft[]>([]);
  const [shippingRuleDrafts, setShippingRuleDrafts] = useState<ShippingRuleDraft[]>([]);
  const [finalRoundingModeDraft, setFinalRoundingModeDraft] = useState<FinalRoundingMode>("unit");
  const [showBybitErrorPopup, setShowBybitErrorPopup] = useState<boolean>(false);
  const [settingsExportInProgress, setSettingsExportInProgress] = useState<boolean>(false);
  const [settingsImportInProgress, setSettingsImportInProgress] = useState<boolean>(false);
  const [pricingTabLoading, setPricingTabLoading] = useState<boolean>(false);
  const [weightTabLoading, setWeightTabLoading] = useState<boolean>(false);
  const [nowTickMs, setNowTickMs] = useState<number>(() => Date.now());
  const [pricingExampleStartSeed] = useState<number>(() => Math.random());
  const [sourcePricingDrafts, setSourcePricingDrafts] = useState<Record<string, {
    supplierId: string;
    promoPercent: string;
    promoOnlyNoDiscount: boolean;
    buyout: TriCurrencyDraft;
  }>>({});
  const productsSentinelRef = useRef<HTMLDivElement | null>(null);
  const settingsImportInputRef = useRef<HTMLInputElement | null>(null);
  const bybitWarnToastShownRef = useRef<string | null>(null);
  const pricingBlockedToastShownRef = useRef<boolean>(false);
  const shippingValidationToastRef = useRef<string | null>(null);
  const svcValidationToastRef = useRef<string | null>(null);

  const [filteredServerProducts, setFilteredServerProducts] = useState<AdminListProduct[]>([]);
  const [filteredServerTotal, setFilteredServerTotal] = useState<number>(0);
  const [filteredServerHasMore, setFilteredServerHasMore] = useState<boolean>(false);
  const [filteredServerCursor, setFilteredServerCursor] = useState<string | null>(null);
  const [loadingFilteredServer, setLoadingFilteredServer] = useState<boolean>(false);

  const isSyncInProgress = Boolean(latestJob && ["in_progress", "pending"].includes(latestJob.status));
  const canRunSync = !isSyncInProgress;
  const canCancelSync = Boolean(latestJob?.can_cancel && latestJob?.job_id);

  useEffect(() => {
    return () => {
      for (const item of imagePreviews) {
        URL.revokeObjectURL(item.url);
      }
    };
  }, [imagePreviews]);

  useEffect(() => {
    if (!error) {
      return;
    }
    pushToast(`Error: ${error}`);
  }, [error]);

  useEffect(() => {
    const warning = pricingSettings?.bybit_rate_warning?.trim();
    if (!warning) {
      bybitWarnToastShownRef.current = null;
      return;
    }
    if (bybitWarnToastShownRef.current === warning) {
      return;
    }
    bybitWarnToastShownRef.current = warning;
    pushToast(warning);
  }, [pricingSettings?.bybit_rate_warning]);

  useEffect(() => {
    if (!pricingSettings?.bybit_last_error) {
      setShowBybitErrorPopup(false);
    }
  }, [pricingSettings?.bybit_last_error]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const run = async () => {
      if (tab === "pricing") {
        setPricingTabLoading(true);
        try {
          await ensurePricingLoaded();
        } finally {
          setPricingTabLoading(false);
        }
        return;
      }
      if (tab === "weight") {
        setWeightTabLoading(true);
        try {
          await ensureWeightLoaded();
        } finally {
          setWeightTabLoading(false);
        }
        return;
      }
      if (tab === "dedup") {
        await ensureDedupLoaded();
      }
    };
    void run();
  }, [tab, ensurePricingLoaded, ensureWeightLoaded, ensureDedupLoaded]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTickMs(Date.now());
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const categoryOptions = useMemo(() => {
    const rows: { id: number; name: string }[] = [];
    const walk = (nodes: typeof adminCategories, prefix: string) => {
      for (const node of nodes) {
        rows.push({ id: node.id, name: `${prefix}${node.name}` });
        walk(node.children, `${prefix}  `);
      }
    };
    walk(adminCategories, "");
    return rows;
  }, [adminCategories]);

  const selectedCategory = useMemo(() => {
    if (selectedCategoryId === null) {
      return null;
    }
    let found: (typeof adminCategories)[number] | null = null;
    const walk = (nodes: typeof adminCategories) => {
      for (const node of nodes) {
        if (node.id === selectedCategoryId) {
          found = node;
          return;
        }
        walk(node.children);
      }
    };
    walk(adminCategories);
    return found;
  }, [adminCategories, selectedCategoryId]);

  const selectedCategoryIsLeaf = useMemo(() => {
    if (!selectedCategory) {
      return false;
    }
    return !selectedCategory.has_children && selectedCategory.children.length === 0;
  }, [selectedCategory]);

  const flattenedAdminCategories = useMemo(() => {
    const list: { id: number; name: string; keywords: string[]; title_keywords: string[] }[] = [];
    const walk = (nodes: typeof adminCategories) => {
      for (const node of nodes) {
        if (node.is_enabled) {
          list.push({
            id: node.id,
            name: node.name,
            keywords: node.keywords || [],
            title_keywords: node.title_keywords || [],
          });
        }
        walk(node.children);
      }
    };
    walk(adminCategories);
    return list;
  }, [adminCategories]);

  const inferInternalCategoryName = (product: (typeof products)[number]) => {
    if ((product.internal_category_names || []).length > 0) {
      return product.internal_category_names!.join(", ");
    }
    if (product.internal_category_name && product.internal_category_name.trim()) {
      return product.internal_category_name.trim();
    }
    const haystack = `${product.title} ${product.vendor || ""} ${product.product_type || ""}`.toLowerCase();
    const titleHaystack = `${product.title || ""}`.toLowerCase();
    let best: { name: string; score: number } | null = null;

    for (const category of flattenedAdminCategories) {
      let score = 0;
      for (const keyword of category.keywords) {
        const normalized = keyword.trim().toLowerCase();
        if (!normalized) {
          continue;
        }
        if (haystack.includes(normalized)) {
          score += normalized.length;
        }
      }
      for (const keyword of category.title_keywords) {
        const normalized = keyword.trim().toLowerCase();
        if (!normalized) {
          continue;
        }
        if (titleHaystack.includes(normalized)) {
          score += normalized.length;
        }
      }
      if (score > 0 && (!best || score > best.score)) {
        best = { name: category.name, score };
      }
    }

    return best?.name || "Прочее";
  };

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }
    setRenameCategoryName(selectedCategory.name);
    setLastSavedCategoryName(selectedCategory.name);
  }, [selectedCategory?.id, selectedCategory?.name]);

  useEffect(() => {
    if (!selectedCategoryId || !selectedCategory || !selectedCategory.keywords_editable || !selectedCategoryIsLeaf) {
      setManualAssignedProducts([]);
      setManualAssignedLoading(false);
      setManualSearchInput("");
      setManualSearchResults([]);
      return;
    }
    void (async () => {
      setManualAssignedLoading(true);
      const result = await getCategoryManualProducts(selectedCategoryId);
      if (result.ok) {
        setManualAssignedProducts(result.items);
      } else {
        pushToast(result.message);
      }
      setManualAssignedLoading(false);
    })();
  }, [selectedCategoryId, selectedCategory?.id, selectedCategory?.keywords_editable, selectedCategoryIsLeaf, getCategoryManualProducts]);

  useEffect(() => {
    const rawQuery = manualSearchInput.trim();
    if (!selectedCategoryId || !selectedCategory?.keywords_editable || !selectedCategoryIsLeaf || rawQuery.length === 0) {
      setManualSearchResults([]);
      setManualSearchLoading(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setManualSearchLoading(true);
      const result = await searchCategoryManualProducts(selectedCategoryId, rawQuery, 3);
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setManualSearchResults(result.items);
      } else {
        setManualSearchResults([]);
        pushToast(result.message);
      }
      setManualSearchLoading(false);
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [manualSearchInput, selectedCategoryId, selectedCategory?.keywords_editable, selectedCategoryIsLeaf, searchCategoryManualProducts]);

  useEffect(() => {
    if (!selectedCategoryId) {
      return;
    }
    const normalized = renameCategoryName.trim();
    if (!normalized || normalized === lastSavedCategoryName) {
      return;
    }

    const timer = window.setTimeout(async () => {
      const result = await updateCategory(selectedCategoryId, { name: normalized });
      pushToast(result.message);
      if (result.ok) {
        setLastSavedCategoryName(normalized);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [renameCategoryName, lastSavedCategoryName, selectedCategoryId, updateCategory]);

  useEffect(() => {
    setWeightRuleDrafts((prev) => {
      const next: Record<number, string> = {};
      for (const rule of weightRules) {
        next[rule.id] = prev[rule.id] ?? String(rule.weight_grams);
      }
      return next;
    });
  }, [weightRules]);

  useEffect(() => {
    const timers: number[] = [];
    for (const rule of weightRules) {
      const raw = weightRuleDrafts[rule.id];
      if (raw === undefined) {
        continue;
      }
      const trimmed = raw.trim();
      if (!trimmed) {
        continue;
      }
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        continue;
      }
      const rounded = Math.round(parsed);
      if (rounded === rule.weight_grams) {
        continue;
      }

      const timer = window.setTimeout(async () => {
        const result = await updateWeightRule(rule.id, rounded);
        if (!result.ok) {
          pushToast(result.message);
        }
      }, 700);
      timers.push(timer);
    }

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [weightRuleDrafts, weightRules, updateWeightRule]);

  useEffect(() => {
    if (!pricingSettings) {
      return;
    }
    const markupRate = Math.max(0, Number(pricingSettings.markup_multiplier) - 1);
    setMarkupRateDraft(formatCompactNumber(markupRate, 6));
    setPricingDrafts((prev) => {
      const next = { ...prev };
      for (const key of pricingNumericKeys) {
        next[key] = prev[key] ?? String(pricingSettings[key]);
      }
      return next;
    });
  }, [pricingSettings]);

  useEffect(() => {
    if (!pricingSettings) {
      return;
    }
    setFinalRoundingModeDraft(normalizeFinalRoundingMode(pricingSettings.final_rounding_mode, "unit"));
  }, [pricingSettings?.final_rounding_mode]);

  useEffect(() => {
    if (!pricingSettings) {
      return;
    }
    const patch: Partial<PricingSettings> = {};
    for (const key of pricingNumericKeys) {
      const raw = (pricingDrafts[key] ?? "").trim();
      if (!raw) {
        continue;
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        continue;
      }
      const rounded = Number(parsed.toFixed(6));
      const current = Number(pricingSettings[key]);
      if (Number.isFinite(current) && Math.abs(current - rounded) <= 0.000001) {
        continue;
      }
      patch[key] = rounded;
    }

    if (Object.keys(patch).length === 0) {
      return;
    }

    const timer = window.setTimeout(async () => {
      const result = await updatePricingSettings(patch);
      if (!result.ok) {
        pushToast(result.message);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [pricingDrafts, pricingSettings, updatePricingSettings]);

  useEffect(() => {
    if (!pricingSettings) {
      return;
    }
    const parsed = Number((markupRateDraft || "").trim());
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }
    const nextMultiplier = Number((1 + parsed).toFixed(6));
    const currentMultiplier = Number(pricingSettings.markup_multiplier);
    if (Number.isFinite(currentMultiplier) && Math.abs(currentMultiplier - nextMultiplier) <= 0.000001) {
      return;
    }
    const timer = window.setTimeout(async () => {
      const result = await updatePricingSettings({ markup_multiplier: nextMultiplier });
      if (!result.ok) {
        pushToast(result.message);
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [markupRateDraft, pricingSettings, updatePricingSettings]);

  useEffect(() => {
    if (!pricingSettings) {
      return;
    }
    const currentMode = normalizeFinalRoundingMode(pricingSettings.final_rounding_mode, "unit");
    if (currentMode === finalRoundingModeDraft) {
      return;
    }
    const timer = window.setTimeout(async () => {
      const result = await updatePricingSettings({ final_rounding_mode: finalRoundingModeDraft });
      if (!result.ok) {
        pushToast(result.message);
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [finalRoundingModeDraft, pricingSettings, updatePricingSettings]);

  useEffect(() => {
    if (!pricingSettings) {
      return;
    }
    const sourceRules = Array.isArray(pricingSettings.svc_rules) ? pricingSettings.svc_rules : [];
    const next = sourceRules
      .map((row, index) => {
        const raw = row as Record<string, unknown>;
        const minRub = Number(raw.min_rub);
        const maxRaw = raw.max_rub;
        const maxRub = maxRaw === null || maxRaw === undefined || String(maxRaw).trim() === "" ? null : Number(maxRaw);
        const value = Number(raw.value);
        if (!Number.isFinite(minRub) || !Number.isFinite(value)) {
          return null;
        }
        if (maxRub !== null && !Number.isFinite(maxRub)) {
          return null;
        }
        if (minRub < 0 || (maxRub !== null && maxRub <= minRub) || value < 0) {
          return null;
        }
        const mode = String(raw.mode || "fixed_rub").toLowerCase() === "percent" ? "percent" : "fixed_rub";
        return {
          id: `svc-${index}-${minRub}-${maxRub ?? "inf"}`,
          min_rub: formatCompactNumber(minRub, 6),
          max_rub: maxRub === null ? "" : formatCompactNumber(maxRub, 6),
          mode,
          value: formatCompactNumber(value, 6),
        } as SvcRuleDraft;
      })
      .filter(Boolean) as SvcRuleDraft[];
    setSvcRuleDrafts(next);
  }, [pricingSettings?.svc_rules]);

  useEffect(() => {
    if (!pricingSettings) {
      return;
    }
    const parsed = svcRuleDrafts.map(parseSvcRuleDraft).filter(Boolean) as SvcRulePayload[];
    if (parsed.length !== svcRuleDrafts.length) {
      return;
    }
    parsed.sort((a, b) => (a.min_rub - b.min_rub) || ((a.max_rub ?? Number.POSITIVE_INFINITY) - (b.max_rub ?? Number.POSITIVE_INFINITY)));
    for (let i = 1; i < parsed.length; i += 1) {
      const prevMax = parsed[i - 1].max_rub ?? Number.POSITIVE_INFINITY;
      if (parsed[i].min_rub < prevMax) {
        return;
      }
    }
    const currentRaw = Array.isArray(pricingSettings.svc_rules) ? pricingSettings.svc_rules : [];
    const current = currentRaw
      .map((row) => {
        const raw = row as Record<string, unknown>;
        const minRub = Number(raw.min_rub);
        const maxRaw = raw.max_rub;
        const maxRub = maxRaw === null || maxRaw === undefined || String(maxRaw).trim() === "" ? null : Number(maxRaw);
        const value = Number(raw.value);
        if (!Number.isFinite(minRub) || !Number.isFinite(value)) {
          return null;
        }
        if (maxRub !== null && !Number.isFinite(maxRub)) {
          return null;
        }
        if (minRub < 0 || (maxRub !== null && maxRub <= minRub) || value < 0) {
          return null;
        }
        return {
          min_rub: Number(minRub.toFixed(6)),
          max_rub: maxRub === null ? null : Number(maxRub.toFixed(6)),
          mode: String(raw.mode || "fixed_rub").toLowerCase() === "percent" ? "percent" : "fixed_rub",
          value: Number(value.toFixed(6)),
        };
      })
      .filter(Boolean) as SvcRulePayload[];
    current.sort((a, b) => (a.min_rub - b.min_rub) || ((a.max_rub ?? Number.POSITIVE_INFINITY) - (b.max_rub ?? Number.POSITIVE_INFINITY)));
    if (JSON.stringify(current) === JSON.stringify(parsed)) {
      return;
    }
    const timer = window.setTimeout(async () => {
      const result = await updatePricingSettings({
        svc_rules: parsed as unknown as Array<Record<string, unknown>>,
      });
      if (!result.ok) {
        pushToast(result.message);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [svcRuleDrafts, pricingSettings, updatePricingSettings]);

  const svcRulesValidationError = useMemo(() => {
    const parsed = svcRuleDrafts.map(parseSvcRuleDraft).filter(Boolean) as SvcRulePayload[];
    if (parsed.length !== svcRuleDrafts.length) {
      return "SVC: заполни начало, конец и значение корректными числами";
    }
    for (const row of parsed) {
      if (row.max_rub !== null && row.max_rub <= row.min_rub) {
        return "SVC: конец диапазона должен быть больше начала";
      }
    }
    parsed.sort((a, b) => (a.min_rub - b.min_rub) || ((a.max_rub ?? Number.POSITIVE_INFINITY) - (b.max_rub ?? Number.POSITIVE_INFINITY)));
    for (let i = 1; i < parsed.length; i += 1) {
      const prevMax = parsed[i - 1].max_rub ?? Number.POSITIVE_INFINITY;
      if (parsed[i].min_rub < prevMax) {
        return "SVC: диапазоны пересекаются";
      }
    }
    return null;
  }, [svcRuleDrafts]);

  const svcRuleFieldErrors = useMemo(() => {
    const errors: Record<string, SvcRuleFieldError> = {};
    const sortableRows: Array<{ id: string; min_rub: number; max_rub: number | null }> = [];
    for (const rule of svcRuleDrafts) {
      const minRub = Number((rule.min_rub || "").trim());
      const maxRaw = (rule.max_rub || "").trim();
      const maxRub = maxRaw ? Number(maxRaw) : null;
      const value = Number((rule.value || "").trim());
      const rowError: SvcRuleFieldError = {
        min: !Number.isFinite(minRub) || minRub < 0,
        max: maxRub !== null && !Number.isFinite(maxRub),
        value: !Number.isFinite(value) || value < 0,
      };
      if (!rowError.min && !rowError.max && maxRub !== null && maxRub <= minRub) {
        rowError.max = true;
      }
      errors[rule.id] = rowError;
      if (Number.isFinite(minRub) && (maxRub === null || Number.isFinite(maxRub)) && minRub >= 0) {
        sortableRows.push({ id: rule.id, min_rub: minRub, max_rub: maxRub });
      }
    }
    sortableRows.sort((a, b) => (a.min_rub - b.min_rub) || ((a.max_rub ?? Number.POSITIVE_INFINITY) - (b.max_rub ?? Number.POSITIVE_INFINITY)));
    for (let i = 1; i < sortableRows.length; i += 1) {
      const prevMax = sortableRows[i - 1].max_rub ?? Number.POSITIVE_INFINITY;
      if (sortableRows[i].min_rub < prevMax) {
        errors[sortableRows[i - 1].id].max = true;
        errors[sortableRows[i].id].min = true;
      }
    }
    return errors;
  }, [svcRuleDrafts]);

  const onAddSvcRule = () => {
    setSvcRuleDrafts((prev) => {
      const normalized = prev.map(parseSvcRuleDraft).filter(Boolean) as SvcRulePayload[];
      normalized.sort((a, b) => (a.min_rub - b.min_rub) || ((a.max_rub ?? Number.POSITIVE_INFINITY) - (b.max_rub ?? Number.POSITIVE_INFINITY)));
      const last = normalized.length > 0 ? normalized[normalized.length - 1] : null;
      const nextMin = last ? Number(((last.max_rub ?? last.min_rub)).toFixed(2)) : 0;
      const nextMax = Number((nextMin + 10000).toFixed(2));
      return [
        ...prev,
        {
          id: `svc-new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          min_rub: formatCompactNumber(nextMin, 6),
          max_rub: formatCompactNumber(nextMax, 6),
          mode: "fixed_rub",
          value: "0",
        },
      ];
    });
  };

  useEffect(() => {
    if (!pricingSettings) {
      setShippingRuleDrafts([]);
      return;
    }
    const next: ShippingRuleDraft[] = [];
    for (const group of shippingGroupOrder) {
      const rows = ((pricingSettings.shipping_rules || {})[group.region] || {})[group.mode] || [];
      for (const row of rows) {
        const raw = row as Record<string, unknown>;
        const minKgRaw = Number(raw.min_kg);
        const maxRaw = raw.max_kg;
        const maxKgRaw = maxRaw === null || maxRaw === undefined || String(maxRaw).trim() === "" ? null : Number(maxRaw);
        const rubRaw = Number(raw.rub);
        if (!Number.isFinite(minKgRaw) || minKgRaw < 0 || !Number.isFinite(rubRaw) || rubRaw < 0) {
          continue;
        }
        if (maxKgRaw !== null && (!Number.isFinite(maxKgRaw) || maxKgRaw <= minKgRaw)) {
          continue;
        }
        next.push({
          id: `${group.region}-${group.mode}-${next.length}`,
          region: group.region,
          mode: group.mode,
          min_kg: formatCompactNumber(minKgRaw, 6),
          max_kg: maxKgRaw === null ? "" : formatCompactNumber(maxKgRaw, 6),
          rub: formatCompactNumber(rubRaw, 6),
        });
      }
    }
    setShippingRuleDrafts(next);
  }, [pricingSettings?.shipping_rules]);

  const shippingRulesValidationError = useMemo(() => {
    for (const group of shippingGroupOrder) {
      const parsed = shippingRuleDrafts
        .filter((item) => item.region === group.region && item.mode === group.mode)
        .map(parseShippingRuleDraft);
      if (parsed.some((item) => !item)) {
        return `SSR: заполни корректно диапазоны в "${group.label}"`;
      }
      const normalized = parsed.filter(Boolean) as ShippingRulePayload[];
      normalized.sort((a, b) => (a.min_kg - b.min_kg) || ((a.max_kg ?? Number.POSITIVE_INFINITY) - (b.max_kg ?? Number.POSITIVE_INFINITY)));
      for (let i = 1; i < normalized.length; i += 1) {
        const prevMax = normalized[i - 1].max_kg ?? Number.POSITIVE_INFINITY;
        if (normalized[i].min_kg < prevMax - 1e-9) {
          return `SSR: диапазоны пересекаются в "${group.label}"`;
        }
      }
    }
    return null;
  }, [shippingRuleDrafts]);

  const shippingRuleFieldErrors = useMemo(() => {
    const errors: Record<string, ShippingRuleFieldError> = {};
    for (const row of shippingRuleDrafts) {
      const minKg = Number((row.min_kg || "").trim());
      const rub = Number((row.rub || "").trim());
      const maxRaw = (row.max_kg || "").trim();
      const maxKg = maxRaw ? Number(maxRaw) : null;
      const rowError: ShippingRuleFieldError = {
        min: !Number.isFinite(minKg) || minKg < 0,
        max: false,
        rub: !Number.isFinite(rub) || rub < 0,
      };
      if (maxKg !== null && (!Number.isFinite(maxKg) || maxKg <= minKg)) {
        rowError.max = true;
      }
      errors[row.id] = rowError;
    }
    for (const group of shippingGroupOrder) {
      const rows = shippingRuleDrafts
        .filter((item) => item.region === group.region && item.mode === group.mode)
        .map((item) => {
          const parsed = parseShippingRuleDraft(item);
          return parsed ? { id: item.id, ...parsed } : null;
        })
        .filter(Boolean) as Array<{ id: string; min_kg: number; max_kg: number | null; rub: number }>;
      rows.sort((a, b) => (a.min_kg - b.min_kg) || ((a.max_kg ?? Number.POSITIVE_INFINITY) - (b.max_kg ?? Number.POSITIVE_INFINITY)));
      for (let i = 1; i < rows.length; i += 1) {
        const prevMax = rows[i - 1].max_kg ?? Number.POSITIVE_INFINITY;
        if (rows[i].min_kg < prevMax - 1e-9) {
          errors[rows[i - 1].id].max = true;
          errors[rows[i].id].min = true;
        }
      }
    }
    return errors;
  }, [shippingRuleDrafts]);

  useEffect(() => {
    if (!pricingSettings || shippingRulesValidationError) {
      return;
    }
    const payload: Record<string, Record<string, Array<Record<string, unknown>>>> = {
      US: { normal: [], alt: [] },
      EU: { normal: [], alt: [] },
      UK: { normal: [], alt: [] },
    };
    for (const group of shippingGroupOrder) {
      const rows = shippingRuleDrafts
        .filter((item) => item.region === group.region && item.mode === group.mode)
        .map(parseShippingRuleDraft)
        .filter(Boolean) as ShippingRulePayload[];
      rows.sort((a, b) => (a.min_kg - b.min_kg) || ((a.max_kg ?? Number.POSITIVE_INFINITY) - (b.max_kg ?? Number.POSITIVE_INFINITY)));
      payload[group.region][group.mode] = rows.map((row) => ({
        min_kg: row.min_kg,
        max_kg: row.max_kg,
        rub: row.rub,
      }));
    }
    const current = JSON.stringify(pricingSettings.shipping_rules || {});
    const next = JSON.stringify(payload);
    if (current === next) {
      return;
    }
    const timer = window.setTimeout(async () => {
      const result = await updatePricingSettings({
        shipping_rules: payload as unknown as Record<string, Record<string, Array<Record<string, unknown>>>>,
      });
      if (!result.ok) {
        pushToast(result.message);
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [shippingRuleDrafts, pricingSettings, shippingRulesValidationError, updatePricingSettings]);

  const onAddShippingRule = (region: ShippingRegion, mode: ShippingMode) => {
    setShippingRuleDrafts((prev) => {
      const groupRows = prev
        .filter((item) => item.region === region && item.mode === mode)
        .map(parseShippingRuleDraft)
        .filter(Boolean) as ShippingRulePayload[];
      groupRows.sort((a, b) => (a.min_kg - b.min_kg) || ((a.max_kg ?? Number.POSITIVE_INFINITY) - (b.max_kg ?? Number.POSITIVE_INFINITY)));
      const last = groupRows.length > 0 ? groupRows[groupRows.length - 1] : null;
      const nextMin = last ? Number((last.max_kg ?? last.min_kg).toFixed(3)) : 0;
      const nextMax = Number((nextMin + 0.5).toFixed(3));
      return [
        ...prev,
        {
          id: `ship-new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          region,
          mode,
          min_kg: formatCompactNumber(nextMin, 6),
          max_kg: formatCompactNumber(nextMax, 6),
          rub: "0",
        },
      ];
    });
  };

  const pricingRates = useMemo(() => {
    if (!pricingSettings) {
      return { usdToRub: 95, eurToRub: 105, gbpToRub: 133 };
    }
    const bybitBase = Number(pricingSettings.bybit_usdt_to_rub);
    const draftExtra = Number((pricingDrafts.bybit_extra_rub ?? String(pricingSettings.bybit_extra_rub)).trim());
    const draftEurToUsd = Number((pricingDrafts.eur_to_usd_rate ?? String(pricingSettings.eur_to_usd_rate)).trim());
    const draftGbpToUsd = Number((pricingDrafts.gbp_to_usd_rate ?? String(pricingSettings.gbp_to_usd_rate)).trim());
    const bybitExtra = Number.isFinite(draftExtra) ? draftExtra : Number(pricingSettings.bybit_extra_rub);
    const eurToUsd = Number.isFinite(draftEurToUsd) && draftEurToUsd > 0 ? draftEurToUsd : Number(pricingSettings.eur_to_usd_rate);
    const gbpToUsd = Number.isFinite(draftGbpToUsd) && draftGbpToUsd > 0 ? draftGbpToUsd : Number(pricingSettings.gbp_to_usd_rate);
    const usdToRub = (Number.isFinite(bybitBase) && bybitBase > 0 ? bybitBase : 95) + Math.max(0, bybitExtra);
    const eurToRub = usdToRub * eurToUsd;
    const gbpToRub = usdToRub * gbpToUsd;
    return { usdToRub, eurToRub, gbpToRub };
  }, [pricingSettings, pricingDrafts.bybit_extra_rub, pricingDrafts.eur_to_usd_rate, pricingDrafts.gbp_to_usd_rate]);

  const setThresholdField = (field: TriCurrencyAmountKey, raw: string) => {
    setThresholdDraft((prev) => {
      if (!prev) {
        return prev;
      }
      const next = { ...prev, [field]: raw };
      const parsed = parseNonNegativeNumber(raw);
      if (parsed === null) {
        return next;
      }
      return buildTriCurrencyDraft(
        amountKeyToCurrency(field),
        parsed,
        pricingRates.usdToRub,
        pricingRates.eurToRub,
        pricingRates.gbpToRub
      );
    });
  };

  const setSourceBuyoutField = (sourceKey: string, field: TriCurrencyAmountKey, raw: string) => {
    setSourcePricingDrafts((prev) => {
      const current = prev[sourceKey];
      if (!current) {
        return prev;
      }
      const nextBuyout = { ...current.buyout, [field]: raw };
      const parsed = parseNonNegativeNumber(raw);
      if (parsed !== null) {
        const rebuilt = buildTriCurrencyDraft(
          amountKeyToCurrency(field),
          parsed,
          pricingRates.usdToRub,
          pricingRates.eurToRub,
          pricingRates.gbpToRub
        );
        nextBuyout.currency = rebuilt.currency;
        nextBuyout.rub = rebuilt.rub;
        nextBuyout.usd = rebuilt.usd;
        nextBuyout.eur = rebuilt.eur;
        nextBuyout.gbp = rebuilt.gbp;
      }
      return { ...prev, [sourceKey]: { ...current, buyout: nextBuyout } };
    });
  };

  useEffect(() => {
    if (!pricingSettings) {
      return;
    }
    const usdToRub = pricingRates.usdToRub;
    const eurToRub = pricingRates.eurToRub;
    const thresholdEur = Number(pricingSettings.customs_threshold_eur);
    const thresholdRub = thresholdEur * eurToRub;
    const thresholdUsd = usdToRub > 0 ? thresholdRub / usdToRub : 0;
    setThresholdDraft({
      currency: normalizeCurrencyCode(pricingSettings.customs_threshold_currency, "EUR"),
      rub: formatCompactNumber(thresholdRub, 4),
      usd: formatCompactNumber(thresholdUsd, 4),
      eur: formatCompactNumber(thresholdEur, 4),
      gbp: formatCompactNumber(fromRubByRates(thresholdRub, "GBP", usdToRub, eurToRub, pricingRates.gbpToRub), 4),
    });
  }, [pricingSettings?.customs_threshold_eur, pricingSettings?.customs_threshold_currency, pricingRates.usdToRub, pricingRates.eurToRub, pricingRates.gbpToRub]);

  useEffect(() => {
    if (!pricingSettings || !thresholdDraft) {
      return;
    }
    const usdToRub = pricingRates.usdToRub;
    const eurToRub = pricingRates.eurToRub;
    const activeCurrency = thresholdDraft.currency;
    const activeRaw = thresholdDraft[activeCurrency.toLowerCase() as TriCurrencyAmountKey];
    const activeValue = Number((activeRaw || "").trim());
    if (!Number.isFinite(activeValue) || activeValue < 0) {
      return;
    }
    const thresholdRub = toRubByRates(activeValue, activeCurrency, usdToRub, eurToRub, pricingRates.gbpToRub);
    const nextThresholdEur = fromRubByRates(thresholdRub, "EUR", usdToRub, eurToRub, pricingRates.gbpToRub);
    const currentThresholdEur = Number(pricingSettings.customs_threshold_eur);
    const currentCurrency = normalizeCurrencyCode(pricingSettings.customs_threshold_currency, "EUR");
    if (Math.abs(nextThresholdEur - currentThresholdEur) <= 0.0001 && activeCurrency === currentCurrency) {
      return;
    }
    const timer = window.setTimeout(async () => {
      const result = await updatePricingSettings({
        customs_threshold_eur: Number(nextThresholdEur.toFixed(6)),
        customs_threshold_currency: activeCurrency,
      });
      if (!result.ok) {
        pushToast(result.message);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [pricingSettings, thresholdDraft, updatePricingSettings, pricingRates.usdToRub, pricingRates.eurToRub, pricingRates.gbpToRub]);

  useEffect(() => {
    if (!sources || sources.length === 0) {
      return;
    }
    setSourcePricingDrafts((prev) => {
      const next = { ...prev };
      for (const source of sources) {
        const rawBuyoutCurrency = normalizeCurrencyCode(source.buyout_surcharge_currency || "USD", "USD");
        const buyoutCurrency: CurrencyCode = rawBuyoutCurrency === "RUB" ? "USD" : rawBuyoutCurrency;
        const buyoutValue = Number(source.buyout_surcharge_value || 0);
        const buyoutRub = toRubByRates(
          buyoutValue,
          normalizeCurrencyCode(source.buyout_surcharge_currency || "RUB", "RUB"),
          pricingRates.usdToRub,
          pricingRates.eurToRub,
          pricingRates.gbpToRub
        );
        const buyoutUsd = fromRubByRates(buyoutRub, "USD", pricingRates.usdToRub, pricingRates.eurToRub, pricingRates.gbpToRub);
        const buyoutEur = fromRubByRates(buyoutRub, "EUR", pricingRates.usdToRub, pricingRates.eurToRub, pricingRates.gbpToRub);
        const buyoutGbp = fromRubByRates(buyoutRub, "GBP", pricingRates.usdToRub, pricingRates.eurToRub, pricingRates.gbpToRub);
        const promoFactor = Number(source.promo_factor ?? 1);
        const promoPercent = Math.max(0, Math.min(100, (1 - promoFactor) * 100));
        next[source.key] = {
          supplierId: String(source.supplier_id ?? ""),
          promoPercent: formatCompactNumber(promoPercent, 4),
          promoOnlyNoDiscount: Boolean(source.promo_only_no_discount),
          buyout: {
            currency: buyoutCurrency,
            usd: formatCompactNumber(buyoutUsd, 4),
            eur: formatCompactNumber(buyoutEur, 4),
            gbp: formatCompactNumber(buyoutGbp, 4),
            rub: formatCompactNumber(buyoutRub, 4),
          },
        };
      }
      return next;
    });
  }, [sources, pricingRates.usdToRub, pricingRates.eurToRub, pricingRates.gbpToRub]);

  useEffect(() => {
    if (!sources || sources.length === 0) {
      return;
    }
    const timers: number[] = [];
    for (const source of sources) {
      const draft = sourcePricingDrafts[source.key];
      if (!draft) {
        continue;
      }
      const supplierParsed = Number((draft.supplierId || "").trim());
      const promoPercentParsed = Number((draft.promoPercent || "").trim());
      const normalizedTargetCurrency = normalizeCurrencyCode(draft.buyout.currency, "USD");
      const targetBuyoutCurrency: CurrencyCode = normalizedTargetCurrency === "RUB" ? "USD" : normalizedTargetCurrency;
      const targetBuyoutField = currencyToAmountKey(targetBuyoutCurrency);
      const targetBuyoutRaw = String(draft.buyout[targetBuyoutField] || "").trim();
      const targetBuyoutParsed = Number(targetBuyoutRaw);
      if (!Number.isFinite(supplierParsed) || supplierParsed <= 0) {
        continue;
      }
      if (!Number.isFinite(promoPercentParsed) || promoPercentParsed < 0 || promoPercentParsed > 100) {
        continue;
      }
      if (!Number.isFinite(targetBuyoutParsed) || targetBuyoutParsed < 0) {
        continue;
      }
      const targetSupplierId = Math.round(supplierParsed);
      const targetPromoFactor = Number((1 - (promoPercentParsed / 100)).toFixed(6));
      const targetBuyoutValue = Number(targetBuyoutParsed.toFixed(6));
      const targetBuyoutRub = toRubByRates(
        targetBuyoutValue,
        targetBuyoutCurrency,
        pricingRates.usdToRub,
        pricingRates.eurToRub,
        pricingRates.gbpToRub
      );
      const targetPromoOnlyNoDiscount = Boolean(draft.promoOnlyNoDiscount);
      const sourceSupplierId = Number(source.supplier_id ?? 0);
      const sourcePromoFactor = Number(source.promo_factor ?? 1);
      const sourcePromoMode = Boolean(source.promo_only_no_discount);
      const sourceBuyoutCurrency = normalizeCurrencyCode(source.buyout_surcharge_currency || "RUB", "RUB");
      const sourceBuyoutValue = Number(source.buyout_surcharge_value || 0);
      const sourceBuyoutRub = toRubByRates(
        sourceBuyoutValue,
        sourceBuyoutCurrency,
        pricingRates.usdToRub,
        pricingRates.eurToRub,
        pricingRates.gbpToRub
      );
      if (
        sourceSupplierId === targetSupplierId
        && Math.abs(sourcePromoFactor - targetPromoFactor) <= 0.000001
        && sourcePromoMode === targetPromoOnlyNoDiscount
        && Math.abs(sourceBuyoutRub - targetBuyoutRub) <= 0.000001
        && sourceBuyoutCurrency === targetBuyoutCurrency
      ) {
        continue;
      }
      const timer = window.setTimeout(async () => {
        const result = await assignSourceSupplier(source.key, {
          supplier_id: targetSupplierId,
          promo_factor: targetPromoFactor,
          promo_only_no_discount: targetPromoOnlyNoDiscount,
          buyout_surcharge_value: targetBuyoutValue,
          buyout_surcharge_currency: targetBuyoutCurrency,
        });
        if (!result.ok) {
          pushToast(result.message);
        }
      }, 700);
      timers.push(timer);
    }
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [sources, sourcePricingDrafts, assignSourceSupplier, pricingRates.usdToRub, pricingRates.eurToRub, pricingRates.gbpToRub]);

  const newCategoryParentName = useMemo(() => {
    if (newCategoryParentId === null) {
      return "root";
    }
    return categoryOptions.find((item) => item.id === newCategoryParentId)?.name || "unknown";
  }, [categoryOptions, newCategoryParentId]);

  const pricingSuppliers = useMemo(() => {
    return (pricingSettings?.suppliers || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [pricingSettings]);

  const pricingFormulaHtml = useMemo(() => {
    if (!pricingSettings?.formula_latex) {
      return "";
    }
    return renderLatexBlock(pricingSettings.formula_latex);
  }, [pricingSettings?.formula_latex]);

  const pricingExample = useMemo(() => {
    if (products.length === 0) {
      return null;
    }
    const startIndex = Math.floor(pricingExampleStartSeed * products.length) % products.length;
    for (let offset = 0; offset < products.length; offset += 1) {
      const product = products[(startIndex + offset) % products.length];
      if (String(product.status || "").toLowerCase() !== "available") {
        continue;
      }
      const components = (product.pricing_components || {}) as Record<string, unknown>;
      const finalPrice = toFiniteNumber(product.final_price);
      const sourcePriceRub = toFiniteNumber(components.source_price_rub);
      const sourcePriceUsd = toFiniteNumber(components.source_price_usd);
      const sourcePriceEur = toFiniteNumber(components.source_price_eur);
      const sourcePriceRaw = toFiniteNumber(components.source_price) ?? toFiniteNumber(product.source_price) ?? toFiniteNumber(product.price);
      const sourceCurrency = normalizeCurrencyCode(
        String(components.source_currency || product.source_currency || product.currency || "USD"),
        "USD"
      );
      const bybitBase = toFiniteNumber(components.bybit_bucket_rate_rub) ?? toFiniteNumber(components.bybit_usdt_to_rub);
      const bybitExtra = toFiniteNumber(components.bybit_extra_rub);
      const bybitFx = toFiniteNumber(components.effective_usdt_to_rub);
      const buyoutSurchargeRub = toFiniteNumber(components.buyout_surcharge_rub);
      const buyoutRub = toFiniteNumber(components.buyout_rub);
      const paymentFeeRate = toFiniteNumber(components.payment_fee_rate);
      const paymentFeeRub = toFiniteNumber(components.payment_fee_rub);
      const insuranceRub = toFiniteNumber(components.insurance_rub);
      const customsRub = toFiniteNumber(components.customs_duty_rub);
      const spAfterPromoEur = toFiniteNumber(components.sp_after_promo_eur);
      const customsThresholdEur = toFiniteNumber(components.customs_threshold_eur);
      const customsDutyRate = toFiniteNumber(components.customs_duty_rate);
      const customsProcessingRate = toFiniteNumber(components.customs_processing_rate);
      const customsFixedRub = toFiniteNumber(components.customs_fixed_rub);
      const eurToUsdRate = toFiniteNumber(components.eur_to_usd_rate);
      const gbpToUsdRate = toFiniteNumber(components.gbp_to_usd_rate);
      const supplierTransportRub = toFiniteNumber(components.supplier_transport_rub);
      const serviceFeeRub = toFiniteNumber(components.service_fee_rub);
      const subtotalRub = toFiniteNumber(components.subtotal_rub);
      const subtotalAfterMarkupRub = toFiniteNumber(components.subtotal_after_markup_rub);
      const passThroughCostsRub = toFiniteNumber(components.pass_through_costs_rub);
      const taxRate = toFiniteNumber(components.tax_rate);
      const taxRub = toFiniteNumber(components.tax_rub);
      const shippingRuleLabel = String(components.shipping_rule_label || "");
      const promoFactor = toFiniteNumber(components.promo_factor);
      const markupMultiplier = toFiniteNumber(components.markup_multiplier);
      const markupRate = toFiniteNumber(components.markup_rate) ?? ((markupMultiplier ?? 1) - 1);
      const supplierName = String(components.supplier_name || "Default Supplier");
      if (
        finalPrice === null
        || sourcePriceRub === null
        || sourcePriceUsd === null
        || sourcePriceEur === null
        || sourcePriceRaw === null
        || bybitBase === null
        || bybitExtra === null
        || bybitFx === null
        || buyoutSurchargeRub === null
        || buyoutRub === null
        || paymentFeeRate === null
        || paymentFeeRub === null
        || insuranceRub === null
        || customsRub === null
        || spAfterPromoEur === null
        || customsThresholdEur === null
        || customsDutyRate === null
        || customsProcessingRate === null
        || customsFixedRub === null
        || eurToUsdRate === null
        || gbpToUsdRate === null
        || supplierTransportRub === null
        || serviceFeeRub === null
        || subtotalRub === null
        || subtotalAfterMarkupRub === null
        || taxRate === null
        || taxRub === null
        || promoFactor === null
        || markupMultiplier === null
      ) {
        continue;
      }

      const subtotalBeforeMarkup = subtotalRub;
      const subtotalAfterMarkup = subtotalAfterMarkupRub;
      const labelVar = (symbol: string) => symbol;
      const labelGroup = (symbol: string, value: number, digits = 4) => `${symbol}=${formatCompactNumber(value, digits)}`;
      const finalRoundingMode = normalizeFinalRoundingMode(
        String(components.final_rounding_mode || pricingSettings.final_rounding_mode || "unit"),
        "unit"
      );
      const roundingPrefix = finalRoundingMode === "none"
        ? ""
        : finalRoundingMode === "unit"
          ? "\\lceil"
          : `\\operatorname{ceil}_{${finalRoundingMode === "ten" ? "10" : finalRoundingMode === "hundred" ? "100" : "1000"}}(`;
      const roundingSuffix = finalRoundingMode === "none"
        ? ""
        : finalRoundingMode === "unit"
          ? "\\rceil"
          : ")";
      const exampleLatex =
        `${roundingPrefix}` +
        `\\underbrace{` +
        `\\underbrace{(` +
        `\\underbrace{${formatCompactNumber(sourcePriceUsd)}}_{${labelVar("SPU")}}` +
        `\\cdot(` +
        `\\underbrace{${formatCompactNumber(bybitBase, 4)}}_{${labelVar("BBR")}}+\\underbrace{${formatCompactNumber(bybitExtra, 4)}}_{${labelVar("BEX")}}` +
        `)` +
        `\\cdot\\underbrace{${formatCompactNumber(promoFactor, 4)}}_{${labelVar("PRM")}}` +
        `+\\underbrace{${formatCompactNumber(buyoutSurchargeRub)}}_{${labelVar("BSC")}}` +
        `)}_{${labelGroup("BUY", buyoutRub)}}` +
        `+\\underbrace{(` +
        `\\underbrace{${formatCompactNumber(buyoutRub)}}_{${labelVar("BUY")}}` +
        `\\cdot\\underbrace{${formatCompactNumber(paymentFeeRate, 4)}}_{${labelVar("PFRP")}}` +
        `)}_{${labelGroup("PFR", paymentFeeRub)}}` +
        `+\\underbrace{${formatCompactNumber(insuranceRub)}}_{${labelVar("INS")}}` +
        `+\\underbrace{(` +
        `(\\max(0,\\underbrace{${formatCompactNumber(spAfterPromoEur, 4)}}_{${labelVar("SPE")}}-\\underbrace{${formatCompactNumber(customsThresholdEur, 4)}}_{${labelVar("THR")}})` +
        `\\cdot\\underbrace{${formatCompactNumber(customsDutyRate, 4)}}_{${labelVar("DUT")}}` +
        `\\cdot(1+\\underbrace{${formatCompactNumber(customsProcessingRate, 4)}}_{${labelVar("CPR")}}))` +
        `\\cdot\\underbrace{${formatCompactNumber(eurToUsdRate, 4)}}_{${labelVar("E2U")}}` +
        `\\cdot(` +
        `\\underbrace{${formatCompactNumber(bybitBase, 4)}}_{${labelVar("BBR")}}+\\underbrace{${formatCompactNumber(bybitExtra, 4)}}_{${labelVar("BEX")}}` +
        `)` +
        `+\\underbrace{${formatCompactNumber(customsFixedRub)}}_{${labelVar("CFX")}}` +
        `)}_{${labelGroup("CDR", customsRub)}}` +
        `+\\underbrace{${formatCompactNumber(supplierTransportRub)}}_{SSR[\\text{${escapeLatexText(supplierName)}}][\\text{${escapeLatexText(shippingRuleLabel || "-")}}]}` +
        `}_{${labelGroup("SUB", subtotalBeforeMarkup)}}` +
        `\\quad\\Rightarrow\\quad` +
        `\\underbrace{(` +
        `\\underbrace{${formatCompactNumber(subtotalBeforeMarkup)}}_{${labelVar("SUB")}}` +
        `\\cdot(1+\\underbrace{${formatCompactNumber(markupRate, 4)}}_{${labelVar("MUP")}})` +
        `+\\underbrace{${formatCompactNumber(serviceFeeRub)}}_{${labelVar("SVC")}}` +
        `)}_{${labelGroup("SUBM", subtotalAfterMarkup)}}` +
        `+\\underbrace{(` +
        `\\underbrace{${formatCompactNumber(subtotalAfterMarkup)}}_{${labelVar("SUBM")}}` +
        `\\cdot\\underbrace{${formatCompactNumber(taxRate, 4)}}_{${labelVar("TXR")}}` +
        `)}_{${labelGroup("TAX", taxRub)}}` +
        `${roundingSuffix}`;
      const summarySpLatex = renderLatexInline("SP");
      const summaryFpLatex = renderLatexInline("FPR");
      const summaryRubLatex = renderLatexInline("SPR");
      const marginRub =
        toFiniteNumber(components.margin_rub)
        ?? ((subtotalAfterMarkupRub !== null && passThroughCostsRub !== null)
          ? subtotalAfterMarkupRub - passThroughCostsRub
          : Math.round(finalPrice) - sourcePriceRub);
      const usedKeys = new Set([
        "SP",
        "SPU",
        "SPE",
        "SPR",
        "BBR",
        "BEX",
        "BFX",
        "E2U",
        "G2U",
        "PRM",
        "BSC",
        "BUY",
        "PFRP",
        "PFR",
        "THR",
        "DUT",
        "CPR",
        "CFX",
        "CDR",
        "SSR",
        "SUP",
        "RNG",
        "INS",
        "SVC",
        "SUB",
        "SUBM",
        "TXR",
        "TAX",
        "MUP",
        "RND",
        "FPR",
      ]);
      const keyValues: Record<string, unknown> = {
        SP: sourcePriceRaw,
        SPU: sourcePriceUsd,
        SPE: sourcePriceEur,
        SPR: sourcePriceRub,
        BBR: bybitBase,
        BEX: bybitExtra,
        BFX: bybitFx,
        E2U: eurToUsdRate,
        G2U: gbpToUsdRate,
        PRM: promoFactor,
        BSC: buyoutSurchargeRub,
        BUY: buyoutRub,
        PFRP: toFiniteNumber(components.payment_fee_rate),
        PFR: paymentFeeRub,
        THR: customsThresholdEur,
        DUT: customsDutyRate,
        CPR: customsProcessingRate,
        CFX: customsFixedRub,
        CDR: customsRub,
        SSR: supplierTransportRub,
        SUP: supplierName,
        RNG: shippingRuleLabel || "-",
        INS: insuranceRub,
        SVC: serviceFeeRub,
        SUB: subtotalRub,
        SUBM: subtotalAfterMarkupRub,
        TXR: toFiniteNumber(components.tax_rate),
        TAX: taxRub,
        MUP: markupRate,
        RND: finalRoundingMode,
        FPR: finalPrice,
      };
      const legendDim: Record<string, boolean> = {};
      const isZeroOrEmpty = (value: unknown): boolean => {
        if (value === null || value === undefined) {
          return true;
        }
        if (typeof value === "number") {
          return Math.abs(value) <= 0.0000001;
        }
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (!trimmed) {
            return true;
          }
          const parsed = Number(trimmed);
          if (Number.isFinite(parsed)) {
            return Math.abs(parsed) <= 0.0000001;
          }
          return false;
        }
        return false;
      };
      for (const item of pricingSettings?.formula_legend || []) {
        const key = item.key;
        const used = usedKeys.has(key);
        const zero = isZeroOrEmpty(keyValues[key]);
        legendDim[key] = !used || zero;
      }
      return {
        productId: product.id,
        title: product.title,
        url: product.url,
        imageUrl: getProductPrimaryImageUrl(product) || "",
        finalPrice: Math.round(finalPrice),
        sourcePrice: sourcePriceRaw,
        sourcePriceRub,
        sourceCurrency,
        summarySpLatex,
        summaryFpLatex,
        summaryRubLatex,
        marginRub,
        legendDim,
        formulaHtml: renderLatexBlock(exampleLatex),
      };
    }
    return null;
  }, [products, pricingSettings, pricingExampleStartSeed]);

  const productVendors = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      if (product.vendor) {
        set.add(product.vendor);
      }
    }
    return [...set.values()].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const productTypes = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      if (product.product_type) {
        set.add(product.product_type);
      }
    }
    return [...set.values()].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchValue = productSearch.trim().toLowerCase();
      const searchText = [
        String(product.id),
        product.title,
        product.handle,
        product.vendor || "",
        product.product_type || "",
        product.url,
        product.status,
        product.currency,
        String(product.price ?? ""),
        String(product.source_price ?? ""),
        String(product.final_price ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !searchValue || searchText.includes(searchValue);

      const matchesSource = !productSourceFilter || String(product.source_id) === productSourceFilter;
      const matchesVendor = !productVendorFilter
        || (productVendorFilter === NO_BRAND_VALUE
          ? !product.vendor || !product.vendor.trim()
          : product.vendor === productVendorFilter);
      const matchesType = !productTypeFilter || product.product_type === productTypeFilter;
      const matchesStatus = !productStatusFilter || product.status === productStatusFilter;

      return matchesSearch && matchesSource && matchesVendor && matchesType && matchesStatus;
    });
  }, [products, productSearch, productSourceFilter, productVendorFilter, productTypeFilter, productStatusFilter]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      productSearch.trim() ||
      productSourceFilter ||
      productVendorFilter ||
      productTypeFilter ||
      productStatusFilter
    );
  }, [productSearch, productSourceFilter, productVendorFilter, productTypeFilter, productStatusFilter]);

  const buildFilterQuery = () => {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    if (productSearch.trim()) {
      params.set("search", productSearch.trim());
    }
    if (productSourceFilter) {
      params.set("source_id", productSourceFilter);
    }
    if (productVendorFilter) {
      params.set("vendor", productVendorFilter);
    }
    if (productTypeFilter) {
      params.set("product_type", productTypeFilter);
    }
    if (productStatusFilter) {
      params.set("status", productStatusFilter);
    }
    return params;
  };

  useEffect(() => {
    if (!hasActiveFilters) {
      setFilteredServerProducts([]);
      setFilteredServerTotal(0);
      setFilteredServerHasMore(false);
      setFilteredServerCursor(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const run = async () => {
      try {
        setLoadingFilteredServer(true);
        const params = buildFilterQuery();
        const res = await fetch(`${API_BASE}/admin/products?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Products API error: ${res.status}`);
        }
        const payload = (await res.json()) as { items: AdminListProduct[]; total: number; next_cursor?: string | null; has_more?: boolean };
        if (cancelled) {
          return;
        }
        const items = payload.items || [];
        setFilteredServerProducts(items);
        setFilteredServerTotal(payload.total || 0);
        setFilteredServerCursor(payload.next_cursor || null);
        setFilteredServerHasMore(Boolean(payload.has_more && payload.next_cursor));
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          return;
        }
        if (!cancelled) {
          pushToast(e instanceof Error ? e.message : "Ошибка фильтрации");
        }
      } finally {
        if (!cancelled) {
          setLoadingFilteredServer(false);
        }
      }
    };

    const timer = window.setTimeout(() => {
      void run();
    }, 280);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [hasActiveFilters, productSearch, productSourceFilter, productVendorFilter, productTypeFilter, productStatusFilter]);

  const loadMoreFilteredProducts = async () => {
    if (!filteredServerHasMore || loadingFilteredServer || !filteredServerCursor) {
      return;
    }
    try {
      setLoadingFilteredServer(true);
      const params = buildFilterQuery();
      params.set("cursor", filteredServerCursor);
      const res = await fetch(`${API_BASE}/admin/products?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Products API error: ${res.status}`);
      }
      const payload = (await res.json()) as { items: AdminListProduct[]; total: number; next_cursor?: string | null; has_more?: boolean };
      const nextItems = payload.items || [];
      setFilteredServerProducts((prev) => {
        const known = new Set(prev.map((item) => item.id));
        const toAdd = nextItems.filter((item) => !known.has(item.id));
        return [...prev, ...toAdd];
      });
      setFilteredServerTotal(payload.total || 0);
      setFilteredServerCursor(payload.next_cursor || null);
      setFilteredServerHasMore(Boolean(payload.has_more && payload.next_cursor));
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка догрузки");
    } finally {
      setLoadingFilteredServer(false);
    }
  };

  const displayedProducts = hasActiveFilters ? filteredServerProducts : filteredProducts;
  const displayedTotal = hasActiveFilters ? filteredServerTotal : productsTotal;
  const displayedHasMore = hasActiveFilters ? filteredServerHasMore : productsHasMore;
  const displayedLoadingMore = hasActiveFilters ? loadingFilteredServer : loadingMoreProducts;
  const displayedProductInternalCategoryNames = useMemo(() => {
    const out = new Map<number, string>();
    for (const product of displayedProducts) {
      out.set(product.id, inferInternalCategoryName(product));
    }
    return out;
  }, [displayedProducts, flattenedAdminCategories]);

  useEffect(() => {
    if (tab !== "products") {
      return;
    }
    const node = productsSentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        if (!displayedHasMore || displayedLoadingMore) {
          return;
        }
        if (hasActiveFilters) {
          void loadMoreFilteredProducts();
        } else {
          void loadMoreProducts();
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    tab,
    displayedHasMore,
    displayedLoadingMore,
    hasActiveFilters,
    loadMoreProducts,
    loadMoreFilteredProducts,
  ]);

  const sourceById = useMemo(() => {
    const map = new Map<number, (typeof sources)[number]>();
    for (const source of sources) {
      if (source.source_id !== null) {
        map.set(source.source_id, source);
      }
    }
    return map;
  }, [sources]);

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) {
      return "--.--.----, --:--:--";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const bybitWorkerInfo = useMemo(() => {
    if (!pricingSettings) {
      return {
        stateLabel: "Нет данных",
        stateClass: "status-pill status-pill--muted",
        intervalSec: 0,
        intervalLabel: "-",
        ageLabel: "-",
        errorMessage: null as string | null,
      };
    }
    const intervalSec = Math.max(30, Number(pricingSettings.bybit_worker_interval_sec || 1800));
    const intervalHours = intervalSec / 3600;
    const intervalLabel = Number.isInteger(intervalHours) && intervalHours >= 1
      ? `${intervalHours} ${intervalHours === 1 ? "час" : intervalHours < 5 ? "часа" : "часов"}`
      : `${Math.max(1, Math.round(intervalSec / 60))} мин`;
    const lastUpdatedRaw = pricingSettings.bybit_last_updated_at || null;
    const lastUpdatedDate = lastUpdatedRaw ? new Date(lastUpdatedRaw) : null;
    const staleAfterMs = intervalSec * 2 * 1000;

    let stateLabel = "Нет обновлений";
    let stateClass = "status-pill status-pill--muted";
    if (pricingSettings.bybit_last_error) {
      stateLabel = "Ошибка";
      stateClass = "status-pill status-pill--bad";
    } else if (lastUpdatedDate && !Number.isNaN(lastUpdatedDate.getTime()) && (nowTickMs - lastUpdatedDate.getTime()) <= staleAfterMs) {
      stateLabel = "Работает";
      stateClass = "status-pill status-pill--ok";
    } else {
      stateLabel = "Задержка";
      stateClass = "status-pill status-pill--warn";
    }

    const ageLabel = lastUpdatedDate && !Number.isNaN(lastUpdatedDate.getTime())
      ? `${Math.max(0, Math.floor((nowTickMs - lastUpdatedDate.getTime()) / 60000))} мин назад`
      : "-";

    return {
      stateLabel,
      stateClass,
      intervalSec,
      intervalLabel,
      ageLabel,
      errorMessage: pricingSettings.bybit_last_error || null,
    };
  }, [pricingSettings, nowTickMs]);

  const pricingBlockedByInitialBybit = useMemo(() => {
    if (!pricingSettings) {
      return false;
    }
    const hasSuccessfulRefresh = Boolean(pricingSettings.bybit_last_updated_at);
    const status = String(pricingSettings.bybit_rate_status || "").toLowerCase();
    const failedNow = status === "fallback_stored" || status === "unknown";
    return !hasSuccessfulRefresh && failedNow;
  }, [pricingSettings]);

  useEffect(() => {
    if (!pricingBlockedByInitialBybit) {
      pricingBlockedToastShownRef.current = false;
      return;
    }
    if (pricingBlockedToastShownRef.current) {
      return;
    }
    pricingBlockedToastShownRef.current = true;
    pushToast("Ценообразование временно недоступно: ждем первый успешный курс Bybit после запуска системы.");
  }, [pricingBlockedByInitialBybit, pushToast]);

  useEffect(() => {
    const message = (shippingRulesValidationError || "").trim();
    if (!message) {
      shippingValidationToastRef.current = null;
      return;
    }
    if (shippingValidationToastRef.current === message) {
      return;
    }
    shippingValidationToastRef.current = message;
    pushToast(message);
  }, [shippingRulesValidationError, pushToast]);

  useEffect(() => {
    const message = (svcRulesValidationError || "").trim();
    if (!message) {
      svcValidationToastRef.current = null;
      return;
    }
    if (svcValidationToastRef.current === message) {
      return;
    }
    svcValidationToastRef.current = message;
    pushToast(message);
  }, [svcRulesValidationError, pushToast]);

  const statusBadge = (status: string) => {
    if (status === "available") {
      return { label: "Доступен", cls: "status-pill status-pill--ok" };
    }
    if (status === "out_of_stock") {
      return { label: "Нет в наличии", cls: "status-pill status-pill--bad" };
    }
    return { label: "Скрыт", cls: "status-pill status-pill--muted" };
  };

  const resetProductForm = () => {
    for (const item of imagePreviews) {
      URL.revokeObjectURL(item.url);
    }
    setProductUrl("");
    setProductTitle("");
    setProductVendor("");
    setProductCategory("");
    setProductPrice("");
    setProductCurrency("USD");
    setImagePreviews([]);
    setZoomedImageUrl(null);
  };

  const closeProductModal = () => {
    resetProductForm();
    setOpenModal(false);
  };

  const addFiles = (files: File[]) => {
    if (files.length === 0) {
      return;
    }
    const newItems = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setImagePreviews((prev) => [...prev, ...newItems]);
  };

  const onDropImage = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = [...event.dataTransfer.files].filter((file) => file.type.startsWith("image/"));
    addFiles(files);
  };

  const onPickImage = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? [...event.target.files].filter((file) => file.type.startsWith("image/")) : [];
    addFiles(files);
    event.target.value = "";
  };

  const removePreviewImage = (index: number) => {
    setImagePreviews((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const uploadSelectedImages = async () => {
    let uploadedCount = 0;
    for (const item of imagePreviews) {
      const uploadResult = await uploadProductImage(item.file);
      if (!uploadResult.ok) {
        pushToast(uploadResult.message);
        return { ok: false, count: uploadedCount };
      }
      uploadedCount += 1;
    }
    return { ok: true, count: uploadedCount };
  };

  const onFetchPreview = async () => {
    if (!productUrl.trim()) {
      pushToast("Ссылка не указана");
      return;
    }

    const result = await previewProductByUrl(productUrl.trim());
    pushToast(result.message);
    if (result.ok && result.preview) {
      setProductTitle(result.preview.title || "");
      setProductVendor(result.preview.vendor || "");
      setProductCategory(result.preview.product_type || "");
      setProductPrice(result.preview.price !== null ? String(result.preview.price) : "");
      setProductCurrency((result.preview.currency || "USD").toUpperCase());
    }
  };

  const onSaveProduct = async () => {
    if (!productTitle.trim()) {
      pushToast("Введите название товара");
      return;
    }

    const parsedPrice = productPrice.trim() ? Number(productPrice) : null;
    if (parsedPrice !== null && Number.isNaN(parsedPrice)) {
      pushToast("Цена должна быть числом");
      return;
    }

    const uploaded = await uploadSelectedImages();
    if (!uploaded.ok) {
      return;
    }

    const currency = (productCurrency.trim() || "USD").toUpperCase();

    const result = productUrl.trim()
      ? await addProductByUrl(productUrl.trim(), {
          title: productTitle.trim(),
          vendor: productVendor.trim() || null,
          product_type: productCategory.trim() || null,
          price: parsedPrice,
          currency,
          image_count: uploaded.count,
        })
      : await createManualProduct({
          title: productTitle.trim(),
          price: parsedPrice,
          currency,
          product_type: productCategory.trim() || null,
          image_count: uploaded.count,
        });

    pushToast(result.message);
    if (result.ok) {
      closeProductModal();
    }
  };

  const onRunSync = async () => {
    const result = await runSync();
    if (!result.ok) {
      pushToast(result.message);
    }
  };

  const onCancelSync = async () => {
    if (!latestJob?.job_id) {
      return;
    }
    const result = await cancelSync(latestJob.job_id);
    pushToast(result.message);
  };

  const onStartCategoryCreate = (parentId: number | null) => {
    setSelectedCategoryId(null);
    setCreateFormOpen(true);
    setNewCategoryParentId(parentId);
    setNewCategoryName("");
    setNewCategoryKeywords("");
  };

  const onCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      pushToast("Введите название категории");
      return;
    }

    const result = await createCategory(newCategoryName.trim(), newCategoryParentId);
    pushToast(result.message);

    if (result.ok && result.categoryId) {
      const keywords = newCategoryKeywords
        .split(/[\n,;]/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

      for (const keyword of keywords) {
        const addResult = await addCategoryKeyword(result.categoryId, keyword);
        if (!addResult.ok) {
          pushToast(addResult.message);
          break;
        }
      }

      setCreateFormOpen(false);
      setNewCategoryParentId(null);
      setNewCategoryName("");
      setNewCategoryKeywords("");
    }
  };

  const onDeleteCategory = async () => {
    if (!selectedCategoryId) {
      return;
    }
    const result = await deleteCategory(selectedCategoryId);
    pushToast(result.message);
    if (result.ok) {
      setSelectedCategoryId(null);
      setRenameCategoryName("");
      setKeywordInput("");
      setTitleKeywordInput("");
    }
  };

  const onAddKeyword = async (scope: "local" | "title") => {
    if (!selectedCategoryId) {
      return;
    }
    const raw = scope === "title" ? titleKeywordInput.trim() : keywordInput.trim();
    if (!raw) {
      return;
    }
    if (!selectedCategory?.keywords_editable) {
      pushToast(selectedCategory?.keywords_locked_reason || "Для этой категории ключевые слова недоступны");
      return;
    }
    const result = await addCategoryKeyword(selectedCategoryId, raw, scope);
    if (result.ok) {
      if (scope === "title") {
        setTitleKeywordInput("");
      } else {
        setKeywordInput("");
      }
    } else {
      pushToast(result.message);
    }
  };

  const onRemoveKeyword = async (keyword: string, scope: "local" | "title") => {
    if (!selectedCategoryId) {
      return;
    }
    if (!selectedCategory?.keywords_editable) {
      pushToast(selectedCategory?.keywords_locked_reason || "Для этой категории ключевые слова недоступны");
      return;
    }
    const result = await removeCategoryKeyword(selectedCategoryId, keyword, scope);
    if (!result.ok) {
      pushToast(result.message);
    }
  };

  const onToggleCategoryEnabled = async (enabled: boolean) => {
    if (!selectedCategoryId) {
      return;
    }
    const result = await updateCategory(selectedCategoryId, { is_enabled: enabled });
    pushToast(result.ok ? (enabled ? "Категория включена" : "Категория выключена") : result.message);
  };

  const onToggleCategoryFavorite = async (isFavorite: boolean) => {
    if (!selectedCategoryId) {
      return;
    }
    const result = await updateCategory(selectedCategoryId, { is_favorite: isFavorite });
    pushToast(result.ok ? (isFavorite ? "Категория отмечена звездой" : "Звезда снята") : result.message);
  };

  const onAddManualProduct = async (productId: number) => {
    if (!selectedCategoryId || !selectedCategoryIsLeaf) {
      return;
    }
    const result = await addCategoryManualProduct(selectedCategoryId, productId);
    pushToast(result.message);
    if (!result.ok) {
      return;
    }
    setManualAssignedLoading(true);
    const [assigned, search] = await Promise.all([
      getCategoryManualProducts(selectedCategoryId),
      manualSearchInput.trim() ? searchCategoryManualProducts(selectedCategoryId, manualSearchInput.trim(), 3) : Promise.resolve({ ok: true, message: "OK", items: [] }),
    ]);
    if (assigned.ok) {
      setManualAssignedProducts(assigned.items);
    }
    if (search.ok) {
      setManualSearchResults(search.items);
    }
    setManualAssignedLoading(false);
  };

  const onRemoveManualProduct = async (productId: number) => {
    if (!selectedCategoryId || !selectedCategoryIsLeaf) {
      return;
    }
    const result = await removeCategoryManualProduct(selectedCategoryId, productId);
    pushToast(result.message);
    if (!result.ok) {
      return;
    }
    setManualAssignedLoading(true);
    const assigned = await getCategoryManualProducts(selectedCategoryId);
    if (assigned.ok) {
      setManualAssignedProducts(assigned.items);
    }
    setManualAssignedLoading(false);
  };

  const onCreateWeightRule = async () => {
    const parsed = Number(newWeightRuleGrams);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      pushToast("Вес должен быть положительным числом");
      return;
    }
    const result = await createWeightRule(Math.round(parsed));
    pushToast(result.message);
  };

  const onDeleteWeightRule = async (ruleId: number) => {
    const result = await deleteWeightRule(ruleId);
    pushToast(result.message);
  };

  const onAddWeightKeyword = async (ruleId: number) => {
    const raw = (weightKeywordInputs[ruleId] || "").trim();
    if (!raw) {
      return;
    }
    const result = await addWeightKeyword(ruleId, raw);
    if (result.ok) {
      setWeightKeywordInputs((prev) => ({ ...prev, [ruleId]: "" }));
    }
    pushToast(result.message);
  };

  const onRemoveWeightKeyword = async (ruleId: number, keyword: string) => {
    const result = await removeWeightKeyword(ruleId, keyword);
    pushToast(result.message);
  };

  const onMergePair = async (primaryId: number, duplicateId: number) => {
    const result = await mergeDedupPair(primaryId, duplicateId);
    pushToast(result.message);
  };

  const onRejectPair = async (leftId: number, rightId: number) => {
    const result = await rejectDedupPair(leftId, rightId);
    pushToast(result.message);
  };

  const onExportSettings = async () => {
    if (settingsExportInProgress) {
      return;
    }
    setSettingsExportInProgress(true);
    try {
      const result = await exportSettings();
      if (!result.ok || !result.payload) {
        pushToast(result.message);
        return;
      }
      const now = new Date();
      const stamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");
      const fileName = `settings-export-${stamp}.json`;
      const json = JSON.stringify(result.payload, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      pushToast("Файл настроек выгружен");
    } finally {
      setSettingsExportInProgress(false);
    }
  };

  const onOpenImportDialog = () => {
    if (settingsImportInProgress) {
      return;
    }
    settingsImportInputRef.current?.click();
  };

  const onImportSettingsFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setSettingsImportInProgress(true);
    try {
      const text = await file.text();
      let payload: SettingsTransferPayload;
      try {
        payload = JSON.parse(text) as SettingsTransferPayload;
      } catch {
        pushToast("Файл не похож на валидный JSON");
        return;
      }
      const result = await importSettings(payload);
      pushToast(result.message);
    } finally {
      setSettingsImportInProgress(false);
    }
  };

  const renderTree = (nodes: typeof adminCategories, depth = 0) => {
    return (
      <div className="cat-tree-column">
        {nodes.map((node) => {
          const hideChildrenInTree = !!node.is_designers_root;
          const canCreateChild = !node.is_designers_root && !node.is_in_designers_branch && !node.is_fallback;
          return (
            <div key={node.id} className="cat-tree-node" style={{ marginLeft: `${depth * 12}px` }}>
              <div className="cat-tree-item">
                <button
                  type="button"
                  className={selectedCategoryId === node.id ? "tab tab--active cat-tree-btn" : "tab cat-tree-btn"}
                  onClick={() => {
                    setCreateFormOpen(false);
                    setSelectedCategoryId(node.id);
                  }}
                >
                  <span>{node.name}</span>
                </button>
                {canCreateChild ? (
                  <button
                    type="button"
                    className="tree-plus"
                    title="Добавить дочернюю категорию"
                    onClick={() => onStartCategoryCreate(node.id)}
                  >
                    <IconPlus className="icon-svg icon-svg--sm" />
                  </button>
                ) : null}
                <span className="muted">
                  {!node.is_enabled ? "выключена" : node.is_system ? "системная" : node.keywords_editable ? `${node.keywords.length} ключей` : "ветка"} • {node.product_count} товаров
                </span>
              </div>
              {node.children.length > 0 && !hideChildrenInTree ? (
                <div className="cat-tree-children">{renderTree(node.children, depth + 1)}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="section admin">
      <div className="admin-head">
        <h1>Admin Panel</h1>
        <div className="actions">
          <button type="button" onClick={onRunSync} disabled={!canRunSync}>
            {isSyncInProgress ? "Синхронизация..." : "Синхронизировать товары"}
          </button>
          <button type="button" onClick={onCancelSync} disabled={!canCancelSync}>
            Отменить синхронизацию
          </button>
          <button type="button" onClick={() => setOpenModal(true)}>
            Добавить товар
          </button>
          <Link className="btn-link" to="/">
            Открыть витрину
          </Link>
        </div>
        {latestJob ? (
          <div className="sync-summary">
            {isSyncInProgress ? (
              <>
                <p className="muted">
                  Этап: {latestJob.current_stage || "discovery"} • Сайт: {latestJob.current_source_name || "-"} (
                  {latestJob.current_source_index || 0}/{latestJob.total_sources || 0})
                </p>
                <div className="sync-progress">
                  <div className="sync-progress__bar" style={{ width: `${Math.max(0, Math.min(100, latestJob.progress_percent || 0))}%` }} />
                </div>
                <p className="muted">
                  {Math.max(0, Math.min(100, latestJob.progress_percent || 0))}% • Сайты: {latestJob.processed_sources}/{latestJob.total_sources}
                </p>
              </>
            ) : (
              latestJob.status === "completed" ? (
                <p className="muted">
                  Синхронизация завершена! Дата последней синхронизиации: {formatDateTime(latestJob.completed_at)}
                </p>
              ) : (
                <p className="muted">
                  Последний запуск: {latestJob.status}. Дата: {formatDateTime(latestJob.completed_at || latestJob.started_at || latestJob.created_at)}
                </p>
              )
            )}
          </div>
        ) : null}
      </div>

      <div className="tabs">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            className={item.key === tab ? "tab tab--active" : "tab"}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "products" ? (
        <div className="card">
          <h2>
            {loading && displayedProducts.length === 0
              ? "Все товары"
              : hasActiveFilters && !productSourceFilter
              ? `Все товары (${displayedProducts.length}/${displayedTotal})`
              : `Все товары (${hasActiveFilters ? displayedTotal : productsTotal})`}
          </h2>
          <p className="muted">Подгрузка товаров выполняется автоматически при скролле вниз.</p>

          <div className="products-layout">
            <aside className="products-filters card">
              <h3>Фильтры</h3>
              <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Поиск" />
              <select value={productSourceFilter} onChange={(event) => setProductSourceFilter(event.target.value)}>
                <option value="">Все сайты</option>
                {sources
                  .filter((source) => source.source_id !== null)
                  .map((source) => (
                    <option key={source.key} value={String(source.source_id)}>
                      {source.name}
                    </option>
                  ))}
              </select>
              <select value={productVendorFilter} onChange={(event) => setProductVendorFilter(event.target.value)}>
                <option value="">Все бренды</option>
                <option value={NO_BRAND_VALUE}>Без бренда</option>
                {productVendors.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
              <select value={productTypeFilter} onChange={(event) => setProductTypeFilter(event.target.value)}>
                <option value="">Все локальные категории</option>
                {productTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select value={productStatusFilter} onChange={(event) => setProductStatusFilter(event.target.value)}>
                <option value="">Все статусы</option>
                <option value="available">Доступен</option>
                <option value="out_of_stock">Нет в наличии</option>
                <option value="hidden">Скрыт</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setProductSearch("");
                  setProductSourceFilter("");
                  setProductVendorFilter("");
                  setProductTypeFilter("");
                  setProductStatusFilter("");
                }}
              >
                Сбросить
              </button>
            </aside>

            <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Фото</th>
                    <th>Название</th>
                    <th>Сайт</th>
                    <th>Локальная категория</th>
                    <th>Категория</th>
                    <th>Статус</th>
                    <th>Оригинальная цена</th>
                    <th>Итоговая цена (RUB)</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedProducts.map((product) => {
                    const status = statusBadge(product.status);
                    const sourcePrice = product.source_price ?? product.price;
                    const sourceCurrency = product.source_currency ?? product.currency;
                    const finalPrice = product.final_price ?? (product.currency === "RUB" ? product.price : null);
                    const finalCurrency = product.final_currency ?? (product.currency === "RUB" ? "RUB" : null);
                    const source = sourceById.get(product.source_id);
                    return (
                      <tr key={product.id}>
                        <td>
                          <ImageWithFallback
                            src={getProductPrimaryImageUrl(product)}
                            alt={product.title}
                            className="thumb-mini-image"
                            placeholderClassName="thumb-mini"
                            placeholderText={product.image_count > 0 ? `${product.image_count} фото` : "Нет фото"}
                            loadingText={product.image_count > 0 ? "Загружаем..." : "Нет фото"}
                          />
                        </td>
                        <td>
                          <Link className="btn-link" to={`/product/${product.id}`}>
                            {product.title}
                          </Link>
                        </td>
                        <td>
                          {source?.base_url ? (
                            <a className="btn-link" href={source.base_url} target="_blank" rel="noreferrer">
                              {source?.name || source.base_url}
                            </a>
                          ) : (
                            source?.name || `#${product.source_id}`
                          )}
                        </td>
                        <td>{product.product_type || "-"}</td>
                        <td>{displayedProductInternalCategoryNames.get(product.id) || "Прочее"}</td>
                        <td>
                          <span className={status.cls}>{status.label}</span>
                        </td>
                        <td>
                          {sourcePrice ?? "-"} {sourceCurrency ?? "-"}
                        </td>
                        <td>{finalPrice === null ? "-" : `${Math.round(finalPrice)} ${finalCurrency || "RUB"}`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {loading && displayedProducts.length === 0 ? <AdminTableSkeleton rows={8} cols={8} /> : null}
              {!loading && displayedProducts.length === 0 ? <p className="muted">По текущим фильтрам товаров нет</p> : null}
              {displayedLoadingMore ? <AdminTableSkeleton rows={3} cols={8} /> : null}
              <div ref={productsSentinelRef} style={{ height: "1px" }} />
            </div>
          </div>
        </div>
      ) : null}

      {tab === "dedup" ? (
        <div className="card">
          <h2>Дедубликация</h2>
          <p className="muted">{loadingDedupCandidates ? "Кандидатов: ..." : `Кандидатов: ${dedupCandidates.length}`}</p>
          <div className="dedup-list">
            {dedupCandidates.map((candidate) => (
              <div key={candidate.pair_key} className="dedup-item">
                <div className="dedup-head">
                  <strong>score: {candidate.score.toFixed(2)}</strong>
                  <span className="muted">{candidate.reasons.join(", ") || "heuristic_match"}</span>
                </div>

                <div className="dedup-grid">
                  <div className="dedup-col">
                    <strong>{candidate.left.title}</strong>
                    <p className="muted">{candidate.left.vendor || "-"}</p>
                    <p className="muted">
                      {candidate.left.price ?? "-"} {candidate.left.currency}
                    </p>
                    <a className="btn-link" href={candidate.left.url} target="_blank" rel="noreferrer">
                      Открыть источник
                    </a>
                    <button type="button" onClick={() => void onMergePair(candidate.left.id, candidate.right.id)}>
                      Merge: оставить левый
                    </button>
                  </div>

                  <div className="dedup-col">
                    <strong>{candidate.right.title}</strong>
                    <p className="muted">{candidate.right.vendor || "-"}</p>
                    <p className="muted">
                      {candidate.right.price ?? "-"} {candidate.right.currency}
                    </p>
                    <a className="btn-link" href={candidate.right.url} target="_blank" rel="noreferrer">
                      Открыть источник
                    </a>
                    <button type="button" onClick={() => void onMergePair(candidate.right.id, candidate.left.id)}>
                      Merge: оставить правый
                    </button>
                  </div>
                </div>

                <div className="actions">
                  <button type="button" onClick={() => void onRejectPair(candidate.left.id, candidate.right.id)}>
                    Не дубль
                  </button>
                </div>
              </div>
            ))}
            {loadingDedupCandidates ? <AdminSectionSkeleton rows={4} /> : null}
            {!loadingDedupCandidates && dedupCandidates.length === 0 ? <p className="muted">Кандидатов нет</p> : null}
          </div>
        </div>
      ) : null}

      {tab === "categories" ? (
        <div className="card">
          <h2>Категории</h2>
          {loadingCategoriesTree ? <AdminSectionSkeleton rows={6} /> : null}
          {!loadingCategoriesTree && loadingCategoryCounts ? <AdminSectionSkeleton rows={3} /> : null}
          <div className="categories-layout">
            <div>
              <div className="actions" style={{ marginBottom: "0.5rem" }}>
                <button type="button" className="tree-plus" onClick={() => onStartCategoryCreate(null)}>
                  <IconPlus className="icon-svg icon-svg--sm" /> root
                </button>
              </div>
              <div className="cat-tree-wrap">{renderTree(adminCategories)}</div>
            </div>

            <div className="card">
              {createFormOpen ? (
                <div className="form">
                  <h3>Создание категории</h3>
                  {newCategoryParentId !== null ? <p className="muted">Родитель: {newCategoryParentName}</p> : null}
                  <input
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    placeholder="Название"
                  />
                  <textarea
                    value={newCategoryKeywords}
                    onChange={(event) => setNewCategoryKeywords(event.target.value)}
                    placeholder="Ключевые слова (через запятую или с новой строки, опционально)"
                  />
                  <div className="actions">
                    <button type="button" onClick={onCreateCategory}>
                      Создать
                    </button>
                    <button type="button" onClick={() => setCreateFormOpen(false)}>
                      Отмена
                    </button>
                  </div>
                </div>
              ) : null}

              {!createFormOpen && selectedCategory ? (
                <>
                  <h3>Редактирование: {selectedCategory.name}</h3>
                  <div className="form">
                    <input
                      value={renameCategoryName}
                      onChange={(event) => setRenameCategoryName(event.target.value)}
                      placeholder="Название категории"
                      disabled={selectedCategory.is_system}
                    />
                    <label className="ui-switch">
                      <input
                        type="checkbox"
                        checked={selectedCategory.is_enabled}
                        onChange={(event) => void onToggleCategoryEnabled(event.target.checked)}
                      />
                      <span className="ui-switch-track">
                        <span className="ui-switch-thumb" />
                      </span>
                      <span className="ui-switch-text">{selectedCategory.is_enabled ? "Вкл" : "Выкл"}</span>
                    </label>
                    {!selectedCategory.is_system ? (
                      <label className="ui-switch">
                        <input
                          type="checkbox"
                          checked={selectedCategory.is_favorite}
                          onChange={(event) => void onToggleCategoryFavorite(event.target.checked)}
                        />
                        <span className="ui-switch-track">
                          <span className="ui-switch-thumb" />
                        </span>
                        <span className="ui-switch-text">{selectedCategory.is_favorite ? "Звездная" : "Обычная"}</span>
                      </label>
                    ) : null}
                    <button type="button" onClick={onDeleteCategory} disabled={selectedCategory.is_system}>
                      Удалить
                    </button>
                    {selectedCategory.is_system ? (
                      <p className="muted">Данная категория системная, ее нельзя удалить.</p>
                    ) : null}
                  </div>

                  {selectedCategory.is_designers_root ? (
                    <>
                      <p className="muted">Список дизайнеров синхронизируется автоматически из брендов товаров.</p>
                      <div className="chip-list">
                        {[...selectedCategory.children]
                          .sort((left, right) => left.name.localeCompare(right.name, "ru"))
                          .map((child) => (
                          <span key={child.id} className="tag tag--muted">
                            {child.name}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : !selectedCategory.is_system ? (
                    <>
                      <p className="muted">
                        Ключевые слова по локальным категориям{" "}
                        <HelpHint text="Срабатывают по бренду и типу товара. Товар может попасть сразу в несколько категорий." />
                      </p>
                      <div className="chip-list">
                        {selectedCategory.keywords.map((keyword) => (
                          <span
                            key={keyword}
                            className={selectedCategory.keywords_editable ? "tag tag--with-action" : "tag tag--muted"}
                          >
                            <span>{keyword}</span>
                            {selectedCategory.keywords_editable ? (
                              <button type="button" className="tag-x" onClick={() => void onRemoveKeyword(keyword, "local")}>
                                <IconClose className="icon-svg icon-svg--sm" />
                              </button>
                            ) : null}
                          </span>
                        ))}
                      </div>
                      <div className="form">
                        <input
                          value={keywordInput}
                          onChange={(event) => setKeywordInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              void onAddKeyword("local");
                            }
                          }}
                          placeholder="Введите ключ и нажмите Enter"
                          disabled={!selectedCategory.keywords_editable}
                        />
                        <button type="button" onClick={() => void onAddKeyword("local")} disabled={!selectedCategory.keywords_editable}>
                          Добавить ключ
                        </button>
                      </div>
                      <p className="muted">
                        Ключевые слова по названию товара{" "}
                        <HelpHint text="Срабатывают только по title товара. Удобно для точных слов, которые не должны матчиться по бренду или URL." />
                      </p>
                      <div className="chip-list">
                        {selectedCategory.title_keywords.map((keyword) => (
                          <span
                            key={keyword}
                            className={selectedCategory.keywords_editable ? "tag tag--with-action" : "tag tag--muted"}
                          >
                            <span>{keyword}</span>
                            {selectedCategory.keywords_editable ? (
                              <button type="button" className="tag-x" onClick={() => void onRemoveKeyword(keyword, "title")}>
                                <IconClose className="icon-svg icon-svg--sm" />
                              </button>
                            ) : null}
                          </span>
                        ))}
                      </div>
                      <div className="form">
                        <input
                          value={titleKeywordInput}
                          onChange={(event) => setTitleKeywordInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              void onAddKeyword("title");
                            }
                          }}
                          placeholder="Введите ключ из названия товара и нажмите Enter"
                          disabled={!selectedCategory.keywords_editable}
                        />
                        <button type="button" onClick={() => void onAddKeyword("title")} disabled={!selectedCategory.keywords_editable}>
                          Добавить ключ
                        </button>
                      </div>
                      {selectedCategoryIsLeaf ? (
                        <>
                          <p className="muted">Ручное добавление товаров в категорию</p>
                          <div className="form">
                            <input
                              value={manualSearchInput}
                              onChange={(event) => setManualSearchInput(event.target.value)}
                              placeholder="Поиск"
                              disabled={!selectedCategory.keywords_editable}
                            />
                          </div>
                          {manualSearchLoading ? <AdminSectionSkeleton rows={2} /> : null}
                          {!manualSearchLoading && manualSearchInput.trim() && manualSearchResults.length === 0 ? (
                            <p className="muted">Ничего не найдено</p>
                          ) : null}
                          {manualSearchResults.map((item) => {
                            const categoryLabel = item.category_names.length > 0 ? item.category_names.join(", ") : "Прочее";
                            return (
                              <div key={`manual-search-${item.product_id}`} className="manual-product-row">
                                <div className="manual-product-media">
                                  {item.image_url ? <img src={item.image_url} alt={item.title} loading="lazy" /> : <span className="muted">Нет фото</span>}
                                </div>
                                <div className="manual-product-main">
                                  <a href={`/product/${item.product_id}`} target="_blank" rel="noreferrer">
                                    {item.title}
                                  </a>
                                  <p className="muted">
                                    <a href={item.url} target="_blank" rel="noreferrer">
                                      {item.source_name || `Source #${item.source_id}`}
                                    </a>
                                  </p>
                                  <p className="muted">{categoryLabel}</p>
                                </div>
                                <button type="button" onClick={() => void onAddManualProduct(item.product_id)}>
                                  <IconPlus className="icon-svg icon-svg--sm" />
                                </button>
                              </div>
                            );
                          })}

                          <p className="muted">Добавленные товары</p>
                          {manualAssignedLoading ? <AdminSectionSkeleton rows={2} /> : null}
                          {!manualAssignedLoading && manualAssignedProducts.length === 0 ? <p className="muted">Пока пусто</p> : null}
                          {manualAssignedProducts.map((item) => {
                            const categoryLabel = item.category_names.length > 0 ? item.category_names.join(", ") : "Прочее";
                            return (
                              <div key={`manual-added-${item.product_id}`} className="manual-product-row">
                                <div className="manual-product-media">
                                  {item.image_url ? <img src={item.image_url} alt={item.title} loading="lazy" /> : <span className="muted">Нет фото</span>}
                                </div>
                                <div className="manual-product-main">
                                  <a href={`/product/${item.product_id}`} target="_blank" rel="noreferrer">
                                    {item.title}
                                  </a>
                                  <p className="muted">
                                    <a href={item.url} target="_blank" rel="noreferrer">
                                      {item.source_name || `Source #${item.source_id}`}
                                    </a>
                                  </p>
                                  <p className="muted">{categoryLabel}</p>
                                </div>
                                <button type="button" onClick={() => void onRemoveManualProduct(item.product_id)}>
                                  Удалить
                                </button>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <p className="muted">Ручное добавление доступно только для конечных категорий.</p>
                      )}
                      {!selectedCategory.keywords_editable && selectedCategory.keywords_locked_reason ? (
                        <p className="muted">{selectedCategory.keywords_locked_reason}</p>
                      ) : null}
                    </>
                  ) : null}
                </>
              ) : (
                <p className="muted">Выбери категорию в дереве слева, чтобы редактировать название и ключи.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "sources" ? (
        <div className="card">
          <h2>Источники ({sources.length})</h2>
          {loading ? <AdminSectionSkeleton rows={5} /> : null}
          <div className="list">
            {sources.map((source) => (
              <div key={source.key} className="list-row">
                <div>
                  <strong>
                    {source.name}
                    {source.status_label ? ` · ${source.status_label}` : ""}
                  </strong>
                  <p className="muted">{source.base_url}</p>
                  <p className="muted">
                    Товаров: {source.products_count} • Категорий: {source.categories_count}
                  </p>
                </div>
                <label className="switch-wrap">
                  <input
                    type="checkbox"
                    checked={source.enabled}
                    onChange={(event) => {
                      void (async () => {
                        const result = await toggleSourceEnabled(source.key, event.target.checked);
                        pushToast(result.message);
                      })();
                    }}
                  />
                  <span>{source.enabled ? "Включен" : "Выключен"}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "pricing" ? (
        <div className="card">
          <h2>Настройки ценообразования</h2>
          {(pricingTabLoading && !pricingSettings) ? (
            <AdminSectionSkeleton rows={8} />
          ) : !pricingSettings ? (
            <AdminSectionSkeleton rows={8} />
          ) : pricingBlockedByInitialBybit ? (
            <AdminSectionSkeleton rows={3} />
          ) : (
            <>
              <div className="pricing-worker-box">
                <h3 className="with-help">
                  Состояние воркера Bybit
                  <HelpHint text="Здесь видно, как работает фоновый процесс обновления курса Bybit, и можно быстро проверить расчет для нужной суммы." />
                </h3>
                <div className="pricing-worker-grid">
                  <div className="pricing-worker-item">
                    <span className="muted">Состояние</span>
                    {bybitWorkerInfo.errorMessage ? (
                      <div className="pricing-worker-error-wrap">
                        <button
                          type="button"
                          className={bybitWorkerInfo.stateClass}
                          onClick={() => setShowBybitErrorPopup((prev) => !prev)}
                        >
                          {bybitWorkerInfo.stateLabel}
                        </button>
                        {showBybitErrorPopup ? (
                          <div className="pricing-worker-error-popup">
                            <strong>Лог ошибки</strong>
                            <pre>{bybitWorkerInfo.errorMessage}</pre>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <span className={bybitWorkerInfo.stateClass}>{bybitWorkerInfo.stateLabel}</span>
                    )}
                  </div>
                  <div className="pricing-worker-item">
                    <span className="muted">Интервал</span>
                    <strong>{bybitWorkerInfo.intervalLabel}</strong>
                  </div>
                  <div className="pricing-worker-item">
                    <span className="muted">Последнее обновление</span>
                    <strong>{formatDateTime(pricingSettings.bybit_last_updated_at)}</strong>
                    <span className="muted">{bybitWorkerInfo.ageLabel}</span>
                  </div>
                  <div className="pricing-worker-item">
                    <span className="muted">Выбранный курс</span>
                    <strong>{formatCompactNumber(pricingSettings.bybit_usdt_to_rub, 4)} RUB/USDT</strong>
                    <span className="muted">
                      BFX: {formatCompactNumber(pricingSettings.bybit_usdt_to_rub + pricingSettings.bybit_extra_rub, 4)} RUB/USDT
                    </span>
                  </div>
                </div>

              </div>

              <div className="pricing-formula-box">
                <h3 className="with-help">
                  Формула финальной цены
                  <HelpHint text="Это единая формула, по которой система считает цену для витрины. Она одинаковая для всех магазинов." />
                </h3>
                <div className="pricing-formula-text pricing-formula-latex pricing-main-formula" dangerouslySetInnerHTML={{ __html: pricingFormulaHtml }} />
                {pricingExample ? (
                  <div className="pricing-example-box">
                    <p className="with-help">
                      <strong>Пример на товаре:</strong>
                      <HelpHint text="Это реальный товар из базы. Пример показывает, как числа подставляются в формулу." />
                    </p>
                    <div className="pricing-example-head">
                      {pricingExample.imageUrl ? (
                        <a href={pricingExample.url} target="_blank" rel="noreferrer" className="pricing-example-thumb-link">
                          <img src={pricingExample.imageUrl} alt={pricingExample.title} className="pricing-example-thumb" />
                        </a>
                      ) : null}
                      <a className="btn-link pricing-example-title-link" href={pricingExample.url} target="_blank" rel="noreferrer">
                        {pricingExample.title}
                      </a>
                    </div>
                    <div className="pricing-formula-text pricing-formula-latex pricing-example-formula" dangerouslySetInnerHTML={{ __html: pricingExample.formulaHtml }} />
                    <div className="pricing-example-summary">
                      <div className="pricing-example-metric">
                        <div className="pricing-example-metric-key" dangerouslySetInnerHTML={{ __html: pricingExample.summarySpLatex }} />
                        <div className="pricing-example-metric-value">{formatDisplayMoney(pricingExample.sourcePrice, pricingExample.sourceCurrency)}</div>
                      </div>
                      <div className="pricing-example-metric">
                        <div className="pricing-example-metric-key" dangerouslySetInnerHTML={{ __html: pricingExample.summaryRubLatex }} />
                        <div className="pricing-example-metric-value">{formatDisplayMoney(pricingExample.sourcePriceRub, "RUB")}</div>
                      </div>
                      <div className="pricing-example-metric">
                        <div className="pricing-example-metric-key" dangerouslySetInnerHTML={{ __html: pricingExample.summaryFpLatex }} />
                        <div className="pricing-example-metric-value">{formatDisplayMoney(pricingExample.finalPrice, "RUB")}</div>
                      </div>
                      <div className="pricing-example-metric">
                        <div className="pricing-example-metric-key">Моржа</div>
                        <div className="pricing-example-metric-value">{formatDisplayMoney(pricingExample.marginRub, "RUB")}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="muted">Пока нет товара с полностью рассчитанной ценой для примера.</p>
                )}
                <div className="pricing-formula-legend pricing-legend-grid">
                  {pricingSettings.formula_legend.map((item) => (
                    <div key={item.key} className="pricing-legend-item">
                      <p
                        className={pricingExample?.legendDim?.[item.key] ? "pricing-legend-key pricing-legend-key--dim" : "pricing-legend-key"}
                        dangerouslySetInnerHTML={{ __html: renderLegendSymbol(item.key) }}
                      />
                      <p className="muted">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pricing-settings-grid">
                <label className="pricing-settings-field">
                  <span className="muted with-help">
                    <span className="pricing-field-label">
                      <span dangerouslySetInnerHTML={{ __html: renderLatexInline("MUP") }} />
                      <span>Наценка</span>
                    </span>
                    <HelpHint text="Отдельная наценка к SUB. Пример: 0.25 означает +25%, применяется как (1 + MUP)." />
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={markupRateDraft}
                    onChange={(event) => setMarkupRateDraft(event.target.value)}
                  />
                </label>
                {pricingFieldMeta.map((field) => (
                  <label key={field.key} className="pricing-settings-field">
                    <span className="muted with-help">
                      <span className="pricing-field-label">
                        <span dangerouslySetInnerHTML={{ __html: renderLatexInline(field.symbolLatex) }} />
                        <span>{field.label}</span>
                      </span>
                      <HelpHint text={field.hint} />
                    </span>
                    <input
                      type="number"
                      step={field.step || "0.01"}
                      value={pricingDrafts[field.key] ?? String(pricingSettings[field.key])}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setPricingDrafts((prev) => ({ ...prev, [field.key]: nextValue }));
                      }}
                    />
                  </label>
                ))}
                <label className="pricing-settings-field">
                  <span className="muted with-help">
                    <span className="pricing-field-label">
                      <span dangerouslySetInnerHTML={{ __html: renderLatexInline("RND") }} />
                      <span>Округление FPR</span>
                    </span>
                    <HelpHint text="Управляет финальным округлением цены. Применяется вместо старого жесткого ceil в формуле." />
                  </span>
                  <select
                    value={finalRoundingModeDraft}
                    onChange={(event) => setFinalRoundingModeDraft(normalizeFinalRoundingMode(event.target.value, "unit"))}
                  >
                    {finalRoundingOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <h3 className="with-help">
                Порог пошлины THR
                <HelpHint text="Укажи порог и валюту. Можно менять сумму в RUB, USD, EUR или GBP: остальные поля пересчитаются автоматически." />
              </h3>
              <div className="pricing-threshold-grid">
                <label className="pricing-settings-field">
                  <span className="muted">THR (RUB)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={thresholdDraft?.rub || "0"}
                    onChange={(event) => setThresholdField("rub", event.target.value)}
                  />
                </label>
                <label className="pricing-settings-field">
                  <span className="muted">THR (USD)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={thresholdDraft?.usd || "0"}
                    onChange={(event) => setThresholdField("usd", event.target.value)}
                  />
                </label>
                <label className="pricing-settings-field">
                  <span className="muted">THR (EUR)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={thresholdDraft?.eur || "0"}
                    onChange={(event) => setThresholdField("eur", event.target.value)}
                  />
                </label>
                <label className="pricing-settings-field">
                  <span className="muted">THR (GBP)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={thresholdDraft?.gbp || "0"}
                    onChange={(event) => setThresholdField("gbp", event.target.value)}
                  />
                </label>
              </div>

              <h3 className="with-help">
                SSR по диапазонам веса
                <HelpHint text="Тарифы доставки задаются диапазонами веса (кг). Для каждого диапазона укажи сумму в RUB. Диапазоны внутри одного тарифа не должны пересекаться." />
              </h3>
              <div className="pricing-svc-list">
                <div className="pricing-svc-head">
                  <span>Тариф</span>
                  <span>От, кг</span>
                  <span>До, кг</span>
                  <span>Цена, RUB</span>
                  <span></span>
                </div>
                {shippingGroupOrder.map((group) => {
                  const rows = shippingRuleDrafts.filter((item) => item.region === group.region && item.mode === group.mode);
                  return (
                    <div key={`ship-group-${group.region}-${group.mode}`}>
                      {rows.map((rule) => {
                        const rowError = shippingRuleFieldErrors[rule.id] ?? { min: false, max: false, rub: false };
                        return (
                          <div key={rule.id} className="pricing-svc-row">
                            <span className="muted">{group.label}</span>
                            <input
                              className={rowError.min ? "input-error" : undefined}
                              type="number"
                              min="0"
                              step="0.001"
                              value={rule.min_kg}
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                setShippingRuleDrafts((prev) => prev.map((item) => (item.id === rule.id ? { ...item, min_kg: nextValue } : item)));
                              }}
                            />
                            <input
                              className={rowError.max ? "input-error" : undefined}
                              type="number"
                              min="0"
                              step="0.001"
                              placeholder=""
                              value={rule.max_kg}
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                setShippingRuleDrafts((prev) => prev.map((item) => (item.id === rule.id ? { ...item, max_kg: nextValue } : item)));
                              }}
                            />
                            <input
                              className={rowError.rub ? "input-error" : undefined}
                              type="number"
                              min="0"
                              step="0.01"
                              value={rule.rub}
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                setShippingRuleDrafts((prev) => prev.map((item) => (item.id === rule.id ? { ...item, rub: nextValue } : item)));
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setShippingRuleDrafts((prev) => prev.filter((item) => item.id !== rule.id));
                              }}
                            >
                              Удалить
                            </button>
                          </div>
                        );
                      })}
                      <div className="pricing-svc-actions">
                        <button type="button" onClick={() => onAddShippingRule(group.region, group.mode)}>
                          Добавить диапазон: {group.label}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <h3 className="with-help">
                Надбавка SVC
                <HelpHint text="SVC — это ваша надбавка по диапазонам BUY. Диапазоны не должны пересекаться и касаться границ друг друга." />
              </h3>
              <div className="pricing-svc-list">
                <div className="pricing-svc-head">
                  <span>Начало BUY (RUB)</span>
                  <span>Конец BUY (RUB)</span>
                  <span>Режим</span>
                  <span>Значение</span>
                  <span></span>
                </div>
                {svcRuleDrafts.map((rule) => {
                  const rowError = svcRuleFieldErrors[rule.id] ?? { min: false, max: false, value: false };
                  return (
                    <div key={rule.id} className="pricing-svc-row">
                      <input
                        className={rowError.min ? "input-error" : undefined}
                        type="number"
                        min="0"
                        step="0.01"
                        value={rule.min_rub}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setSvcRuleDrafts((prev) => prev.map((item) => (item.id === rule.id ? { ...item, min_rub: nextValue } : item)));
                        }}
                      />
                      <input
                        className={rowError.max ? "input-error" : undefined}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder=""
                        value={rule.max_rub}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setSvcRuleDrafts((prev) => prev.map((item) => (item.id === rule.id ? { ...item, max_rub: nextValue } : item)));
                        }}
                      />
                      <select
                        value={rule.mode}
                        onChange={(event) => {
                          const nextMode = event.target.value === "percent" ? "percent" : "fixed_rub";
                          setSvcRuleDrafts((prev) => prev.map((item) => (item.id === rule.id ? { ...item, mode: nextMode } : item)));
                        }}
                      >
                        <option value="fixed_rub">Ручная сумма (RUB)</option>
                        <option value="percent">Процент от BUY</option>
                      </select>
                      <input
                        className={rowError.value ? "input-error" : undefined}
                        type="number"
                        min="0"
                        step={rule.mode === "percent" ? "0.0001" : "0.01"}
                        value={rule.value}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setSvcRuleDrafts((prev) => prev.map((item) => (item.id === rule.id ? { ...item, value: nextValue } : item)));
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSvcRuleDrafts((prev) => prev.filter((item) => item.id !== rule.id));
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  );
                })}
                <div className="pricing-svc-actions">
                  <button type="button" onClick={onAddSvcRule}>
                    Добавить надбавку
                  </button>
                </div>
              </div>

              <h3 className="with-help">
                Настройки по источникам
                <HelpHint text="Для каждого магазина отдельно задаются поставщик, доплата к выкупу и параметры промокода." />
              </h3>
              <div className="pricing-source-map-list">
                <div className="pricing-source-map-head">
                  <span>Источник</span>
                  <span>Поставщик</span>
                  <span>Выкуп + (USD)</span>
                  <span>Выкуп + (EUR)</span>
                  <span>Выкуп + (GBP)</span>
                  <span>PROMO (%)</span>
                  <span>Промокод</span>
                </div>
                {sources.map((source) => {
                  const draft = sourcePricingDrafts[source.key];
                  return (
                    <div key={source.key} className="pricing-source-map-row">
                      <span className="muted">{source.name}</span>
                      <select
                        value={draft?.supplierId ?? String(source.supplier_id ?? "")}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setSourcePricingDrafts((prev) => ({
                            ...prev,
                            [source.key]: {
                              ...(prev[source.key] || {
                                supplierId: "",
                                promoPercent: "0",
                                promoOnlyNoDiscount: false,
                                buyout: { currency: "USD", rub: "0", usd: "0", eur: "0", gbp: "0" },
                              }),
                              supplierId: nextValue,
                            },
                          }));
                        }}
                      >
                        {pricingSuppliers.map((supplier) => (
                          <option key={`source-${source.key}-supplier-${supplier.id}`} value={supplier.id}>
                            {supplier.name} ({formatSupplierCategory(supplier.category)})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={draft?.buyout.usd ?? "0"}
                        onChange={(event) => setSourceBuyoutField(source.key, "usd", event.target.value)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={draft?.buyout.eur ?? "0"}
                        onChange={(event) => setSourceBuyoutField(source.key, "eur", event.target.value)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={draft?.buyout.gbp ?? "0"}
                        onChange={(event) => setSourceBuyoutField(source.key, "gbp", event.target.value)}
                      />
                      <div className="percent-input-wrap">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={draft?.promoPercent ?? formatCompactNumber(Math.max(0, Math.min(100, (1 - Number(source.promo_factor ?? 1)) * 100)), 4)}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setSourcePricingDrafts((prev) => ({
                              ...prev,
                              [source.key]: {
                                ...(prev[source.key] || {
                                  supplierId: String(source.supplier_id ?? ""),
                                  promoPercent: "0",
                                  promoOnlyNoDiscount: false,
                                  buyout: { currency: "USD", rub: "0", usd: "0", eur: "0", gbp: "0" },
                                }),
                                promoPercent: nextValue,
                              },
                            }));
                          }}
                        />
                        <span className="percent-input-sign">%</span>
                      </div>
                      <label className="switch-wrap">
                        <input
                          type="checkbox"
                          checked={draft?.promoOnlyNoDiscount ?? Boolean(source.promo_only_no_discount)}
                          onChange={(event) => {
                            const nextValue = event.target.checked;
                            setSourcePricingDrafts((prev) => ({
                              ...prev,
                              [source.key]: {
                                ...(prev[source.key] || {
                                  supplierId: String(source.supplier_id ?? ""),
                                  promoPercent: "0",
                                  promoOnlyNoDiscount: false,
                                  buyout: { currency: "USD", rub: "0", usd: "0", eur: "0", gbp: "0" },
                                }),
                                promoOnlyNoDiscount: nextValue,
                              },
                            }));
                          }}
                        />
                        <span className="promo-mode-compact">{(draft?.promoOnlyNoDiscount ?? Boolean(source.promo_only_no_discount)) ? "Без скидки" : "Всегда"}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : null}

      {tab === "weight" ? (
        <div className="card">
          <h2>Настройки веса</h2>
          {weightTabLoading ? <AdminSectionSkeleton rows={6} /> : (
            <>
              <p className="muted">Вес в граммах задается слева. Справа добавляй англ-ключевые слова.</p>

              <div className="weight-rule-create-row">
                <input
                  type="number"
                  min={1}
                  value={newWeightRuleGrams}
                  onChange={(event) => setNewWeightRuleGrams(event.target.value)}
                  placeholder="Вес, г"
                />
                <button type="button" onClick={() => void onCreateWeightRule()}>
                  Добавить правило
                </button>
              </div>

              <div className="weight-rules-list">
            {weightRules.map((rule) => (
              <div key={rule.id} className="weight-rule-row">
                <div className="weight-rule-left">
                  <label className="muted">Вес (г)</label>
                  <input
                    type="number"
                    min={1}
                    value={weightRuleDrafts[rule.id] ?? String(rule.weight_grams)}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setWeightRuleDrafts((prev) => ({ ...prev, [rule.id]: nextValue }));
                    }}
                  />
                  <div className="weight-rule-actions">
                    <button type="button" onClick={() => void onDeleteWeightRule(rule.id)}>
                      Удалить
                    </button>
                  </div>
                </div>

                <div className="weight-rule-right">
                  <div className="chip-list">
                    {rule.keywords.map((keyword) => (
                      <span key={`${rule.id}-${keyword}`} className="tag tag--with-action">
                        <span>{keyword}</span>
                        <button type="button" className="tag-x" onClick={() => void onRemoveWeightKeyword(rule.id, keyword)}>
                          <IconClose className="icon-svg icon-svg--sm" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={weightKeywordInputs[rule.id] || ""}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setWeightKeywordInputs((prev) => ({ ...prev, [rule.id]: nextValue }));
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void onAddWeightKeyword(rule.id);
                      }
                    }}
                    placeholder="Введите keyword на английском и нажмите Enter"
                  />
                </div>
              </div>
            ))}
              </div>

              <h3 style={{ marginTop: "1rem" }}>Товары без определенного веса</h3>
              {weightMissingProducts.length === 0 ? (
                <p className="muted">Все товары имеют вес (из источника или по ключевым словам).</p>
              ) : (
                <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Товар</th>
                        <th>Сайт</th>
                        <th>Источник</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weightMissingProducts.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <Link className="btn-link" to={`/product/${item.id}`}>
                              {item.title}
                            </Link>
                          </td>
                          <td>{item.source_name}</td>
                          <td>
                            <a className="btn-link" href={item.url} target="_blank" rel="noreferrer">
                              Открыть товар
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      ) : null}

      {tab === "settings" ? (
        <div className="card">
          <h2>Экспорт и импорт настроек</h2>
          {(settingsExportInProgress || settingsImportInProgress) ? <AdminSectionSkeleton rows={2} /> : null}
          <p className="muted">
            Экспортируется конфигурация админки: ценообразование, поставщики, источники, правила веса и категории.
            Товары в файл не попадают.
          </p>
          <div className="settings-transfer-actions">
            <button type="button" onClick={() => void onExportSettings()} disabled={settingsExportInProgress}>
              {settingsExportInProgress ? "Экспорт..." : "Экспорт"}
            </button>
            <button type="button" onClick={onOpenImportDialog} disabled={settingsImportInProgress}>
              {settingsImportInProgress ? "Импорт..." : "Импорт"}
            </button>
            <input
              ref={settingsImportInputRef}
              type="file"
              accept="application/json,.json"
              style={{ display: "none" }}
              onChange={(event) => void onImportSettingsFile(event)}
            />
          </div>
          <p className="muted">
            Рекомендуется сначала сделать экспорт текущих настроек как резервную копию, затем выполнять импорт.
          </p>
        </div>
      ) : null}

      {openModal ? (
        <div className="modal-backdrop" onClick={closeProductModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h2>Добавить товар</h2>
              <button type="button" onClick={closeProductModal}>
                Закрыть
              </button>
            </div>

            <div className="form">
              <div className="url-fetch-row">
                <input
                  value={productUrl}
                  onChange={(event) => setProductUrl(event.target.value)}
                  placeholder="Ссылка (опционально): https://shop.example.com/products/..."
                />
                <button type="button" className="mini-btn" onClick={onFetchPreview} title="Подтянуть поля из URL">
                  <IconChevronDown className="icon-svg" />
                </button>
              </div>

              <input value={productTitle} onChange={(event) => setProductTitle(event.target.value)} placeholder="Название" />

              <div className="row2">
                <input value={productVendor} onChange={(event) => setProductVendor(event.target.value)} placeholder="Бренд" />
                <input
                  value={productCategory}
                  onChange={(event) => setProductCategory(event.target.value)}
                  placeholder="Категория / product_type"
                />
              </div>

              <div className="row2">
                <input value={productPrice} onChange={(event) => setProductPrice(event.target.value)} placeholder="Цена" />
                <select value={productCurrency} onChange={(event) => setProductCurrency(event.target.value)}>
                  {currencyOptions.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dropzone" onDrop={onDropImage} onDragOver={(event) => event.preventDefault()}>
                Drag-and-drop изображений сюда
              </div>
              <label className="btn-link" htmlFor="image-file">
                <IconPlus className="icon-svg icon-svg--sm" /> добавить фото
              </label>
              <input
                id="image-file"
                type="file"
                accept="image/*"
                multiple
                onChange={onPickImage}
                style={{ display: "none" }}
              />

              {imagePreviews.length > 0 ? (
                <div className="image-preview-grid">
                  {imagePreviews.map((item, index) => (
                    <div key={`${item.file.name}-${index}`} className="image-preview-card">
                      <button type="button" className="image-preview-btn" onClick={() => setZoomedImageUrl(item.url)}>
                        <img src={item.url} alt={item.file.name} className="image-preview" />
                      </button>
                      <div className="actions" style={{ marginTop: "0.35rem" }}>
                        <button type="button" onClick={() => removePreviewImage(index)}>
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">Фото не выбраны</p>
              )}

              <button type="button" onClick={onSaveProduct}>
                Сохранить товар
              </button>
              <p className="muted">Whitelist: {whitelist.join(", ")}</p>
            </div>
          </div>
        </div>
      ) : null}

      <ToastStack toasts={toasts} onClose={closeToast} />

      {zoomedImageUrl ? (
        <div className="modal-backdrop" onClick={() => setZoomedImageUrl(null)}>
          <div className="zoom-modal" onClick={(event) => event.stopPropagation()}>
            <img src={zoomedImageUrl} alt="preview" className="zoom-image" />
          </div>
        </div>
      ) : null}
    </section>
  );
}
