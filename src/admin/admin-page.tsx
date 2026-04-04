import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { renderToString } from "katex";
import "katex/dist/katex.min.css";
import { useLiveData, type PricingSettings } from "../shared/live-data-context";
import { toImageGatewayUrl } from "../shared/live-data-context";

type AdminTab = "products" | "dedup" | "categories" | "sync" | "sources" | "pricing" | "weight";

type UploadPreview = {
  file: File;
  url: string;
};

type ToastItem = {
  id: number;
  message: string;
};

const tabs: { key: AdminTab; label: string }[] = [
  { key: "products", label: "Все товары" },
  { key: "dedup", label: "Дедубликация" },
  { key: "categories", label: "Категории" },
  { key: "sync", label: "Синхронизация" },
  { key: "sources", label: "Источники" },
  { key: "pricing", label: "Ценообразование" },
  { key: "weight", label: "Вес" },
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
const PAGE_SIZE = 200;
const NO_BRAND_VALUE = "__NO_BRAND__";
const pricingNumericKeys = [
  "markup_multiplier",
  "weight_tolerance",
  "customs_duty_rate",
  "usd_to_rub",
  "eur_to_rub",
] as const;
type PricingFieldKey = (typeof pricingNumericKeys)[number];

const legendKeyToLatex: Record<string, string> = {
  SP: "SP",
  SP_EUR: "SP_{EUR}",
  SP_RUB: "SP_{RUB}",
  THR_EUR: "THR_{EUR}",
  DUTY: "DUTY",
  EUR2RUB: "EUR2RUB",
  CDT_EUR: "CDT_{EUR}",
  CDT_RUB: "CDT_{RUB}",
  SDC_RUB: "SDC_{RUB}",
  BSC_RUB: "BSC_{RUB}",
  STC_RUB: "STC_{RUB}",
  MP: "MP",
  WT: "WT",
  WEIGHT_G: "WEIGHT_G",
  STEP: "STEP",
  PROMO: "PROMO",
  SUPPLIER: "SUPPLIER",
  "SSR[SUPPLIER][STEP]": "SSR_{SUPPLIER,STEP}",
  FP_RUB: "FP_{RUB}",
};

const pricingFieldMeta: Array<{ key: PricingFieldKey; symbolLatex: string; label: string; hint: string; step?: string }> = [
  {
    key: "markup_multiplier",
    symbolLatex: "MP",
    label: "Наценка",
    hint: "Во сколько раз увеличиваем итог после всех расходов. Пример: 1.25 = +25%.",
    step: "0.01",
  },
  {
    key: "weight_tolerance",
    symbolLatex: "WT",
    label: "Запас по весу",
    hint: "Коэффициент запаса к весу. Нужен на случай, если фактический вес чуть выше расчетного.",
    step: "0.01",
  },
  {
    key: "customs_duty_rate",
    symbolLatex: "DUTY",
    label: "Ставка пошлины",
    hint: "Процент пошлины на сумму выше порога. Пример: 0.15 = 15%.",
    step: "0.001",
  },
  {
    key: "usd_to_rub",
    symbolLatex: "USD2RUB",
    label: "Курс USD к RUB",
    hint: "Курс доллара к рублю для перевода цены в рубли.",
    step: "0.01",
  },
  {
    key: "eur_to_rub",
    symbolLatex: "EUR2RUB",
    label: "Курс EUR к RUB",
    hint: "Курс евро к рублю для пошлины и перевода цены в рубли.",
    step: "0.01",
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

type CurrencyCode = "RUB" | "USD" | "EUR";

const normalizeCurrencyCode = (value: string | null | undefined, fallback: CurrencyCode = "RUB"): CurrencyCode => {
  const upper = (value || "").trim().toUpperCase();
  if (upper === "RUB" || upper === "USD" || upper === "EUR") {
    return upper;
  }
  return fallback;
};

const toRubByRates = (value: number, currency: CurrencyCode, usdToRub: number, eurToRub: number): number => {
  if (currency === "RUB") {
    return value;
  }
  if (currency === "USD") {
    return value * usdToRub;
  }
  return value * eurToRub;
};

const fromRubByRates = (valueRub: number, currency: CurrencyCode, usdToRub: number, eurToRub: number): number => {
  if (currency === "RUB") {
    return valueRub;
  }
  if (currency === "USD") {
    return usdToRub > 0 ? valueRub / usdToRub : 0;
  }
  return eurToRub > 0 ? valueRub / eurToRub : 0;
};

type TriCurrencyDraft = {
  currency: CurrencyCode;
  rub: string;
  usd: string;
  eur: string;
};

type TriCurrencyAmountKey = "rub" | "usd" | "eur";

const currencyToAmountKey = (currency: CurrencyCode): TriCurrencyAmountKey => {
  if (currency === "RUB") {
    return "rub";
  }
  if (currency === "USD") {
    return "usd";
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
  return "EUR";
};

const parseNonNegativeNumber = (raw: string): number | null => {
  const parsed = Number((raw || "").trim());
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
};

const buildTriCurrencyDraft = (
  activeCurrency: CurrencyCode,
  activeValue: number,
  usdToRub: number,
  eurToRub: number
): TriCurrencyDraft => {
  const rub = toRubByRates(activeValue, activeCurrency, usdToRub, eurToRub);
  const usd = fromRubByRates(rub, "USD", usdToRub, eurToRub);
  const eur = fromRubByRates(rub, "EUR", usdToRub, eurToRub);
  return {
    currency: activeCurrency,
    rub: formatCompactNumber(rub, 4),
    usd: formatCompactNumber(usd, 4),
    eur: formatCompactNumber(eur, 4),
  };
};

const renderLatexInline = (latex: string): string =>
  renderToString(latex, {
    throwOnError: false,
    displayMode: false,
    strict: "ignore",
  });

function HelpHint({ text }: { text: string }) {
  return (
    <span className="help-hint" tabIndex={0} aria-label={text}>
      ?
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
    latestJobDetails,
    loadingMoreProducts,
    error,
    refresh,
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
    dedupCandidates,
    mergeDedupPair,
    rejectDedupPair,
    jobsHistory,
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
    assignSourceSupplier,
  } = useLiveData();

  const [tab, setTab] = useState<AdminTab>("products");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef<number>(1);

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
  const [thresholdDraft, setThresholdDraft] = useState<TriCurrencyDraft | null>(null);
  const [supplierRateDrafts, setSupplierRateDrafts] = useState<Record<number, TriCurrencyDraft>>({});
  const [sourcePricingDrafts, setSourcePricingDrafts] = useState<Record<string, {
    supplierId: string;
    promoPercent: string;
    promoOnlyNoDiscount: boolean;
    sdc: TriCurrencyDraft;
    buyout: TriCurrencyDraft;
  }>>({});
  const [newSupplierName, setNewSupplierName] = useState<string>("");
  const [newSupplierCountryCode, setNewSupplierCountryCode] = useState<string>("CN");
  const [newSupplierRateDraft, setNewSupplierRateDraft] = useState<TriCurrencyDraft>({
    currency: "RUB",
    rub: "0",
    usd: "0",
    eur: "0",
  });
  const productsSentinelRef = useRef<HTMLDivElement | null>(null);
  const [syncInProgressLocal, setSyncInProgressLocal] = useState<boolean>(false);

  const [filteredServerProducts, setFilteredServerProducts] = useState<AdminListProduct[]>([]);
  const [filteredServerTotal, setFilteredServerTotal] = useState<number>(0);
  const [filteredServerHasMore, setFilteredServerHasMore] = useState<boolean>(false);
  const [loadingFilteredServer, setLoadingFilteredServer] = useState<boolean>(false);

  const canRunSync = !latestJob || !["in_progress", "pending"].includes(latestJob.status);
  const canCancelSync = Boolean(latestJob?.can_cancel && latestJob?.job_id);
  const showHeaderSyncProgress = Boolean(syncInProgressLocal || (latestJob && ["in_progress", "pending"].includes(latestJob.status)));

  const pushToast = (message: string) => {
    const text = message.trim();
    if (!text) {
      return;
    }
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, message: text }]);
  };

  const closeToast = (toastId: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== toastId));
  };

  useEffect(() => {
    return () => {
      for (const item of imagePreviews) {
        URL.revokeObjectURL(item.url);
      }
    };
  }, [imagePreviews]);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        closeToast(toast.id);
      }, 4500)
    );
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [toasts]);

  useEffect(() => {
    if (!error) {
      return;
    }
    pushToast(`Error: ${error}`);
  }, [error]);

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

  const flattenedAdminCategories = useMemo(() => {
    const list: { id: number; name: string; effective_keywords: string[] }[] = [];
    const walk = (nodes: typeof adminCategories) => {
      for (const node of nodes) {
        list.push({ id: node.id, name: node.name, effective_keywords: node.effective_keywords || [] });
        walk(node.children);
      }
    };
    walk(adminCategories);
    return list;
  }, [adminCategories]);

  const inferInternalCategoryName = (product: (typeof products)[number]) => {
    const haystack = `${product.title} ${product.vendor || ""} ${product.product_type || ""}`.toLowerCase();
    let best: { name: string; score: number } | null = null;

    for (const category of flattenedAdminCategories) {
      let score = 0;
      for (const keyword of category.effective_keywords) {
        const normalized = keyword.trim().toLowerCase();
        if (!normalized) {
          continue;
        }
        if (haystack.includes(normalized)) {
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

  const pricingRates = useMemo(() => {
    if (!pricingSettings) {
      return { usdToRub: 95, eurToRub: 105 };
    }
    const draftUsd = Number((pricingDrafts.usd_to_rub ?? String(pricingSettings.usd_to_rub)).trim());
    const draftEur = Number((pricingDrafts.eur_to_rub ?? String(pricingSettings.eur_to_rub)).trim());
    const usdToRub = Number.isFinite(draftUsd) && draftUsd > 0 ? draftUsd : Number(pricingSettings.usd_to_rub);
    const eurToRub = Number.isFinite(draftEur) && draftEur > 0 ? draftEur : Number(pricingSettings.eur_to_rub);
    return { usdToRub, eurToRub };
  }, [pricingSettings, pricingDrafts.usd_to_rub, pricingDrafts.eur_to_rub]);

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
        pricingRates.eurToRub
      );
    });
  };

  const setSupplierRateField = (supplierId: number, field: TriCurrencyAmountKey, raw: string) => {
    setSupplierRateDrafts((prev) => {
      const current = prev[supplierId];
      if (!current) {
        return prev;
      }
      const nextCurrent = { ...current, [field]: raw };
      const parsed = parseNonNegativeNumber(raw);
      if (parsed === null) {
        return { ...prev, [supplierId]: nextCurrent };
      }
      return {
        ...prev,
        [supplierId]: buildTriCurrencyDraft(
          amountKeyToCurrency(field),
          parsed,
          pricingRates.usdToRub,
          pricingRates.eurToRub
        ),
      };
    });
  };

  const setNewSupplierRateField = (field: TriCurrencyAmountKey, raw: string) => {
    setNewSupplierRateDraft((prev) => {
      const next = { ...prev, [field]: raw };
      const parsed = parseNonNegativeNumber(raw);
      if (parsed === null) {
        return next;
      }
      return buildTriCurrencyDraft(
        amountKeyToCurrency(field),
        parsed,
        pricingRates.usdToRub,
        pricingRates.eurToRub
      );
    });
  };

  const setSourceSdcField = (sourceKey: string, field: TriCurrencyAmountKey, raw: string) => {
    setSourcePricingDrafts((prev) => {
      const current = prev[sourceKey];
      if (!current) {
        return prev;
      }
      const nextSdc = { ...current.sdc, [field]: raw };
      const parsed = parseNonNegativeNumber(raw);
      if (parsed !== null) {
        const rebuilt = buildTriCurrencyDraft(
          amountKeyToCurrency(field),
          parsed,
          pricingRates.usdToRub,
          pricingRates.eurToRub
        );
        nextSdc.currency = rebuilt.currency;
        nextSdc.rub = rebuilt.rub;
        nextSdc.usd = rebuilt.usd;
        nextSdc.eur = rebuilt.eur;
      }
      return { ...prev, [sourceKey]: { ...current, sdc: nextSdc } };
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
          pricingRates.eurToRub
        );
        nextBuyout.currency = rebuilt.currency;
        nextBuyout.rub = rebuilt.rub;
        nextBuyout.usd = rebuilt.usd;
        nextBuyout.eur = rebuilt.eur;
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
    });
  }, [pricingSettings?.customs_threshold_eur, pricingSettings?.customs_threshold_currency, pricingRates.usdToRub, pricingRates.eurToRub]);

  useEffect(() => {
    if (!pricingSettings || !thresholdDraft) {
      return;
    }
    const usdToRub = pricingRates.usdToRub;
    const eurToRub = pricingRates.eurToRub;
    const activeCurrency = thresholdDraft.currency;
    const activeRaw = thresholdDraft[activeCurrency.toLowerCase() as "rub" | "usd" | "eur"];
    const activeValue = Number((activeRaw || "").trim());
    if (!Number.isFinite(activeValue) || activeValue < 0) {
      return;
    }
    const thresholdRub = toRubByRates(activeValue, activeCurrency, usdToRub, eurToRub);
    const nextThresholdEur = fromRubByRates(thresholdRub, "EUR", usdToRub, eurToRub);
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
  }, [pricingSettings, thresholdDraft, updatePricingSettings, pricingRates.usdToRub, pricingRates.eurToRub]);

  useEffect(() => {
    if (!pricingSettings) {
      return;
    }
    const usdToRub = pricingRates.usdToRub;
    const eurToRub = pricingRates.eurToRub;
    setSupplierRateDrafts((prev) => {
      const next = { ...prev };
      for (const supplier of pricingSettings.suppliers || []) {
        const rub = Number(supplier.rate_per_500g_rub);
        const usd = fromRubByRates(rub, "USD", usdToRub, eurToRub);
        const eur = fromRubByRates(rub, "EUR", usdToRub, eurToRub);
        next[supplier.id] = {
          currency: normalizeCurrencyCode(supplier.rate_currency, "RUB"),
          rub: formatCompactNumber(rub, 4),
          usd: formatCompactNumber(usd, 4),
          eur: formatCompactNumber(eur, 4),
        };
      }
      return next;
    });
  }, [pricingSettings?.suppliers, pricingRates.usdToRub, pricingRates.eurToRub]);

  useEffect(() => {
    if (!pricingSettings) {
      return;
    }
    const usdToRub = pricingRates.usdToRub;
    const eurToRub = pricingRates.eurToRub;
    const timers: number[] = [];
    for (const supplier of pricingSettings.suppliers || []) {
      const draft = supplierRateDrafts[supplier.id];
      if (!draft) {
        continue;
      }
      const activeCurrency = normalizeCurrencyCode(draft.currency, "RUB");
      const activeRaw = draft[activeCurrency.toLowerCase() as "rub" | "usd" | "eur"];
      const activeValue = Number((activeRaw || "").trim());
      if (!Number.isFinite(activeValue) || activeValue < 0) {
        continue;
      }
      const targetRub = toRubByRates(activeValue, activeCurrency, usdToRub, eurToRub);
      const currentRub = Number(supplier.rate_per_500g_rub);
      const currentCurrency = normalizeCurrencyCode(supplier.rate_currency, "RUB");
      if (Math.abs(currentRub - targetRub) <= 0.0001 && currentCurrency === activeCurrency) {
        continue;
      }
      const timer = window.setTimeout(async () => {
        const result = await updatePricingSupplier(supplier.id, {
          rate_currency: activeCurrency,
          rate_per_500g_value: Number(activeValue.toFixed(6)),
          max_step_500g: Math.max(1, Number(supplier.max_step_500g) || 120),
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
  }, [pricingSettings, supplierRateDrafts, updatePricingSupplier, pricingRates.usdToRub, pricingRates.eurToRub]);

  useEffect(() => {
    if (!sources || sources.length === 0) {
      return;
    }
    setSourcePricingDrafts((prev) => {
      const next = { ...prev };
      for (const source of sources) {
        const sdcRub = Number(source.seller_delivery_rub || 0);
        const sdcUsd = fromRubByRates(sdcRub, "USD", pricingRates.usdToRub, pricingRates.eurToRub);
        const sdcEur = fromRubByRates(sdcRub, "EUR", pricingRates.usdToRub, pricingRates.eurToRub);
        const buyoutCurrency = normalizeCurrencyCode(source.buyout_surcharge_currency || "RUB", "RUB");
        const buyoutValue = Number(source.buyout_surcharge_value || 0);
        const buyoutRub = toRubByRates(buyoutValue, buyoutCurrency, pricingRates.usdToRub, pricingRates.eurToRub);
        const buyoutUsd = fromRubByRates(buyoutRub, "USD", pricingRates.usdToRub, pricingRates.eurToRub);
        const buyoutEur = fromRubByRates(buyoutRub, "EUR", pricingRates.usdToRub, pricingRates.eurToRub);
        const promoFactor = Number(source.promo_factor ?? 1);
        const promoPercent = Math.max(0, Math.min(100, (1 - promoFactor) * 100));
        next[source.key] = {
          supplierId: String(source.supplier_id ?? ""),
          promoPercent: formatCompactNumber(promoPercent, 4),
          promoOnlyNoDiscount: Boolean(source.promo_only_no_discount),
          sdc: {
            currency: "RUB",
            rub: formatCompactNumber(sdcRub, 4),
            usd: formatCompactNumber(sdcUsd, 4),
            eur: formatCompactNumber(sdcEur, 4),
          },
          buyout: {
            currency: buyoutCurrency,
            rub: formatCompactNumber(buyoutRub, 4),
            usd: formatCompactNumber(buyoutUsd, 4),
            eur: formatCompactNumber(buyoutEur, 4),
          },
        };
      }
      return next;
    });
  }, [sources, pricingRates.usdToRub, pricingRates.eurToRub]);

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
      const sdcRubParsed = Number((draft.sdc.rub || "").trim());
      const targetBuyoutCurrency = normalizeCurrencyCode(draft.buyout.currency, "RUB");
      const targetBuyoutField = currencyToAmountKey(targetBuyoutCurrency);
      const targetBuyoutRaw = String(draft.buyout[targetBuyoutField] || "").trim();
      const targetBuyoutParsed = Number(targetBuyoutRaw);
      if (!Number.isFinite(supplierParsed) || supplierParsed <= 0) {
        continue;
      }
      if (!Number.isFinite(promoPercentParsed) || promoPercentParsed < 0 || promoPercentParsed > 100) {
        continue;
      }
      if (!Number.isFinite(sdcRubParsed) || sdcRubParsed < 0) {
        continue;
      }
      if (!Number.isFinite(targetBuyoutParsed) || targetBuyoutParsed < 0) {
        continue;
      }
      const targetSupplierId = Math.round(supplierParsed);
      const targetPromoFactor = Number((1 - (promoPercentParsed / 100)).toFixed(6));
      const targetSdcRub = Number(sdcRubParsed.toFixed(6));
      const targetBuyoutValue = Number(targetBuyoutParsed.toFixed(6));
      const targetBuyoutRub = toRubByRates(
        targetBuyoutValue,
        targetBuyoutCurrency,
        pricingRates.usdToRub,
        pricingRates.eurToRub
      );
      const targetPromoOnlyNoDiscount = Boolean(draft.promoOnlyNoDiscount);
      const sourceSupplierId = Number(source.supplier_id ?? 0);
      const sourcePromoFactor = Number(source.promo_factor ?? 1);
      const sourceSdcRub = Number(source.seller_delivery_rub ?? 0);
      const sourcePromoMode = Boolean(source.promo_only_no_discount);
      const sourceBuyoutCurrency = normalizeCurrencyCode(source.buyout_surcharge_currency || "RUB", "RUB");
      const sourceBuyoutValue = Number(source.buyout_surcharge_value || 0);
      const sourceBuyoutRub = toRubByRates(
        sourceBuyoutValue,
        sourceBuyoutCurrency,
        pricingRates.usdToRub,
        pricingRates.eurToRub
      );
      if (
        sourceSupplierId === targetSupplierId
        && Math.abs(sourcePromoFactor - targetPromoFactor) <= 0.000001
        && Math.abs(sourceSdcRub - targetSdcRub) <= 0.000001
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
          seller_delivery_rub: targetSdcRub,
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
  }, [sources, sourcePricingDrafts, assignSourceSupplier, pricingRates.usdToRub, pricingRates.eurToRub]);

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
    return renderLatexInline(pricingSettings.formula_latex);
  }, [pricingSettings?.formula_latex]);

  const pricingExample = useMemo(() => {
    const eurToRub = pricingSettings ? Number(pricingSettings.eur_to_rub) : null;
    const usdToRub = pricingSettings ? Number(pricingSettings.usd_to_rub) : null;
    for (const product of products) {
      const components = (product.pricing_components || {}) as Record<string, unknown>;
      const finalPrice = toFiniteNumber(product.final_price);
      const sourcePriceRub = toFiniteNumber(components.source_price_rub);
      const sourcePriceEur = toFiniteNumber(components.source_price_eur);
      const sourcePriceRaw = toFiniteNumber(components.source_price) ?? toFiniteNumber(product.source_price) ?? toFiniteNumber(product.price);
      const sourceCurrency = normalizeCurrencyCode(
        String(components.source_currency || product.source_currency || product.currency || "USD"),
        "USD"
      );
      const spAfterPromo = toFiniteNumber(components.sp_after_promo_rub);
      const customsRub = toFiniteNumber(components.customs_duty_rub);
      const sellerDeliveryRub = toFiniteNumber(components.seller_delivery_rub);
      const supplierTransportRub = toFiniteNumber(components.supplier_transport_rub);
      const customsThresholdEur = toFiniteNumber(components.customs_threshold_eur);
      const customsDutyRate = toFiniteNumber(components.customs_duty_rate);
      const weightGrams = toFiniteNumber(components.weight_grams);
      const weightTolerance = toFiniteNumber(components.weight_tolerance);
      const shippingSteps = toFiniteNumber(components.shipping_steps_500g);
      const promoFactor = toFiniteNumber(components.promo_factor);
      const markup = toFiniteNumber(components.markup_multiplier);
      const supplierName = String(components.supplier_name || "Default Supplier");
      if (
        finalPrice === null
        || sourcePriceRub === null
        || sourcePriceEur === null
        || sourcePriceRaw === null
        || spAfterPromo === null
        || customsRub === null
        || sellerDeliveryRub === null
        || supplierTransportRub === null
        || customsThresholdEur === null
        || customsDutyRate === null
        || weightGrams === null
        || weightTolerance === null
        || shippingSteps === null
        || promoFactor === null
        || usdToRub === null
        || eurToRub === null
        || markup === null
      ) {
        continue;
      }

      const supplierLabelLatex = `\\text{${escapeLatexText(supplierName)}}`;
      const thresholdRub = customsThresholdEur * eurToRub;
      const thresholdInSource = fromRubByRates(thresholdRub, sourceCurrency, usdToRub, eurToRub);
      const sourceToRub = sourceCurrency === "USD" ? usdToRub : sourceCurrency === "EUR" ? eurToRub : 1;
      const sourceToRubLabel = sourceCurrency === "RUB" ? "RUB2RUB" : `${sourceCurrency}2RUB`;
      const exampleLatex =
        `\\left\\lceil\\Big(` +
        `\\underbrace{${formatCompactNumber(sourcePriceRub)}}_{SP_{RUB}}\\cdot\\underbrace{${formatCompactNumber(promoFactor, 4)}}_{PROMO}` +
        `+\\underbrace{\\max\\!\\left(0,\\underbrace{${formatCompactNumber(sourcePriceRaw)}}_{SP_{${sourceCurrency}}}-\\underbrace{${formatCompactNumber(thresholdInSource)}}_{THR_{${sourceCurrency}}}\\right)\\cdot\\underbrace{${formatCompactNumber(customsDutyRate, 4)}}_{DUTY}\\cdot\\underbrace{${formatCompactNumber(sourceToRub)}}_{${sourceToRubLabel}}}_{CDT_{RUB}=${formatCompactNumber(customsRub)}}` +
        `+\\underbrace{${formatCompactNumber(sellerDeliveryRub)}}_{SDC_{RUB}}` +
        `+\\underbrace{${formatCompactNumber(supplierTransportRub)}}_{STC_{RUB}=SSR[\\underbrace{${supplierLabelLatex}}_{SUPPLIER}][\\underbrace{\\left\\lceil\\frac{\\underbrace{${formatCompactNumber(weightGrams)}}_{WEIGHT_G}\\cdot\\underbrace{${formatCompactNumber(weightTolerance, 4)}}_{WT}}{500}\\right\\rceil}_{STEP}]}` +
        `\\Big)\\cdot\\underbrace{${formatCompactNumber(markup, 4)}}_{MP}\\right\\rceil`;
      const summarySpLatex = renderLatexInline("SP");
      const summaryFpLatex = renderLatexInline("FP_{RUB}");
      const summaryRubLatex = renderLatexInline("SP_{RUB}");
      const marginRub = Math.round(finalPrice) - sourcePriceRub;
      return {
        productId: product.id,
        title: product.title,
        url: product.url,
        imageUrl: toImageGatewayUrl(product.image_ids?.[0]) || product.image_urls?.[0] || "",
        finalPrice: Math.round(finalPrice),
        sourcePrice: sourcePriceRaw,
        sourcePriceRub,
        sourceCurrency,
        summarySpLatex,
        summaryFpLatex,
        summaryRubLatex,
        marginRub,
        formulaHtml: renderLatexInline(exampleLatex),
      };
    }
    return null;
  }, [products, pricingSettings]);

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
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        setLoadingFilteredServer(true);
        const params = buildFilterQuery();
        params.set("offset", "0");
        const res = await fetch(`${API_BASE}/products?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Products API error: ${res.status}`);
        }
        const payload = (await res.json()) as { items: AdminListProduct[]; total: number; offset: number };
        if (cancelled) {
          return;
        }
        const items = payload.items || [];
        setFilteredServerProducts(items);
        setFilteredServerTotal(payload.total || 0);
        setFilteredServerHasMore(items.length + (payload.offset || 0) < (payload.total || 0));
      } catch (e) {
        if (!cancelled) {
          pushToast(e instanceof Error ? e.message : "Ошибка фильтрации");
        }
      } finally {
        if (!cancelled) {
          setLoadingFilteredServer(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [hasActiveFilters, productSearch, productSourceFilter, productVendorFilter, productTypeFilter, productStatusFilter]);

  const loadMoreFilteredProducts = async () => {
    if (!filteredServerHasMore || loadingFilteredServer) {
      return;
    }
    try {
      setLoadingFilteredServer(true);
      const params = buildFilterQuery();
      params.set("offset", String(filteredServerProducts.length));
      const res = await fetch(`${API_BASE}/products?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Products API error: ${res.status}`);
      }
      const payload = (await res.json()) as { items: AdminListProduct[]; total: number; offset: number };
      const nextItems = payload.items || [];
      setFilteredServerProducts((prev) => {
        const known = new Set(prev.map((item) => item.id));
        const toAdd = nextItems.filter((item) => !known.has(item.id));
        return [...prev, ...toAdd];
      });
      setFilteredServerTotal(payload.total || 0);
      setFilteredServerHasMore(nextItems.length + (payload.offset || 0) < (payload.total || 0));
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
    filteredServerProducts.length,
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

  const latestProblemSources = useMemo(() => {
    const sourceRuns = latestJobDetails?.source_runs || [];
    return sourceRuns
      .filter((run) => run.status === "partial" || run.status === "failed")
      .map((run) => ({
        ...run,
        sourceName: sourceById.get(run.source_id)?.name || `#${run.source_id}`,
        sourceUrl: sourceById.get(run.source_id)?.base_url || "",
      }))
      .sort((left, right) => {
        if (left.status !== right.status) {
          return left.status === "failed" ? -1 : 1;
        }
        return right.products_failed - left.products_failed;
      });
  }, [latestJobDetails?.source_runs, sourceById]);

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

  const statusBadge = (status: string) => {
    if (status === "available") {
      return { label: "Доступен", cls: "status-pill status-pill--ok" };
    }
    if (status === "out_of_stock") {
      return { label: "Нет в наличии", cls: "status-pill status-pill--bad" };
    }
    return { label: "Comming soon", cls: "status-pill status-pill--muted" };
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
    setSyncInProgressLocal(true);
    const result = await runSync();
    setSyncInProgressLocal(false);
    if (!result.ok) {
      pushToast(result.message);
    }
    await refresh();
  };

  const onCancelSync = async () => {
    if (!latestJob?.job_id) {
      return;
    }
    const result = await cancelSync(latestJob.job_id);
    pushToast(result.message);
    await refresh();
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
      await refresh();
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
    }
  };

  const onAddKeyword = async () => {
    if (!selectedCategoryId || !keywordInput.trim()) {
      return;
    }
    const result = await addCategoryKeyword(selectedCategoryId, keywordInput.trim());
    if (result.ok) {
      setKeywordInput("");
    } else {
      pushToast(result.message);
    }
  };

  const onRemoveKeyword = async (keyword: string) => {
    if (!selectedCategoryId) {
      return;
    }
    const result = await removeCategoryKeyword(selectedCategoryId, keyword);
    if (!result.ok) {
      pushToast(result.message);
    }
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

  const onCreatePricingSupplier = async () => {
    const name = newSupplierName.trim();
    const countryCode = newSupplierCountryCode.trim().toUpperCase();
    const countryName = countryCode;
    const activeCurrency = normalizeCurrencyCode(newSupplierRateDraft.currency, "RUB");
    const activeField = currencyToAmountKey(activeCurrency);
    const parsedRate = Number((newSupplierRateDraft[activeField] || "").trim());
    if (!name) {
      pushToast("Название поставщика обязательно");
      return;
    }
    if (!countryCode || countryCode.length < 2) {
      pushToast("Код страны должен быть минимум из 2 символов");
      return;
    }
    if (!countryName) {
      pushToast("Название страны обязательно");
      return;
    }
    if (!Number.isFinite(parsedRate) || parsedRate < 0) {
      pushToast("Тариф должен быть числом >= 0");
      return;
    }
    const result = await createPricingSupplier({
      name,
      country_code: countryCode,
      country_name: countryName,
      rate_currency: activeCurrency,
      rate_per_500g_value: Number(parsedRate.toFixed(4)),
      max_step_500g: 120,
    });
    pushToast(result.message);
    if (result.ok) {
      setNewSupplierName("");
      setNewSupplierRateDraft({ currency: "RUB", rub: "0", usd: "0", eur: "0" });
    }
  };

  const onDeletePricingSupplier = async (supplierId: number, supplierKey: string) => {
    if (supplierKey === "default") {
      return;
    }
    const result = await deletePricingSupplier(supplierId);
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

  const renderTree = (nodes: typeof adminCategories, depth = 0) => {
    return (
      <div className="cat-tree-column">
        {nodes.map((node) => {
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
                <button
                  type="button"
                  className="tree-plus"
                  title="Добавить дочернюю категорию"
                  onClick={() => onStartCategoryCreate(node.id)}
                >
                  +
                </button>
                <span className="muted">{node.is_fallback ? "fallback" : `${node.keywords.length} ключей`}</span>
              </div>
              {node.children.length > 0 ? <div className="cat-tree-children">{renderTree(node.children, depth + 1)}</div> : null}
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
          <button type="button" onClick={onRunSync} disabled={!canRunSync || syncInProgressLocal}>
            {syncInProgressLocal ? "Синхронизация..." : "Синхронизировать товары"}
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
        {showHeaderSyncProgress && latestJob ? (
          <div className="muted">
            <p>
              Sync status: {latestJob.status}
              {" | "}
              Sources: {latestJob.progress_percent}% ({latestJob.processed_sources}/{latestJob.total_sources})
            </p>
            <p>
              Products: {latestJob.products_progress_percent}% ({latestJob.processed_products}/{latestJob.expected_products || "?"})
              {latestJob.failed_products > 0 ? ` | Failed: ${latestJob.failed_products}` : ""}
              {" | "}
              On site: {latestJob.site_products_total}
            </p>
            <p>
              Current source: {latestJob.current_source_name || "-"}
              {latestJob.current_source_index > 0 ? ` (${latestJob.current_source_index}/${latestJob.total_sources})` : ""}
              {" | "}
              Stage: {latestJob.current_stage || "-"}
              {" | "}
              Source products: {latestJob.current_source_processed_products}/{latestJob.current_source_total_products || "?"}
            </p>
            <p>
              Current product: {latestJob.current_product_title || "-"}
            </p>
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
            {hasActiveFilters && !productSourceFilter
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
                <option value="discontinued">Comming soon</option>
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
                          {toImageGatewayUrl(product.image_ids?.[0]) ? (
                            <img className="thumb-mini-image" src={toImageGatewayUrl(product.image_ids?.[0]) || undefined} alt={product.title} />
                          ) : (
                            <div className="thumb-mini">{product.image_count > 0 ? `${product.image_count} фото` : "Нет фото"}</div>
                          )}
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
                        <td>{inferInternalCategoryName(product)}</td>
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
              {displayedProducts.length === 0 ? <p className="muted">По текущим фильтрам товаров нет</p> : null}
              {displayedLoadingMore ? <p className="muted">Подгружаем еще товары...</p> : null}
              <div ref={productsSentinelRef} style={{ height: "1px" }} />
            </div>
          </div>
        </div>
      ) : null}

      {tab === "dedup" ? (
        <div className="card">
          <h2>Дедубликация</h2>
          <p className="muted">Кандидатов: {dedupCandidates.length}</p>
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
            {dedupCandidates.length === 0 ? <p className="muted">Кандидатов нет</p> : null}
          </div>
        </div>
      ) : null}

      {tab === "categories" ? (
        <div className="card">
          <h2>Категории</h2>
          <div className="categories-layout">
            <div>
              <div className="actions" style={{ marginBottom: "0.5rem" }}>
                <button type="button" className="tree-plus" onClick={() => onStartCategoryCreate(null)}>
                  + root
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
                    />
                    <button type="button" onClick={onDeleteCategory} disabled={selectedCategory.is_fallback}>
                      Удалить
                    </button>
                    {selectedCategory.is_fallback ? (
                      <p className="muted">Данная категория системная, ее нельзя удалить.</p>
                    ) : null}
                  </div>

                  <p className="muted">Ключевые слова (локальные):</p>
                  <div className="chip-list">
                    {selectedCategory.keywords.map((keyword) => (
                      <span key={keyword} className="tag tag--with-action">
                        <span>{keyword}</span>
                        <button type="button" className="tag-x" onClick={() => void onRemoveKeyword(keyword)}>
                          x
                        </button>
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
                          void onAddKeyword();
                        }
                      }}
                      placeholder="Введите ключ и нажмите Enter"
                      disabled={selectedCategory.is_fallback}
                    />
                    <button type="button" onClick={onAddKeyword} disabled={selectedCategory.is_fallback}>
                      Добавить ключ
                    </button>
                  </div>
                  {selectedCategory.is_fallback ? <p className="muted">У системной категории ключей быть не должно.</p> : null}

                  <p className="muted">Ключевые слова (наследованные):</p>
                  <div className="chip-list">
                    {selectedCategory.effective_keywords
                      .filter((keyword) => !selectedCategory.keywords.includes(keyword))
                      .map((keyword) => (
                        <span key={keyword} className="tag">
                          {keyword}
                        </span>
                      ))}
                  </div>
                </>
              ) : (
                <p className="muted">Выбери категорию в дереве слева, чтобы редактировать название и ключи.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "sync" ? (
        <div className="card">
          <h2>Синхронизация</h2>
          {(() => {
            const minutes = latestJob?.sync_period_minutes || 300;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            const ru = (n: number, one: string, few: string, many: string) => {
              const n10 = n % 10;
              const n100 = n % 100;
              if (n10 === 1 && n100 !== 11) return one;
              if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
              return many;
            };
            const chunks: string[] = [];
            if (hours > 0) {
              chunks.push(`${hours} ${ru(hours, "час", "часа", "часов")}`);
            }
            if (mins > 0) {
              chunks.push(`${mins} ${ru(mins, "минута", "минуты", "минут")}`);
            }
            const periodText = chunks.length > 0 ? chunks.join(" ") : "0 минут";
            return <p className="muted">Период синхронизации: {periodText}</p>;
          })()}
          <p className="muted">Последняя синхронизация: {syncInProgressLocal ? "-" : formatDateTime(latestJob?.completed_at)}</p>
          <p className="muted">Следующая синхронизация: {syncInProgressLocal ? "-" : formatDateTime(latestJob?.next_scheduled_at)}</p>
          <div className="sync-stats">
            <span className="sync-pill sync-pill--new">new: {syncInProgressLocal ? "-" : latestJob?.new_products || 0}</span>
            <span className="sync-pill sync-pill--updated">updated: {syncInProgressLocal ? "-" : latestJob?.updated_products || 0}</span>
            <span className="sync-pill sync-pill--missing">missing: {syncInProgressLocal ? "-" : 0}</span>
          </div>

          <h3 style={{ marginTop: "1rem" }}>Проблемные источники</h3>
          {latestProblemSources.length > 0 ? (
            <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Сайт</th>
                    <th>Статус</th>
                    <th>Discovery</th>
                    <th>Fetched</th>
                    <th>Failed</th>
                    <th>Причина</th>
                  </tr>
                </thead>
                <tbody>
                  {latestProblemSources.map((run) => (
                    <tr key={run.id}>
                      <td>
                        {run.sourceUrl ? (
                          <a className="btn-link" href={run.sourceUrl} target="_blank" rel="noreferrer">
                            {run.sourceName}
                          </a>
                        ) : (
                          run.sourceName
                        )}
                      </td>
                      <td>{run.status}</td>
                      <td>{run.products_discovered}</td>
                      <td>{run.products_fetched}</td>
                      <td>{run.products_failed}</td>
                      <td>{run.error_message || run.discovery_mode || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">
              {latestJobDetails?.id ? "По последней джобе проблемных источников нет." : "Детали последней джобы еще не загружены."}
            </p>
          )}

          <h3 style={{ marginTop: "1rem" }}>История запусков</h3>
          <div className="list">
            {(syncInProgressLocal ? [] : jobsHistory).map((job) => (
              <div key={job.id} className="list-row">
                <div>
                  <strong>{job.id}</strong>
                  <p className="muted">{formatDateTime(job.created_at)}</p>
                  <p className="muted">
                    new={job.new_products} updated={job.updated_products} errors={job.error_count}
                  </p>
                </div>
                <span className="muted">{job.triggered_by}</span>
              </div>
            ))}
            {(syncInProgressLocal || jobsHistory.length === 0) ? <p className="muted">История пуста</p> : null}
          </div>
        </div>
      ) : null}

      {tab === "sources" ? (
        <div className="card">
          <h2>Источники ({sources.length})</h2>
          <div className="list">
            {sources.map((source) => (
              <div key={source.key} className="list-row">
                <div>
                  <strong>{source.name}</strong>
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
          {pricingSettings ? (
            <>
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
                      <p className="pricing-legend-key" dangerouslySetInnerHTML={{ __html: renderLatexInline(legendKeyToLatex[item.key] || `\\text{${item.key}}`) }} />
                      <p className="muted">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pricing-settings-grid">
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
              </div>

              <h3 className="with-help">
                Порог пошлины THR
                <HelpHint text="Укажи порог и валюту. Можно менять сумму в RUB, USD или EUR: остальные поля пересчитаются автоматически." />
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
              </div>

              <h3 className="with-help">
                SSR по поставщикам (за 500г)
                <HelpHint text="Это базовый тариф логистики поставщика за каждые 500 грамм. Для большего веса цена растет по шагам." />
              </h3>
              <div className="pricing-supplier-list">
                <div className="pricing-supplier-list-head">
                  <span>Название</span>
                  <span>Код</span>
                  <span>Цена 500г (RUB)</span>
                  <span>Цена 500г (USD)</span>
                  <span>Цена 500г (EUR)</span>
                  <span></span>
                </div>
                {pricingSuppliers.map((supplier) => {
                  const draft = supplierRateDrafts[supplier.id] || buildTriCurrencyDraft("RUB", Number(supplier.rate_per_500g_rub), pricingRates.usdToRub, pricingRates.eurToRub);
                  return (
                    <div key={supplier.id} className="pricing-supplier-list-row">
                      <span>{supplier.name}</span>
                      <span>{supplier.country_code}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={draft.rub}
                        onChange={(event) => setSupplierRateField(supplier.id, "rub", event.target.value)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={draft.usd}
                        onChange={(event) => setSupplierRateField(supplier.id, "usd", event.target.value)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={draft.eur}
                        onChange={(event) => setSupplierRateField(supplier.id, "eur", event.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => void onDeletePricingSupplier(supplier.id, supplier.key)}
                        disabled={supplier.key === "default"}
                      >
                        Удалить
                      </button>
                    </div>
                  );
                })}
                <div className="pricing-supplier-list-row pricing-supplier-list-row--new">
                  <input value={newSupplierName} onChange={(event) => setNewSupplierName(event.target.value)} />
                  <input
                    value={newSupplierCountryCode}
                    onChange={(event) => {
                      const nextCode = event.target.value.toUpperCase();
                      setNewSupplierCountryCode(nextCode);
                    }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={newSupplierRateDraft.rub}
                    onChange={(event) => setNewSupplierRateField("rub", event.target.value)}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={newSupplierRateDraft.usd}
                    onChange={(event) => setNewSupplierRateField("usd", event.target.value)}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={newSupplierRateDraft.eur}
                    onChange={(event) => setNewSupplierRateField("eur", event.target.value)}
                  />
                  <button type="button" onClick={() => void onCreatePricingSupplier()}>
                    Добавить
                  </button>
                </div>
              </div>

              <h3 className="with-help">
                Настройки по источникам
                <HelpHint text="Для каждого магазина отдельно задаются поставщик, SDC, доплата к выкупу и параметры промокода." />
              </h3>
              <div className="pricing-source-map-list">
                <div className="pricing-source-map-head">
                  <span>Источник</span>
                  <span>Поставщик</span>
                  <span>SDC (RUB)</span>
                  <span>SDC (USD)</span>
                  <span>SDC (EUR)</span>
                  <span>Выкуп + (RUB)</span>
                  <span>Выкуп + (USD)</span>
                  <span>Выкуп + (EUR)</span>
                  <span>PROMO (%)</span>
                  <span>Режим промокода</span>
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
                                sdc: { currency: "RUB", rub: "0", usd: "0", eur: "0" },
                                buyout: { currency: "RUB", rub: "0", usd: "0", eur: "0" },
                              }),
                              supplierId: nextValue,
                            },
                          }));
                        }}
                      >
                        {pricingSuppliers.map((supplier) => (
                          <option key={`source-${source.key}-supplier-${supplier.id}`} value={supplier.id}>
                            {supplier.name} ({supplier.country_name})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={draft?.sdc.rub ?? "0"}
                        onChange={(event) => setSourceSdcField(source.key, "rub", event.target.value)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={draft?.sdc.usd ?? "0"}
                        onChange={(event) => setSourceSdcField(source.key, "usd", event.target.value)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={draft?.sdc.eur ?? "0"}
                        onChange={(event) => setSourceSdcField(source.key, "eur", event.target.value)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={draft?.buyout.rub ?? "0"}
                        onChange={(event) => setSourceBuyoutField(source.key, "rub", event.target.value)}
                      />
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
                                  sdc: { currency: "RUB", rub: "0", usd: "0", eur: "0" },
                                  buyout: { currency: "RUB", rub: "0", usd: "0", eur: "0" },
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
                                  sdc: { currency: "RUB", rub: "0", usd: "0", eur: "0" },
                                  buyout: { currency: "RUB", rub: "0", usd: "0", eur: "0" },
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
          ) : (
            <p className="muted">Загрузка настроек ценообразования...</p>
          )}
        </div>
      ) : null}

      {tab === "weight" ? (
        <div className="card">
          <h2>Настройки веса</h2>
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
                          ✕
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
                  ⇣
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
                + добавить фото
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

      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast-item">
            <span>{toast.message}</span>
            <button type="button" className="toast-close" onClick={() => closeToast(toast.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>

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
