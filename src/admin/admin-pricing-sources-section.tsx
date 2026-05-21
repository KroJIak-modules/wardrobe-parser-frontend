import type { Dispatch, SetStateAction } from "react";
import { formatCompactNumber } from "./admin-formatters";
import { HelpHint } from "./help-hint";
import type { TriCurrencyAmountKey, TriCurrencyDraft } from "./admin-types";

type SourceItem = {
  key: string;
  name: string;
  supplier_id: number | null;
  promo_factor: number;
  promo_only_no_discount: boolean;
};

type SourcePricingDraft = {
  supplierId: string;
  promoPercent: string;
  promoOnlyNoDiscount: boolean;
  buyout: TriCurrencyDraft;
};

type SupplierItem = {
  id: number;
  name: string;
};

type Props = {
  sources: SourceItem[];
  sourcePricingDrafts: Record<string, SourcePricingDraft>;
  setSourcePricingDrafts: Dispatch<SetStateAction<Record<string, SourcePricingDraft>>>;
  pricingSuppliers: SupplierItem[];
  setSourceBuyoutField: (sourceKey: string, field: TriCurrencyAmountKey, raw: string) => void;
};

function ensureDraft(sourceKey: string, sourceSupplierId: number, prev: Record<string, SourcePricingDraft>): SourcePricingDraft {
  return prev[sourceKey] || {
    supplierId: String(sourceSupplierId || ""),
    promoPercent: "0",
    promoOnlyNoDiscount: false,
    buyout: { currency: "USD", rub: "0", usd: "0", eur: "0", gbp: "0" },
  };
}

export function AdminPricingSourcesSection({
  sources,
  sourcePricingDrafts,
  setSourcePricingDrafts,
  pricingSuppliers,
  setSourceBuyoutField,
}: Props) {
  return (
    <>
      <h3 className="with-help">
        Настройки по источникам
        <HelpHint text="Для каждого магазина выбирается базовый тариф, доплата к выкупу и параметры промокода. ALT-тариф применяется автоматически при превышении ATH порога alt-доставки." />
      </h3>
      <div className="pricing-source-map-list">
        <div className="pricing-source-map-head">
          <span>Источник</span>
          <span>Тариф</span>
          <span>Выкуп + (USD)</span>
          <span>Выкуп + (EUR)</span>
          <span>Выкуп + (GBP)</span>
          <span>PROMO (%)</span>
          <span>Промокод</span>
        </div>
        {sources.map((source) => {
          const draft = sourcePricingDrafts[source.key];
          const sourceSupplierRaw = Number(source.supplier_id ?? 0);
          return (
            <div key={source.key} className="pricing-source-map-row">
              <span className="muted">{source.name}</span>
              <select
                value={draft?.supplierId ?? String(sourceSupplierRaw || "")}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSourcePricingDrafts((prev) => ({
                    ...prev,
                    [source.key]: {
                      ...ensureDraft(source.key, sourceSupplierRaw, prev),
                      supplierId: nextValue,
                    },
                  }));
                }}
              >
                {pricingSuppliers.map((supplier) => (
                  <option key={`source-${source.key}-supplier-${supplier.id}`} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <input type="number" step="0.01" value={draft?.buyout.usd ?? "0"} onChange={(event) => setSourceBuyoutField(source.key, "usd", event.target.value)} />
              <input type="number" step="0.01" value={draft?.buyout.eur ?? "0"} onChange={(event) => setSourceBuyoutField(source.key, "eur", event.target.value)} />
              <input type="number" step="0.01" value={draft?.buyout.gbp ?? "0"} onChange={(event) => setSourceBuyoutField(source.key, "gbp", event.target.value)} />
              <div className="percent-input-wrap">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={draft?.promoPercent ?? formatCompactNumber(Math.max(0, Math.min(100, (1 - Number(source.promo_factor ?? 1)) * 100)), 4)}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSourcePricingDrafts((prev) => ({
                      ...prev,
                      [source.key]: {
                        ...ensureDraft(source.key, sourceSupplierRaw, prev),
                        promoPercent: nextValue,
                      },
                    }));
                  }}
                />
                <span className="percent-input-sign">%</span>
              </div>
              <label className="switch-wrap">
                <input
                  type="checkbox"
                  checked={draft?.promoOnlyNoDiscount ?? Boolean(source.promo_only_no_discount)}
                  onChange={(event) => {
                    const nextValue = event.target.checked;
                    setSourcePricingDrafts((prev) => ({
                      ...prev,
                      [source.key]: {
                        ...ensureDraft(source.key, sourceSupplierRaw, prev),
                        promoOnlyNoDiscount: nextValue,
                      },
                    }));
                  }}
                />
                <span className="promo-mode-compact">{(draft?.promoOnlyNoDiscount ?? Boolean(source.promo_only_no_discount)) ? "Без скидки" : "Всегда"}</span>
              </label>
            </div>
          );
        })}
      </div>
    </>
  );
}
