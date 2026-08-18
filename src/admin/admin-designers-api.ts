import { API_BASE } from "../shared/admin-auth";
import { apiJson } from "../shared/api-client";
import type { AdminFinalDesigner, AdminDesignerSourceRow } from "./admin-types";

export type AdminDesignerMappingsPayload = {
  rows: AdminDesignerSourceRow[];
  designers: AdminFinalDesigner[];
};

type InternalDesignerStore = {
  rows: AdminDesignerSourceRow[];
  designers: AdminFinalDesigner[];
};

let store: InternalDesignerStore = {
  rows: [],
  designers: [],
};

function normalizeText(value: string | null | undefined) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function cloneRows(rows: readonly AdminDesignerSourceRow[]) {
  return rows.map((row) => ({ ...row }));
}

function cloneDesigners(designers: readonly AdminFinalDesigner[]) {
  return designers.map((designer) => ({ ...designer }));
}

function clonePayload(payload: AdminDesignerMappingsPayload): AdminDesignerMappingsPayload {
  return {
    rows: cloneRows(payload.rows),
    designers: cloneDesigners(payload.designers),
  };
}

function normalizePayload(payload: AdminDesignerMappingsPayload): AdminDesignerMappingsPayload {
  return {
    rows: cloneRows(payload.rows).map((row) => ({
      source_brand: normalizeText(row.source_brand),
      source_product_count: Math.max(0, Math.trunc(Number(row.source_product_count) || 0)),
      source_unavailable_product_count: Math.max(0, Math.trunc(Number(row.source_unavailable_product_count) || 0)),
      source_public_product_count: Math.max(0, Math.trunc(Number(row.source_public_product_count) || 0)),
      designer_name: normalizeText(row.designer_name),
      include_in_designers: Boolean(row.include_in_designers),
    })),
    designers: cloneDesigners(payload.designers).map((designer) => ({
      id: normalizeText(designer.id),
      name: normalizeText(designer.name),
      description: String(designer.description || "").trim(),
    })),
  };
}

function writeStore(payload: AdminDesignerMappingsPayload): AdminDesignerMappingsPayload {
  const normalized = normalizePayload(payload);
  store = {
    rows: normalized.rows,
    designers: normalized.designers,
  };
  return clonePayload(normalized);
}

function buildPayload(): AdminDesignerMappingsPayload {
  return clonePayload({
    rows: store.rows,
    designers: store.designers,
  });
}

export async function fetchAdminDesignerMappings(): Promise<AdminDesignerMappingsPayload> {
  const payload = await apiJson<AdminDesignerMappingsPayload>(`${API_BASE}/admin/designers/editor`);
  return writeStore(payload);
}

export async function saveAdminDesignerMappings(payload: AdminDesignerMappingsPayload): Promise<AdminDesignerMappingsPayload> {
  const saved = await apiJson<AdminDesignerMappingsPayload>(`${API_BASE}/admin/designers/editor`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizePayload(payload)),
  });
  return writeStore(saved);
}

export function readAdminDesignerMappingsState(): AdminDesignerMappingsPayload {
  return buildPayload();
}

export function hydrateAdminDesignerMappings(payload: AdminDesignerMappingsPayload): AdminDesignerMappingsPayload {
  return writeStore(payload);
}
