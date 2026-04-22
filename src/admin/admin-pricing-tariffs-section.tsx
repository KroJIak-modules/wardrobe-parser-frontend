import type { Dispatch, SetStateAction } from "react";
import type { PricingSupplier } from "../shared/live-data-context";
import { HelpHint } from "./help-hint";

type Props = {
  mainPricingSuppliers: PricingSupplier[];
  altSuppliersByMainId: Map<number, PricingSupplier[]>;
  newAltByMainId: Record<number, { name: string }>;
  setNewAltByMainId: Dispatch<SetStateAction<Record<number, { name: string }>>>;
  tariffRangesDrafts: Record<number, Array<{ id: string; min_kg: string; max_kg: string; rub: string }>>;
  setTariffRangesDrafts: Dispatch<SetStateAction<Record<number, Array<{ id: string; min_kg: string; max_kg: string; rub: string }>>>>;
  tariffNameDrafts: Record<number, string>;
  setTariffNameDrafts: Dispatch<SetStateAction<Record<number, string>>>;
  onDeleteSupplier: (supplierId: number) => Promise<void>;
  onRemoveTariffRange: (supplierId: number, rowId: string) => void;
  onAddTariffRange: (supplierId: number) => void;
  onCreateAltSupplier: (mainSupplierId: number) => Promise<void>;
  newSupplierName: string;
  setNewSupplierName: Dispatch<SetStateAction<string>>;
  onCreateMainSupplier: () => Promise<void>;
};

export function AdminPricingTariffsSection({
  mainPricingSuppliers,
  altSuppliersByMainId,
  newAltByMainId,
  setNewAltByMainId,
  tariffRangesDrafts,
  setTariffRangesDrafts,
  tariffNameDrafts,
  setTariffNameDrafts,
  onDeleteSupplier,
  onRemoveTariffRange,
  onAddTariffRange,
  onCreateAltSupplier,
  newSupplierName,
  setNewSupplierName,
  onCreateMainSupplier,
}: Props) {
  return (
    <>
      <h3 className="with-help">
        Тарифы SSR
        <HelpHint text="Создавай базовые тарифы и до 3 ALT-тарифов для каждого. Внутри тарифа настраиваются диапазоны веса и цена за диапазон." />
      </h3>
      <div className="pricing-source-map-list">
        {mainPricingSuppliers.map((supplier) => {
          const altItems = altSuppliersByMainId.get(supplier.id) || [];
          const altDraft = newAltByMainId[supplier.id] || { name: "" };
          const renderTariffCard = (item: PricingSupplier, title: string) => {
            const rows = tariffRangesDrafts[item.id] || [];
            return (
              <div key={`tariff-card-${item.id}`} className="card pricing-tariff-card">
                <div className="pricing-tariff-card-head">
                  <input
                    type="text"
                    value={tariffNameDrafts[item.id] ?? title}
                    onChange={(event) => setTariffNameDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))}
                    placeholder="Название тарифа"
                  />
                  <div className="pricing-tariff-card-head-actions">
                    <button type="button" onClick={() => void onDeleteSupplier(item.id)}>Удалить</button>
                  </div>
                </div>
                <div className="pricing-source-map-head">
                  <span>Мин. вес (кг)</span>
                  <span>Макс. вес (кг)</span>
                  <span>Цена (RUB)</span>
                  <span></span>
                </div>
                {rows.map((row) => (
                  <div key={row.id} className="pricing-source-map-row">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.min_kg}
                      onChange={(event) => setTariffRangesDrafts((prev) => ({
                        ...prev,
                        [item.id]: (prev[item.id] || []).map((entry) => (entry.id === row.id ? { ...entry, min_kg: event.target.value } : entry)),
                      }))}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="пусто = бесконечность"
                      value={row.max_kg}
                      onChange={(event) => setTariffRangesDrafts((prev) => ({
                        ...prev,
                        [item.id]: (prev[item.id] || []).map((entry) => (entry.id === row.id ? { ...entry, max_kg: event.target.value } : entry)),
                      }))}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.rub}
                      onChange={(event) => setTariffRangesDrafts((prev) => ({
                        ...prev,
                        [item.id]: (prev[item.id] || []).map((entry) => (entry.id === row.id ? { ...entry, rub: event.target.value } : entry)),
                      }))}
                    />
                    <button type="button" onClick={() => onRemoveTariffRange(item.id, row.id)}>Удалить</button>
                  </div>
                ))}
                <button type="button" onClick={() => onAddTariffRange(item.id)}>Добавить диапазон</button>
              </div>
            );
          };
          return (
            <div key={`tariff-main-${supplier.id}`} className="pricing-tariff-main">
              {renderTariffCard(supplier, supplier.name)}
              {altItems.map((alt, idx) => renderTariffCard(alt, `ALT ${idx + 1} ${supplier.name}`))}
              <div className="pricing-source-map-row">
                <input
                  type="text"
                  placeholder={`ALT ${altItems.length + 1} ${supplier.name}`}
                  value={altDraft.name}
                  onChange={(event) =>
                    setNewAltByMainId((prev) => ({
                      ...prev,
                      [supplier.id]: { ...altDraft, name: event.target.value },
                    }))
                  }
                />
                <button type="button" disabled={altItems.length >= 3} onClick={() => void onCreateAltSupplier(supplier.id)}>
                  {altItems.length >= 3 ? "Лимит 3" : "Создать ALT"}
                </button>
              </div>
            </div>
          );
        })}
        <div className="pricing-source-map-row">
          <input
            type="text"
            placeholder="Название нового тарифа"
            value={newSupplierName}
            onChange={(event) => setNewSupplierName(event.target.value)}
          />
          <button type="button" onClick={() => void onCreateMainSupplier()}>
            Создать тариф
          </button>
        </div>
      </div>
    </>
  );
}
