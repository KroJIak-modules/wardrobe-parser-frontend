import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent, type MouseEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { renderToString } from "katex";
import "katex/dist/katex.min.css";
import { useLiveData, type CategoryManualProduct, type PricingExampleProduct, type PricingSettings, type SettingsTransferPayload, getProductPrimaryImageUrl, toImageGatewayUrl } from "../shared/live-data-context";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { IconChevronDown, IconClose, IconExternalLink, IconInfo, IconPlus, IconStar } from "../shared/mono-icons";
import {
  AdminCategoriesSkeleton,
  AdminDedupSkeleton,
  AdminPricingSkeleton,
  AdminProductsSkeleton,
  AdminSectionSkeleton,
  AdminSettingsSkeleton,
  AdminSourcesSkeleton,
  AdminTableSkeleton,
  AdminWeightSkeleton,
} from "../shared/skeleton";
import { ToastStack } from "../shared/toast-stack";
import { useToasts } from "../shared/use-toasts";

type AdminTab = "products" | "dedup" | "categories" | "sources" | "pricing" | "weight" | "settings";

type UploadPreview = {
  file: File;
  url: string;
};

type ShowcaseImageItem = {
  id: number;
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
const tabKeys = new Set<AdminTab>(tabs.map((item) => item.key));

const currencyOptions = ["RUB", "EUR", "USD"];
const API_BASE = "/api/v1";
const PAGE_SIZE = 100;
const ADMIN_ACCESS_TOKEN_KEY = "admin_access_token";
const ADMIN_REFRESH_TOKEN_KEY = "admin_refresh_token";

async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const accessToken = window.localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
  const headers = new Headers(init?.headers ?? undefined);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  const response = await globalThis.fetch(input, { ...init, headers });
  if (response.status !== 401 || requestUrl.startsWith(`${API_BASE}/auth/`)) {
    return response;
  }

  const refreshToken = window.localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
  if (!refreshToken) {
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
  const refreshed = (await refreshResponse.json()) as { access_token: string; refresh_token: string };
  window.localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, refreshed.access_token || "");
  window.localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshed.refresh_token || "");
  const retryHeaders = new Headers(init?.headers ?? undefined);
  retryHeaders.set("Authorization", `Bearer ${refreshed.access_token}`);
  return globalThis.fetch(input, { ...init, headers: retryHeaders });
}
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

const selectRuPluralForm = (value: number, one: string, few: string, many: string): string => {
  const absolute = Math.abs(value) % 100;
  const tail = absolute % 10;
  if (absolute > 10 && absolute < 20) {
    return many;
  }
  if (tail === 1) {
    return one;
  }
  if (tail >= 2 && tail <= 4) {
    return few;
  }
  return many;
};

const formatDurationHoursMinutesAgo = (totalMinutes: number): string => {
  const safeMinutes = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  const minutesPart = `${minutes} ${selectRuPluralForm(minutes, "минута", "минуты", "минут")}`;
  if (hours <= 0) {
    return `${minutesPart} назад`;
  }
  const hoursPart = `${hours} ${selectRuPluralForm(hours, "час", "часа", "часов")}`;
  return `${hoursPart} ${minutesPart} назад`;
};

const parseApiDate = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }
  const raw = String(value).trim();
  if (!raw) {
    return null;
  }
  const normalized = raw.includes(" ") ? raw.replace(" ", "T") : raw;
  const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(normalized);
  const date = new Date(hasTimezone ? normalized : `${normalized}Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
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

const toCompressedThumbUrl = (url: string | null | undefined, width = 240, height = 240, quality = 55): string | null => {
  const raw = String(url || "").trim();
  if (!raw) {
    return null;
  }
  if (!raw.startsWith("/api/v1/images/")) {
    return raw;
  }
  const sep = raw.includes("?") ? "&" : "?";
  return `${raw}${sep}w=${Math.max(16, Math.round(width))}&h=${Math.max(16, Math.round(height))}&q=${Math.max(25, Math.min(95, Math.round(quality)))}`;
};

const dedupReasonLabelMap: Record<string, string> = {
  title_match: "Название",
  title_similar: "Похожее название",
  vendor_match: "Бренд",
  price_close: "Цена",
  handle_match: "Handle",
  handle_similar: "Похожий handle",
  image_overlap: "Фото",
  variant_overlap: "Варианты",
  auto_match: "Автосопоставление",
};

const toTitleCaseRu = (value: string): string => {
  if (!value) {
    return "";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatDedupReason = (rawReason: string): string => {
  const key = String(rawReason || "").trim().toLowerCase();
  if (!key) {
    return "";
  }
  const mapped = dedupReasonLabelMap[key];
  if (mapped) {
    return mapped;
  }
  return toTitleCaseRu(key.replaceAll("_", " "));
};

const dedupActionLabelMap: Record<string, string> = {
  merge: "Оставлен один",
  combine: "Соединены",
  reject: "Не дубль",
};

const formatDedupAction = (action: string): string => {
  const key = String(action || "").trim().toLowerCase();
  if (!key) {
    return "Решение";
  }
  return dedupActionLabelMap[key] || toTitleCaseRu(key.replaceAll("_", " "));
};

const escapeLatexText = (value: string): string =>
  value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([{}$&#_^%~])/g, "\\$1");

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

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
  (() => {
    const safeLatex = String(latex ?? "");
    try {
      return renderToString(safeLatex, {
        throwOnError: false,
        displayMode: false,
        strict: "ignore",
      });
    } catch {
      return escapeHtml(safeLatex);
    }
  })();

const renderLatexBlock = (latex: string): string =>
  (() => {
    const safeLatex = String(latex ?? "");
    try {
      return renderToString(safeLatex, {
        throwOnError: false,
        displayMode: true,
        strict: "ignore",
      });
    } catch {
      return escapeHtml(safeLatex);
    }
  })();

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

type AdminProductsTableItem = {
  id: number;
  source_id: number;
  title: string;
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

type AdminFilterFacetOption = {
  value: string;
  label: string;
  count: number;
};

const normalizeAdminTab = (raw: string | undefined): AdminTab => {
  if (!raw) {
    return "products";
  }
  return tabKeys.has(raw as AdminTab) ? (raw as AdminTab) : "products";
};

export function AdminPage() {
  const navigate = useNavigate();
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const tab = normalizeAdminTab(tabParam);
  const onLogout = () => {
    window.localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    navigate("/control/login", { replace: true });
  };

  useEffect(() => {
    if (!tabParam || tabParam !== tab) {
      navigate(`/control/${tab}`, { replace: true });
    }
  }, [navigate, tab, tabParam]);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Панель управления | Anton Shell";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  const {
    products,
    sources,
    latestJob,
    loadingCategoriesTree,
    loadingCategoryCounts,
    error,
    ensurePricingLoaded,
    ensureWeightLoaded,
    ensureDedupLoaded,
    runSync,
    cancelSync,
    previewProductByUrl,
    addProductByUrl,
    createManualProduct,
    uploadProductImage,
    uploadShowcaseImage,
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
    dedupDecisions,
    loadingDedupDecisions,
    mergeDedupPair,
    rejectDedupPair,
    combineDedupPair,
    undoDedupDecision,
    loading,
    toggleSourceEnabled,
    toggleSourceSyncEnabled,
    toggleSourceAutoHideProducts,
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
    fetchPricingExampleProduct,
  } = useLiveData();

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
  const [dedupChoosingPairKey, setDedupChoosingPairKey] = useState<string | null>(null);
  const [dedupBusyPairKeys, setDedupBusyPairKeys] = useState<Set<string>>(new Set());
  const [dedupView, setDedupView] = useState<"candidates" | "decisions">("candidates");
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
  const [finalRoundingModeDraft, setFinalRoundingModeDraft] = useState<FinalRoundingMode>("unit");
  const [designersMinProductsDraft, setDesignersMinProductsDraft] = useState<string>("1");
  const [showBybitErrorPopup, setShowBybitErrorPopup] = useState<boolean>(false);
  const [settingsExportInProgress, setSettingsExportInProgress] = useState<boolean>(false);
  const [settingsImportInProgress, setSettingsImportInProgress] = useState<boolean>(false);
  const [pricingTabLoading, setPricingTabLoading] = useState<boolean>(false);
  const [weightTabLoading, setWeightTabLoading] = useState<boolean>(false);
  const [nowTickMs, setNowTickMs] = useState<number>(() => Date.now());
  const [pricingExampleProduct, setPricingExampleProduct] = useState<PricingExampleProduct | null>(null);
  const [pricingExampleLoading, setPricingExampleLoading] = useState<boolean>(false);
  const [newSupplierName, setNewSupplierName] = useState<string>("");
  const [newAltByMainId, setNewAltByMainId] = useState<Record<number, { name: string }>>({});
  const [tariffRangesDrafts, setTariffRangesDrafts] = useState<Record<number, Array<{ id: string; min_kg: string; max_kg: string; rub: string }>>>({});
  const [tariffNameDrafts, setTariffNameDrafts] = useState<Record<number, string>>({});
  const [sourcePricingDrafts, setSourcePricingDrafts] = useState<Record<string, {
    supplierId: string;
    promoPercent: string;
    promoOnlyNoDiscount: boolean;
    buyout: TriCurrencyDraft;
  }>>({});
  const productsSentinelRef = useRef<HTMLDivElement | null>(null);
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const carouselInputRef = useRef<HTMLInputElement | null>(null);
  const settingsImportInputRef = useRef<HTMLInputElement | null>(null);
  const bybitWarnToastShownRef = useRef<string | null>(null);
  const pricingBlockedToastShownRef = useRef<boolean>(false);
  const svcValidationToastRef = useRef<string | null>(null);
  const [showcaseHeroImageId, setShowcaseHeroImageId] = useState<number | null>(null);
  const [showcaseCarousel, setShowcaseCarousel] = useState<ShowcaseImageItem[]>([]);
  const [showcaseSaving, setShowcaseSaving] = useState<boolean>(false);
  const [draggingCarouselId, setDraggingCarouselId] = useState<number | null>(null);

  const [tableProducts, setTableProducts] = useState<AdminProductsTableItem[]>([]);
  const [tableTotal, setTableTotal] = useState<number>(0);
  const [tableOverallTotal, setTableOverallTotal] = useState<number>(0);
  const [tableHasMore, setTableHasMore] = useState<boolean>(false);
  const [tableCursor, setTableCursor] = useState<string | null>(null);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [tableLoadingMore, setTableLoadingMore] = useState<boolean>(false);
  const [productVendors, setProductVendors] = useState<AdminFilterFacetOption[]>([]);
  const [productTypes, setProductTypes] = useState<AdminFilterFacetOption[]>([]);

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
    const run = async () => {
      if (tab === "pricing" || tab === "settings") {
        setPricingTabLoading(true);
        try {
          await ensurePricingLoaded(true);
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
    const nextValue = Math.max(1, Math.trunc(Number(pricingSettings.designers_min_products || 1)));
    setDesignersMinProductsDraft(String(nextValue));
  }, [pricingSettings?.designers_min_products]);

  useEffect(() => {
    if (!pricingSettings) {
      return;
    }
    const heroRaw = Number(pricingSettings.showcase_hero_image_asset_id);
    setShowcaseHeroImageId(Number.isFinite(heroRaw) && heroRaw > 0 ? heroRaw : null);
    const ids = Array.isArray(pricingSettings.showcase_carousel_image_asset_ids)
      ? pricingSettings.showcase_carousel_image_asset_ids
      : [];
    const normalized = ids
      .map((item) => Number(item))
      .filter((item, index, arr) => Number.isFinite(item) && item > 0 && arr.indexOf(item) === index)
      .slice(0, 20)
      .map((id) => ({ id }));
    setShowcaseCarousel(normalized);
  }, [pricingSettings?.showcase_hero_image_asset_id, pricingSettings?.showcase_carousel_image_asset_ids]);

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
    const parsed = Number((designersMinProductsDraft || "").trim());
    if (!Number.isFinite(parsed) || parsed < 1) {
      return;
    }
    const nextValue = Math.max(1, Math.trunc(parsed));
    const currentValue = Math.max(1, Math.trunc(Number(pricingSettings.designers_min_products || 1)));
    if (nextValue === currentValue) {
      return;
    }
    const timer = window.setTimeout(async () => {
      const result = await updatePricingSettings({ designers_min_products: nextValue });
      if (!result.ok) {
        pushToast(result.message);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [designersMinProductsDraft, pricingSettings, updatePricingSettings]);

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

  const pricingRates = useMemo(() => {
    if (!pricingSettings) {
      return { usdToRub: 0, eurToRub: 0, gbpToRub: 0 };
    }
    const bybitBase = Number(pricingSettings.bybit_usdt_to_rub);
    const draftExtra = Number((pricingDrafts.bybit_extra_rub ?? String(pricingSettings.bybit_extra_rub)).trim());
    const draftEurToUsd = Number((pricingDrafts.eur_to_usd_rate ?? String(pricingSettings.eur_to_usd_rate)).trim());
    const draftGbpToUsd = Number((pricingDrafts.gbp_to_usd_rate ?? String(pricingSettings.gbp_to_usd_rate)).trim());
    const bybitExtra = Number.isFinite(draftExtra) ? draftExtra : Number(pricingSettings.bybit_extra_rub);
    const eurToUsd = Number.isFinite(draftEurToUsd) && draftEurToUsd > 0 ? draftEurToUsd : Number(pricingSettings.eur_to_usd_rate);
    const gbpToUsd = Number.isFinite(draftGbpToUsd) && draftGbpToUsd > 0 ? draftGbpToUsd : Number(pricingSettings.gbp_to_usd_rate);
    const usdToRub = (Number.isFinite(bybitBase) && bybitBase > 0 ? bybitBase : 0) + Math.max(0, bybitExtra);
    const eurToRub = usdToRub * eurToUsd;
    const gbpToRub = usdToRub * gbpToUsd;
    return { usdToRub, eurToRub, gbpToRub };
  }, [pricingSettings, pricingDrafts.bybit_extra_rub, pricingDrafts.eur_to_usd_rate, pricingDrafts.gbp_to_usd_rate]);

  const pricingSuppliers = useMemo(() => {
    return (pricingSettings?.suppliers || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [pricingSettings]);

  const mainPricingSuppliers = useMemo(() => {
    return pricingSuppliers
      .filter((item) => item.parent_supplier_id === null || item.parent_supplier_id === undefined)
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [pricingSuppliers]);

  useEffect(() => {
    const next: Record<number, string> = {};
    for (const supplier of pricingSuppliers) {
      next[supplier.id] = supplier.name;
    }
    setTariffNameDrafts(next);
  }, [pricingSuppliers]);

  useEffect(() => {
    const timers: number[] = [];
    for (const supplier of pricingSuppliers) {
      const draft = (tariffNameDrafts[supplier.id] || "").trim();
      if (!draft || draft === supplier.name) {
        continue;
      }
      const timer = window.setTimeout(async () => {
        const result = await updatePricingSupplier(supplier.id, { name: draft });
        if (!result.ok) {
          pushToast(result.message);
        }
      }, 550);
      timers.push(timer);
    }
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [pricingSuppliers, tariffNameDrafts, updatePricingSupplier]);

  useEffect(() => {
    const timers: number[] = [];
    for (const supplier of pricingSuppliers) {
      const rows = tariffRangesDrafts[supplier.id] || [];
      if (rows.length === 0) {
        continue;
      }
      const normalized = rows
        .map((row) => {
          const min = Number((row.min_kg || "").trim());
          const maxRaw = (row.max_kg || "").trim();
          const max = maxRaw.length > 0 ? Number(maxRaw) : null;
          const rub = Number((row.rub || "").trim());
          if (!Number.isFinite(min) || min < 0 || !Number.isFinite(rub) || rub < 0) {
            return null;
          }
          if (max !== null && (!Number.isFinite(max) || max <= min)) {
            return null;
          }
          return { min_kg: Number(min.toFixed(4)), max_kg: max === null ? null : Number(max.toFixed(4)), rub: Number(rub.toFixed(2)) };
        })
        .filter(Boolean) as Array<{ min_kg: number; max_kg: number | null; rub: number }>;
      if (normalized.length !== rows.length) {
        continue;
      }
      normalized.sort((a, b) => (a.min_kg - b.min_kg) || ((a.max_kg ?? Number.POSITIVE_INFINITY) - (b.max_kg ?? Number.POSITIVE_INFINITY)));
      let hasOverlap = false;
      for (let idx = 1; idx < normalized.length; idx += 1) {
        const prev = normalized[idx - 1];
        const curr = normalized[idx];
        const prevMax = prev.max_kg ?? Number.POSITIVE_INFINITY;
        if (curr.min_kg < prevMax) {
          hasOverlap = true;
          break;
        }
      }
      if (hasOverlap) {
        continue;
      }
      const current = (supplier.rates || [])
        .map((row) => ({
          min_kg: Number(Number(row.min_kg).toFixed(4)),
          max_kg: row.max_kg === null ? null : Number(Number(row.max_kg).toFixed(4)),
          rub: Number(Number(row.rub).toFixed(2)),
        }))
        .sort((a, b) => (a.min_kg - b.min_kg) || ((a.max_kg ?? Number.POSITIVE_INFINITY) - (b.max_kg ?? Number.POSITIVE_INFINITY)));
      if (JSON.stringify(current) === JSON.stringify(normalized)) {
        continue;
      }
      const timer = window.setTimeout(async () => {
        const result = await updatePricingSupplier(supplier.id, { rates: normalized });
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
  }, [pricingSuppliers, tariffRangesDrafts, updatePricingSupplier]);

  const altSuppliersByMainId = useMemo(() => {
    const grouped = new Map<number, typeof pricingSuppliers>();
    for (const supplier of pricingSuppliers) {
      const parentId = supplier.parent_supplier_id;
      if (!parentId) {
        continue;
      }
      const list = grouped.get(parentId) || [];
      list.push(supplier);
      grouped.set(parentId, list);
    }
    for (const [mainId, list] of grouped.entries()) {
      list.sort((a, b) => (Number(a.alt_position || 0) - Number(b.alt_position || 0)) || a.name.localeCompare(b.name, "ru"));
      grouped.set(mainId, list);
    }
    return grouped;
  }, [pricingSuppliers]);

  const mainSupplierIdByAnySupplierId = useMemo(() => {
    const result = new Map<number, number>();
    for (const supplier of pricingSuppliers) {
      const id = Number(supplier.id);
      const parentId = Number(supplier.parent_supplier_id || 0);
      result.set(id, parentId > 0 ? parentId : id);
    }
    return result;
  }, [pricingSuppliers]);

  useEffect(() => {
    const next: Record<number, Array<{ id: string; min_kg: string; max_kg: string; rub: string }>> = {};
    for (const supplier of pricingSuppliers) {
      next[supplier.id] = (supplier.rates || []).map((row, idx) => ({
        id: `r-${supplier.id}-${idx}-${row.min_kg}-${row.max_kg ?? "inf"}`,
        min_kg: String(row.min_kg),
        max_kg: row.max_kg === null ? "" : String(row.max_kg),
        rub: String(row.rub),
      }));
    }
    setTariffRangesDrafts(next);
  }, [pricingSuppliers]);

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
        const sourceSupplierRaw = Number(source.supplier_id ?? 0);
        const resolvedMainSupplierId = sourceSupplierRaw > 0
          ? (mainSupplierIdByAnySupplierId.get(sourceSupplierRaw) || sourceSupplierRaw)
          : 0;
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
          supplierId: String(resolvedMainSupplierId || ""),
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
  }, [sources, pricingRates.usdToRub, pricingRates.eurToRub, pricingRates.gbpToRub, mainSupplierIdByAnySupplierId]);

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

  const pricingFormulaHtml = useMemo(() => {
    if (!pricingSettings?.formula_latex) {
      return "";
    }
    return renderLatexBlock(pricingSettings.formula_latex);
  }, [pricingSettings?.formula_latex]);

  const pricingExample = useMemo(() => {
    if (!pricingExampleProduct || !pricingSettings) {
      return null;
    }
    const product = pricingExampleProduct;
    const components = (product.components || {}) as Record<string, unknown>;
    const sourcePriceRaw = toFiniteNumber(product.source_price) ?? toFiniteNumber(components.source_price);
    const sourceCurrency = normalizeCurrencyCode(String(product.source_currency || components.source_currency || "USD"), "USD");
    const sourcePriceRub = toFiniteNumber(components.source_price_rub);
    const sourcePriceUsd = toFiniteNumber(components.source_price_usd);
    const sourcePriceEur = toFiniteNumber(components.source_price_eur);
    const bybitBase = toFiniteNumber(components.bybit_bucket_rate_rub) ?? toFiniteNumber(components.bybit_usdt_to_rub);
    const bybitExtra = toFiniteNumber(components.bybit_extra_rub);
    const bybitFx = toFiniteNumber(components.effective_usdt_to_rub);
    const promoFactor = toFiniteNumber(components.promo_factor);
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
    const taxRate = toFiniteNumber(components.tax_rate);
    const taxRub = toFiniteNumber(components.tax_rub);
    const markupRate = toFiniteNumber(components.markup_rate) ?? (Number(pricingSettings.markup_multiplier) - 1);
    const finalPrice = toFiniteNumber(product.final_price) ?? toFiniteNumber(components.final_price_rub) ?? toFiniteNumber(components.final_price);
    const finalRoundingMode = normalizeFinalRoundingMode(String(components.final_rounding_mode || pricingSettings.final_rounding_mode || "unit"), "unit");
    const supplierName = String(components.supplier_name || "Поставщик");
    const shippingRuleLabel = String(components.shipping_rule_label || "-");
    if (
      sourcePriceRaw === null
      || sourcePriceRub === null
      || sourcePriceUsd === null
      || sourcePriceEur === null
      || bybitBase === null
      || bybitExtra === null
      || bybitFx === null
      || promoFactor === null
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
      || finalPrice === null
    ) {
      return null;
    }

    const labelVar = (symbol: string) => symbol;
    const labelGroup = (symbol: string, value: number, digits = 4) => `${symbol}=${formatCompactNumber(value, digits)}`;
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
      `+\\underbrace{${formatCompactNumber(supplierTransportRub)}}_{SSR[\\text{${escapeLatexText(supplierName)}}][\\text{${escapeLatexText(shippingRuleLabel)}}]}` +
      `}_{${labelGroup("SUB", subtotalRub)}}` +
      `\\quad\\Rightarrow\\quad` +
      `\\underbrace{(` +
      `\\underbrace{${formatCompactNumber(subtotalRub)}}_{${labelVar("SUB")}}` +
      `\\cdot(1+\\underbrace{${formatCompactNumber(markupRate, 4)}}_{${labelVar("MUP")}})` +
      `+\\underbrace{${formatCompactNumber(serviceFeeRub)}}_{${labelVar("SVC")}}` +
      `)}_{${labelGroup("SUBM", subtotalAfterMarkupRub)}}` +
      `+\\underbrace{(` +
      `\\underbrace{${formatCompactNumber(subtotalAfterMarkupRub)}}_{${labelVar("SUBM")}}` +
      `\\cdot\\underbrace{${formatCompactNumber(taxRate, 4)}}_{${labelVar("TXR")}}` +
      `)}_{${labelGroup("TAX", taxRub)}}` +
      `${roundingSuffix}`;
    const summarySpLatex = renderLatexInline("SP");
    const summaryFpLatex = renderLatexInline("FPR");
    const summaryRubLatex = renderLatexInline("SPR");
    const marginRub = toFiniteNumber(components.margin_rub) ?? (finalPrice - sourcePriceRub);
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
      PFRP: paymentFeeRate,
      PFR: paymentFeeRub,
      THR: customsThresholdEur,
      DUT: customsDutyRate,
      CPR: customsProcessingRate,
      CFX: customsFixedRub,
      CDR: customsRub,
      SSR: supplierTransportRub,
      SUP: supplierName,
      RNG: shippingRuleLabel,
      INS: insuranceRub,
      SVC: serviceFeeRub,
      SUB: subtotalRub,
      SUBM: subtotalAfterMarkupRub,
      TXR: taxRate,
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
    for (const item of pricingSettings.formula_legend || []) {
      const key = item.key;
      legendDim[key] = !usedKeys.has(key) || isZeroOrEmpty(keyValues[key]);
    }
    return {
      productId: product.product_id,
      title: product.title,
      url: product.url,
      sourceName: product.source_name || null,
      imageUrl: (product.image_url ? String(product.image_url) : ""),
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
  }, [pricingExampleProduct, pricingSettings]);

  const buildFilterQuery = (options?: { includeLimit?: boolean; cursor?: string | null }) => {
    const params = new URLSearchParams();
    if (options?.includeLimit ?? true) {
      params.set("limit", String(PAGE_SIZE));
    }
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
    if (options?.cursor) {
      params.set("cursor", options.cursor);
    }
    return params;
  };

  useEffect(() => {
    if (tab !== "products") {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const run = async () => {
      try {
        setTableLoading(true);
        const productsParams = buildFilterQuery({ includeLimit: true });
        const facetsParams = buildFilterQuery({ includeLimit: false });
        const [productsRes, facetsRes] = await Promise.all([
          authFetch(`${API_BASE}/admin/products/table?${productsParams.toString()}`, { signal: controller.signal }),
          authFetch(`${API_BASE}/admin/products/table/facets?${facetsParams.toString()}`, { signal: controller.signal }),
        ]);

        if (!productsRes.ok) {
          throw new Error(`Products table API error: ${productsRes.status}`);
        }
        if (!facetsRes.ok) {
          throw new Error(`Products facets API error: ${facetsRes.status}`);
        }

        const payload = (await productsRes.json()) as {
          items: AdminProductsTableItem[];
          total: number;
          overall_total?: number;
          next_cursor?: string | null;
          has_more?: boolean;
        };
        const facetsPayload = (await facetsRes.json()) as {
          vendors?: AdminFilterFacetOption[];
          local_categories?: AdminFilterFacetOption[];
          total?: number;
          overall_total?: number;
        };

        if (cancelled) {
          return;
        }
        const items = payload.items || [];
        setTableProducts(items);
        setTableTotal(payload.total || facetsPayload.total || 0);
        setTableOverallTotal(payload.overall_total || facetsPayload.overall_total || 0);
        setTableCursor(payload.next_cursor || null);
        setTableHasMore(Boolean(payload.has_more && payload.next_cursor));
        setProductVendors(facetsPayload.vendors || []);
        setProductTypes(facetsPayload.local_categories || []);
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          return;
        }
        if (!cancelled) {
          pushToast(e instanceof Error ? e.message : "Ошибка загрузки таблицы товаров");
        }
      } finally {
        if (!cancelled) {
          setTableLoading(false);
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
  }, [tab, productSearch, productSourceFilter, productVendorFilter, productTypeFilter, productStatusFilter]);

  const loadMoreTableProducts = async () => {
    if (!tableHasMore || tableLoadingMore || !tableCursor) {
      return;
    }
    try {
      setTableLoadingMore(true);
      const params = buildFilterQuery({ includeLimit: true, cursor: tableCursor });
      const res = await authFetch(`${API_BASE}/admin/products/table?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Products table API error: ${res.status}`);
      }
      const payload = (await res.json()) as {
        items: AdminProductsTableItem[];
        total: number;
        overall_total?: number;
        next_cursor?: string | null;
        has_more?: boolean;
      };
      const nextItems = payload.items || [];
      setTableProducts((prev) => {
        const known = new Set(prev.map((item) => item.id));
        const toAdd = nextItems.filter((item) => !known.has(item.id));
        return [...prev, ...toAdd];
      });
      setTableTotal(payload.total || 0);
      setTableOverallTotal(payload.overall_total || tableOverallTotal);
      setTableCursor(payload.next_cursor || null);
      setTableHasMore(Boolean(payload.has_more && payload.next_cursor));
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка догрузки");
    } finally {
      setTableLoadingMore(false);
    }
  };

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
        if (!tableHasMore || tableLoadingMore) {
          return;
        }
        void loadMoreTableProducts();
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    tab,
    tableHasMore,
    tableLoadingMore,
    loadMoreTableProducts,
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
    const date = parseApiDate(value);
    if (!date) {
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

  const formatSyncStatusRu = (status: string | null | undefined) => {
    const value = String(status || "").trim().toLowerCase();
    if (value === "pending") {
      return "В очереди";
    }
    if (value === "in_progress") {
      return "Выполняется";
    }
    if (value === "completed" || value === "success") {
      return "Завершено";
    }
    if (value === "partial") {
      return "Частично";
    }
    if (value === "cancelled") {
      return "Отменено";
    }
    if (value === "failed") {
      return "Ошибка";
    }
    return "Неизвестно";
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
    const intervalSecRaw = Number(pricingSettings.bybit_worker_interval_sec);
    const intervalSec = Number.isFinite(intervalSecRaw) && intervalSecRaw > 0 ? Math.floor(intervalSecRaw) : 0;
    const intervalHours = intervalSec / 3600;
    const intervalLabel = intervalSec <= 0
      ? "-"
      : Number.isInteger(intervalHours) && intervalHours >= 1
        ? `${intervalHours} ${intervalHours === 1 ? "час" : intervalHours < 5 ? "часа" : "часов"}`
        : `${Math.max(1, Math.round(intervalSec / 60))} мин`;
    const lastUpdatedRaw = pricingSettings.bybit_last_updated_at || null;
    const lastUpdatedDate = parseApiDate(lastUpdatedRaw);
    const staleAfterMs = intervalSec > 0 ? intervalSec * 1000 : Number.POSITIVE_INFINITY;

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
      ? formatDurationHoursMinutesAgo((nowTickMs - lastUpdatedDate.getTime()) / 60000)
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
    if (tab !== "pricing" || !pricingSettings || pricingBlockedByInitialBybit) {
      setPricingExampleProduct(null);
      setPricingExampleLoading(false);
      return;
    }
    let cancelled = false;
    setPricingExampleLoading(true);
    void fetchPricingExampleProduct()
      .then((payload) => {
        if (!cancelled) {
          setPricingExampleProduct(payload);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPricingExampleLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tab, pricingSettings, pricingBlockedByInitialBybit, fetchPricingExampleProduct]);

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
      return { label: "В наличии", cls: "status-pill status-pill--ok" };
    }
    if (status === "out_of_stock") {
      return { label: "Нет в наличии", cls: "status-pill status-pill--warn" };
    }
    if (status === "unavailable") {
      return { label: "Недоступен", cls: "status-pill status-pill--bad" };
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
    pushToast(result.ok ? (isFavorite ? "Категория добавлена в избранное" : "Категория удалена из избранного") : result.message);
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

  const saveShowcaseSettings = async (payload: Partial<PricingSettings>) => {
    setShowcaseSaving(true);
    try {
      const result = await updatePricingSettings(payload);
      if (!result.ok) {
        pushToast(result.message);
      }
      return result.ok;
    } finally {
      setShowcaseSaving(false);
    }
  };

  const onPickHeroImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    const uploaded = await uploadShowcaseImage(file);
    if (!uploaded.ok || !uploaded.imageAssetId) {
      pushToast(uploaded.message);
      return;
    }
    if (await saveShowcaseSettings({ showcase_hero_image_asset_id: uploaded.imageAssetId })) {
      setShowcaseHeroImageId(uploaded.imageAssetId);
    }
  };

  const onRemoveHeroImage = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (await saveShowcaseSettings({ showcase_hero_image_asset_id: null })) {
      setShowcaseHeroImageId(null);
    }
  };

  const onPickCarouselImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = "";
    if (files.length === 0) {
      return;
    }
    if (showcaseCarousel.length >= 20) {
      pushToast("Максимум 20 фотографий в карусели");
      return;
    }
    const remaining = Math.max(0, 20 - showcaseCarousel.length);
    const picked = files.slice(0, remaining);
    const uploadedIds: number[] = [];
    for (const file of picked) {
      const uploaded = await uploadShowcaseImage(file);
      if (!uploaded.ok || !uploaded.imageAssetId) {
        pushToast(uploaded.message);
        break;
      }
      uploadedIds.push(uploaded.imageAssetId);
    }
    if (uploadedIds.length === 0) {
      return;
    }
    const next = [...showcaseCarousel.map((item) => item.id), ...uploadedIds].slice(0, 20);
    if (await saveShowcaseSettings({ showcase_carousel_image_asset_ids: next })) {
      setShowcaseCarousel(next.map((id) => ({ id })));
    }
  };

  const onRemoveCarouselImage = async (id: number) => {
    const next = showcaseCarousel.map((item) => item.id).filter((item) => item !== id);
    if (await saveShowcaseSettings({ showcase_carousel_image_asset_ids: next })) {
      setShowcaseCarousel(next.map((item) => ({ id: item })));
    }
  };

  const onReorderCarouselImage = async (targetId: number) => {
    if (!draggingCarouselId || draggingCarouselId === targetId) {
      return;
    }
    const ids = showcaseCarousel.map((item) => item.id);
    const fromIndex = ids.indexOf(draggingCarouselId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }
    const next = [...ids];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    if (await saveShowcaseSettings({ showcase_carousel_image_asset_ids: next })) {
      setShowcaseCarousel(next.map((item) => ({ id: item })));
    }
    setDraggingCarouselId(null);
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

  const withDedupBusy = async (pairKey: string, task: () => Promise<{ ok: boolean; message: string }>) => {
    setDedupBusyPairKeys((prev) => new Set(prev).add(pairKey));
    try {
      const result = await task();
      if (result.ok) {
        setDedupChoosingPairKey((prev) => (prev === pairKey ? null : prev));
      }
      pushToast(result.message);
    } finally {
      setDedupBusyPairKeys((prev) => {
        const next = new Set(prev);
        next.delete(pairKey);
        return next;
      });
    }
  };

  const onMergePair = async (pairKey: string, primaryId: number, duplicateId: number) => {
    await withDedupBusy(pairKey, () => mergeDedupPair(primaryId, duplicateId));
  };

  const onRejectPair = async (pairKey: string, leftId: number, rightId: number) => {
    await withDedupBusy(pairKey, () => rejectDedupPair(leftId, rightId));
  };

  const onCombinePair = async (pairKey: string, leftId: number, rightId: number) => {
    await withDedupBusy(pairKey, () => combineDedupPair(leftId, rightId));
  };

  const onUndoDecision = async (pairKey: string) => {
    await withDedupBusy(pairKey, () => undoDedupDecision(pairKey));
  };

  const onCreateMainSupplier = async () => {
    const name = newSupplierName.trim();
    if (!name) {
      pushToast("Укажи название тарифа");
      return;
    }
    const result = await createPricingSupplier({
      name,
      category: "main",
      rate_currency: "RUB",
    });
    pushToast(result.message);
    if (result.ok) {
      setNewSupplierName("");
    }
  };

  const onCreateAltSupplier = async (mainSupplierId: number) => {
    const draft = newAltByMainId[mainSupplierId] || { name: "" };
    const name = draft.name.trim();
    if (!name) {
      pushToast("Укажи название альтернативы");
      return;
    }
    const result = await createPricingSupplier({
      name,
      parent_supplier_id: mainSupplierId,
      category: "alt",
      rate_currency: "RUB",
      alt_position: (altSuppliersByMainId.get(mainSupplierId)?.length || 0) + 1,
    });
    pushToast(result.message);
    if (result.ok) {
      setNewAltByMainId((prev) => ({
        ...prev,
        [mainSupplierId]: { name: "" },
      }));
    }
  };

  const onDeleteSupplier = async (supplierId: number) => {
    const result = await deletePricingSupplier(supplierId);
    pushToast(result.message);
  };

  const onAddTariffRange = (supplierId: number) => {
    setTariffRangesDrafts((prev) => {
      const current = prev[supplierId] || [];
      const last = current[current.length - 1];
      const nextMin = last ? Number((last.max_kg || last.min_kg || "0").trim() || "0") : 0;
      const nextMax = Number.isFinite(nextMin) ? nextMin + 0.5 : 0.5;
      return {
        ...prev,
        [supplierId]: [
          ...current,
          { id: `new-${Date.now()}-${Math.random()}`, min_kg: String(nextMin), max_kg: String(nextMax), rub: "0" },
        ],
      };
    });
  };

  const onRemoveTariffRange = (supplierId: number, rowId: string) => {
    setTariffRangesDrafts((prev) => ({
      ...prev,
      [supplierId]: (prev[supplierId] || []).filter((row) => row.id !== rowId),
    }));
  };

  const openProductCard = (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>, productId: number) => {
    const href = `/product/${productId}?from=admin`;
    if ("button" in event) {
      if (event.button === 1 || event.ctrlKey || event.metaKey) {
        event.preventDefault();
        window.open(href, "_blank", "noreferrer");
        return;
      }
      if (event.button !== 0) {
        return;
      }
    }
    navigate(href);
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
                  {!node.is_enabled ? "выключена" : node.is_system ? "системная" : node.keywords_editable ? `${node.keywords.length} ключей` : "ветка"} • {loadingCategoryCounts ? "..." : node.product_count} товаров
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
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand" aria-label="Anton Shell">
            <img src="/logo_anton_shell.svg" alt="Anton Shell" className="brand-logo" />
          </Link>
          <div className="topbar-actions">
            <Link to="/" className="topbar-cta">
              Каталог товаров
            </Link>
            <button type="button" className="topbar-cta" onClick={onLogout}>
              Выход
            </button>
          </div>
        </div>
      </header>
      <main className="container container--admin">
    <section className="section admin">
      <div className="admin-head">
        <h1>Панель управления</h1>
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
        </div>
        {latestJob ? (
          <div className="sync-summary">
            {isSyncInProgress ? (
              <>
                <div className="sync-progress">
                  <div className="sync-progress__bar" style={{ width: `${Math.max(0, Math.min(100, latestJob.progress_percent || 0))}%` }} />
                </div>
                <div className="sync-stats">
                  <span className="sync-pill">{`${latestJob.processed_sources || 0}/${latestJob.total_sources || 0}`}</span>
                  <span className="sync-pill">{latestJob.current_source_name || "—"}</span>
                  <span className="sync-pill">{latestJob.current_source_parser_type || "—"}</span>
                  <span className="sync-pill">Выгружено: {latestJob.processed_products || 0}</span>
                  <span className="sync-pill">Обнаружено: {latestJob.expected_products || 0}</span>
                  <span className="sync-pill">Ошибок: {latestJob.failed_products || 0}</span>
                  <span className="sync-pill">{Math.max(0, Math.min(100, latestJob.progress_percent || 0))}%</span>
                  <span className="sync-pill">{formatSyncStatusRu(latestJob.status)}</span>
                </div>
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
            onClick={() => navigate(`/control/${item.key}`)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "products" ? (
        <div className="card">
          {tableLoading && tableProducts.length === 0 ? (
            <AdminProductsSkeleton />
          ) : (
            <>
          <h2>
            {tableLoading && tableProducts.length === 0
              ? "Все товары"
              : `Все товары (${tableTotal}/${tableOverallTotal})`}
          </h2>

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
                {productVendors.map((vendor) => (
                  <option key={vendor.value} value={vendor.value}>
                    {vendor.label} ({vendor.count})
                  </option>
                ))}
              </select>
              <select value={productTypeFilter} onChange={(event) => setProductTypeFilter(event.target.value)}>
                <option value="">Все локальные категории</option>
                {productTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} ({type.count})
                  </option>
                ))}
              </select>
              <select value={productStatusFilter} onChange={(event) => setProductStatusFilter(event.target.value)}>
                <option value="">Все статусы</option>
                <option value="available">В наличии</option>
                <option value="out_of_stock">Нет в наличии</option>
                <option value="hidden">Скрыт</option>
                <option value="unavailable">Недоступен</option>
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
                    <th>Категория/Бренд</th>
                    <th>Статус</th>
                    <th>Оригинальная цена</th>
                    <th>Итоговая цена (RUB)</th>
                  </tr>
                </thead>
                <tbody>
                  {tableProducts.map((product) => {
                    const status = statusBadge(product.status);
                    const sourcePrice = product.source_price;
                    const sourceCurrency = product.source_currency;
                    const finalPrice = product.final_price ?? null;
                    const finalCurrency = product.final_currency ?? "RUB";
                    const source = sourceById.get(product.source_id);
                    const adminProductHref = `/product/${product.id}?from=admin`;
                    return (
                      <tr key={product.id}>
                        <td>
                          <Link className="thumb-mini-link" to={adminProductHref}>
                            <ImageWithFallback
                              src={getProductPrimaryImageUrl(product, { w: 180, h: 180, q: 55 })}
                              alt={product.title}
                              className="thumb-mini-image"
                              placeholderClassName="thumb-mini"
                              placeholderText={product.image_count > 0 ? `${product.image_count} фото` : "Нет фото"}
                              loadingText={product.image_count > 0 ? "Загружаем..." : "Нет фото"}
                            />
                          </Link>
                        </td>
                        <td>
                          <Link className="btn-link" to={adminProductHref}>
                            {product.title}
                          </Link>
                        </td>
                        <td>
                          {product.url ? (
                            <a className="btn-link" href={product.url} target="_blank" rel="noreferrer">
                              {source?.name || `#${product.source_id}`}
                            </a>
                          ) : (
                            source?.name || `#${product.source_id}`
                          )}
                        </td>
                        <td>{product.product_type || "-"}</td>
                        <td>{(product.internal_category_name || "").trim() || "Прочее"}</td>
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
              {!tableLoading && tableProducts.length === 0 ? <p className="muted">По текущим фильтрам товаров нет</p> : null}
              {tableLoadingMore ? <AdminTableSkeleton rows={3} cols={8} /> : null}
              <div ref={productsSentinelRef} style={{ height: "1px" }} />
            </div>
          </div>
            </>
          )}
        </div>
      ) : null}

      {tab === "dedup" ? (
        <div className="card">
          <h2>Дедубликация</h2>
          <div className="dedup-subtabs">
            <button
              type="button"
              className={`tab ${dedupView === "candidates" ? "tab--active" : ""}`}
              onClick={() => setDedupView("candidates")}
            >
              {`Дубликаты (${dedupCandidates.length})`}
            </button>
            <button
              type="button"
              className={`tab ${dedupView === "decisions" ? "tab--active" : ""}`}
              onClick={() => setDedupView("decisions")}
            >
              {`Решения (${dedupDecisions.length})`}
            </button>
          </div>
          {dedupView === "candidates" ? (
            <>
              {(loadingDedupCandidates && dedupCandidates.length === 0) ? <AdminDedupSkeleton rows={3} /> : null}
              <div className="dedup-list">
            {dedupCandidates.map((candidate) => (
              <div key={candidate.pair_key} className="dedup-item">
                <div className="dedup-grid">
                  <article
                    className="dedup-col dedup-card dedup-card--clickable"
                    onClick={(event) => openProductCard(event, candidate.left.id)}
                    onMouseDown={(event) => {
                      if (event.button === 1) {
                        openProductCard(event, candidate.left.id);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openProductCard(event, candidate.left.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <ImageWithFallback
                      src={getProductPrimaryImageUrl(candidate.left, { w: 520, h: 360, q: 55 })}
                      alt={candidate.left.title}
                      className="dedup-card-media"
                      placeholderClassName="dedup-card-media dedup-card-media--placeholder"
                      placeholderText={candidate.left.image_count > 0 ? "Фото" : "Нет фото"}
                    />
                    <div className="dedup-card-body">
                      <strong className="dedup-card-title">{candidate.left.title}</strong>
                      <p className="muted dedup-card-meta">{candidate.left.vendor || "-"}</p>
                      <p className="muted dedup-card-meta">
                        {candidate.left.price ?? "-"} {candidate.left.currency}
                      </p>
                      <button
                        type="button"
                        className="icon-btn dedup-source-btn"
                        title="Открыть источник"
                        onClick={(event) => {
                          event.stopPropagation();
                          window.open(candidate.left.url, "_blank", "noreferrer");
                        }}
                      >
                        <IconExternalLink className="icon-svg" />
                      </button>
                    </div>
                  </article>

                  <article
                    className="dedup-col dedup-card dedup-card--clickable"
                    onClick={(event) => openProductCard(event, candidate.right.id)}
                    onMouseDown={(event) => {
                      if (event.button === 1) {
                        openProductCard(event, candidate.right.id);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openProductCard(event, candidate.right.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <ImageWithFallback
                      src={getProductPrimaryImageUrl(candidate.right, { w: 520, h: 360, q: 55 })}
                      alt={candidate.right.title}
                      className="dedup-card-media"
                      placeholderClassName="dedup-card-media dedup-card-media--placeholder"
                      placeholderText={candidate.right.image_count > 0 ? "Фото" : "Нет фото"}
                    />
                    <div className="dedup-card-body">
                      <strong className="dedup-card-title">{candidate.right.title}</strong>
                      <p className="muted dedup-card-meta">{candidate.right.vendor || "-"}</p>
                      <p className="muted dedup-card-meta">
                        {candidate.right.price ?? "-"} {candidate.right.currency}
                      </p>
                      <button
                        type="button"
                        className="icon-btn dedup-source-btn"
                        title="Открыть источник"
                        onClick={(event) => {
                          event.stopPropagation();
                          window.open(candidate.right.url, "_blank", "noreferrer");
                        }}
                      >
                        <IconExternalLink className="icon-svg" />
                      </button>
                    </div>
                  </article>
                </div>

                <div className="dedup-reasons">
                  <span className="muted dedup-reasons-label">Совпадение по:</span>
                  {(candidate.reasons.length > 0 ? candidate.reasons : ["auto_match"]).map((reason) => (
                    <span key={`${candidate.pair_key}-${reason}`} className="dedup-reason-pill">
                      {formatDedupReason(reason)}
                    </span>
                  ))}
                </div>

                <div className="actions dedup-actions dedup-actions--stack">
                  <button
                    type="button"
                    disabled={dedupBusyPairKeys.has(candidate.pair_key)}
                    onClick={() => void onCombinePair(candidate.pair_key, candidate.left.id, candidate.right.id)}
                  >
                    Соединить дубликаты
                  </button>
                  {dedupChoosingPairKey === candidate.pair_key ? (
                    <div className="dedup-actions-row">
                      <button
                        type="button"
                        disabled={dedupBusyPairKeys.has(candidate.pair_key)}
                        onClick={() => void onMergePair(candidate.pair_key, candidate.left.id, candidate.right.id)}
                      >
                        Оставить левый
                      </button>
                      <button
                        type="button"
                        disabled={dedupBusyPairKeys.has(candidate.pair_key)}
                        onClick={() => void onMergePair(candidate.pair_key, candidate.right.id, candidate.left.id)}
                      >
                        Оставить правый
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={dedupBusyPairKeys.has(candidate.pair_key)}
                      onClick={() =>
                        setDedupChoosingPairKey((prev) => (prev === candidate.pair_key ? null : candidate.pair_key))
                      }
                    >
                      Оставить только один
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={dedupBusyPairKeys.has(candidate.pair_key)}
                    onClick={() => void onRejectPair(candidate.pair_key, candidate.left.id, candidate.right.id)}
                  >
                    Не дубль
                  </button>
                </div>
              </div>
            ))}
            {loadingDedupCandidates ? <AdminDedupSkeleton rows={1} /> : null}
            {!loadingDedupCandidates && dedupCandidates.length === 0 ? <p className="muted">Кандидатов нет</p> : null}
          </div>
            </>
          ) : (
            <>
              {(loadingDedupDecisions && dedupDecisions.length === 0) ? <AdminDedupSkeleton rows={3} /> : null}
              <div className="dedup-list">
                {dedupDecisions.map((decision) => (
                  <div key={decision.pair_key} className="dedup-item">
                    <div className="dedup-grid">
                      <article
                        className="dedup-col dedup-card dedup-card--clickable"
                        onClick={(event) => openProductCard(event, decision.left.id)}
                        onMouseDown={(event) => {
                          if (event.button === 1) {
                            openProductCard(event, decision.left.id);
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openProductCard(event, decision.left.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <ImageWithFallback
                          src={getProductPrimaryImageUrl(decision.left, { w: 520, h: 360, q: 55 })}
                          alt={decision.left.title}
                          className="dedup-card-media"
                          placeholderClassName="dedup-card-media dedup-card-media--placeholder"
                          placeholderText={decision.left.image_count > 0 ? "Фото" : "Нет фото"}
                        />
                        <div className="dedup-card-body">
                          <strong className="dedup-card-title">{decision.left.title}</strong>
                          <p className="muted dedup-card-meta">{decision.left.vendor || "-"}</p>
                          <p className="muted dedup-card-meta">
                            {decision.left.price ?? "-"} {decision.left.currency}
                          </p>
                          <button
                            type="button"
                            className="icon-btn dedup-source-btn"
                            title="Открыть источник"
                            onClick={(event) => {
                              event.stopPropagation();
                              window.open(decision.left.url, "_blank", "noreferrer");
                            }}
                          >
                            <IconExternalLink className="icon-svg" />
                          </button>
                        </div>
                      </article>

                      <article
                        className="dedup-col dedup-card dedup-card--clickable"
                        onClick={(event) => openProductCard(event, decision.right.id)}
                        onMouseDown={(event) => {
                          if (event.button === 1) {
                            openProductCard(event, decision.right.id);
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openProductCard(event, decision.right.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <ImageWithFallback
                          src={getProductPrimaryImageUrl(decision.right, { w: 520, h: 360, q: 55 })}
                          alt={decision.right.title}
                          className="dedup-card-media"
                          placeholderClassName="dedup-card-media dedup-card-media--placeholder"
                          placeholderText={decision.right.image_count > 0 ? "Фото" : "Нет фото"}
                        />
                        <div className="dedup-card-body">
                          <strong className="dedup-card-title">{decision.right.title}</strong>
                          <p className="muted dedup-card-meta">{decision.right.vendor || "-"}</p>
                          <p className="muted dedup-card-meta">
                            {decision.right.price ?? "-"} {decision.right.currency}
                          </p>
                          <button
                            type="button"
                            className="icon-btn dedup-source-btn"
                            title="Открыть источник"
                            onClick={(event) => {
                              event.stopPropagation();
                              window.open(decision.right.url, "_blank", "noreferrer");
                            }}
                          >
                            <IconExternalLink className="icon-svg" />
                          </button>
                        </div>
                      </article>
                    </div>
                    <div className="dedup-reasons">
                      <span className="muted dedup-reasons-label">Решение:</span>
                      <span className="dedup-reason-pill">{formatDedupAction(decision.action)}</span>
                      {decision.decided_at ? (
                        <span className="muted dedup-reasons-label dedup-reasons-label--soft">
                          {new Date(decision.decided_at).toLocaleString("ru-RU")}
                        </span>
                      ) : null}
                    </div>
                    <div className="actions dedup-actions">
                      <button
                        type="button"
                        disabled={!decision.can_undo || dedupBusyPairKeys.has(decision.pair_key)}
                        title={decision.undo_block_reason || "Отменить решение"}
                        onClick={() => void onUndoDecision(decision.pair_key)}
                      >
                        Отменить решение
                      </button>
                    </div>
                  </div>
                ))}
                {loadingDedupDecisions ? <AdminDedupSkeleton rows={1} /> : null}
                {!loadingDedupDecisions && dedupDecisions.length === 0 ? <p className="muted">Решений пока нет</p> : null}
              </div>
            </>
          )}
        </div>
      ) : null}

      {tab === "categories" ? (
        <div className="card">
          <h2>Категории</h2>
          {loadingCategoriesTree ? (
            <AdminCategoriesSkeleton />
          ) : (
            <>
              {loadingCategoryCounts ? <AdminSectionSkeleton rows={2} /> : null}
              <div className="categories-layout">
            <div>
              <div className="actions" style={{ marginBottom: "0.5rem" }}>
                <button type="button" className="tree-plus" onClick={() => onStartCategoryCreate(null)}>
                  <IconPlus className="icon-svg icon-svg--sm" /> root
                </button>
              </div>
              <div className="cat-tree-wrap">{renderTree(adminCategories)}</div>
            </div>

            <div className="card category-editor-panel">
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
                    <div className="category-controls-row">
                      <label className="ui-switch ui-switch--compact">
                        <input
                          type="checkbox"
                          checked={selectedCategory.is_enabled}
                          onChange={(event) => void onToggleCategoryEnabled(event.target.checked)}
                        />
                        <span className="ui-switch-track">
                          <span className="ui-switch-thumb" />
                        </span>
                        <span className="ui-switch-text">{selectedCategory.is_enabled ? "Включено" : "Выключено"}</span>
                      </label>
                      {!selectedCategory.is_system ? (
                        <div className="favorite-toggle-row">
                          <button
                            type="button"
                            className={selectedCategory.is_favorite ? "icon-btn icon-btn--active favorite-toggle-btn favorite-toggle-btn--active" : "icon-btn favorite-toggle-btn"}
                            onClick={() => void onToggleCategoryFavorite(!selectedCategory.is_favorite)}
                            aria-label={selectedCategory.is_favorite ? "Убрать из избранного" : "Сделать избранным"}
                          >
                            <IconStar className="icon-svg icon-svg--sm" />
                          </button>
                          <span className="favorite-toggle-text">{selectedCategory.is_favorite ? "Добавлен в избранное" : "Сделать избранным"}</span>
                        </div>
                      ) : null}
                      <button type="button" onClick={onDeleteCategory} disabled={selectedCategory.is_system}>
                        Удалить
                      </button>
                    </div>
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
                                  {item.image_url ? <img src={toCompressedThumbUrl(item.image_url, 120, 120, 55) || item.image_url} alt={item.title} loading="lazy" decoding="async" fetchPriority="low" /> : <span className="muted">Нет фото</span>}
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

                          {manualAssignedLoading || manualAssignedProducts.length > 0 ? <p className="muted">Добавленные товары</p> : null}
                          {manualAssignedLoading ? <AdminSectionSkeleton rows={2} /> : null}
                          {manualAssignedProducts.map((item) => {
                            const categoryLabel = item.category_names.length > 0 ? item.category_names.join(", ") : "Прочее";
                            return (
                              <div key={`manual-added-${item.product_id}`} className="manual-product-row">
                                <div className="manual-product-media">
                                  {item.image_url ? <img src={toCompressedThumbUrl(item.image_url, 120, 120, 55) || item.image_url} alt={item.title} loading="lazy" decoding="async" fetchPriority="low" /> : <span className="muted">Нет фото</span>}
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
                        <p className="muted">Добавление ключевых слов и товаров доступно только для конечных категорий.</p>
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
            </>
          )}
        </div>
      ) : null}

      {tab === "sources" ? (
        <div className="card">
          <h2>Источники ({sources.length})</h2>
          {loading ? (
            <AdminSourcesSkeleton rows={5} />
          ) : (
            <div className="sources-grid">
            {sources.map((source) => {
              const href = /^https?:\/\//i.test(source.base_url) ? source.base_url : `https://${source.base_url}`;
              const label = source.base_url.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
              return (
              <article key={source.key} className="list-row source-card">
                <div className="source-card-head">
                  <strong className="source-card-title">
                    {source.name}
                    {source.status_label ? ` · ${source.status_label}` : ""}
                  </strong>
                  <a className="source-card-link" href={href} target="_blank" rel="noreferrer">
                    {label}
                  </a>
                </div>
                <div className="source-card-foot">
                  <div className="source-card-meta">
                    <span className="source-pill">Товаров: {source.products_count}</span>
                    <span className="source-pill">Время: {source.last_sync_duration_sec ?? 0}с</span>
                    <span className="source-pill">Последняя: {source.last_sync_at ? formatDateTime(source.last_sync_at) : "—"}</span>
                  </div>
                  <div className="source-card-switches">
                    <label className="ui-switch ui-switch--compact source-card-switch">
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
                      <span className="ui-switch-track">
                        <span className="ui-switch-thumb" />
                      </span>
                      <span className="ui-switch-text">{source.enabled ? "Тип включен" : "Тип выключен"}</span>
                    </label>
                    <label className="ui-switch ui-switch--compact source-card-switch">
                      <input
                        type="checkbox"
                        checked={source.sync_enabled}
                        onChange={(event) => {
                          void (async () => {
                            const result = await toggleSourceSyncEnabled(source.key, event.target.checked);
                            pushToast(result.message);
                          })();
                        }}
                      />
                      <span className="ui-switch-track">
                        <span className="ui-switch-thumb" />
                      </span>
                      <span className="ui-switch-text">{source.sync_enabled ? "Участвует в sync" : "Исключен из sync"}</span>
                    </label>
                    <label className="ui-switch ui-switch--compact source-card-switch">
                      <input
                        type="checkbox"
                        checked={Boolean(source.hide_auto_added_products)}
                        onChange={(event) => {
                          void (async () => {
                            const result = await toggleSourceAutoHideProducts(source.key, event.target.checked);
                            pushToast(result.message);
                          })();
                        }}
                      />
                      <span className="ui-switch-track">
                        <span className="ui-switch-thumb" />
                      </span>
                      <span className="ui-switch-text">
                        {Boolean(source.hide_auto_added_products) ? "Скрывать автотовары" : "Показывать автотовары"}
                      </span>
                    </label>
                  </div>
                </div>
              </article>
              );
            })}
            </div>
          )}
        </div>
      ) : null}

      {tab === "pricing" ? (
        <div className="card">
          <h2>Настройки ценообразования</h2>
          {(pricingTabLoading && !pricingSettings) ? (
            <AdminPricingSkeleton />
          ) : !pricingSettings ? (
            <AdminPricingSkeleton />
          ) : pricingBlockedByInitialBybit ? (
            <AdminPricingSkeleton />
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
                      <Link className="pricing-example-thumb-link" to={`/product/${pricingExample.productId}?from=admin`}>
                        <ImageWithFallback
                          src={toCompressedThumbUrl(pricingExample.imageUrl, 240, 240, 55)}
                          alt={pricingExample.title}
                          className="pricing-example-thumb"
                          placeholderClassName="pricing-example-thumb-placeholder"
                          placeholderText="Нет фото"
                          loadingText="Загружаем..."
                        />
                      </Link>
                      <div className="pricing-example-title-row">
                        <Link className="btn-link pricing-example-title-link" to={`/product/${pricingExample.productId}?from=admin`}>
                          {pricingExample.title}
                        </Link>
                        {pricingExample.url ? (
                          <a className="btn-link pricing-example-source-link" href={pricingExample.url} target="_blank" rel="noreferrer">
                            {pricingExample.sourceName || "Источник"}
                          </a>
                        ) : (
                          <span className="muted pricing-example-source-link">{pricingExample.sourceName || "Источник"}</span>
                        )}
                      </div>
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
                ) : pricingExampleLoading ? (
                  <div className="pricing-example-box">
                    <AdminPricingSkeleton />
                  </div>
                ) : (
                  <div className="pricing-example-box pricing-example-box--empty">
                    <p className="with-help">
                      <strong>Пример на товаре:</strong>
                    </p>
                    <p className="muted">Не удалось собрать пример: у доступных товаров не хватает расчетных полей.</p>
                  </div>
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
                Тарифы SSR
                <HelpHint text="Создавай базовые тарифы и до 3 ALT-тарифов для каждого. Внутри тарифа настраиваются диапазоны веса и цена за диапазон." />
              </h3>
              <div className="pricing-source-map-list">
                {mainPricingSuppliers.map((supplier) => {
                  const altItems = altSuppliersByMainId.get(supplier.id) || [];
                  const altDraft = newAltByMainId[supplier.id] || { name: "" };
                  const renderTariffCard = (item: typeof supplier, title: string) => {
                    const rows = tariffRangesDrafts[item.id] || [];
                    return (
                      <div key={`tariff-card-${item.id}`} className="card" style={{ marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <input
                            type="text"
                            value={tariffNameDrafts[item.id] ?? title}
                            onChange={(event) =>
                              setTariffNameDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))
                            }
                            placeholder="Название тарифа"
                          />
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button type="button" onClick={() => void onDeleteSupplier(item.id)}>Удалить</button>
                          </div>
                        </div>
                        <div className="pricing-source-map-head">
                          <span>Мин. вес (кг)</span>
                          <span>Макс. вес (кг)</span>
                          <span>Цена (RUB)</span>
                          <span></span>
                        </div>
                        {rows.map((row) => (
                          <div key={row.id} className="pricing-source-map-row">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.min_kg}
                              onChange={(event) => setTariffRangesDrafts((prev) => ({
                                ...prev,
                                [item.id]: (prev[item.id] || []).map((entry) => (entry.id === row.id ? { ...entry, min_kg: event.target.value } : entry)),
                              }))}
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="пусто = бесконечность"
                              value={row.max_kg}
                              onChange={(event) => setTariffRangesDrafts((prev) => ({
                                ...prev,
                                [item.id]: (prev[item.id] || []).map((entry) => (entry.id === row.id ? { ...entry, max_kg: event.target.value } : entry)),
                              }))}
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.rub}
                              onChange={(event) => setTariffRangesDrafts((prev) => ({
                                ...prev,
                                [item.id]: (prev[item.id] || []).map((entry) => (entry.id === row.id ? { ...entry, rub: event.target.value } : entry)),
                              }))}
                            />
                            <button type="button" onClick={() => onRemoveTariffRange(item.id, row.id)}>Удалить</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => onAddTariffRange(item.id)}>Добавить диапазон</button>
                      </div>
                    );
                  };
                  return (
                    <div key={`tariff-main-${supplier.id}`} style={{ marginBottom: "1rem" }}>
                      {renderTariffCard(supplier, supplier.name)}
                      {altItems.map((alt, idx) => renderTariffCard(alt, `ALT ${idx + 1} ${supplier.name}`))}
                      <div className="pricing-source-map-row">
                        <input
                          type="text"
                          placeholder={`ALT ${altItems.length + 1} ${supplier.name}`}
                          value={altDraft.name}
                          onChange={(event) =>
                            setNewAltByMainId((prev) => ({
                              ...prev,
                              [supplier.id]: { ...altDraft, name: event.target.value },
                            }))
                          }
                        />
                        <button type="button" disabled={altItems.length >= 3} onClick={() => void onCreateAltSupplier(supplier.id)}>
                          {altItems.length >= 3 ? "Лимит 3" : "Создать ALT"}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="pricing-source-map-row">
                  <input
                    type="text"
                    placeholder="Название нового тарифа"
                    value={newSupplierName}
                    onChange={(event) => setNewSupplierName(event.target.value)}
                  />
                  <button type="button" onClick={() => void onCreateMainSupplier()}>
                    Создать тариф
                  </button>
                </div>
              </div>

              <h3 className="with-help">
                Настройки по источникам
                <HelpHint text="Для каждого магазина выбирается базовый тариф, доплата к выкупу и параметры промокода. ALT-тариф применяется автоматически при превышении ATH порога alt-доставки." />
              </h3>
              <div className="pricing-source-map-list">
                <div className="pricing-source-map-head">
                  <span>Источник</span>
                  <span>Тариф</span>
                  <span>Выкуп + (USD)</span>
                  <span>Выкуп + (EUR)</span>
                  <span>Выкуп + (GBP)</span>
                  <span>PROMO (%)</span>
                  <span>Промокод</span>
                </div>
                {sources.map((source) => {
                  const draft = sourcePricingDrafts[source.key];
                  const sourceSupplierRaw = Number(source.supplier_id ?? 0);
                  const resolvedMainSupplierId = sourceSupplierRaw > 0
                    ? (mainSupplierIdByAnySupplierId.get(sourceSupplierRaw) || sourceSupplierRaw)
                    : 0;
                  return (
                    <div key={source.key} className="pricing-source-map-row">
                      <span className="muted">{source.name}</span>
                      <select
                        value={draft?.supplierId ?? String(resolvedMainSupplierId || "")}
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
                        {mainPricingSuppliers.map((supplier) => (
                          <option key={`source-${source.key}-supplier-${supplier.id}`} value={supplier.id}>
                            {supplier.name}
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
                                supplierId: String(resolvedMainSupplierId || ""),
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
                                  supplierId: String(resolvedMainSupplierId || ""),
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
          {weightTabLoading ? <AdminWeightSkeleton /> : (
            <div className="weight-layout">
              <section>
                <h2>Настройки веса</h2>
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
              </section>
              <section>
              <h2>Товары без определенного веса</h2>
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
              </section>
            </div>
          )}
        </div>
      ) : null}

      {tab === "settings" ? (
        <div className="card">
          <h2>Параметры витрины</h2>
          {(pricingTabLoading && !pricingSettings) ? <AdminSettingsSkeleton /> : null}
          <div className="pricing-settings-grid" style={{ marginBottom: "1rem" }}>
            <label className="pricing-settings-field">
              <span className="muted with-help">
                <span className="pricing-field-label">
                  <span>Минимум товаров у бренда для «Дизайнеров»</span>
                </span>
                <HelpHint text="Бренд попадет в ветку «Дизайнеры», только если у него не меньше этого количества товаров." />
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={designersMinProductsDraft}
                onChange={(event) => setDesignersMinProductsDraft(event.target.value)}
                disabled={!pricingSettings}
              />
            </label>
            <div className="pricing-settings-field">
              <span className="muted with-help">
                <span className="pricing-field-label">
                  <span>Исключать бренды-магазины</span>
                </span>
                <HelpHint text="Если включено, из «Дизайнеров» убираются бренды, которые совпадают с именем/доменом самого источника." />
              </span>
              <label className="ui-switch ui-switch--compact">
                <input
                  type="checkbox"
                  checked={Boolean(pricingSettings?.designers_exclude_store_vendors)}
                  disabled={!pricingSettings}
                  onChange={async (event) => {
                    if (!pricingSettings) {
                      return;
                    }
                    const result = await updatePricingSettings({
                      designers_exclude_store_vendors: Boolean(event.target.checked),
                    });
                    if (!result.ok) {
                      pushToast(result.message);
                    }
                  }}
                />
                <span className="ui-switch-track">
                  <span className="ui-switch-thumb" />
                </span>
                <span className="ui-switch-text">{pricingSettings?.designers_exclude_store_vendors ? "Включено" : "Выключено"}</span>
              </label>
            </div>
            <div className="pricing-settings-field">
              <span className="muted with-help">
                <span className="pricing-field-label">
                  <span>Показывать только доступные товары в дедубликации</span>
                </span>
                <HelpHint text="Если включено, кандидаты в дедубликации формируются только из товаров со статусом «В наличии»." />
              </span>
              <label className="ui-switch ui-switch--compact">
                <input
                  type="checkbox"
                  checked={Boolean(pricingSettings?.dedup_only_available_products)}
                  disabled={!pricingSettings}
                  onChange={async (event) => {
                    if (!pricingSettings) {
                      return;
                    }
                    const result = await updatePricingSettings({
                      dedup_only_available_products: Boolean(event.target.checked),
                    });
                    if (!result.ok) {
                      pushToast(result.message);
                    }
                  }}
                />
                <span className="ui-switch-track">
                  <span className="ui-switch-thumb" />
                </span>
                <span className="ui-switch-text">{pricingSettings?.dedup_only_available_products ? "Включено" : "Выключено"}</span>
              </label>
            </div>
          </div>

          <h2>Медиа витрины</h2>
          <div className="showcase-media-settings">
            <div className="showcase-media-block">
              {showcaseHeroImageId ? <p className="muted">Заставка</p> : null}
              <div
                className="showcase-hero-tile"
                onClick={() => heroInputRef.current?.click()}
                onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    heroInputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-disabled={showcaseSaving}
              >
                {showcaseHeroImageId ? (
                  <>
                    <img src={toImageGatewayUrl(showcaseHeroImageId, { w: 960, h: 420, q: 75 }) || ""} alt="Заставка" loading="lazy" />
                    <button type="button" className="showcase-remove-btn" onClick={(event) => void onRemoveHeroImage(event)}>
                      <IconClose className="icon-svg icon-svg--sm" />
                    </button>
                  </>
                ) : (
                  <IconPlus className="icon-svg icon-svg--sm" />
                )}
              </div>
              <input ref={heroInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(event) => void onPickHeroImage(event)} />
            </div>

            <div className="showcase-media-block">
              <p className="muted">Карусель ({showcaseCarousel.length}/20)</p>
              <div className="showcase-carousel-grid">
                {showcaseCarousel.map((item) => (
                  <div
                    key={item.id}
                    className="showcase-carousel-item"
                    draggable
                    onDragStart={() => setDraggingCarouselId(item.id)}
                    onDragEnd={() => setDraggingCarouselId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => void onReorderCarouselImage(item.id)}
                  >
                    <img src={toImageGatewayUrl(item.id, { w: 480, h: 300, q: 72 }) || ""} alt="Слайд карусели" loading="lazy" />
                    <button type="button" className="showcase-remove-btn" onClick={() => void onRemoveCarouselImage(item.id)}>
                      <IconClose className="icon-svg icon-svg--sm" />
                    </button>
                  </div>
                ))}
                {showcaseCarousel.length < 20 ? (
                  <button type="button" className="showcase-carousel-add" onClick={() => carouselInputRef.current?.click()} disabled={showcaseSaving}>
                    <IconPlus className="icon-svg icon-svg--sm" />
                  </button>
                ) : null}
              </div>
              <input
                ref={carouselInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(event) => void onPickCarouselImages(event)}
              />
            </div>
          </div>

          <h2>Экспорт и импорт настроек</h2>
          {(settingsExportInProgress || settingsImportInProgress) ? <AdminSectionSkeleton rows={2} /> : null}
          <p className="muted">
            Экспортируется конфигурация панели управления: ценообразование, поставщики, источники, правила веса и категории.
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
      </main>
    </div>
  );
}
