import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { API_BASE } from "../admin-auth";
import { errResult, okResult } from "../action-result";
import { apiJson } from "../api-client";
import { normalizeServiceProduct } from "../live-product-normalizer";
import type { ProductStarredCategoryOption, ProductUrlPreview, ProductWriteState, ServiceProduct } from "../live-data-types";

type SetProducts = Dispatch<SetStateAction<ServiceProduct[]>>;

type TaxonomyState = {
  filters?: Array<{
    slug?: string | null;
    title?: string | null;
    children?: TaxonomyState["filters"];
  }>;
};

function flattenFilterOptions(nodes: TaxonomyState["filters"], items: Array<{ slug: string; name: string }> = []) {
  for (const node of nodes || []) {
    const slug = String(node?.slug || "").trim();
    const title = String(node?.title || "").trim();
    if (slug && title) {
      items.push({ slug, name: title });
    }
    flattenFilterOptions(node?.children, items);
  }
  return items;
}

function normalizeManualImageOrder(order: string[] | undefined): string[] | undefined {
  if (!Array.isArray(order)) {
    return undefined;
  }
  const normalized: string[] = [];
  const seen = new Set<string>();
  for (const rawItem of order) {
    const item = String(rawItem || "").trim();
    if (!item || seen.has(item)) {
      continue;
    }
    seen.add(item);
    normalized.push(item);
  }
  return normalized;
}

export function useLiveDataProductActions(params: {
  setProducts: SetProducts;
  refreshProductsOnly: () => Promise<void>;
  refreshSourcesOnly: () => Promise<void>;
}) {
  const { setProducts, refreshProductsOnly, refreshSourcesOnly } = params;

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

  const probeProductByUrl = useCallback(async (url: string) => {
    try {
      const payload = await apiJson<ProductUrlPreview>(`${API_BASE}/products/probe-by-url`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }),
      });
      return { ...okResult("Данные товара получены из источника", payload), preview: payload };
    } catch (e) {
      return { ...errResult(e instanceof Error ? e.message : "Unknown error", null), preview: null };
    }
  }, []);

  const addProductByUrl = useCallback(async (url: string, payload?: {
    title?: string; designer_name?: string | null; source_category_name?: string | null; price?: number | null; currency?: string; image_count?: number;
  }) => {
    try {
      await apiJson(`${API_BASE}/products/add-by-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, ...(payload || {}) }),
      });
      await Promise.all([refreshProductsOnly(), refreshSourcesOnly()]);
      return okResult("Товар добавлен по URL");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshProductsOnly, refreshSourcesOnly]);

  const createManualProduct = useCallback(async (payload: {
    title: string;
    description?: string | null;
    description_html?: string | null;
    designer_name?: string | null;
    source_category_name: string | null;
    gender?: "male" | "female" | "unisex" | null;
    variants: Array<{ title: string; price: number | null; currency: string; available: boolean }>;
    manual_image_asset_ids: number[];
    manual_weight_grams?: number | null;
    price_override?: {
      manual_price_rub?: number | null;
      manual_compare_at_price_rub?: number | null;
    } | null;
    state?: ProductWriteState;
    filter_slugs?: string[];
    bind_sync?: boolean;
    bind_url?: string | null;
  }) => {
    try {
      const out = await apiJson<{ id?: number }>(`${API_BASE}/products/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          description_text: payload.description ?? null,
          ...(payload.description_html !== undefined ? { description_html: payload.description_html } : {}),
          designer_name: payload.designer_name ?? null,
          source_category_name: payload.source_category_name ?? null,
          ...(payload.gender !== undefined ? { gender: payload.gender } : {}),
          variants: payload.variants,
          manual_image_asset_ids: payload.manual_image_asset_ids,
          manual_weight_grams: payload.manual_weight_grams ?? null,
          ...(payload.price_override !== undefined ? { price_override: payload.price_override } : {}),
          filter_slugs: payload.filter_slugs ?? [],
          bind_source_url: payload.bind_url ?? null,
          ...(payload.state || {}),
        }),
      });
      await Promise.all([refreshProductsOnly(), refreshSourcesOnly()]);
      return { ...okResult("Ручной товар сохранен"), id: Number(out?.id || 0) || null };
    } catch (e) {
      return { ...errResult(e instanceof Error ? e.message : "Unknown error"), id: null };
    }
  }, [refreshProductsOnly, refreshSourcesOnly]);

  const updateManualProduct = useCallback(async (productId: number, payload: {
    title: string;
    description?: string | null;
    description_html?: string | null;
    designer_name?: string | null;
    source_category_name: string | null;
    gender?: "male" | "female" | "unisex" | null;
    variants: Array<{ title: string; price: number | null; currency: string; available: boolean }>;
    manual_image_asset_ids: number[];
    manual_weight_grams?: number | null;
    price_override?: {
      manual_price_rub?: number | null;
      manual_compare_at_price_rub?: number | null;
    } | null;
    state?: ProductWriteState;
    filter_slugs?: string[];
    bind_sync?: boolean;
    bind_url?: string | null;
  }) => {
    try {
      const out = await apiJson<{ id?: number }>(`${API_BASE}/products/manual/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          description_text: payload.description ?? null,
          ...(payload.description_html !== undefined ? { description_html: payload.description_html } : {}),
          designer_name: payload.designer_name ?? null,
          source_category_name: payload.source_category_name ?? null,
          ...(payload.gender !== undefined ? { gender: payload.gender } : {}),
          variants: payload.variants,
          manual_image_asset_ids: payload.manual_image_asset_ids,
          manual_weight_grams: payload.manual_weight_grams ?? null,
          ...(payload.price_override !== undefined ? { price_override: payload.price_override } : {}),
          filter_slugs: payload.filter_slugs ?? [],
          ...(payload.state || {}),
        }),
      });
      if (payload.bind_sync && payload.bind_url) {
        await apiJson(`${API_BASE}/products/${productId}/bind-source-by-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: payload.bind_url, set_as_primary: false }),
        });
      } else if (payload.bind_sync === false) {
        const product = await apiJson<{ listings?: Array<{ id: number; ingest_mode?: string | null }> }>(`${API_BASE}/admin/products/${productId}`);
        for (const listing of product.listings || []) {
          if (String(listing.ingest_mode || "").trim().toLowerCase() !== "sync") {
            continue;
          }
          await apiJson(`${API_BASE}/products/${productId}/listings/${Number(listing.id)}`, { method: "DELETE" });
        }
      }
      await Promise.all([refreshProductsOnly(), refreshSourcesOnly()]);
      return { ...okResult("Ручной товар обновлен"), id: Number(out?.id || 0) || null };
    } catch (e) {
      return { ...errResult(e instanceof Error ? e.message : "Unknown error"), id: null };
    }
  }, [refreshProductsOnly, refreshSourcesOnly]);

  const getStarredCategoryOptions = useCallback(async () => {
    try {
      const payload = await apiJson<TaxonomyState>(`${API_BASE}/taxonomy/state`);
      return { ok: true, items: flattenFilterOptions(payload.filters) };
    } catch {
      return { ok: false, items: [] as Array<{ slug: string; name: string }> };
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

  const bulkUpdateProducts = useCallback(async (payload: {
    product_ids: number[];
    gender?: "male" | "female" | "unisex" | null;
  }) => {
    try {
      const response = await apiJson<{ updated_product_ids?: number[] }>(`${API_BASE}/admin/products/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await refreshProductsOnly();
      return {
        ok: true,
        message: "Товары обновлены",
        updatedProductIds: Array.isArray(response?.updated_product_ids)
          ? response.updated_product_ids.map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0)
          : [],
      };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "Unknown error",
        updatedProductIds: [],
      };
    }
  }, [refreshProductsOnly]);

  const updateProductOverrides = useCallback(async (productId: number, payload: {
    title?: string;
    description?: string;
    description_text?: string;
    description_html?: string;
    description_visible?: boolean | null;
    gender?: "male" | "female" | "unisex" | null;
    availability_mode?: "in_stock" | "by_order" | null;
    manual_weight_grams?: number | null;
    price_override?: {
      manual_price_rub?: number | null;
      manual_compare_at_price_rub?: number | null;
    } | null;
    gallery_listing_id?: number | null;
    images?: { hidden_source_image_urls?: string[]; manual_image_urls?: string[]; manual_image_order?: string[] };
    reset_to_default?: Array<"title" | "description" | "images" | "description_visibility" | "manual_weight_grams" | "price_override">;
  }) => {
    try {
      const nextProduct = await apiJson<ServiceProduct>(`${API_BASE}/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title_override: payload.title,
          description_text: payload.description_text ?? payload.description,
          description_html: payload.description_html,
          description_visibility: payload.description_visible,
          ...(payload.gender !== undefined ? { gender: payload.gender } : {}),
          ...(payload.availability_mode !== undefined ? { availability_mode: payload.availability_mode } : {}),
          ...(payload.manual_weight_grams !== undefined ? { manual_weight_grams: payload.manual_weight_grams } : {}),
          ...(payload.price_override !== undefined ? { price_override: payload.price_override } : {}),
          ...(payload.gallery_listing_id !== undefined ? { gallery_listing_id: payload.gallery_listing_id } : {}),
          images: payload.images
            ? {
                ...payload.images,
                ...(payload.images.manual_image_order
                  ? { manual_image_order: normalizeManualImageOrder(payload.images.manual_image_order) }
                  : {}),
              }
            : payload.images,
          reset_to_default: (payload.reset_to_default || []).flatMap((item) => {
            if (item === "title") return ["title_override"];
            if (item === "description") return ["description_text", "description_html"];
            if (item === "description_visibility") return ["description_visibility"];
            if (item === "manual_weight_grams") return ["manual_weight_grams"];
            if (item === "price_override") return ["price_override"];
            return [item];
          }),
        }),
      });
      const normalizedProduct = nextProduct?.id ? normalizeServiceProduct(nextProduct as never) : null;
      if (normalizedProduct?.id) {
        setProducts((prev) => prev.map((item) => (item.id === normalizedProduct.id ? { ...item, ...normalizedProduct } : item)));
      }
      return { ok: true, message: "Товар обновлен", product: normalizedProduct };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error", product: null };
    }
  }, [setProducts]);

  const setProductStatus = useCallback(async (productId: number, state: ProductWriteState) => {
    try {
      const payload = await apiJson<ServiceProduct>(`${API_BASE}/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      const normalizedProduct = payload?.id ? normalizeServiceProduct(payload as never) : null;
      if (normalizedProduct?.id) {
        setProducts((prev) => prev.map((item) => (item.id === normalizedProduct.id ? { ...item, ...normalizedProduct } : item)));
      }
      return { ok: true, message: "Статус товара обновлен" };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error" };
    }
  }, [setProducts]);

  const getProductStarredCategories = useCallback(async (productId: number) => {
    try {
      const [productPayload, taxonomyPayload] = await Promise.all([
        apiJson<ServiceProduct>(`${API_BASE}/admin/products/${productId}`),
        apiJson<TaxonomyState>(`${API_BASE}/taxonomy/state`),
      ]);
      const available = flattenFilterOptions(taxonomyPayload.filters);
      const assignedSlugs = Array.isArray((productPayload as ServiceProduct).filter_slugs) ? (productPayload as ServiceProduct).filter_slugs || [] : [];
      return {
        ok: true,
        message: "OK",
        assignedFilterSlugs: assignedSlugs,
        availableCategories: available as ProductStarredCategoryOption[],
      };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error", assignedFilterSlugs: [], availableCategories: [] };
    }
  }, []);

  const setProductStarredCategories = useCallback(async (productId: number, filterSlugs: string[]) => {
    try {
      const normalizedFilterSlugs = [...new Set(filterSlugs.map((item) => String(item || "").trim()).filter(Boolean))];
      await apiJson(`${API_BASE}/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filter_slugs: normalizedFilterSlugs }),
      });
      setProducts((prev) => prev.map((item) => (
        item.id === productId
          ? { ...item, filter_slugs: normalizedFilterSlugs, is_favorite: normalizedFilterSlugs.length > 0 }
          : item
      )));
      return { ok: true, message: "Избранные категории сохранены", assignedFilterSlugs: normalizedFilterSlugs };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unknown error", assignedFilterSlugs: [] };
    }
  }, [setProducts]);

  return {
    previewProductByUrl,
    probeProductByUrl,
    addProductByUrl,
    createManualProduct,
    updateManualProduct,
    uploadProductImage,
    uploadProductImageByUrl,
    bulkUpdateProducts,
    updateProductOverrides,
    setProductStatus,
    getProductStarredCategories,
    setProductStarredCategories,
    getStarredCategoryOptions,
  };
}
