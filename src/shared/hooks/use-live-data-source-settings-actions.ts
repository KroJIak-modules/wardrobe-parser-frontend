import { useCallback } from "react";
import { API_BASE } from "../admin-auth";
import { errResult, okResult } from "../action-result";
import { apiJson, apiNoContent } from "../api-client";
import type { PricingExampleProduct, PricingSettings, SettingsTransferPayload, Source } from "../live-data-types";

export function useLiveDataSourceSettingsActions(params: {
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
  setPricingSettings: React.Dispatch<React.SetStateAction<PricingSettings | null>>;
  refresh: () => Promise<void>;
  refreshSourcesOnly: () => Promise<void>;
  refreshPricingOnly: () => Promise<void>;
  refreshWeightOnly: () => Promise<void>;
  refreshCategoriesOnly: (options?: { includeCounts?: boolean; silent?: boolean }) => Promise<void>;
  refreshDedupOnly: () => Promise<void>;
  setError: (value: string | null) => void;
}) {
  const { setSources, setPricingSettings, refresh, refreshSourcesOnly, refreshPricingOnly, refreshWeightOnly, refreshCategoriesOnly, refreshDedupOnly, setError } = params;

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

  const updatePricingSettings = useCallback(async (payload: Partial<PricingSettings>) => {
    try {
      const updated = await apiJson<PricingSettings>(`${API_BASE}/settings/pricing`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setPricingSettings(updated || null);
      if (Object.prototype.hasOwnProperty.call(payload, "dedup_only_available_products")) {
        void refreshDedupOnly().catch((e) => setError(e instanceof Error ? e.message : "Unknown error"));
      }
      return okResult("Параметры формулы сохранены");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshDedupOnly, setError, setPricingSettings]);

  const fetchPricingExampleProduct = useCallback(async (): Promise<PricingExampleProduct | null> => {
    try {
      return await apiJson<PricingExampleProduct>(`${API_BASE}/products/pricing-example`);
    } catch {
      return null;
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

  const updateShowcaseMediaSettings = useCallback(async (payload: {
    showcase_hero_image_asset_id?: number | null;
    showcase_carousel_image_asset_ids?: number[];
  }) => {
    try {
      const updated = await apiJson<{ showcase_hero_image_asset_id?: number | null; showcase_carousel_image_asset_ids?: number[] }>(
        `${API_BASE}/settings/showcase-media`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      setPricingSettings((prev) => prev ? ({
        ...prev,
        showcase_hero_image_asset_id: updated?.showcase_hero_image_asset_id ?? null,
        showcase_carousel_image_asset_ids: Array.isArray(updated?.showcase_carousel_image_asset_ids) ? updated.showcase_carousel_image_asset_ids : [],
      }) : prev);
      return okResult("Медиа витрины сохранены");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [setPricingSettings]);

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
    assignSourceSupplier,
    createWeightRule,
    updateWeightRule,
    deleteWeightRule,
    addWeightKeyword,
    removeWeightKeyword,
    updatePricingSettings,
    fetchPricingExampleProduct,
    updateShowcaseMediaSettings,
    updatePricingSupplier,
    createPricingSupplier,
    deletePricingSupplier,
    exportSettings,
    importSettings,
  };
}
