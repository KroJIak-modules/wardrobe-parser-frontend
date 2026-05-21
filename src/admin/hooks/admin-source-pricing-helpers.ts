import { normalizeCurrencyCode } from "../admin-constants";
import { buildTriCurrencyDraft, currencyToAmountKey, formatCompactNumber, fromRubByRates, toRubByRates } from "../admin-formatters";
import type { CurrencyCode, PricingFieldKey, PricingSettings, TriCurrencyAmountKey, TriCurrencyDraft } from "../admin-types";

export type SourcePricingDraft = {
  supplierId: string;
  promoPercent: string;
  promoOnlyNoDiscount: boolean;
  buyout: TriCurrencyDraft;
};

export type SourceEntry = {
  key: string;
  supplier_id: number | null;
  promo_factor: number;
  promo_only_no_discount: boolean;
  buyout_surcharge_value: number;
  buyout_surcharge_currency: string;
};

export type PricingRates = {
  usdToRub: number;
  eurToRub: number;
  gbpToRub: number;
};

export function computePricingRates(pricingSettings: PricingSettings | null, pricingDrafts: Record<PricingFieldKey, string>): PricingRates {
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
  return { usdToRub, eurToRub: usdToRub * eurToUsd, gbpToRub: usdToRub * gbpToUsd };
}

export function buildThresholdDraft(pricingSettings: PricingSettings, rates: PricingRates): TriCurrencyDraft {
  const thresholdEur = Number(pricingSettings.customs_threshold_eur);
  const thresholdRub = thresholdEur * rates.eurToRub;
  const thresholdUsd = rates.usdToRub > 0 ? thresholdRub / rates.usdToRub : 0;
  return {
    currency: normalizeCurrencyCode(pricingSettings.customs_threshold_currency, "EUR"),
    rub: formatCompactNumber(thresholdRub, 4),
    usd: formatCompactNumber(thresholdUsd, 4),
    eur: formatCompactNumber(thresholdEur, 4),
    gbp: formatCompactNumber(fromRubByRates(thresholdRub, "GBP", rates.usdToRub, rates.eurToRub, rates.gbpToRub), 4),
  };
}

export function rebuildTriCurrencyDraft(current: TriCurrencyDraft, field: TriCurrencyAmountKey, raw: string, rates: PricingRates): TriCurrencyDraft {
  const next = { ...current, [field]: raw };
  const parsed = Number(raw.trim());
  if (!Number.isFinite(parsed) || parsed < 0) {
    return next;
  }
  return buildTriCurrencyDraft(field.toUpperCase() as CurrencyCode, parsed, rates.usdToRub, rates.eurToRub, rates.gbpToRub);
}

export function buildSourceDraft(source: SourceEntry, rates: PricingRates): SourcePricingDraft {
  const sourceSupplierRaw = Number(source.supplier_id ?? 0);
  const rawBuyoutCurrency = normalizeCurrencyCode(source.buyout_surcharge_currency || "USD", "USD");
  const buyoutCurrency: CurrencyCode = rawBuyoutCurrency === "RUB" ? "USD" : rawBuyoutCurrency;
  const buyoutValue = Number(source.buyout_surcharge_value || 0);
  const buyoutRub = toRubByRates(
    buyoutValue,
    normalizeCurrencyCode(source.buyout_surcharge_currency || "RUB", "RUB"),
    rates.usdToRub,
    rates.eurToRub,
    rates.gbpToRub
  );
  const promoFactor = Number(source.promo_factor ?? 1);
  const promoPercent = Math.max(0, Math.min(100, (1 - promoFactor) * 100));
  return {
    supplierId: String(sourceSupplierRaw || ""),
    promoPercent: formatCompactNumber(promoPercent, 4),
    promoOnlyNoDiscount: Boolean(source.promo_only_no_discount),
    buyout: {
      currency: buyoutCurrency,
      usd: formatCompactNumber(fromRubByRates(buyoutRub, "USD", rates.usdToRub, rates.eurToRub, rates.gbpToRub), 4),
      eur: formatCompactNumber(fromRubByRates(buyoutRub, "EUR", rates.usdToRub, rates.eurToRub, rates.gbpToRub), 4),
      gbp: formatCompactNumber(fromRubByRates(buyoutRub, "GBP", rates.usdToRub, rates.eurToRub, rates.gbpToRub), 4),
      rub: formatCompactNumber(buyoutRub, 4),
    },
  };
}

export function toSourceSyncPayload(source: SourceEntry, draft: SourcePricingDraft, rates: PricingRates) {
  const supplierParsed = Number((draft.supplierId || "").trim());
  const promoPercentParsed = Number((draft.promoPercent || "").trim());
  const normalizedTargetCurrency = normalizeCurrencyCode(draft.buyout.currency, "USD");
  const targetBuyoutCurrency: CurrencyCode = normalizedTargetCurrency === "RUB" ? "USD" : normalizedTargetCurrency;
  const targetBuyoutField = currencyToAmountKey(targetBuyoutCurrency);
  const targetBuyoutParsed = Number(String(draft.buyout[targetBuyoutField] || "").trim());
  if (!Number.isFinite(supplierParsed) || supplierParsed <= 0) {
    return null;
  }
  if (!Number.isFinite(promoPercentParsed) || promoPercentParsed < 0 || promoPercentParsed > 100) {
    return null;
  }
  if (!Number.isFinite(targetBuyoutParsed) || targetBuyoutParsed < 0) {
    return null;
  }
  const targetSupplierId = Math.round(supplierParsed);
  const targetPromoFactor = Number((1 - promoPercentParsed / 100).toFixed(6));
  const targetBuyoutValue = Number(targetBuyoutParsed.toFixed(6));
  const targetBuyoutRub = toRubByRates(targetBuyoutValue, targetBuyoutCurrency, rates.usdToRub, rates.eurToRub, rates.gbpToRub);
  const sourceBuyoutCurrency = normalizeCurrencyCode(source.buyout_surcharge_currency || "RUB", "RUB");
  const sourceBuyoutRub = toRubByRates(Number(source.buyout_surcharge_value || 0), sourceBuyoutCurrency, rates.usdToRub, rates.eurToRub, rates.gbpToRub);
  const noChanges =
    Number(source.supplier_id ?? 0) === targetSupplierId
    && Math.abs(Number(source.promo_factor ?? 1) - targetPromoFactor) <= 0.000001
    && Boolean(source.promo_only_no_discount) === Boolean(draft.promoOnlyNoDiscount)
    && Math.abs(sourceBuyoutRub - targetBuyoutRub) <= 0.000001
    && sourceBuyoutCurrency === targetBuyoutCurrency;
  if (noChanges) {
    return null;
  }
  return {
    supplier_id: targetSupplierId,
    promo_factor: targetPromoFactor,
    promo_only_no_discount: Boolean(draft.promoOnlyNoDiscount),
    buyout_surcharge_value: targetBuyoutValue,
    buyout_surcharge_currency: targetBuyoutCurrency,
  };
}
