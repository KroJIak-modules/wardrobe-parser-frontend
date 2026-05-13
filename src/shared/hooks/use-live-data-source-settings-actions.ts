import { useCallback } from "react";
import { API_BASE } from "../admin-auth";
import { errResult, okResult } from "../action-result";
import { apiJson, apiNoContent } from "../api-client";
import type { PricingExampleProduct, PricingSettings, SettingsTransferPayload, Source } from "../live-data-types";
import type { AdminUiSettings } from "../live-data-types";

export function useLiveDataSourceSettingsActions(params: {
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
  setPricingSettings: React.Dispatch<React.SetStateAction<PricingSettings | null>>;
  setAdminUiSettings: React.Dispatch<React.SetStateAction<AdminUiSettings | null>>;
  refresh: () => Promise<void>;
  refreshSourcesOnly: () => Promise<void>;
  refreshPricingOnly: () => Promise<void>;
  refreshAdminUiOnly: () => Promise<void>;
  refreshWeightOnly: () => Promise<void>;
  refreshCategoriesOnly: (options?: { includeCounts?: boolean; silent?: boolean }) => Promise<void>;
  refreshDedupOnly: () => Promise<void>;
  setError: (value: string | null) => void;
}) {
  const { setSources, setPricingSettings, setAdminUiSettings, refresh, refreshSourcesOnly, refreshPricingOnly, refreshAdminUiOnly, refreshWeightOnly, refreshCategoriesOnly, refreshDedupOnly, setError } = params;

  const patchSource = useCallback((sourceKey: string, updated: Source) => {
    setSources((prev) => prev.map((item) => (item.key === sourceKey ? updated : item)));
  }, [setSources]);

  const toggleSourceEnabled = useCallback(async (sourceKey: string, enabled: boolean) => {
    try {
      const updated = await apiJson<Source>(`${API_BASE}/sources/${sourceKey}/enabled`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) });
      patchSource(sourceKey, updated);
      return okResult(enabled ? "Источник включен" : "Источник выключен");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [patchSource]);

  const toggleSourceSyncEnabled = useCallback(async (sourceKey: string, syncEnabled: boolean) => {
    try {
      const updated = await apiJson<Source>(`${API_BASE}/sources/${sourceKey}/sync-enabled`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sync_enabled: syncEnabled }) });
      patchSource(sourceKey, updated);
      return okResult(syncEnabled ? "Источник участвует в синхронизации" : "Источник исключен из синхронизации");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [patchSource]);

  const assignSourceSupplier = useCallback(async (sourceKey: string, payload: Record<string, unknown>) => {
    try {
      const updated = await apiJson<Source>(`${API_BASE}/sources/${sourceKey}/supplier`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      patchSource(sourceKey, updated);
      return okResult("Настройки источника обновлены");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [patchSource]);

  const createWeightRule = useCallback(async (weightGrams: number) => {
    try {
      await apiJson(`${API_BASE}/settings/weight-rules`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weight_grams: weightGrams }) });
      await refreshWeightOnly();
      return okResult("Правило веса добавлено");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshWeightOnly]);

  const updateWeightRule = useCallback(async (id: number, weightGrams: number) => {
    try {
      await apiNoContent(`${API_BASE}/settings/weight-rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight_grams: weightGrams }),
      });
      await refreshWeightOnly();
      return okResult("Вес правила обновлен");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshWeightOnly]);

  const deleteWeightRule = useCallback(async (id: number) => {
    try {
      await apiNoContent(`${API_BASE}/settings/weight-rules/${id}`, { method: "DELETE" });
      await refreshWeightOnly();
      return okResult("Правило веса удалено");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshWeightOnly]);

  const addWeightKeyword = useCallback(async (ruleId: number, keyword: string) => {
    try {
      await apiNoContent(`${API_BASE}/settings/weight-rules/${ruleId}/keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      await refreshWeightOnly();
      return okResult("Ключевое слово добавлено");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshWeightOnly]);

  const removeWeightKeyword = useCallback(async (ruleId: number, keyword: string) => {
    try {
      const encoded = encodeURIComponent(keyword);
      await apiNoContent(`${API_BASE}/settings/weight-rules/${ruleId}/keywords/${encoded}`, { method: "DELETE" });
      await refreshWeightOnly();
      return okResult("Ключевое слово удалено");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshWeightOnly]);

  const toggleSourceAutoHideProducts = useCallback(async (sourceKey: string, hideAutoAddedProducts: boolean) => {
    try {
      const updated = await apiJson<Source>(`${API_BASE}/sources/${sourceKey}/hide-auto-added-products`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hide_auto_added_products: hideAutoAddedProducts }),
      });
      patchSource(sourceKey, updated);
      return okResult(hideAutoAddedProducts ? "Автотовары скрываются глобально" : "Автотовары снова показываются");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [patchSource]);

  const updateSourceAttributeVisibility = useCallback(async (sourceKey: string, payload: { show_description?: boolean; show_images?: boolean }) => {
    try {
      const updated = await apiJson<Source>(`${API_BASE}/sources/${sourceKey}/attribute-visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      patchSource(sourceKey, updated);
      return okResult("Правила атрибутов обновлены");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [patchSource]);

  const updateSourceCurrencyPriority = useCallback(async (sourceKey: string, currencyPriority: string[]) => {
    try {
      const updated = await apiJson<Source>(`${API_BASE}/sources/${sourceKey}/currency-priority`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency_priority: currencyPriority }),
      });
      patchSource(sourceKey, updated);
      return okResult("Приоритет валют обновлен");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [patchSource]);

  const updatePricingSettings = useCallback(async (payload: Partial<PricingSettings>) => {
    try {
      const updated = await apiJson<PricingSettings>(`${API_BASE}/settings/pricing`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setPricingSettings(updated || null);
      return okResult("Параметры формулы сохранены");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [setPricingSettings]);

  const fetchPricingExampleProduct = useCallback(async (): Promise<{ product: PricingExampleProduct | null; errorMessage: string | null }> => {
    try {
      const product = await apiJson<PricingExampleProduct>(`${API_BASE}/products/pricing-example`);
      return { product, errorMessage: null };
    } catch (e) {
      const text = e instanceof Error ? e.message : "Unknown error";
      const lower = text.toLowerCase();
      if (lower.includes("нет доступных товаров")) {
        return { product: null, errorMessage: "Сейчас нет доступных товаров для примера ценообразования." };
      }
      if (lower.includes("не удалось выбрать товар")) {
        return { product: null, errorMessage: "Не удалось выбрать товар для примера. Попробуй обновить страницу." };
      }
      if (lower.includes("500") || lower.includes("502") || lower.includes("503") || lower.includes("504")) {
        return { product: null, errorMessage: "Не удалось собрать пример из-за временной ошибки. Попробуй еще раз позже." };
      }
      return { product: null, errorMessage: "Не удалось собрать пример: у доступных товаров не хватает расчетных полей." };
    }
  }, []);

  const exportSettings = useCallback(async () => {
    try {
      const payload = await apiJson<SettingsTransferPayload>(`${API_BASE}/settings/export`);
      return { ...okResult("Настройки экспортированы"), payload };
    } catch (e) {
      return { ...errResult(e instanceof Error ? e.message : "Unknown error"), payload: null };
    }
  }, []);

  const importSettings = useCallback(async (payload: SettingsTransferPayload) => {
    try {
      await apiNoContent(`${API_BASE}/settings/import`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      await Promise.all([refresh(), refreshPricingOnly(), refreshWeightOnly(), refreshCategoriesOnly({ includeCounts: true, silent: true }), refreshSourcesOnly()]);
      return okResult("Настройки импортированы");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refresh, refreshCategoriesOnly, refreshPricingOnly, refreshSourcesOnly, refreshWeightOnly]);

  const resetSettings = useCallback(async () => {
    try {
      await apiJson<{ ok: boolean }>(`${API_BASE}/settings/reset`, { method: "POST" });
      await Promise.all([refresh(), refreshPricingOnly(), refreshWeightOnly(), refreshCategoriesOnly({ includeCounts: true, silent: true }), refreshSourcesOnly()]);
      return okResult("Настройки сброшены");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refresh, refreshCategoriesOnly, refreshPricingOnly, refreshSourcesOnly, refreshWeightOnly]);

  const updateShowcaseMediaSettings = useCallback(async (payload: {
    showcase_hero_image_asset_id?: number | null;
    showcase_carousel_image_asset_ids?: number[];
  }) => {
    try {
      if (payload.showcase_hero_image_asset_id === null) {
        await apiNoContent(`${API_BASE}/showcase/hero`, { method: "DELETE" });
      } else if (typeof payload.showcase_hero_image_asset_id === "number" && payload.showcase_hero_image_asset_id > 0) {
        await apiJson<{ ok: boolean; image_asset_id: number }>(`${API_BASE}/showcase/hero`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_asset_id: payload.showcase_hero_image_asset_id }),
        });
      }
      if (Array.isArray(payload.showcase_carousel_image_asset_ids)) {
        await apiJson<{ ok: boolean; items: number[] }>(`${API_BASE}/showcase/carousel/order`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: payload.showcase_carousel_image_asset_ids }),
        });
      }
      await refreshAdminUiOnly();
      return okResult("Медиа витрины сохранены");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshAdminUiOnly]);

  const updateAdminUiSettings = useCallback(async (payload: Partial<AdminUiSettings>) => {
    try {
      const updated = await apiJson<AdminUiSettings>(`${API_BASE}/settings/admin-ui`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setAdminUiSettings(updated || null);
      return okResult("Настройки интерфейса сохранены");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [setAdminUiSettings]);

  const updatePricingSupplier = useCallback(async (supplierId: number, payload: Record<string, unknown>) => {
    try {
      await apiNoContent(`${API_BASE}/settings/pricing/suppliers/${supplierId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await Promise.all([refreshPricingOnly(), refreshSourcesOnly()]);
      return okResult("Тариф обновлен");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshPricingOnly, refreshSourcesOnly]);

  const createPricingSupplier = useCallback(async (payload: Record<string, unknown>) => {
    try {
      await apiNoContent(`${API_BASE}/settings/pricing/suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await Promise.all([refreshPricingOnly(), refreshSourcesOnly()]);
      return okResult("Тариф добавлен");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshPricingOnly, refreshSourcesOnly]);

  const deletePricingSupplier = useCallback(async (supplierId: number) => {
    try {
      await apiNoContent(`${API_BASE}/settings/pricing/suppliers/${supplierId}`, { method: "DELETE" });
      await Promise.all([refreshPricingOnly(), refreshSourcesOnly()]);
      return okResult("Тариф удален");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshPricingOnly, refreshSourcesOnly]);

  return {
    toggleSourceEnabled,
    toggleSourceSyncEnabled,
    toggleSourceAutoHideProducts,
    updateSourceAttributeVisibility,
    updateSourceCurrencyPriority,
    assignSourceSupplier,
    createWeightRule,
    updateWeightRule,
    deleteWeightRule,
    addWeightKeyword,
    removeWeightKeyword,
    updatePricingSettings,
    updateAdminUiSettings,
    fetchPricingExampleProduct,
    updateShowcaseMediaSettings,
    updatePricingSupplier,
    createPricingSupplier,
    deletePricingSupplier,
    exportSettings,
    importSettings,
    resetSettings,
  };
}
