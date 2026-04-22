import { HelpHint } from "./help-hint";
import type { TriCurrencyAmountKey, TriCurrencyDraft } from "./admin-types";

type Props = {
  thresholdDraft: TriCurrencyDraft | null;
  setThresholdField: (field: TriCurrencyAmountKey, raw: string) => void;
};

export function AdminPricingThresholdSection({ thresholdDraft, setThresholdField }: Props) {
  return (
    <>
      <h3 className="with-help">
        Порог пошлины THR
        <HelpHint text="Укажи порог и валюту. Можно менять сумму в RUB, USD, EUR или GBP: остальные поля пересчитаются автоматически." />
      </h3>
      <div className="pricing-threshold-grid">
        <label className="pricing-settings-field">
          <span className="muted">THR (RUB)</span>
          <input type="number" step="0.01" value={thresholdDraft?.rub || "0"} onChange={(event) => setThresholdField("rub", event.target.value)} />
        </label>
        <label className="pricing-settings-field">
          <span className="muted">THR (USD)</span>
          <input type="number" step="0.01" value={thresholdDraft?.usd || "0"} onChange={(event) => setThresholdField("usd", event.target.value)} />
        </label>
        <label className="pricing-settings-field">
          <span className="muted">THR (EUR)</span>
          <input type="number" step="0.01" value={thresholdDraft?.eur || "0"} onChange={(event) => setThresholdField("eur", event.target.value)} />
        </label>
        <label className="pricing-settings-field">
          <span className="muted">THR (GBP)</span>
          <input type="number" step="0.01" value={thresholdDraft?.gbp || "0"} onChange={(event) => setThresholdField("gbp", event.target.value)} />
        </label>
      </div>
    </>
  );
}
