import { useEffect, useMemo, useState } from "react";
import { buildSvcRuleDraftsFromSettings, createNextSvcRuleDraft, getSvcRuleFieldErrors, getSvcRulesValidationError } from "../admin-svc-rules";
import { parseSvcRuleDraft } from "../admin-formatters";
import type { PricingSettings } from "../../shared/live-data-context";
import type { SvcRuleDraft, SvcRulePayload } from "../admin-types";

type UseAdminSvcRulesParams = {
  pricingSettings: PricingSettings | null;
  updatePricingSettings: (patch: Partial<PricingSettings>) => Promise<{ ok: boolean; message: string }>;
  pushToast: (message: string) => void;
};

export function useAdminSvcRules({ pricingSettings, updatePricingSettings, pushToast }: UseAdminSvcRulesParams) {
  const [svcRuleDrafts, setSvcRuleDrafts] = useState<SvcRuleDraft[]>([]);

  useEffect(() => {
    if (!pricingSettings) {
      return;
    }
    const sourceRules = Array.isArray(pricingSettings.svc_rules) ? pricingSettings.svc_rules : [];
    setSvcRuleDrafts(buildSvcRuleDraftsFromSettings(sourceRules));
  }, [pricingSettings?.svc_rules, pricingSettings]);

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
    const nextSvcRules: PricingSettings["svc_rules"] = parsed.map((row) => ({
      min_rub: row.min_rub,
      max_rub: row.max_rub,
      mode: row.mode,
      value: row.value,
    }));
    const timer = window.setTimeout(async () => {
      const result = await updatePricingSettings({
        svc_rules: nextSvcRules,
      });
      if (!result.ok) {
        pushToast(result.message);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [svcRuleDrafts, pricingSettings, updatePricingSettings, pushToast]);

  const svcRulesValidationError = useMemo(() => getSvcRulesValidationError(svcRuleDrafts), [svcRuleDrafts]);
  const svcRuleFieldErrors = useMemo(() => getSvcRuleFieldErrors(svcRuleDrafts), [svcRuleDrafts]);

  const onAddSvcRule = () => {
    setSvcRuleDrafts((prev) => [...prev, createNextSvcRuleDraft(prev)]);
  };

  return {
    svcRuleDrafts,
    setSvcRuleDrafts,
    svcRulesValidationError,
    svcRuleFieldErrors,
    onAddSvcRule,
  };
}
