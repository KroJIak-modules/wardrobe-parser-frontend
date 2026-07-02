import { API_BASE } from "../shared/admin-auth";
import { apiJson } from "../shared/api-client";
import type { AdminFiltersCategoriesPayload, AdminRuleManualProduct } from "./admin-filters-categories-types";

type AdminFiltersCategoriesWritePayload = Pick<
  AdminFiltersCategoriesPayload,
  "filters" | "categories" | "custom_catalogs" | "hidden_product_ids"
>;

export async function fetchAdminFiltersCategoriesState(): Promise<AdminFiltersCategoriesPayload> {
  return apiJson<AdminFiltersCategoriesPayload>(`${API_BASE}/admin/taxonomy/editor`);
}

export async function searchAdminFiltersCategoriesProductLibrary(query: string, limit = 8): Promise<AdminRuleManualProduct[]> {
  const searchParams = new URLSearchParams();
  searchParams.set("q", query);
  searchParams.set("limit", String(limit));
  const payload = await apiJson<{ items: AdminRuleManualProduct[] }>(
    `${API_BASE}/admin/taxonomy/editor/product-library?${searchParams.toString()}`
  );
  return payload.items;
}

export function buildAdminFiltersCategoriesWritePayload(payload: AdminFiltersCategoriesWritePayload) {
  return {
    filters: payload.filters.map(function buildFilter(node) {
      return {
        id: node.id,
        label: node.label,
        display_label: node.display_label,
        mobile_pair_root_id: node.mobile_pair_root_id,
        node_kind: node.node_kind,
        is_enabled: node.is_enabled,
        rules: {
          local_category_keywords: [...node.rules.local_category_keywords],
          title_keywords: [...node.rules.title_keywords],
          manual_products: node.rules.manual_products.map((item) => ({
            product_id: item.product_id,
          })),
        },
        children: node.children.map(buildFilter),
      };
    }),
    categories: payload.categories.map((category) => ({
      id: category.id,
      label: category.label,
      behavior: category.behavior,
      system_filter_value: category.system_filter_value ?? null,
      attachments: category.attachments.map((attachment) => ({
        id: attachment.id,
        kind: attachment.kind,
        ref_id: attachment.ref_id,
        hidden_node_ids: [...attachment.hidden_node_ids],
      })),
      children: [],
    })),
    custom_catalogs: payload.custom_catalogs.map((catalog) => ({
      id: catalog.id,
      label: catalog.label,
      description: catalog.description,
      is_enabled: catalog.is_enabled,
      manual_products: catalog.manual_products.map((item) => ({
        product_id: item.product_id,
      })),
    })),
    hidden_product_ids: [...payload.hidden_product_ids],
  };
}

export async function saveAdminFiltersCategoriesState(payload: AdminFiltersCategoriesWritePayload): Promise<AdminFiltersCategoriesPayload> {
  return apiJson<AdminFiltersCategoriesPayload>(`${API_BASE}/admin/taxonomy/editor`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildAdminFiltersCategoriesWritePayload(payload)),
  });
}
