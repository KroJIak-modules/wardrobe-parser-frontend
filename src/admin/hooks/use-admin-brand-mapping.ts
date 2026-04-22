import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE, authFetch } from "../auth-fetch";
import type { BrandMappingItem } from "../admin-types";

type Payload = {
  items?: BrandMappingItem[];
  known_targets?: string[];
};

export function useAdminBrandMapping(tab: string, pushToast: (message: string) => void) {
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [rows, setRows] = useState<BrandMappingItem[]>([]);
  const [baselineRows, setBaselineRows] = useState<BrandMappingItem[]>([]);
  const [knownTargets, setKnownTargets] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${API_BASE}/admin/brand-mapping`);
      if (!response.ok) {
        throw new Error(`Brand mapping API error: ${response.status}`);
      }
      const payload = (await response.json()) as Payload;
      const nextRows = Array.isArray(payload.items)
        ? payload.items.map((item) => ({
            source_brand: String(item.source_brand || "").trim(),
            target_brand: String(item.target_brand || "").trim(),
            include_in_designers: item.include_in_designers !== false,
          }))
        : [];
      setRows(nextRows);
      setBaselineRows(nextRows);
      setKnownTargets(Array.isArray(payload.known_targets) ? payload.known_targets : []);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Ошибка загрузки дизайнеров");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    if (tab !== "designers") {
      return;
    }
    void load();
  }, [tab, load]);

  const onChangeTarget = useCallback((sourceBrand: string, targetBrand: string) => {
    setRows((prev) => prev.map((item) => (item.source_brand === sourceBrand ? { ...item, target_brand: targetBrand } : item)));
  }, []);

  const onToggleIncludeInDesigners = useCallback((sourceBrand: string, includeInDesigners: boolean) => {
    setRows((prev) =>
      prev.map((item) => (item.source_brand === sourceBrand ? { ...item, include_in_designers: includeInDesigners } : item))
    );
  }, []);

  const save = useCallback(async () => {
    try {
      setSaving(true);
      const normalized = rows.map((item) => ({
        source_brand: String(item.source_brand || "").trim(),
        target_brand: String(item.target_brand || "").trim(),
        include_in_designers: Boolean(item.include_in_designers),
      }));
      const response = await authFetch(`${API_BASE}/admin/brand-mapping`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: normalized }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(payload?.detail || `Brand mapping save error: ${response.status}`);
      }
      const payload = (await response.json()) as Payload;
      const nextRows = Array.isArray(payload.items)
        ? payload.items.map((item) => ({
            source_brand: String(item.source_brand || "").trim(),
            target_brand: String(item.target_brand || "").trim(),
            include_in_designers: item.include_in_designers !== false,
          }))
        : normalized;
      setRows(nextRows);
      setBaselineRows(nextRows);
      setKnownTargets(Array.isArray(payload.known_targets) ? payload.known_targets : []);
      pushToast("Маппинг брендов сохранен");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Ошибка сохранения дизайнеров");
    } finally {
      setSaving(false);
    }
  }, [rows, pushToast]);

  const normalizedKnownTargets = useMemo(() => {
    const dedup = new Set<string>();
    for (const item of knownTargets) {
      const value = String(item || "").trim();
      if (!value) {
        continue;
      }
      dedup.add(value);
    }
    for (const row of rows) {
      const value = String(row.target_brand || "").trim();
      if (!value) {
        continue;
      }
      dedup.add(value);
    }
    return Array.from(dedup).sort((a, b) => a.localeCompare(b, "ru"));
  }, [knownTargets, rows]);

  const hasUnsavedChanges = useMemo(() => {
    const normalize = (list: BrandMappingItem[]) =>
      list
        .map(
          (item) =>
            `${String(item.source_brand || "").trim()}=>${String(item.target_brand || "").trim()}|${Boolean(item.include_in_designers)}`
        )
        .sort();
    const current = normalize(rows);
    const baseline = normalize(baselineRows);
    if (current.length !== baseline.length) {
      return true;
    }
    for (let index = 0; index < current.length; index += 1) {
      if (current[index] !== baseline[index]) {
        return true;
      }
    }
    return false;
  }, [rows, baselineRows]);

  return {
    loading,
    saving,
    rows,
    knownTargets: normalizedKnownTargets,
    hasUnsavedChanges,
    onChangeTarget,
    onToggleIncludeInDesigners,
    save,
  };
}
