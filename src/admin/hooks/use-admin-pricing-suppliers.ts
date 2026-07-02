import { useEffect, useMemo, useState } from "react";
import type { PricingSettings } from "../admin-types";
import { parseNonNegativeNumber } from "../admin-formatters";

type TariffRangeDraft = { id: string; min_kg: string; max_kg: string; rub: string };

type UseAdminPricingSuppliersParams = {
  pricingSettings: PricingSettings | null;
  updatePricingSupplier: (supplierId: number, payload: { name?: string; rates?: Array<{ min_kg: number; max_kg: number | null; rub: number }> }) => Promise<{ ok: boolean; message: string }>;
  createPricingSupplier: (payload: {
    name: string;
    provider_kind: "main" | "alternate";
    rate_currency: string;
    parent_supplier_id?: number;
    is_enabled?: boolean;
  }) => Promise<{ ok: boolean; message: string }>;
  deletePricingSupplier: (supplierId: number) => Promise<{ ok: boolean; message: string }>;
  pushToast: (message: string) => void;
};

function buildDraftId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}`;
}

export function useAdminPricingSuppliers(params: UseAdminPricingSuppliersParams) {
  const { pricingSettings, updatePricingSupplier, createPricingSupplier, deletePricingSupplier, pushToast } = params;

  const [tariffRangesDrafts, setTariffRangesDrafts] = useState<Record<number, TariffRangeDraft[]>>({});
  const [tariffNameDrafts, setTariffNameDrafts] = useState<Record<number, string>>({});
  const [newSupplierName, setNewSupplierName] = useState<string>("");
  const pricingSuppliers = useMemo(() => {
    return (pricingSettings?.suppliers || []).slice().sort((a, b) => Number(a.id) - Number(b.id));
  }, [pricingSettings]);

  const mainPricingSuppliers = useMemo(() => {
    return pricingSuppliers
      .filter((item) => item.parent_supplier_id === null || item.parent_supplier_id === undefined)
      .sort((a, b) => Number(a.id) - Number(b.id));
  }, [pricingSuppliers]);

  const altSuppliersByMainId = useMemo(() => {
    const grouped = new Map<number, typeof pricingSuppliers>();
    for (const supplier of pricingSuppliers) {
      const parentId = supplier.parent_supplier_id;
      if (!parentId) {
        continue;
      }
      const list = grouped.get(parentId) || [];
      list.push(supplier);
      grouped.set(parentId, list);
    }
    for (const [mainId, list] of grouped.entries()) {
      list.sort((a, b) => Number(a.id) - Number(b.id));
      grouped.set(mainId, list);
    }
    return grouped;
  }, [pricingSuppliers]);

  useEffect(() => {
    const next: Record<number, string> = {};
    for (const supplier of pricingSuppliers) {
      next[supplier.id] = supplier.name;
    }
    setTariffNameDrafts(next);
  }, [pricingSuppliers]);

  useEffect(() => {
    const timers: number[] = [];
    for (const supplier of pricingSuppliers) {
      const draft = (tariffNameDrafts[supplier.id] || "").trim();
      if (!draft || draft === supplier.name) {
        continue;
      }
      const timer = window.setTimeout(async () => {
        const result = await updatePricingSupplier(supplier.id, { name: draft });
        if (!result.ok) {
          pushToast(result.message);
        }
      }, 550);
      timers.push(timer);
    }
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [pricingSuppliers, tariffNameDrafts, updatePricingSupplier, pushToast]);

  useEffect(() => {
    const next: Record<number, TariffRangeDraft[]> = {};
    for (const supplier of pricingSuppliers) {
      next[supplier.id] = (supplier.rates || []).map((row, idx) => ({
        id: `r-${supplier.id}-${idx}-${row.min_kg}-${row.max_kg ?? "inf"}`,
        min_kg: String(row.min_kg),
        max_kg: row.max_kg === null ? "" : String(row.max_kg),
        rub: String(row.rub),
      }));
    }
    setTariffRangesDrafts(next);
  }, [pricingSuppliers]);

  useEffect(() => {
    const timers: number[] = [];
    for (const supplier of pricingSuppliers) {
      const rows = tariffRangesDrafts[supplier.id] || [];
      if (rows.length === 0) {
        continue;
      }
      const normalized = rows
        .map((row) => {
          const min = parseNonNegativeNumber(row.min_kg || "");
          const maxRaw = (row.max_kg || "").trim();
          const max = maxRaw.length > 0 ? parseNonNegativeNumber(maxRaw) : null;
          const rub = parseNonNegativeNumber(row.rub || "");
          if (min === null || rub === null) {
            return null;
          }
          if (max !== null && max <= min) {
            return null;
          }
          return { min_kg: Number(min.toFixed(4)), max_kg: max === null ? null : Number(max.toFixed(4)), rub: Number(rub.toFixed(2)) };
        })
        .filter(Boolean) as Array<{ min_kg: number; max_kg: number | null; rub: number }>;
      if (normalized.length !== rows.length) {
        continue;
      }
      normalized.sort((a, b) => (a.min_kg - b.min_kg) || ((a.max_kg ?? Number.POSITIVE_INFINITY) - (b.max_kg ?? Number.POSITIVE_INFINITY)));
      let hasOverlap = false;
      for (let idx = 1; idx < normalized.length; idx += 1) {
        const prevMax = normalized[idx - 1].max_kg ?? Number.POSITIVE_INFINITY;
        if (normalized[idx].min_kg < prevMax) {
          hasOverlap = true;
          break;
        }
      }
      if (hasOverlap) {
        continue;
      }
      const current = (supplier.rates || [])
        .map((row) => ({
          min_kg: Number(Number(row.min_kg).toFixed(4)),
          max_kg: row.max_kg === null ? null : Number(Number(row.max_kg).toFixed(4)),
          rub: Number(Number(row.rub).toFixed(2)),
        }))
        .sort((a, b) => (a.min_kg - b.min_kg) || ((a.max_kg ?? Number.POSITIVE_INFINITY) - (b.max_kg ?? Number.POSITIVE_INFINITY)));
      if (JSON.stringify(current) === JSON.stringify(normalized)) {
        continue;
      }
      const timer = window.setTimeout(async () => {
        const result = await updatePricingSupplier(supplier.id, { rates: normalized });
        if (!result.ok) {
          pushToast(result.message);
        }
      }, 700);
      timers.push(timer);
    }
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [pricingSuppliers, tariffRangesDrafts, updatePricingSupplier, pushToast]);

  const onCreateMainSupplier = async () => {
    const name = newSupplierName.trim();
    if (!name) {
      pushToast("Укажи название тарифа");
      return;
    }
    const result = await createPricingSupplier({
      name,
      provider_kind: "main",
      rate_currency: "RUB",
      is_enabled: true,
    });
    pushToast(result.message);
    if (result.ok) {
      setNewSupplierName("");
    }
  };

  const onCreateAltSupplier = async (mainSupplierId: number) => {
    const main = mainPricingSuppliers.find((item) => item.id === mainSupplierId);
    if (!main) {
      pushToast("Базовый тариф не найден");
      return;
    }
    const name = `ALT ${main.name}`.trim();
    const result = await createPricingSupplier({
      name,
      parent_supplier_id: mainSupplierId,
      provider_kind: "alternate",
      rate_currency: "RUB",
      is_enabled: true,
    });
    pushToast(result.message);
  };

  const onDeleteSupplier = async (supplierId: number) => {
    const result = await deletePricingSupplier(supplierId);
    pushToast(result.message);
  };

  const onAddTariffRange = (supplierId: number) => {
    setTariffRangesDrafts((prev) => {
      const current = prev[supplierId] || [];
      const last = current[current.length - 1];
      const nextMin = last ? (parseNonNegativeNumber(last.max_kg || last.min_kg || "0") ?? 0) : 0;
      const nextMax = Number.isFinite(nextMin) ? nextMin + 0.5 : 0.5;
      return {
        ...prev,
        [supplierId]: [
          ...current,
          { id: buildDraftId("new"), min_kg: String(nextMin), max_kg: String(nextMax), rub: "0" },
        ],
      };
    });
  };

  const onRemoveTariffRange = (supplierId: number, rowId: string) => {
    setTariffRangesDrafts((prev) => ({
      ...prev,
      [supplierId]: (prev[supplierId] || []).filter((row) => row.id !== rowId),
    }));
  };

  return {
    pricingSuppliers,
    mainPricingSuppliers,
    altSuppliersByMainId,
    newSupplierName,
    setNewSupplierName,
    tariffRangesDrafts,
    setTariffRangesDrafts,
    tariffNameDrafts,
    setTariffNameDrafts,
    onCreateMainSupplier,
    onCreateAltSupplier,
    onDeleteSupplier,
    onAddTariffRange,
    onRemoveTariffRange,
  };
}
