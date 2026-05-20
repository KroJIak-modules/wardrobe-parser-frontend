import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { API_BASE } from "../admin-auth";
import { errResult, okResult } from "../action-result";
import { apiJson } from "../api-client";
import type { ProductStarredCategoryOption, ProductUrlPreview, ServiceProduct } from "../live-data-types";

type SetProducts = Dispatch<SetStateAction<ServiceProduct[]>>;

export function useLiveDataProductActions(params: {
  setProducts: SetProducts;
  refresh: () => Promise<void>;
}) {
  const { setProducts, refresh } = params;

  const previewProductByUrl = useCallback(async (url: string) => {
    try {
      const payload = await apiJson<ProductUrlPreview>(`${API_BASE}/products/preview-by-url`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }),
      });
      return { ...okResult("Preview получен", payload), preview: payload };
    } catch (e) {
      return { ...errResult(e instanceof Error ? e.message : "Unknown error", null), preview: null };
    }
  }, []);

  const addProductByUrl = useCallback(async (url: string, payload?: {
    title?: string; vendor?: string | null; product_type?: string | null; price?: number | null; currency?: string; image_count?: number;
  }) => {
    try {
      await apiJson(`${API_BASE}/products/add-by-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, ...(payload || {}) }),
      });
      await refresh();
      return okResult("Товар добавлен по URL");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refresh]);

  const createManualProduct = useCallback(async (payload: {
    title: string;
    description?: string | null;
    vendor?: string | null;
    currency: string;
    product_type: string | null;
    variants: Array<{ title: string; price: number | null; available: boolean }>;
    manual_image_asset_ids: number[];
    weight_grams?: number | null;
    status?: "available" | "out_of_stock" | "hidden";
    bind_sync?: boolean;
    bind_source_id?: number | null;
    bind_source_product_url?: string | null;
  }) => {
    try {
      const out = await apiJson<{ id?: number }>(`${API_BASE}/products/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await refresh();
      return { ...okResult("Ручной товар сохранен"), id: Number(out?.id || 0) || null };
    } catch (e) {
      return { ...errResult(e instanceof Error ? e.message : "Unknown error"), id: null };
    }
  }, [refresh]);

  const updateManualProduct = useCallback(async (productId: number, payload: {
    title: string;
    description?: string | null;
    vendor?: string | null;
    currency: string;
    product_type: string | null;
    variants: Array<{ title: string; price: number | null; available: boolean }>;
    manual_image_asset_ids: number[];
    weight_grams?: number | null;
    status?: "available" | "out_of_stock" | "hidden";
    bind_sync?: boolean;
    bind_source_id?: number | null;
    bind_source_product_url?: string | null;
  }) => {
    try {
      const out = await apiJson<{ id?: number }>(`${API_BASE}/products/manual/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await refresh();
      return { ...okResult("Ручной товар обновлен"), id: Number(out?.id || 0) || null };
    } catch (e) {
      return { ...errResult(e instanceof Error ? e.message : "Unknown error"), id: null };
    }
  }, [refresh]);

  const getStarredCategoryOptions = useCallback(async () => {
    try {
      const payload = await apiJson<{ items?: Array<{ id: number; name: string; slug: string }> }>(`${API_BASE}/products/starred-categories/options`);
      return { ok: true, items: Array.isArray(payload.items) ? payload.items : [] };
    } catch {
      return { ok: false, items: [] as Array<{ id: number; name: string; slug: string }> };
    }
  }, []);

  const uploadProductImage = useCallback(async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const payload = await apiJson<{ image_asset_id?: number }>(`${API_BASE}/products/upload-image`, { method: "POST", body: formData });
      const imageAssetId = Number(payload?.image_asset_id);
      if (!Number.isFinite(imageAssetId) || imageAssetId <= 0) {
        return { ok: false, message: "Сервер вернул некорректный id изображения", imageAssetId: null };
      }
      return { ok: true, message: "Изображение загружено", imageAssetId };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error", imageAssetId: null };
    }
  }, []);

  const uploadProductImageByUrl = useCallback(async (url: string) => {
    try {
      const payload = await apiJson<{ image_asset_id?: number }>(`${API_BASE}/products/upload-image-by-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const imageAssetId = Number(payload?.image_asset_id);
      if (!Number.isFinite(imageAssetId) || imageAssetId <= 0) {
        return { ok: false, message: "Сервер вернул некорректный id изображения", imageAssetId: null };
      }
      return { ok: true, message: "Изображение загружено", imageAssetId };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error", imageAssetId: null };
    }
  }, []);

  const updateProductOverrides = useCallback(async (productId: number, payload: {
    title?: string; description?: string; description_visible?: boolean | null; images?: { hidden_source_image_urls?: string[]; manual_image_urls?: string[]; manual_image_order?: string[] };
    reset_to_default?: Array<"title" | "description" | "images" | "description_visibility">;
  }) => {
    try {
      const nextProduct = await apiJson<ServiceProduct>(`${API_BASE}/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (nextProduct?.id) {
        setProducts((prev) => prev.map((item) => (item.id === nextProduct.id ? { ...item, ...nextProduct } : item)));
      }
      return { ok: true, message: "Товар обновлен", product: nextProduct };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error", product: null };
    }
  }, [setProducts]);

  const setProductStatus = useCallback(async (productId: number, status: "available" | "out_of_stock" | "hidden") => {
    try {
      const payload = await apiJson<ServiceProduct>(`${API_BASE}/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (payload?.id) {
        const statusOnly = String((payload.pricing_components as { reason?: unknown } | null | undefined)?.reason || "") === "status-only-patch";
        setProducts((prev) => prev.map((item) => (item.id === payload.id ? (statusOnly ? { ...item, status: payload.status } : { ...item, ...payload }) : item)));
      } else {
        setProducts((prev) => prev.map((item) => (item.id === productId ? { ...item, status } : item)));
      }
      return { ok: true, message: "Статус товара обновлен" };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
    }
  }, [setProducts]);

  const getProductStarredCategories = useCallback(async (productId: number) => {
    try {
      const payload = await apiJson<{ assigned_category_ids?: number[]; available_categories?: ProductStarredCategoryOption[] }>(`${API_BASE}/products/${productId}/starred-categories`);
      return {
        ok: true,
        message: "OK",
        assignedCategoryIds: Array.isArray(payload.assigned_category_ids) ? payload.assigned_category_ids.map((item) => Number(item)).filter((item) => Number.isFinite(item)) : [],
        availableCategories: Array.isArray(payload.available_categories) ? payload.available_categories : [],
      };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error", assignedCategoryIds: [], availableCategories: [] };
    }
  }, []);

  const setProductStarredCategories = useCallback(async (productId: number, categoryIds: number[]) => {
    try {
      const normalizedCategoryIds = [...new Set(categoryIds.filter((item) => Number.isFinite(item)).map((item) => Number(item)))];
      const payload = await apiJson<{ assigned_category_ids?: number[] }>(`${API_BASE}/products/${productId}/starred-categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_ids: normalizedCategoryIds }),
      });
      const assigned = Array.isArray(payload?.assigned_category_ids)
        ? payload.assigned_category_ids.map((item) => Number(item)).filter((item) => Number.isFinite(item))
        : normalizedCategoryIds;
      setProducts((prev) => prev.map((item) => (item.id === productId ? { ...item, starred_category_ids: assigned, is_favorite: assigned.length > 0 } : item)));
      return { ok: true, message: "Избранные категории сохранены", assignedCategoryIds: assigned };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error", assignedCategoryIds: [] };
    }
  }, [setProducts]);

  return {
    previewProductByUrl,
    addProductByUrl,
    createManualProduct,
    updateManualProduct,
    uploadProductImage,
    uploadProductImageByUrl,
    updateProductOverrides,
    setProductStatus,
    getProductStarredCategories,
    setProductStarredCategories,
    getStarredCategoryOptions,
  };
}
