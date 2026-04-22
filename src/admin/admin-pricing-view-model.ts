import type { PricingExampleProduct, PricingSettings } from "../shared/live-data-context";
import { normalizeCurrencyCode } from "./admin-constants";
import { escapeLatexText, formatCompactNumber, formatDurationHoursMinutesAgo, normalizeFinalRoundingMode, parseApiDate, renderLatexBlock, renderLatexInline, toFiniteNumber } from "./admin-formatters";
import type { BybitWorkerInfo, PricingExampleView } from "./admin-types";

export function isPricingBlockedByInitialBybit(pricingSettings: PricingSettings | null): boolean {
  if (!pricingSettings) {
    return false;
  }
  const hasSuccessfulRefresh = Boolean(pricingSettings.bybit_last_updated_at);
  const status = String(pricingSettings.bybit_rate_status || "").toLowerCase();
  const failedNow = status === "fallback_stored" || status === "unknown";
  return !hasSuccessfulRefresh && failedNow;
}

export function buildBybitWorkerInfo(pricingSettings: PricingSettings | null, nowTickMs: number): BybitWorkerInfo {
  if (!pricingSettings) {
    return {
      stateLabel: "Нет данных",
      stateClass: "status-pill status-pill--muted",
      intervalSec: 0,
      intervalLabel: "-",
      ageLabel: "-",
      errorMessage: null,
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
}

export function buildPricingExampleView(
  pricingExampleProduct: PricingExampleProduct | null,
  pricingSettings: PricingSettings | null,
): PricingExampleView | null {
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
    "SP", "SPU", "SPE", "SPR", "BBR", "BEX", "BFX", "E2U", "G2U", "PRM", "BSC", "BUY", "PFRP", "PFR",
    "THR", "DUT", "CPR", "CFX", "CDR", "SSR", "SUP", "RNG", "INS", "SVC", "SUB", "SUBM", "TXR", "TAX", "MUP", "RND", "FPR",
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
    imageUrl: product.image_url ? String(product.image_url) : "",
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
