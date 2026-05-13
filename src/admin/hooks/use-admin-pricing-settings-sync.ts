import { useEffect } from "react";
import { pricingNumericKeys } from "../admin-constants";
import { formatCompactNumber, normalizeFinalRoundingMode } from "../admin-formatters";
import type { FinalRoundingMode, PricingFieldKey, PricingSettings } from "../admin-types";

type UseAdminPricingSettingsSyncParams = {
  pricingSettings: PricingSettings | null;
  pricingDrafts: Record<PricingFieldKey, string>;
  setPricingDrafts: (next: Record<PricingFieldKey, string> | ((previous: Record<PricingFieldKey, string>) => Record<PricingFieldKey, string>)) => void;
  markupRateDraft: string;
  setMarkupRateDraft: (next: string | ((previous: string) => string)) => void;
  finalRoundingModeDraft: FinalRoundingMode;
  setFinalRoundingModeDraft: (next: FinalRoundingMode | ((previous: FinalRoundingMode) => FinalRoundingMode)) => void;
  updatePricingSettings: (patch: Partial<PricingSettings>) => Promise<{ ok: boolean; message: string }>;
  pushToast: (message: string) => void;
};

export function useAdminPricingSettingsSync(params: UseAdminPricingSettingsSyncParams) {
  const {
    pricingSettings,
    pricingDrafts,
    setPricingDrafts,
    markupRateDraft,
    setMarkupRateDraft,
    finalRoundingModeDraft,
    setFinalRoundingModeDraft,
    updatePricingSettings,
    pushToast,
  } = params;

  useEffect(() => {
    if (!pricingSettings) {
      return;
    }
    const markupRate = Math.max(0, Number(pricingSettings.markup_multiplier) - 1);
    setMarkupRateDraft(formatCompactNumber(markupRate, 6));
    setPricingDrafts((previous) => {
      const next = { ...previous };
      for (const key of pricingNumericKeys) {
        next[key] = previous[key] ?? String(pricingSettings[key]);
      }
      return next;
    });
  }, [pricingSettings, setMarkupRateDraft, setPricingDrafts]);

  useEffect(() => {
    if (!pricingSettings) {
      return;
    }
    setFinalRoundingModeDraft(normalizeFinalRoundingMode(pricingSettings.final_rounding_mode, "unit"));
  }, [pricingSettings?.final_rounding_mode, setFinalRoundingModeDraft]);

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
  }, [pricingDrafts, pricingSettings, updatePricingSettings, pushToast]);

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
  }, [markupRateDraft, pricingSettings, updatePricingSettings, pushToast]);

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
  }, [finalRoundingModeDraft, pricingSettings, updatePricingSettings, pushToast]);

}
