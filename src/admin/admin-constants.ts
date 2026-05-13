import type { AdminTab, CurrencyCode, FinalRoundingMode, PricingFieldKey } from "./admin-types";

const tabs: { key: AdminTab; label: string }[] = [
  { key: "products", label: "Все товары" },
  { key: "dedup", label: "Дедубликация" },
  { key: "categories", label: "Категории" },
  { key: "designers", label: "Дизайнеры" },
  { key: "sources", label: "Источники" },
  { key: "pricing", label: "Ценообразование" },
  { key: "weight", label: "Вес" },
  { key: "settings", label: "Настройки" },
];

const tabKeys = new Set<AdminTab>(tabs.map((item) => item.key));
const DEFAULT_ADMIN_TAB: AdminTab = tabs[0]?.key ?? "products";

const currencyOptions = ["RUB", "EUR", "USD"];
const PAGE_SIZE = 100;

const pricingNumericKeys: PricingFieldKey[] = [
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
];

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
  { key: "weight_tolerance", symbolLatex: "WT", label: "Запас по весу", hint: "Запас на случай, если фактический вес окажется больше ожидаемого. Чем выше значение, тем выше расчетная доставка.", step: "0.01" },
  { key: "customs_duty_rate", symbolLatex: "DUT", label: "Ставка пошлины", hint: "Процент пошлины на сумму выше порога. Пример: 0.15 = 15%.", step: "0.001" },
  { key: "customs_processing_rate", symbolLatex: "CPR", label: "Обработка пошлины", hint: "Дополнительная комиссия на саму пошлину. Пример: 0.08 = 8%.", step: "0.001" },
  { key: "customs_fixed_rub", symbolLatex: "CFX", label: "Фикс таможни (RUB)", hint: "Фиксированная добавка к таможне в рублях, если пошлина срабатывает.", step: "0.01" },
  { key: "payment_fee_rate", symbolLatex: "PFRP", label: "Комиссия платёжки", hint: "Комиссия платежной системы с суммы выкупа товара. Пример: 0.02 = 2%.", step: "0.001" },
  { key: "tax_rate", symbolLatex: "TXR", label: "Налог", hint: "Налог на полную итоговую сумму. Пример: 0.06 = 6%.", step: "0.001" },
  { key: "shipping_alt_threshold_eur", symbolLatex: "ATH", label: "Порог alt-доставки", hint: "Если цена товара выше этого порога, для US/EU применяется альтернативный тариф доставки.", step: "0.01" },
  { key: "bybit_extra_rub", symbolLatex: "BEX", label: "Надбавка к курсу", hint: "Надбавка к курсу Bybit в рублях.", step: "0.01" },
  { key: "eur_to_usd_rate", symbolLatex: "E2U", label: "EUR -> USD", hint: "Коэффициент перевода цены товара из EUR в USD.", step: "0.0001" },
  { key: "gbp_to_usd_rate", symbolLatex: "G2U", label: "GBP -> USD", hint: "Коэффициент перевода цены товара из GBP в USD.", step: "0.0001" },
];

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

const dedupActionLabelMap: Record<string, string> = {
  merge: "Оставлен один",
  combine: "Соединены",
  reject: "Не дубль",
};

const normalizeAdminTab = (raw: string | undefined): AdminTab => {
  if (!raw) {
    return DEFAULT_ADMIN_TAB;
  }
  return tabKeys.has(raw as AdminTab) ? (raw as AdminTab) : DEFAULT_ADMIN_TAB;
};

const normalizeCurrencyCode = (value: string | null | undefined, fallback: CurrencyCode = "RUB"): CurrencyCode => {
  const upper = (value || "").trim().toUpperCase();
  if (upper === "RUB" || upper === "USD" || upper === "EUR" || upper === "GBP") {
    return upper;
  }
  return fallback;
};

export {
  currencyOptions,
  dedupActionLabelMap,
  dedupReasonLabelMap,
  DEFAULT_ADMIN_TAB,
  finalRoundingOptions,
  legendKeyToLatex,
  normalizeAdminTab,
  normalizeCurrencyCode,
  PAGE_SIZE,
  pricingFieldMeta,
  pricingNumericKeys,
  tabs,
};
