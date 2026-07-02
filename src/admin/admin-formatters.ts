import { renderToString } from "katex";
import { optimizeImageUrl } from "../shared/product-image";
import { dedupActionLabelMap, dedupReasonLabelMap, legendKeyToLatex } from "./admin-constants";
import type { CurrencyCode, FinalRoundingMode, SupplierCategory, TriCurrencyAmountKey, TriCurrencyDraft } from "./admin-types";

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
  return optimizeImageUrl(url, { width, height, quality });
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
  if (raw === "main" || raw === "alternate") {
    return raw;
  }
  if (raw === "alt") {
    return "alternate";
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
  normalizeSupplierCategory(value) === "alternate" ? "Alt" : "Main";

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

const normalizeLocaleNumberInput = (raw: string): string => String(raw ?? "").trim().replace(/\s+/g, "").replace(/,/g, ".");

const parseLocaleNumber = (raw: string): number | null => {
  const normalized = normalizeLocaleNumberInput(raw);
  if (!normalized || !/^(?:\d+|\d+\.\d*|\.\d+)$/.test(normalized)) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseNonNegativeNumber = (raw: string): number | null => {
  const parsed = parseLocaleNumber(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
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

export {
  amountKeyToCurrency,
  buildTriCurrencyDraft,
  currencyToAmountKey,
  escapeLatexText,
  formatCompactNumber,
  formatDedupAction,
  formatDedupReason,
  formatDisplayMoney,
  formatDurationHoursMinutesAgo,
  formatSupplierCategory,
  fromRubByRates,
  normalizeFinalRoundingMode,
  normalizeLocaleNumberInput,
  normalizeSupplierCategory,
  parseApiDate,
  parseLocaleNumber,
  parseNonNegativeNumber,
  renderLatexBlock,
  renderLatexInline,
  renderLegendSymbol,
  toCompressedThumbUrl,
  toFiniteNumber,
  toRubByRates,
};
