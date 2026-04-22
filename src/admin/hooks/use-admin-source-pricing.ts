import { useEffect, useMemo, useState } from "react";
import { normalizeCurrencyCode } from "../admin-constants";
import { parseNonNegativeNumber, toRubByRates, fromRubByRates } from "../admin-formatters";
import type { CurrencyCode, PricingFieldKey, PricingSettings, TriCurrencyAmountKey, TriCurrencyDraft } from "../admin-types";
import { buildSourceDraft, buildThresholdDraft, computePricingRates, rebuildTriCurrencyDraft, toSourceSyncPayload, type SourceEntry, type SourcePricingDraft } from "./admin-source-pricing-helpers";

type UseAdminSourcePricingParams = {
  pricingSettings: PricingSettings | null;
  pricingDrafts: Record<PricingFieldKey, string>;
  sources: SourceEntry[];
  assignSourceSupplier: (sourceKey: string, payload: {
    supplier_id: number;
    promo_factor: number;
    promo_only_no_discount: boolean;
    buyout_surcharge_value: number;
    buyout_surcharge_currency: CurrencyCode;
  }) => Promise<{ ok: boolean; message: string }>;
  updatePricingSettings: (patch: Partial<PricingSettings>) => Promise<{ ok: boolean; message: string }>;
  pushToast: (message: string) => void;
};

export function useAdminSourcePricing(params: UseAdminSourcePricingParams) {
  const { pricingSettings, pricingDrafts, sources, assignSourceSupplier, updatePricingSettings, pushToast } = params;

  const [thresholdDraft, setThresholdDraft] = useState<TriCurrencyDraft | null>(null);
  const [sourcePricingDrafts, setSourcePricingDrafts] = useState<Record<string, SourcePricingDraft>>({});

  const pricingRates = useMemo(
    () => computePricingRates(pricingSettings, pricingDrafts),
    [pricingSettings, pricingDrafts]
  );

  const pricingSuppliers = useMemo(() => {
    return (pricingSettings?.suppliers || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [pricingSettings]);

  const mainSupplierIdByAnySupplierId = useMemo(() => {
    const result = new Map<number, number>();
    for (const supplier of pricingSuppliers) {
      const id = Number(supplier.id);
      const parentId = Number(supplier.parent_supplier_id || 0);
      result.set(id, parentId > 0 ? parentId : id);
    }
    return result;
  }, [pricingSuppliers]);

  const setThresholdField = (field: TriCurrencyAmountKey, raw: string) => {
    setThresholdDraft((previous) => {
      if (!previous) {
        return previous;
      }
      const next = { ...previous, [field]: raw };
      const parsed = parseNonNegativeNumber(raw);
      if (parsed === null) {
        return next;
      }
      return rebuildTriCurrencyDraft(previous, field, String(parsed), pricingRates);
    });
  };

  const setSourceBuyoutField = (sourceKey: string, field: TriCurrencyAmountKey, raw: string) => {
    setSourcePricingDrafts((previous) => {
      const current = previous[sourceKey];
      if (!current) {
        return previous;
      }
      const nextBuyout = rebuildTriCurrencyDraft(current.buyout, field, raw, pricingRates);
      return { ...previous, [sourceKey]: { ...current, buyout: nextBuyout } };
    });
  };

  useEffect(() => {
    if (!pricingSettings) {
      return;
    }
    setThresholdDraft(buildThresholdDraft(pricingSettings, pricingRates));
  }, [pricingSettings?.customs_threshold_eur, pricingSettings?.customs_threshold_currency, pricingRates.usdToRub, pricingRates.eurToRub, pricingRates.gbpToRub]);

  useEffect(() => {
    if (!pricingSettings || !thresholdDraft) {
      return;
    }
    const activeCurrency = thresholdDraft.currency;
    const activeRaw = thresholdDraft[activeCurrency.toLowerCase() as TriCurrencyAmountKey];
    const activeValue = Number((activeRaw || "").trim());
    if (!Number.isFinite(activeValue) || activeValue < 0) {
      return;
    }
    const thresholdRub = toRubByRates(activeValue, activeCurrency, pricingRates.usdToRub, pricingRates.eurToRub, pricingRates.gbpToRub);
    const nextThresholdEur = fromRubByRates(thresholdRub, "EUR", pricingRates.usdToRub, pricingRates.eurToRub, pricingRates.gbpToRub);
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
  }, [pricingSettings, thresholdDraft, updatePricingSettings, pushToast, pricingRates.usdToRub, pricingRates.eurToRub, pricingRates.gbpToRub]);

  useEffect(() => {
    if (!sources || sources.length === 0) {
      return;
    }
    setSourcePricingDrafts((previous) => {
      const next = { ...previous };
      for (const source of sources) {
        next[source.key] = buildSourceDraft(source, mainSupplierIdByAnySupplierId, pricingRates);
      }
      return next;
    });
  }, [sources, mainSupplierIdByAnySupplierId, pricingRates.usdToRub, pricingRates.eurToRub, pricingRates.gbpToRub]);

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
      const payload = toSourceSyncPayload(source, draft, pricingRates);
      if (!payload) {
        continue;
      }
      const timer = window.setTimeout(async () => {
        const result = await assignSourceSupplier(source.key, payload);
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
  }, [sources, sourcePricingDrafts, assignSourceSupplier, pushToast, pricingRates.usdToRub, pricingRates.eurToRub, pricingRates.gbpToRub]);

  return {
    pricingRates,
    mainSupplierIdByAnySupplierId,
    thresholdDraft,
    setThresholdDraft,
    setThresholdField,
    sourcePricingDrafts,
    setSourcePricingDrafts,
    setSourceBuyoutField,
  };
}
