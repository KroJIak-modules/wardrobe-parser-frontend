import type { Dispatch, SetStateAction } from "react";
import type { PricingSettings } from "../shared/live-data-context";
import { finalRoundingOptions, pricingFieldMeta } from "./admin-constants";
import { normalizeFinalRoundingMode, renderLatexInline } from "./admin-formatters";
import { HelpHint } from "./help-hint";
import type { FinalRoundingMode, PricingFieldKey } from "./admin-types";

type Props = {
  pricingSettings: PricingSettings;
  markupRateDraft: string;
  setMarkupRateDraft: Dispatch<SetStateAction<string>>;
  pricingDrafts: Record<PricingFieldKey, string>;
  setPricingDrafts: Dispatch<SetStateAction<Record<PricingFieldKey, string>>>;
  finalRoundingModeDraft: FinalRoundingMode;
  setFinalRoundingModeDraft: Dispatch<SetStateAction<FinalRoundingMode>>;
};

export function AdminPricingCoreFieldsSection({
  pricingSettings,
  markupRateDraft,
  setMarkupRateDraft,
  pricingDrafts,
  setPricingDrafts,
  finalRoundingModeDraft,
  setFinalRoundingModeDraft,
}: Props) {
  return (
    <div className="pricing-settings-grid">
      <label className="pricing-settings-field">
        <span className="muted with-help">
          <span className="pricing-field-label">
            <span dangerouslySetInnerHTML={{ __html: renderLatexInline("MUP") }} />
            <span>Наценка</span>
          </span>
          <HelpHint text="Отдельная наценка к SUB. Пример: 0.25 означает +25%, применяется как (1 + MUP)." />
        </span>
        <input type="number" min="0" step="0.01" value={markupRateDraft} onChange={(event) => setMarkupRateDraft(event.target.value)} />
      </label>
      {pricingFieldMeta.map((field) => (
        <label key={field.key} className="pricing-settings-field">
          <span className="muted with-help">
            <span className="pricing-field-label">
              <span dangerouslySetInnerHTML={{ __html: renderLatexInline(field.symbolLatex) }} />
              <span>{field.label}</span>
            </span>
            <HelpHint text={field.hint} />
          </span>
          <input
            type="number"
            step={field.step || "0.01"}
            value={pricingDrafts[field.key] ?? String(pricingSettings[field.key])}
            onChange={(event) => {
              const nextValue = event.target.value;
              setPricingDrafts((prev) => ({ ...prev, [field.key]: nextValue }));
            }}
          />
        </label>
      ))}
      <label className="pricing-settings-field">
        <span className="muted with-help">
          <span className="pricing-field-label">
            <span dangerouslySetInnerHTML={{ __html: renderLatexInline("RND") }} />
            <span>Округление FPR</span>
          </span>
          <HelpHint text="Управляет финальным округлением цены. Применяется вместо старого жесткого ceil в формуле." />
        </span>
        <select value={finalRoundingModeDraft} onChange={(event) => setFinalRoundingModeDraft(normalizeFinalRoundingMode(event.target.value, "unit"))}>
          {finalRoundingOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
