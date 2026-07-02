import { normalizeCurrencyCode } from "../admin-constants";
import { buildTriCurrencyDraft, currencyToAmountKey, formatCompactNumber, fromRubByRates, parseLocaleNumber, toRubByRates } from "../admin-formatters";
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
  buyout_surcharge_value: number | null;
  buyout_surcharge_currency: string | null;
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
  const draftUsdtToRub = parseLocaleNumber(pricingDrafts.usdt_to_rub_rate ?? String(pricingSettings.usdt_to_rub_rate));
  const draftEurToUsd = parseLocaleNumber(pricingDrafts.eur_to_usd_rate ?? String(pricingSettings.eur_to_usd_rate));
  const draftGbpToUsd = parseLocaleNumber(pricingDrafts.gbp_to_usd_rate ?? String(pricingSettings.gbp_to_usd_rate));
  const usdToRub = Number.isFinite(draftUsdtToRub) && draftUsdtToRub > 0 ? draftUsdtToRub : Number(pricingSettings.usd_to_rub_rate);
  const eurToUsd = Number.isFinite(draftEurToUsd) && draftEurToUsd > 0 ? draftEurToUsd : Number(pricingSettings.eur_to_usd_rate);
  const gbpToUsd = Number.isFinite(draftGbpToUsd) && draftGbpToUsd > 0 ? draftGbpToUsd : Number(pricingSettings.gbp_to_usd_rate);
  const eurToRub = eurToUsd * usdToRub;
  const gbpToRub = gbpToUsd * usdToRub;
  return { usdToRub, eurToRub, gbpToRub };
}

export function buildThresholdDraft(pricingSettings: PricingSettings, rates: PricingRates): TriCurrencyDraft {
  const thresholdEur = Number(pricingSettings.customs_threshold_eur);
  const thresholdRub = thresholdEur * rates.eurToRub;
  const thresholdUsd = rates.usdToRub > 0 ? thresholdRub / rates.usdToRub : 0;
  return {
    currency: "EUR",
    rub: formatCompactNumber(thresholdRub, 4),
    usd: formatCompactNumber(thresholdUsd, 4),
    eur: formatCompactNumber(thresholdEur, 4),
    gbp: "0",
  };
}

export function rebuildTriCurrencyDraft(current: TriCurrencyDraft, field: TriCurrencyAmountKey, raw: string, rates: PricingRates): TriCurrencyDraft {
  const next = { ...current, [field]: raw };
  const parsed = parseLocaleNumber(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return next;
  }
  return buildTriCurrencyDraft(field.toUpperCase() as CurrencyCode, parsed, rates.usdToRub, rates.eurToRub, rates.gbpToRub);
}

export function buildSourceDraft(source: SourceEntry, rates: PricingRates): SourcePricingDraft {
  const sourceSupplierRaw = Number(source.supplier_id ?? 0);
  const promoFactor = Number(source.promo_factor ?? 1);
  const promoPercent = Math.max(0, Math.min(100, (1 - promoFactor) * 100));
  const buyoutValueRaw = source.buyout_surcharge_value;
  const hasBuyoutSurcharge = buyoutValueRaw !== null && buyoutValueRaw !== undefined && Number.isFinite(Number(buyoutValueRaw));
  if (!hasBuyoutSurcharge) {
    return {
      supplierId: String(sourceSupplierRaw || ""),
      promoPercent: formatCompactNumber(promoPercent, 4),
      promoOnlyNoDiscount: Boolean(source.promo_only_no_discount),
      buyout: {
        currency: normalizeCurrencyCode(source.buyout_surcharge_currency || "USD", "USD"),
        usd: "",
        eur: "",
        gbp: "",
        rub: "",
      },
    };
  }
  const buyoutCurrency = normalizeCurrencyCode(source.buyout_surcharge_currency || "USD", "USD");
  const buyoutValue = Number(buyoutValueRaw);
  const buyoutRub = toRubByRates(buyoutValue, buyoutCurrency, rates.usdToRub, rates.eurToRub, rates.gbpToRub);
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
  const promoPercentParsed = parseLocaleNumber(draft.promoPercent);
  if (!Number.isFinite(supplierParsed) || supplierParsed <= 0) {
    return null;
  }
  if (!Number.isFinite(promoPercentParsed) || promoPercentParsed < 0 || promoPercentParsed > 100) {
    return null;
  }
  const targetSupplierId = Math.round(supplierParsed);
  const targetPromoFactor = Number((1 - promoPercentParsed / 100).toFixed(6));
  const hasDraftBuyoutValue = [draft.buyout.rub, draft.buyout.usd, draft.buyout.eur, draft.buyout.gbp].some((value) => String(value || "").trim() !== "");
  let targetBuyoutValue: number | null = null;
  let targetBuyoutCurrency: CurrencyCode | null = null;
  let targetBuyoutRub: number | null = null;
  if (hasDraftBuyoutValue) {
    const normalizedTargetCurrency = normalizeCurrencyCode(draft.buyout.currency, "USD");
    const targetBuyoutField = currencyToAmountKey(normalizedTargetCurrency);
    const targetBuyoutParsed = parseLocaleNumber(String(draft.buyout[targetBuyoutField] || ""));
    if (!Number.isFinite(targetBuyoutParsed) || targetBuyoutParsed < 0) {
      return null;
    }
    targetBuyoutCurrency = normalizedTargetCurrency;
    targetBuyoutValue = Number(targetBuyoutParsed.toFixed(6));
    targetBuyoutRub = toRubByRates(targetBuyoutValue, targetBuyoutCurrency, rates.usdToRub, rates.eurToRub, rates.gbpToRub);
  }
  const sourceBuyoutCurrency = source.buyout_surcharge_currency
    ? normalizeCurrencyCode(source.buyout_surcharge_currency, "RUB")
    : null;
  const sourceBuyoutValue = source.buyout_surcharge_value;
  const sourceBuyoutRub = sourceBuyoutCurrency !== null && sourceBuyoutValue !== null && sourceBuyoutValue !== undefined
    ? toRubByRates(Number(sourceBuyoutValue), sourceBuyoutCurrency, rates.usdToRub, rates.eurToRub, rates.gbpToRub)
    : null;
  const noChanges =
    Number(source.supplier_id ?? 0) === targetSupplierId
    && Math.abs(Number(source.promo_factor ?? 1) - targetPromoFactor) <= 0.000001
    && Boolean(source.promo_only_no_discount) === Boolean(draft.promoOnlyNoDiscount)
    && (
      (sourceBuyoutRub === null && targetBuyoutRub === null)
      || (
        sourceBuyoutRub !== null
        && targetBuyoutRub !== null
        && Math.abs(sourceBuyoutRub - targetBuyoutRub) <= 0.000001
        && sourceBuyoutCurrency === targetBuyoutCurrency
      )
    );
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
