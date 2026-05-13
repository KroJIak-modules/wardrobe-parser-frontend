import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { API_BASE } from "../admin-auth";
import { errResult, okResult } from "../action-result";
import { apiJson, apiNoContent } from "../api-client";
import type { AdminCategoryNode, CategoryManualProduct } from "../live-data-types";

export function useLiveDataCategoryDedupActions(params: {
  setAdminCategories: Dispatch<SetStateAction<AdminCategoryNode[]>>;
  refreshCategoriesOnly: (options?: { includeCounts?: boolean; silent?: boolean }) => Promise<void>;
  refreshProductsOnly: () => Promise<void>;
  refreshAfterDedupMutation: () => void;
}) {
  const { setAdminCategories, refreshCategoriesOnly, refreshProductsOnly, refreshAfterDedupMutation } = params;

  const createCategory = useCallback(async (name: string, parentId: number | null) => {
    try {
      const created = await apiJson<AdminCategoryNode>(`${API_BASE}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parent_id: parentId }),
      });
      if (created?.id) {
        const insertNode = (nodes: AdminCategoryNode[]): AdminCategoryNode[] => {
          if (created.parent_id === null) return [...nodes, created];
          return nodes.map((node) => {
            if (node.id === created.parent_id) return { ...node, has_children: true, children: [...node.children, created] };
            if (!node.children?.length) return node;
            return { ...node, children: insertNode(node.children) };
          });
        };
        setAdminCategories((prev) => insertNode(prev));
      }
      void refreshCategoriesOnly({ includeCounts: true, silent: true });
      return { ...okResult("Категория создана"), categoryId: created?.id };
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshCategoriesOnly, setAdminCategories]);

  const updateCategory = useCallback(async (id: number, payload: { name?: string; parent_id?: number | null; is_enabled?: boolean; is_favorite?: boolean }) => {
    try {
      const updatedNode = await apiJson<AdminCategoryNode>(`${API_BASE}/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (updatedNode?.id) {
        const patchNodeById = (nodes: AdminCategoryNode[]): AdminCategoryNode[] =>
          nodes.map((node) => (node.id === updatedNode.id
            ? { ...node, ...updatedNode }
            : { ...node, children: node.children?.length ? patchNodeById(node.children) : node.children }));
        setAdminCategories((prev) => patchNodeById(prev));
      }
      if (payload.parent_id !== undefined) void refreshCategoriesOnly({ includeCounts: true, silent: true });
      return okResult("Категория обновлена");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshCategoriesOnly, setAdminCategories]);

  const deleteCategory = useCallback(async (id: number) => {
    try {
      await apiNoContent(`${API_BASE}/categories/${id}`, { method: "DELETE" });
      const dropNodeById = (nodes: AdminCategoryNode[]): AdminCategoryNode[] =>
        nodes.filter((node) => node.id !== id).map((node) => ({ ...node, children: node.children?.length ? dropNodeById(node.children) : node.children }));
      setAdminCategories((prev) => dropNodeById(prev));
      void refreshCategoriesOnly({ includeCounts: true, silent: true });
      return okResult("Категория удалена");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshCategoriesOnly, setAdminCategories]);

  const addCategoryKeyword = useCallback(async (id: number, keyword: string, scope: "local" | "title" | "status" = "local") => {
    try {
      await apiNoContent(`${API_BASE}/categories/${id}/keywords`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword, scope }) });
      await refreshCategoriesOnly();
      return okResult("OK");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshCategoriesOnly]);

  const removeCategoryKeyword = useCallback(async (id: number, keyword: string, scope: "local" | "title" | "status" = "local") => {
    try {
      const encodedKeyword = encodeURIComponent(keyword);
      await apiNoContent(`${API_BASE}/categories/${id}/keywords/${encodedKeyword}?scope=${scope}`, { method: "DELETE" });
      await refreshCategoriesOnly();
      return okResult("OK");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshCategoriesOnly]);

  const getCategoryManualProducts = useCallback(async (categoryId: number) => {
    try {
      const payload = await apiJson<CategoryManualProduct[]>(`${API_BASE}/categories/${categoryId}/manual-products`);
      return { ...okResult("OK"), items: payload || [] };
    } catch (e) {
      return { ...errResult(e instanceof Error ? e.message : "Unknown error"), items: [] as CategoryManualProduct[] };
    }
  }, []);

  const searchCategoryManualProducts = useCallback(async (categoryId: number, query: string, limit: number = 3) => {
    try {
      const params = new URLSearchParams({ query, limit: String(limit) });
      const payload = await apiJson<CategoryManualProduct[]>(`${API_BASE}/categories/${categoryId}/manual-products/search?${params.toString()}`);
      return { ...okResult("OK"), items: payload || [] };
    } catch (e) {
      return { ...errResult(e instanceof Error ? e.message : "Unknown error"), items: [] as CategoryManualProduct[] };
    }
  }, []);

  const addCategoryManualProduct = useCallback(async (categoryId: number, productId: number) => {
    try {
      await apiNoContent(`${API_BASE}/categories/${categoryId}/manual-products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });
      await Promise.all([refreshProductsOnly(), refreshCategoriesOnly()]);
      return okResult("Товар добавлен в категорию");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshCategoriesOnly, refreshProductsOnly]);

  const removeCategoryManualProduct = useCallback(async (categoryId: number, productId: number) => {
    try {
      await apiNoContent(`${API_BASE}/categories/${categoryId}/manual-products/${productId}`, { method: "DELETE" });
      await Promise.all([refreshProductsOnly(), refreshCategoriesOnly()]);
      return okResult("Товар убран из категории");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshCategoriesOnly, refreshProductsOnly]);

  const mergeDedupPair = useCallback(async (primaryProductId: number, duplicateProductId: number) => {
    try {
      await apiNoContent(`${API_BASE}/dedup/merge`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ primary_product_id: primaryProductId, duplicate_product_id: duplicateProductId }) });
      refreshAfterDedupMutation();
      return okResult("Дубликаты объединены");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshAfterDedupMutation]);

  const rejectDedupPair = useCallback(async (productAId: number, productBId: number) => {
    try {
      await apiNoContent(`${API_BASE}/dedup/reject`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product_a_id: productAId, product_b_id: productBId }) });
      refreshAfterDedupMutation();
      return okResult("Пара помечена как не дубль");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshAfterDedupMutation]);

  const combineDedupPair = useCallback(async (productAId: number, productBId: number) => {
    try {
      await apiNoContent(`${API_BASE}/dedup/combine`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product_a_id: productAId, product_b_id: productBId }) });
      refreshAfterDedupMutation();
      return okResult("Дубликаты соединены");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshAfterDedupMutation]);

  const undoDedupDecision = useCallback(async (pairKey: string) => {
    try {
      await apiNoContent(`${API_BASE}/dedup/undo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pair_key: pairKey }) });
      refreshAfterDedupMutation();
      return okResult("Решение отменено");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshAfterDedupMutation]);

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    addCategoryKeyword,
    removeCategoryKeyword,
    getCategoryManualProducts,
    searchCategoryManualProducts,
    addCategoryManualProduct,
    removeCategoryManualProduct,
    mergeDedupPair,
    rejectDedupPair,
    combineDedupPair,
    undoDedupDecision,
  };
}
