import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAdminDesignerMappings, readAdminDesignerMappingsSeed, saveAdminDesignerMappings } from "../admin-designers-mock";
import type { AdminDesignerMappingRow } from "../admin-types";

const AUTO_SAVE_DEBOUNCE_MS = 500;

function normalizeRow(row: AdminDesignerMappingRow): AdminDesignerMappingRow {
  return {
    source_brand: String(row.source_brand || "").trim(),
    source_product_count: Number.isFinite(row.source_product_count) ? Math.max(0, Math.trunc(row.source_product_count)) : 0,
    catalog_title: String(row.catalog_title || "").trim(),
    catalog_description: String(row.catalog_description || "").trim(),
    include_in_designers: Boolean(row.include_in_designers),
  };
}

function createSignature(rows: readonly AdminDesignerMappingRow[]) {
  return rows
    .map((row) => {
      const normalized = normalizeRow(row);
      return `${normalized.source_brand}|${normalized.source_product_count}|${normalized.catalog_title}|${normalized.catalog_description}|${normalized.include_in_designers}`;
    })
    .sort()
    .join("||");
}

export function useAdminDesignerMappings(tab: string, pushToast: (message: string) => void) {
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [rows, setRows] = useState<AdminDesignerMappingRow[]>(() => readAdminDesignerMappingsSeed());
  const [baselineRows, setBaselineRows] = useState<AdminDesignerMappingRow[]>(() => readAdminDesignerMappingsSeed());
  const saveTimeoutRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const nextRows = (await fetchAdminDesignerMappings()).map(normalizeRow);
      setRows(nextRows);
      setBaselineRows(nextRows);
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

  const onChangeCatalogTitle = useCallback((sourceBrand: string, catalogTitle: string) => {
    setRows((prev) =>
      prev.map((row) => (row.source_brand === sourceBrand ? { ...row, catalog_title: catalogTitle } : row))
    );
  }, []);

  const onChangeCatalogDescription = useCallback((sourceBrand: string, catalogDescription: string) => {
    setRows((prev) =>
      prev.map((row) => (row.source_brand === sourceBrand ? { ...row, catalog_description: catalogDescription } : row))
    );
  }, []);

  const onToggleIncludeInDesigners = useCallback((sourceBrand: string, includeInDesigners: boolean) => {
    setRows((prev) =>
      prev.map((row) => (row.source_brand === sourceBrand ? { ...row, include_in_designers: includeInDesigners } : row))
    );
  }, []);

  const persistRows = useCallback(async (nextDraftRows: readonly AdminDesignerMappingRow[]) => {
    try {
      setSaving(true);
      const normalizedRows = nextDraftRows.map(normalizeRow);
      const nextRows = await saveAdminDesignerMappings(normalizedRows);
      setRows(nextRows);
      setBaselineRows(nextRows);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Ошибка сохранения дизайнеров");
    } finally {
      setSaving(false);
    }
  }, [pushToast]);

  const hasUnsavedChanges = useMemo(() => createSignature(rows) !== createSignature(baselineRows), [baselineRows, rows]);
  const hasInvalidRows = useMemo(
    () => rows.some((row) => row.include_in_designers && !String(row.catalog_title || "").trim()),
    [rows]
  );

  useEffect(() => {
    if (tab !== "designers" || loading || saving || !hasUnsavedChanges || hasInvalidRows) {
      return;
    }

    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      saveTimeoutRef.current = null;
      void persistRows(rows);
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [hasInvalidRows, hasUnsavedChanges, loading, persistRows, rows, saving, tab]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    loading,
    saving,
    rows,
    onChangeCatalogTitle,
    onChangeCatalogDescription,
    onToggleIncludeInDesigners,
  };
}
