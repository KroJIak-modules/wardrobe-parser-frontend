import { useEffect, useMemo, useState } from "react";
import { buildSvcRuleDraftsFromSettings, createNextSvcRuleDraft, getSvcRuleFieldErrors, getSvcRulesValidationError, parseSvcRuleDraft } from "../admin-svc-rules";
import type { PricingSettings } from "../../shared/live-data-types";
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
    setSvcRuleDrafts(buildSvcRuleDraftsFromSettings(pricingSettings.svc_rules || []));
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
      const previousMax = parsed[i - 1].max_rub ?? Number.POSITIVE_INFINITY;
      if (parsed[i].min_rub < previousMax) {
        return;
      }
    }
    const current = buildSvcRuleDraftsFromSettings(pricingSettings.svc_rules || [])
      .map(parseSvcRuleDraft)
      .filter(Boolean) as SvcRulePayload[];
    current.sort((a, b) => (a.min_rub - b.min_rub) || ((a.max_rub ?? Number.POSITIVE_INFINITY) - (b.max_rub ?? Number.POSITIVE_INFINITY)));
    if (JSON.stringify(current) === JSON.stringify(parsed)) {
      return;
    }
    const timer = window.setTimeout(async () => {
      const result = await updatePricingSettings({
        svc_rules: parsed,
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
