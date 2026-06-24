import { useMemo, useState } from "react";
import { renderLatexBlock } from "../admin-formatters";
import type { FinalRoundingMode, PricingFieldKey } from "../admin-types";
import type { PricingSettings } from "../../shared/live-data-context";

type Props = {
  pricingSettings: PricingSettings | null;
};

export function useAdminPricingLocalState({ pricingSettings }: Props) {
  const [pricingDrafts, setPricingDrafts] = useState<Record<PricingFieldKey, string>>({} as Record<PricingFieldKey, string>);
  const [markupRateDraft, setMarkupRateDraft] = useState<string>("0");
  const [finalRoundingModeDraft, setFinalRoundingModeDraft] = useState<FinalRoundingMode>("unit");
  const pricingFormulaHtml = useMemo(() => {
    if (!pricingSettings?.formula_latex) {
      return "";
    }
    return renderLatexBlock(pricingSettings.formula_latex);
  }, [pricingSettings?.formula_latex]);

  return {
    pricingDrafts,
    setPricingDrafts,
    markupRateDraft,
    setMarkupRateDraft,
    finalRoundingModeDraft,
    setFinalRoundingModeDraft,
    pricingFormulaHtml,
  };
}
