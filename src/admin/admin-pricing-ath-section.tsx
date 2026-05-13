import type { Dispatch, SetStateAction } from "react";
import type { PricingSettings } from "../shared/live-data-context";
import type { PricingFieldKey } from "./admin-types";
import { renderLatexInline } from "./admin-formatters";

type Props = {
  pricingSettings: PricingSettings;
  pricingDrafts: Record<PricingFieldKey, string>;
  setPricingDrafts: Dispatch<SetStateAction<Record<PricingFieldKey, string>>>;
};

export function AdminPricingAthSection({ pricingSettings, pricingDrafts, setPricingDrafts }: Props) {
  return (
    <div className="pricing-ath-section">
      <label className="pricing-settings-field pricing-ath-field">
        <span className="muted">
          <span className="pricing-field-label">
            <span dangerouslySetInnerHTML={{ __html: renderLatexInline("ATH") }} />
            <span>Порог ALT доставки (EUR)</span>
          </span>
        </span>
        <input
          className="pricing-ath-input"
          type="number"
          step="0.01"
          value={pricingDrafts.shipping_alt_threshold_eur ?? String(pricingSettings.shipping_alt_threshold_eur)}
          onChange={(event) => {
            const nextValue = event.target.value;
            setPricingDrafts((prev) => ({ ...prev, shipping_alt_threshold_eur: nextValue }));
          }}
        />
      </label>
      <p className="pricing-ath-description">
        Если цена товара в EUR выше этого порога, для доставки берется альтернативный тариф SSR вместо основного.
        Если цена ниже или равна порогу, используется основной тариф SSR.
      </p>
    </div>
  );
}
