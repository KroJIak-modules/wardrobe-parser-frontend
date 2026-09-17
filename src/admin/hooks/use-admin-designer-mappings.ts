import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAdminDesignerMappings,
  markAdminBrandViewed,
  markAdminDesignerViewed,
  markAllAdminDesignerViewsViewed,
  readAdminDesignerMappingsState,
  saveAdminDesignerMappings,
  setAdminDesignerSourceEnabled,
  type DesignerViewKind,
} from "../admin-designers-api";
import type { AdminFinalDesigner, AdminDesignerSourceRow } from "../admin-types";

const AUTO_SAVE_DEBOUNCE_MS = 500;

function normalizeRow(row: AdminDesignerSourceRow): AdminDesignerSourceRow {
  return {
    source_brand: String(row.source_brand || "").trim(),
    source_product_count: Number.isFinite(row.source_product_count) ? Math.max(0, Math.trunc(row.source_product_count)) : 0,
    source_non_public_product_count: Number.isFinite(row.source_non_public_product_count) ? Math.max(0, Math.trunc(row.source_non_public_product_count)) : 0,
    source_public_product_count: Number.isFinite(row.source_public_product_count) ? Math.max(0, Math.trunc(row.source_public_product_count)) : 0,
    designer_name: String(row.designer_name || "").trim(),
    include_in_designers: Boolean(row.include_in_designers),
    is_new: Boolean(row.is_new),
  };
}

function createSignature(rows: readonly AdminDesignerSourceRow[]) {
  return rows
    .map((row) => {
      const normalized = normalizeRow(row);
      return `${normalized.source_brand}|${normalized.source_product_count}|${normalized.source_non_public_product_count}|${normalized.source_public_product_count}|${normalized.designer_name}|${normalized.include_in_designers}`;
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
    is_new: Boolean(designer.is_new),
  };
}


function createDesignerId() {
  return `designer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useAdminDesignerMappings(tab: string, pushToast: (message: string) => void) {
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [markAllViewedPending, setMarkAllViewedPending] = useState<DesignerViewKind | null>(null);
  const [rows, setRows] = useState<AdminDesignerSourceRow[]>(() => readAdminDesignerMappingsState().rows);
  const [designers, setDesigners] = useState<AdminFinalDesigner[]>(() => readAdminDesignerMappingsState().designers);
  const [baselineRows, setBaselineRows] = useState<AdminDesignerSourceRow[]>(() => readAdminDesignerMappingsState().rows);
  const [baselineDesigners, setBaselineDesigners] = useState<AdminFinalDesigner[]>(() => readAdminDesignerMappingsState().designers);
  const saveTimeoutRef = useRef<number | null>(null);
  const draftRevisionRef = useRef(0);
  const sourceToggleRevisionRef = useRef(new Map<string, number>());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const payload = await fetchAdminDesignerMappings();
      draftRevisionRef.current += 1;
      const nextRows = payload.rows.map(normalizeRow);
      const nextDesigners = payload.designers.map(normalizeDesigner);
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
    draftRevisionRef.current += 1;
    setRows((prev) =>
      prev.map((row) => (row.source_brand === sourceBrand ? { ...row, designer_name: designerName } : row))
    );
  }, []);

  const onToggleIncludeInDesigners = useCallback((sourceBrand: string, includeInDesigners: boolean) => {
    const previousValue = rows.find((row) => row.source_brand === sourceBrand)?.include_in_designers ?? !includeInDesigners;
    const requestRevision = (sourceToggleRevisionRef.current.get(sourceBrand) ?? 0) + 1;
    sourceToggleRevisionRef.current.set(sourceBrand, requestRevision);
    draftRevisionRef.current += 1;
    setRows((prev) =>
      prev.map((row) => (row.source_brand === sourceBrand ? { ...row, include_in_designers: includeInDesigners } : row))
    );
    setBaselineRows((prev) =>
      prev.map((row) => (row.source_brand === sourceBrand ? { ...row, include_in_designers: includeInDesigners } : row))
    );

    void setAdminDesignerSourceEnabled(sourceBrand, includeInDesigners).catch((error) => {
      if (sourceToggleRevisionRef.current.get(sourceBrand) !== requestRevision) {
        return;
      }
      draftRevisionRef.current += 1;
      setRows((prev) =>
        prev.map((row) => (row.source_brand === sourceBrand ? { ...row, include_in_designers: previousValue } : row))
      );
      setBaselineRows((prev) =>
        prev.map((row) => (row.source_brand === sourceBrand ? { ...row, include_in_designers: previousValue } : row))
      );
      pushToast(error instanceof Error ? error.message : "Не удалось изменить видимость дизайнера");
    });
  }, [pushToast, rows]);

  const onChangeFinalDesignerName = useCallback((designerId: string, designerName: string) => {
    draftRevisionRef.current += 1;
    setDesigners((prev) =>
      prev.map((designer) => (designer.id === designerId ? { ...designer, name: designerName } : designer))
    );
  }, []);

  const onChangeFinalDesignerDescription = useCallback((designerId: string, description: string) => {
    draftRevisionRef.current += 1;
    setDesigners((prev) =>
      prev.map((designer) => (designer.id === designerId ? { ...designer, description } : designer))
    );
  }, []);

  const onCreateDesigner = useCallback((designerName: string) => {
    draftRevisionRef.current += 1;
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
    draftRevisionRef.current += 1;
    setDesigners((prev) => prev.filter((designer) => designer.id !== designerId));
  }, []);

  const onMarkAllViewed = useCallback(async (kind: DesignerViewKind) => {
    if (markAllViewedPending) {
      return;
    }
    setMarkAllViewedPending(kind);
    try {
      const marked = await markAllAdminDesignerViewsViewed(kind);
      if (kind === "brands") {
        setRows((prev) => prev.map((row) => (row.is_new ? { ...row, is_new: false } : row)));
      } else {
        setDesigners((prev) => prev.map((designer) => (designer.is_new ? { ...designer, is_new: false } : designer)));
      }
      pushToast(marked > 0 ? `Отмечено просмотренным: ${marked}` : "Всё уже просмотрено");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Не удалось отметить просмотренным");
    } finally {
      setMarkAllViewedPending(null);
    }
  }, [markAllViewedPending, pushToast]);

  const onMarkBrandViewed = useCallback((sourceBrand: string) => {
    setRows((prev) => prev.map((row) => (
      row.source_brand === sourceBrand ? { ...row, is_new: false } : row
    )));
    markAdminBrandViewed(sourceBrand).catch((error) => {
      setRows((prev) => prev.map((row) => (
        row.source_brand === sourceBrand ? { ...row, is_new: true } : row
      )));
      pushToast(error instanceof Error ? error.message : "Не удалось отметить бренд просмотренным");
    });
  }, [pushToast]);

  const onMarkDesignerViewed = useCallback((designerId: string) => {
    setDesigners((prev) => prev.map((designer) => (
      designer.id === designerId ? { ...designer, is_new: false } : designer
    )));
    markAdminDesignerViewed(designerId).catch((error) => {
      setDesigners((prev) => prev.map((designer) => (
        designer.id === designerId ? { ...designer, is_new: true } : designer
      )));
      pushToast(error instanceof Error ? error.message : "Не удалось отметить дизайнера просмотренным");
    });
  }, [pushToast]);

  const persistState = useCallback(async (nextDraftRows: readonly AdminDesignerSourceRow[], nextDraftDesigners: readonly AdminFinalDesigner[]) => {
    const savedDraftRevision = draftRevisionRef.current;
    try {
      setSaving(true);
      const normalizedRows = nextDraftRows.map(normalizeRow);
      const normalizedDesigners = nextDraftDesigners.map(normalizeDesigner);
      const nextPayload = await saveAdminDesignerMappings({
        rows: normalizedRows,
        designers: normalizedDesigners,
      });
      // Keep the server baseline current even when a newer local interaction exists:
      // this makes the autosave queue persist that newer draft after this request.
      setBaselineRows(nextPayload.rows);
      setBaselineDesigners(nextPayload.designers);
      // A delayed response must not overwrite an interaction made while it was saving.
      if (draftRevisionRef.current !== savedDraftRevision) {
        return;
      }
      setRows(nextPayload.rows);
      setDesigners(nextPayload.designers);
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
    markAllViewedPending,
    onMarkAllViewed,
    onMarkBrandViewed,
    onMarkDesignerViewed,
    onChangeDesignerName,
    onToggleIncludeInDesigners,
    onChangeFinalDesignerName,
    onChangeFinalDesignerDescription,
    onCreateDesigner,
    onDeleteDesigner,
  };
}
