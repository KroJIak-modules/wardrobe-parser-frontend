import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAdminDesignerMappings,
  readAdminDesignerMappingsState,
  saveAdminDesignerMappings,
} from "../admin-designers-api";
import type { AdminFinalDesigner, AdminDesignerSourceRow } from "../admin-types";

const AUTO_SAVE_DEBOUNCE_MS = 500;

function normalizeRow(row: AdminDesignerSourceRow): AdminDesignerSourceRow {
  return {
    source_brand: String(row.source_brand || "").trim(),
    source_product_count: Number.isFinite(row.source_product_count) ? Math.max(0, Math.trunc(row.source_product_count)) : 0,
    designer_name: String(row.designer_name || "").trim(),
    include_in_designers: Boolean(row.include_in_designers),
  };
}

function createSignature(rows: readonly AdminDesignerSourceRow[]) {
  return rows
    .map((row) => {
      const normalized = normalizeRow(row);
      return `${normalized.source_brand}|${normalized.source_product_count}|${normalized.designer_name}|${normalized.include_in_designers}`;
    })
    .sort()
    .join("||");
}

function createDesignersSignature(designers: readonly AdminFinalDesigner[]) {
  return designers
    .map((designer) => {
      const id = String(designer.id || "").trim();
      const name = String(designer.name || "").trim();
      const description = String(designer.description || "").trim();
      return `${id}|${name}|${description}`;
    })
    .sort()
    .join("||");
}

function normalizeDesigner(designer: AdminFinalDesigner): AdminFinalDesigner {
  return {
    id: String(designer.id || "").trim(),
    name: String(designer.name || "").trim(),
    description: String(designer.description || "").trim(),
  };
}

function sortDesignersForLoad(designers: readonly AdminFinalDesigner[]) {
  return [...designers].sort((left, right) => {
    const leftName = String(left.name || "").trim();
    const rightName = String(right.name || "").trim();
    if (!leftName && !rightName) {
      return String(left.id || "").localeCompare(String(right.id || ""), "en", { numeric: true, sensitivity: "base" });
    }
    if (!leftName) {
      return 1;
    }
    if (!rightName) {
      return -1;
    }
    return leftName.localeCompare(rightName, "en", { numeric: true, sensitivity: "base" });
  });
}

function createDesignerId() {
  return `designer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useAdminDesignerMappings(tab: string, pushToast: (message: string) => void) {
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [rows, setRows] = useState<AdminDesignerSourceRow[]>(() => readAdminDesignerMappingsState().rows);
  const [designers, setDesigners] = useState<AdminFinalDesigner[]>(() => readAdminDesignerMappingsState().designers);
  const [baselineRows, setBaselineRows] = useState<AdminDesignerSourceRow[]>(() => readAdminDesignerMappingsState().rows);
  const [baselineDesigners, setBaselineDesigners] = useState<AdminFinalDesigner[]>(() => readAdminDesignerMappingsState().designers);
  const saveTimeoutRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const payload = await fetchAdminDesignerMappings();
      const nextRows = payload.rows.map(normalizeRow);
      const nextDesigners = sortDesignersForLoad(payload.designers.map(normalizeDesigner));
      setRows(nextRows);
      setDesigners(nextDesigners);
      setBaselineRows(nextRows);
      setBaselineDesigners(nextDesigners);
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

  useEffect(() => {
    if (tab !== "designers") {
      return;
    }
    const handleRefresh = () => {
      void load();
    };
    window.addEventListener("admin:settings-transfer-applied", handleRefresh);
    return () => {
      window.removeEventListener("admin:settings-transfer-applied", handleRefresh);
    };
  }, [load, tab]);

  const onChangeDesignerName = useCallback((sourceBrand: string, designerName: string) => {
    setRows((prev) =>
      prev.map((row) => (row.source_brand === sourceBrand ? { ...row, designer_name: designerName } : row))
    );
  }, []);

  const onToggleIncludeInDesigners = useCallback((sourceBrand: string, includeInDesigners: boolean) => {
    setRows((prev) =>
      prev.map((row) => (row.source_brand === sourceBrand ? { ...row, include_in_designers: includeInDesigners } : row))
    );
  }, []);

  const onChangeFinalDesignerName = useCallback((designerId: string, designerName: string) => {
    setDesigners((prev) =>
      prev.map((designer) => (designer.id === designerId ? { ...designer, name: designerName } : designer))
    );
  }, []);

  const onChangeFinalDesignerDescription = useCallback((designerId: string, description: string) => {
    setDesigners((prev) =>
      prev.map((designer) => (designer.id === designerId ? { ...designer, description } : designer))
    );
  }, []);

  const onCreateDesigner = useCallback((designerName: string) => {
    const normalizedDesignerName = String(designerName || "").trim();
    setDesigners((prev) => [
      {
        id: createDesignerId(),
        name: normalizedDesignerName,
        description: "",
      },
      ...prev,
    ]);
  }, []);

  const onDeleteDesigner = useCallback((designerId: string) => {
    setDesigners((prev) => prev.filter((designer) => designer.id !== designerId));
  }, []);

  const persistState = useCallback(async (nextDraftRows: readonly AdminDesignerSourceRow[], nextDraftDesigners: readonly AdminFinalDesigner[]) => {
    try {
      setSaving(true);
      const normalizedRows = nextDraftRows.map(normalizeRow);
      const normalizedDesigners = nextDraftDesigners.map(normalizeDesigner);
      const nextPayload = await saveAdminDesignerMappings({
        rows: normalizedRows,
        designers: normalizedDesigners,
      });
      setRows(nextPayload.rows);
      setDesigners(nextPayload.designers);
      setBaselineRows(nextPayload.rows);
      setBaselineDesigners(nextPayload.designers);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Ошибка сохранения дизайнеров");
    } finally {
      setSaving(false);
    }
  }, [pushToast]);

  const hasUnsavedChanges = useMemo(
    () => createSignature(rows) !== createSignature(baselineRows) || createDesignersSignature(designers) !== createDesignersSignature(baselineDesigners),
    [baselineDesigners, baselineRows, designers, rows]
  );
  const hasInvalidRows = useMemo(
    () => rows.some((row) => row.include_in_designers && !String(row.designer_name || "").trim()),
    [rows]
  );
  const hasInvalidDesigners = useMemo(
    () => designers.some((designer) => !String(designer.name || "").trim()),
    [designers]
  );

  useEffect(() => {
    if (tab !== "designers" || loading || saving || !hasUnsavedChanges || hasInvalidRows || hasInvalidDesigners) {
      return;
    }

    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      saveTimeoutRef.current = null;
      void persistState(rows, designers);
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [designers, hasInvalidDesigners, hasInvalidRows, hasUnsavedChanges, loading, persistState, rows, saving, tab]);

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
    designers,
    onChangeDesignerName,
    onToggleIncludeInDesigners,
    onChangeFinalDesignerName,
    onChangeFinalDesignerDescription,
    onCreateDesigner,
    onDeleteDesigner,
  };
}
