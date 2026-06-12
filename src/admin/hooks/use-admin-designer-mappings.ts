import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAdminDesignerMappings, readAdminDesignerMappingsSeed, saveAdminDesignerMappings } from "../admin-designers-mock";
import type { AdminDesignerCatalogPage, AdminDesignerMappingRow } from "../admin-types";

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

function createPagesSignature(pages: readonly AdminDesignerCatalogPage[]) {
  return pages
    .map((page) => {
      const id = String(page.id || "").trim();
      const titleRef = String(page.title_ref || "").trim();
      const description = String(page.catalog_description || "").trim();
      return `${id}|${titleRef}|${description}`;
    })
    .sort()
    .join("||");
}

function normalizePage(page: AdminDesignerCatalogPage): AdminDesignerCatalogPage {
  return {
    id: String(page.id || "").trim(),
    title_ref: String(page.title_ref || "").trim(),
    catalog_description: String(page.catalog_description || "").trim(),
  };
}

function sortPagesForLoad(pages: readonly AdminDesignerCatalogPage[]) {
  return [...pages].sort((left, right) => {
    const leftTitle = String(left.title_ref || "").trim();
    const rightTitle = String(right.title_ref || "").trim();
    if (!leftTitle && !rightTitle) {
      return String(left.id || "").localeCompare(String(right.id || ""), "en", { numeric: true, sensitivity: "base" });
    }
    if (!leftTitle) {
      return 1;
    }
    if (!rightTitle) {
      return -1;
    }
    return leftTitle.localeCompare(rightTitle, "en", { numeric: true, sensitivity: "base" });
  });
}

function createPageId() {
  return `designer-page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useAdminDesignerMappings(tab: string, pushToast: (message: string) => void) {
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [rows, setRows] = useState<AdminDesignerMappingRow[]>(() => readAdminDesignerMappingsSeed().rows);
  const [pages, setPages] = useState<AdminDesignerCatalogPage[]>(() => readAdminDesignerMappingsSeed().pages);
  const [baselineRows, setBaselineRows] = useState<AdminDesignerMappingRow[]>(() => readAdminDesignerMappingsSeed().rows);
  const [baselinePages, setBaselinePages] = useState<AdminDesignerCatalogPage[]>(() => readAdminDesignerMappingsSeed().pages);
  const saveTimeoutRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const payload = await fetchAdminDesignerMappings();
      const nextRows = payload.rows.map(normalizeRow);
      const nextPages = sortPagesForLoad(payload.pages.map(normalizePage));
      setRows(nextRows);
      setPages(nextPages);
      setBaselineRows(nextRows);
      setBaselinePages(nextPages);
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

  const onToggleIncludeInDesigners = useCallback((sourceBrand: string, includeInDesigners: boolean) => {
    setRows((prev) =>
      prev.map((row) => (row.source_brand === sourceBrand ? { ...row, include_in_designers: includeInDesigners } : row))
    );
  }, []);

  const onChangeCatalogPageTitle = useCallback((pageId: string, titleRef: string) => {
    setPages((prev) =>
      prev.map((page) => (page.id === pageId ? { ...page, title_ref: titleRef } : page))
    );
  }, []);

  const onChangeCatalogPageDescription = useCallback((pageId: string, catalogDescription: string) => {
    setPages((prev) =>
      prev.map((page) => (page.id === pageId ? { ...page, catalog_description: catalogDescription } : page))
    );
  }, []);

  const onCreateCatalogPage = useCallback((titleRef: string) => {
    const normalizedTitleRef = String(titleRef || "").trim();
    setPages((prev) => [
      ...prev,
      {
        id: createPageId(),
        title_ref: normalizedTitleRef,
        catalog_description: "",
      },
    ]);
  }, []);

  const onDeleteCatalogPage = useCallback((pageId: string) => {
    setPages((prev) => prev.filter((page) => page.id !== pageId));
  }, []);

  const persistState = useCallback(async (nextDraftRows: readonly AdminDesignerMappingRow[], nextDraftPages: readonly AdminDesignerCatalogPage[]) => {
    try {
      setSaving(true);
      const normalizedRows = nextDraftRows.map(normalizeRow);
      const normalizedPages = nextDraftPages.map(normalizePage);
      const nextPayload = await saveAdminDesignerMappings({
        rows: normalizedRows,
        pages: normalizedPages,
      });
      setRows(nextPayload.rows);
      setPages(nextPayload.pages);
      setBaselineRows(nextPayload.rows);
      setBaselinePages(nextPayload.pages);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Ошибка сохранения дизайнеров");
    } finally {
      setSaving(false);
    }
  }, [pushToast]);

  const hasUnsavedChanges = useMemo(
    () => createSignature(rows) !== createSignature(baselineRows) || createPagesSignature(pages) !== createPagesSignature(baselinePages),
    [baselinePages, baselineRows, pages, rows]
  );
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
      void persistState(rows, pages);
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [hasInvalidRows, hasUnsavedChanges, loading, pages, persistState, rows, saving, tab]);

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
    pages,
    onChangeCatalogTitle,
    onToggleIncludeInDesigners,
    onChangeCatalogPageTitle,
    onChangeCatalogPageDescription,
    onCreateCatalogPage,
    onDeleteCatalogPage,
  };
}
