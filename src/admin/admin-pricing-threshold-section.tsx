import { HelpHint } from "./help-hint";
import type { TriCurrencyAmountKey, TriCurrencyDraft } from "./admin-types";
import type { ThresholdDrafts } from "./hooks/admin-source-pricing-helpers";

type Props = {
  thresholdDrafts: ThresholdDrafts | null;
  setThresholdField: (kind: keyof ThresholdDrafts, field: TriCurrencyAmountKey, raw: string) => void;
};

function ThresholdCurrencyFields({
  draft,
  onChange,
}: {
  draft: TriCurrencyDraft | null;
  onChange: (field: TriCurrencyAmountKey, raw: string) => void;
}) {
  return (
    <div className="pricing-threshold-grid">
      <label className="pricing-settings-field">
        <span className="muted">RUB</span>
        <input type="text" inputMode="decimal" value={draft?.rub || "0"} onChange={(event) => onChange("rub", event.target.value)} />
      </label>
      <label className="pricing-settings-field">
        <span className="muted">USD</span>
        <input type="text" inputMode="decimal" value={draft?.usd || "0"} onChange={(event) => onChange("usd", event.target.value)} />
      </label>
      <label className="pricing-settings-field">
        <span className="muted">EUR</span>
        <input type="text" inputMode="decimal" value={draft?.eur || "0"} onChange={(event) => onChange("eur", event.target.value)} />
      </label>
    </div>
  );
}

export function AdminPricingThresholdSection({ thresholdDrafts, setThresholdField }: Props) {
  return (
    <>
      <h3 className="with-help">
        Порог пошлины THR
        <HelpHint text="Можно менять сумму в RUB, USD или EUR: остальные поля пересчитаются автоматически." />
      </h3>
      <ThresholdCurrencyFields
        draft={thresholdDrafts?.customs ?? null}
        onChange={(field, raw) => setThresholdField("customs", field, raw)}
      />
      <h3 className="with-help">
        Порог альтернативного тарифа ALT
        <HelpHint text="Если цена товара после промо выше этого порога и у тарифа источника есть альтернатива, доставка считается по альтернативному тарифу. По умолчанию 300 EUR." />
      </h3>
      <ThresholdCurrencyFields
        draft={thresholdDrafts?.shippingAlt ?? null}
        onChange={(field, raw) => setThresholdField("shippingAlt", field, raw)}
      />
    </>
  );
}
