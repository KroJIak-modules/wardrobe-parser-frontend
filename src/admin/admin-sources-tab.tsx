import { useEffect, useState } from "react";
import { AdminSourcesSkeleton } from "../shared/skeleton";
import { IconClose } from "../shared/mono-icons";
import { API_BASE, authFetch } from "./auth-fetch";
import { AdminManualProductEditModal, type ManualProductEditDraft, type ManualEditVariant } from "./admin-manual-product-edit-modal";

type SourceItem = {
  key: string;
  source_id?: number | null;
  name: string;
  base_url: string;
  status_label: string | null;
  products_count: number;
  last_sync_duration_sec?: number | null;
  last_sync_at?: string | null;
  last_sync_status?: string | null;
  is_password_protected?: boolean;
  is_auto_ingest?: boolean;
  is_personal?: boolean;
  enabled: boolean;
  sync_enabled: boolean;
  hide_auto_added_products?: boolean;
  show_description?: boolean;
  show_images?: boolean;
  currency_priority?: string[];
  currency_method?: "priority_list" | "locked_param_currency" | "locked_no_currency";
  locked_currency?: string;
  currency_priority_editable?: boolean;
};

type SourceProductsTablePayload = {
  items?: Array<{
    id: number;
    title: string;
    url: string;
    status: string;
    image_urls?: string[];
    final_price?: number | null;
    final_currency?: string | null;
    source_price?: number | null;
    source_currency?: string | null;
  }>;
};

type Props = {
  sources: SourceItem[];
  loading: boolean;
  toggleSourceEnabled: (key: string, enabled: boolean) => Promise<{ message: string }>;
  toggleSourceSyncEnabled: (key: string, enabled: boolean) => Promise<{ message: string }>;
  toggleSourceAutoHideProducts: (key: string, enabled: boolean) => Promise<{ message: string }>;
  updateSourceAttributeVisibility: (key: string, payload: { show_description?: boolean; show_images?: boolean }) => Promise<{ message: string }>;
  updateSourceCurrencyPriority: (
    key: string,
    currencyPriority: string[],
    options?: { currencyMethod?: "priority_list" | "locked_param_currency" | "locked_no_currency"; lockedCurrency?: string }
  ) => Promise<{ message: string }>;
  autoSyncPeriodMinutes: number;
  updateAdminUiSettings: (payload: { auto_sync_period_minutes?: number }) => Promise<{ ok: boolean; message: string }>;
  latestJob: {
    job_id?: string;
    status?: string;
    current_source_name?: string | null;
    can_cancel?: boolean;
  } | null;
  runSyncForSource: (sourceKey: string) => Promise<{ ok: boolean; message: string }>;
  cancelSync: (jobId: string) => Promise<{ ok: boolean; message: string }>;
  pushToast: (message: string) => void;
  onZoomImage: (url: string) => void;
};

type SourceProduct = {
  id: number;
  title: string;
  url: string;
  status: string;
  imageUrl: string | null;
  sourcePrice: string;
  finalPrice: string;
};

function formatMoney(value: number | null | undefined, currency: string | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  const code = String(currency || "").trim().toUpperCase() || "USD";
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: code as "USD",
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch {
    return `${Number(value).toFixed(2)} ${code}`;
  }
}

export function AdminSourcesTab({
  sources,
  loading,
  toggleSourceEnabled,
  toggleSourceSyncEnabled,
  toggleSourceAutoHideProducts,
  updateSourceAttributeVisibility,
  updateSourceCurrencyPriority,
  autoSyncPeriodMinutes,
  updateAdminUiSettings,
  latestJob,
  runSyncForSource,
  cancelSync,
  pushToast,
  onZoomImage,
}: Props) {
  const deriveStatusFromVariants = (variants: ManualEditVariant[]): "available" | "out_of_stock" =>
    variants.some((item) => Boolean(item.available)) ? "available" : "out_of_stock";
  const currencyOptions = ["USD", "EUR", "GBP", "JPY"] as const;
  const [sourceAttrVisibility, setSourceAttrVisibility] = useState<Record<string, { description: boolean; images: boolean }>>({});
  const [sourceCurrencyPriority, setSourceCurrencyPriority] = useState<Record<string, string[]>>({});
  const [currencyInputBySource, setCurrencyInputBySource] = useState<Record<string, string>>({});
  const [currencyOpenBySource, setCurrencyOpenBySource] = useState<Record<string, boolean>>({});
  const [dragCurrencyBySource, setDragCurrencyBySource] = useState<Record<string, string | null>>({});
  const [autoSyncDraft, setAutoSyncDraft] = useState<string>(String(Math.max(60, Number(autoSyncPeriodMinutes || 60))));

  const [sourceProductsOpen, setSourceProductsOpen] = useState<boolean>(false);
  const [sourceProductsLoading, setSourceProductsLoading] = useState<boolean>(false);
  const [sourceProductsError, setSourceProductsError] = useState<string | null>(null);
  const [sourceProductsTitle, setSourceProductsTitle] = useState<string>("");
  const [sourceProducts, setSourceProducts] = useState<SourceProduct[]>([]);
  const [manualEditOpen, setManualEditOpen] = useState<boolean>(false);
  const [manualEditLoading, setManualEditLoading] = useState<boolean>(false);
  const [manualEditSaving, setManualEditSaving] = useState<boolean>(false);
  const [manualEditProductId, setManualEditProductId] = useState<number | null>(null);
  const [manualEditProductTitle, setManualEditProductTitle] = useState<string>("");
  const [manualEditSourceId, setManualEditSourceId] = useState<number | null>(null);
  const [manualEditSourceUrl, setManualEditSourceUrl] = useState<string | null>(null);
  const [manualEditShowBindSync, setManualEditShowBindSync] = useState<boolean>(false);
  const [manualEditFavoriteCategoryOptions, setManualEditFavoriteCategoryOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [manualEditFavoriteCategoryIds, setManualEditFavoriteCategoryIds] = useState<number[]>([]);
  const [manualEditKnownBrands, setManualEditKnownBrands] = useState<string[]>([]);
  const [manualEditDraft, setManualEditDraft] = useState<ManualProductEditDraft>({
    title: "",
    description: "",
    weightGrams: "",
    brand: "",
    bindSync: false,
    favorite: false,
    images: [],
    variants: [{ id: "v-1", title: "Default", price: "", currency: "USD", available: true }],
  });
  const [manualEditSyncBaseline, setManualEditSyncBaseline] = useState<{
    images: ManualProductEditDraft["images"];
    variants: ManualProductEditDraft["variants"];
  } | null>(null);

  useEffect(() => {
    setAutoSyncDraft(String(Math.max(60, Number(autoSyncPeriodMinutes || 60))));
  }, [autoSyncPeriodMinutes]);

  useEffect(() => {
    setSourceAttrVisibility((prev) => {
      const next = { ...prev };
      for (const source of sources) {
        if (!next[source.key]) {
          next[source.key] = {
            description: source.show_description ?? true,
            images: source.show_images ?? true,
          };
        }
      }
      return next;
    });
  }, [sources]);

  useEffect(() => {
    setSourceCurrencyPriority((prev) => {
      const next = { ...prev };
      for (const source of sources) {
        next[source.key] = Array.isArray(source.currency_priority) && source.currency_priority.length > 0
          ? source.currency_priority.map((x) => String(x).toUpperCase())
          : ["USD", "EUR", "GBP"];
      }
      return next;
    });
  }, [sources]);

  const isAnySyncRunning = Boolean(latestJob && ["pending", "in_progress"].includes(String(latestJob.status || "")));
  const activeSourceKey = String(latestJob?.current_source_name || "").trim().toLowerCase();

  const openManualEdit = async (productId: number) => {
    setManualEditLoading(true);
    try {
      const [productRes, categoriesRes] = await Promise.all([
        authFetch(`${API_BASE}/products/${productId}`),
        authFetch(`${API_BASE}/products/${productId}/starred-categories`),
      ]);
      if (!productRes.ok) {
        throw new Error(`Ошибка загрузки товара: ${productRes.status}`);
      }
      const product = await productRes.json() as {
        id: number;
        source_id: number;
        title: string;
        description?: string | null;
        vendor?: string | null;
        status?: string | null;
        weight_grams?: number | null;
        url?: string | null;
        image_urls?: string[];
        variants?: Array<{ title?: string; price?: number | string | null; available?: boolean; currency?: string | null }>;
      };
      const categoriesPayload = categoriesRes.ok ? await categoriesRes.json() as {
        assigned_category_ids?: number[];
        available_categories?: Array<{ id: number; name: string }>;
      } : null;

      const rawVariants = Array.isArray(product.variants) && product.variants.length > 0 ? product.variants : [{ title: "Default", price: null, available: true }];
      const normalizedVariants: ManualEditVariant[] = rawVariants.map((variant, index) => {
        const rawCur = String(variant.currency || "USD").toUpperCase();
        const currency: ManualEditVariant["currency"] = rawCur === "EUR" || rawCur === "GBP" || rawCur === "JPY" ? rawCur : "USD";
        return {
          id: `edit-${product.id}-${index + 1}`,
          title: String(variant.title || "").trim() || `Вариант ${index + 1}`,
          price: variant.price === null || variant.price === undefined ? "" : String(variant.price),
          currency,
          available: Boolean(variant.available),
        };
      });

      const isBoundSync = Boolean(product.url && !String(product.url).startsWith("manual://"));
      setManualEditProductId(Number(product.id));
      setManualEditProductTitle(String(product.title || ""));
      setManualEditSourceId(isBoundSync ? Number(product.source_id || 0) : null);
      setManualEditSourceUrl(isBoundSync ? String(product.url || "") : null);
      setManualEditShowBindSync(isBoundSync);
      setManualEditFavoriteCategoryOptions((categoriesPayload?.available_categories || []).map((x) => ({ id: Number(x.id), name: String(x.name) })));
      const assignedIds = Array.isArray(categoriesPayload?.assigned_category_ids) ? categoriesPayload!.assigned_category_ids!.map((x) => Number(x)).filter((x) => Number.isFinite(x)) : [];
      setManualEditFavoriteCategoryIds(assignedIds);
      setManualEditKnownBrands((prev) => {
        const set = new Set(prev);
        const candidate = String(product.vendor || "").trim();
        if (candidate) set.add(candidate);
        return Array.from(set.values()).sort((a, b) => a.localeCompare(b, "ru"));
      });
      setManualEditDraft({
        title: String(product.title || ""),
        description: String(product.description || ""),
        weightGrams: product.weight_grams === null || product.weight_grams === undefined ? "" : String(product.weight_grams),
        brand: String(product.vendor || ""),
        bindSync: isBoundSync,
        favorite: assignedIds.length > 0,
        images: (product.image_urls || []).map((url, idx) => ({ id: `img-${product.id}-${idx + 1}`, url: String(url) })),
        variants: normalizedVariants,
      });
      setManualEditSyncBaseline({
        images: (product.image_urls || []).map((url, idx) => ({ id: `baseline-img-${product.id}-${idx + 1}`, url: String(url) })),
        variants: normalizedVariants.map((item) => ({ ...item })),
      });
      setManualEditOpen(true);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Не удалось открыть редактирование");
    } finally {
      setManualEditLoading(false);
    }
  };

  const setManualEditField = <K extends keyof ManualProductEditDraft>(key: K, value: ManualProductEditDraft[K]) => {
    setManualEditDraft((prev) => {
      if (key === "bindSync") {
        const nextBind = Boolean(value);
        if (nextBind && manualEditSyncBaseline) {
          return {
            ...prev,
            bindSync: nextBind,
            images: manualEditSyncBaseline.images.map((item) => ({ ...item })),
            variants: manualEditSyncBaseline.variants.map((item) => ({ ...item })),
          };
        }
      }
      return { ...prev, [key]: value };
    });
  };

  const onSaveManualEdit = async () => {
    if (!manualEditProductId) return;
    setManualEditSaving(true);
    try {
      const title = String(manualEditDraft.title || "").trim();
      if (!title) {
        pushToast("Название товара обязательно");
        return;
      }
      const validVariants = manualEditDraft.variants
        .map((variant) => ({
          title: String(variant.title || "").trim(),
          price: Number(String(variant.price || "").replace(",", ".")),
          available: Boolean(variant.available),
          currency: variant.currency,
        }))
        .filter((variant) => variant.title.length > 0 && Number.isFinite(variant.price));
      if (validVariants.length === 0) {
        pushToast("Добавь хотя бы один вариант с названием и ценой");
        return;
      }

      const manualImageAssetIds: number[] = [];
      for (const image of manualEditDraft.images) {
        const fromApi = /^\/api\/v1\/products\/images\/(\d+)$/.exec(String(image.url || "").trim());
        if (fromApi) {
          manualImageAssetIds.push(Number(fromApi[1]));
          continue;
        }
        const uploadRes = await authFetch(`${API_BASE}/products/upload-image-by-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: String(image.url || "").trim() }),
        });
        if (!uploadRes.ok) {
          throw new Error(`Не удалось загрузить изображение: ${uploadRes.status}`);
        }
        const uploadPayload = await uploadRes.json() as { image_asset_id?: number };
        const imageAssetId = Number(uploadPayload.image_asset_id || 0);
        if (imageAssetId > 0) {
          manualImageAssetIds.push(imageAssetId);
        }
      }

      const weightRaw = Number(String(manualEditDraft.weightGrams || "").replace(",", "."));
      const weight = Number.isFinite(weightRaw) && weightRaw > 0 ? weightRaw : null;
      const currency = validVariants[0].currency;
      const payload = {
        title,
        description: String(manualEditDraft.description || "").trim() || null,
        vendor: String(manualEditDraft.brand || "").trim() || null,
        currency,
        product_type: null,
        variants: validVariants.map((x) => ({ title: x.title, price: x.price, available: x.available })),
        manual_image_asset_ids: manualImageAssetIds,
        weight_grams: weight,
        status: deriveStatusFromVariants(validVariants as ManualEditVariant[]),
        bind_sync: Boolean(manualEditShowBindSync && manualEditDraft.bindSync && manualEditSourceId && manualEditSourceUrl),
        bind_source_id: manualEditSourceId,
        bind_source_product_url: manualEditSourceUrl,
      };
      const updateRes = await authFetch(`${API_BASE}/products/manual/${manualEditProductId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!updateRes.ok) {
        throw new Error(`Ошибка сохранения: ${updateRes.status}`);
      }
      await authFetch(`${API_BASE}/products/${manualEditProductId}/starred-categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_ids: manualEditFavoriteCategoryIds }),
      });
      pushToast("Товар обновлен");
      setManualEditOpen(false);
      setSourceProducts((prev) => prev.map((item) => (
        item.id === manualEditProductId
          ? { ...item, title, status: deriveStatusFromVariants(validVariants as ManualEditVariant[]), imageUrl: manualEditDraft.images[0]?.url || null }
          : item
      )));
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Не удалось сохранить товар");
    } finally {
      setManualEditSaving(false);
    }
  };

  const onDeleteManualProduct = async () => {
    if (!manualEditProductId || manualEditSaving) return;
    const confirmed = window.confirm("Удалить товар? Это действие нельзя отменить.");
    if (!confirmed) return;
    setManualEditSaving(true);
    try {
      const res = await authFetch(`${API_BASE}/products/manual/${manualEditProductId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(`Ошибка удаления: ${res.status}`);
      }
      pushToast("Товар удален");
      setManualEditOpen(false);
      setSourceProducts((prev) => prev.filter((item) => item.id !== manualEditProductId));
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Не удалось удалить товар");
    } finally {
      setManualEditSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="admin-sources-sync-period">
        <h3>Автоматическая синхронизация</h3>
        <label className="admin-settings-field">
          <span className="muted">Период автосинхронизации (минуты, минимум 60)</span>
          <div className="admin-settings-inline-row">
            <input
              type="number"
              min={60}
              step={1}
              className="input"
              value={autoSyncDraft}
              onChange={(event) => {
                const raw = event.target.value;
                if (raw === "") {
                  setAutoSyncDraft("60");
                  return;
                }
                const parsed = Math.trunc(Number(raw));
                if (!Number.isFinite(parsed)) {
                  return;
                }
                setAutoSyncDraft(String(Math.max(60, parsed)));
              }}
              onBlur={() => {
                const parsed = Math.trunc(Number(autoSyncDraft || "60"));
                setAutoSyncDraft(String(Number.isFinite(parsed) ? Math.max(60, parsed) : 60));
              }}
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                void (async () => {
                  const raw = Math.trunc(Number(autoSyncDraft || "0"));
                  const next = Number.isFinite(raw) ? Math.max(60, raw) : 60;
                  setAutoSyncDraft(String(next));
                  const result = await updateAdminUiSettings({ auto_sync_period_minutes: next });
                  pushToast(result.message);
                })();
              }}
            >
              Сохранить
            </button>
          </div>
        </label>
      </div>
      <h2>Источники ({sources.length})</h2>
      {loading ? (
        <AdminSourcesSkeleton rows={5} />
      ) : (
        <div className="sources-grid">
          {sources.map((source) => {
            const href = /^https?:\/\//i.test(source.base_url) ? source.base_url : `https://${source.base_url}`;
            const label = source.base_url.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
            const thisSourceActive = isAnySyncRunning && activeSourceKey === source.key.trim().toLowerCase();
            const thisSourceDisabled = isAnySyncRunning && !thisSourceActive;
            const isPersonal = Boolean(source.is_personal);
            return (
              <article key={source.key} className={`list-row source-card${isPersonal ? " source-card--personal" : ""}`}>
                <div className="source-card-head">
                  <div className="source-card-badges" aria-label="Метки источника">
                    {isPersonal ? (
                      <span className="source-badge source-badge--personal">Личный</span>
                    ) : (
                      <>
                        <span className={`source-badge ${source.is_auto_ingest ? "source-badge--ready" : "source-badge--muted"}`}>
                          {source.is_auto_ingest ? "Авто" : "Ручной"}
                        </span>
                        <span className={`source-badge ${source.is_password_protected ? "source-badge--danger" : "source-badge--ok"}`}>
                          {source.is_password_protected ? "Пароль" : "Открыт"}
                        </span>
                      </>
                    )}
                  </div>
                  <strong className="source-card-title">
                    {source.name}
                    {source.status_label ? ` · ${source.status_label}` : ""}
                  </strong>
                  {isPersonal ? null : (
                    <a className="source-card-link" href={href} target="_blank" rel="noreferrer">
                      {label}
                    </a>
                  )}
                </div>
                <div className="source-card-foot">
                  <div className="source-card-meta">
                    <span className="source-pill">Товаров: {source.products_count}</span>
                    {isPersonal ? null : <span className="source-pill">Прогон: {source.last_sync_duration_sec ?? 0}с</span>}
                  </div>
                  <div className="source-card-actions">
                    {isPersonal ? (
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          const sid = Number(source.source_id || 0);
                          if (!Number.isFinite(sid) || sid <= 0) {
                            pushToast("Не найден id источника");
                            return;
                          }
                          void (async () => {
                            setSourceProductsTitle(String(source.name || "Источник"));
                            setSourceProductsOpen(true);
                            setSourceProductsLoading(true);
                            setSourceProductsError(null);
                            try {
                              const res = await authFetch(`${API_BASE}/admin/products/table?source_id=${sid}&limit=40`);
                              if (!res.ok) {
                                throw new Error(`Ошибка: ${res.status}`);
                              }
                              const payload = (await res.json()) as SourceProductsTablePayload;
                              const items = Array.isArray(payload.items) ? payload.items : [];
                              setSourceProducts(
                                items.map((item) => ({
                                  id: Number(item.id || 0),
                                  title: String(item.title || `Товар #${item.id}`),
                                  url: String(item.url || ""),
                                  status: String(item.status || ""),
                                  imageUrl: Array.isArray(item.image_urls) && item.image_urls.length > 0 ? String(item.image_urls[0] || "") : null,
                                  sourcePrice: formatMoney(item.source_price ?? null, item.source_currency ?? null),
                                  finalPrice: formatMoney(item.final_price ?? null, item.final_currency ?? null),
                                })),
                              );
                            } catch (error) {
                              setSourceProductsError(error instanceof Error ? error.message : "Не удалось загрузить товары");
                              setSourceProducts([]);
                            } finally {
                              setSourceProductsLoading(false);
                            }
                          })();
                        }}
                      >
                        Добавленные товары
                      </button>
                    ) : thisSourceActive ? (
                      <button
                        type="button"
                        className="btn btn-outline"
                        disabled={!latestJob?.job_id || !latestJob?.can_cancel}
                        onClick={() => {
                          if (!latestJob?.job_id) return;
                          void (async () => {
                            const result = await cancelSync(latestJob.job_id as string);
                            pushToast(result.message);
                          })();
                        }}
                      >
                        Отменить синхронизацию
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={thisSourceDisabled}
                        onClick={() => {
                          void (async () => {
                            const result = await runSyncForSource(source.key);
                            pushToast(result.message);
                          })();
                        }}
                      >
                        Синхронизовать
                      </button>
                    )}
                  </div>
                  <div className="source-card-switches">
                    <label className="ui-switch ui-switch--compact source-card-switch">
                      <input
                        type="checkbox"
                        checked={source.enabled}
                        onChange={(event) => {
                          void (async () => {
                            const result = await toggleSourceEnabled(source.key, event.target.checked);
                            pushToast(result.message);
                          })();
                        }}
                      />
                      <span className="ui-switch-track">
                        <span className="ui-switch-thumb" />
                      </span>
                      <span className="ui-switch-text">Источник включен</span>
                    </label>
                    <label className="ui-switch ui-switch--compact source-card-switch">
                      <input
                        type="checkbox"
                        checked={source.sync_enabled}
                        onChange={(event) => {
                          void (async () => {
                            const result = await toggleSourceSyncEnabled(source.key, event.target.checked);
                            pushToast(result.message);
                          })();
                        }}
                      />
                      <span className="ui-switch-track">
                        <span className="ui-switch-thumb" />
                      </span>
                      <span className="ui-switch-text">Участие в синхронизацию</span>
                    </label>
                    <label className="ui-switch ui-switch--compact source-card-switch">
                      <input
                        type="checkbox"
                        checked={!Boolean(source.hide_auto_added_products)}
                        onChange={(event) => {
                          void (async () => {
                            const result = await toggleSourceAutoHideProducts(source.key, !event.target.checked);
                            pushToast(result.message);
                          })();
                        }}
                      />
                      <span className="ui-switch-track">
                        <span className="ui-switch-thumb" />
                      </span>
                      <span className="ui-switch-text">Показывать товары</span>
                    </label>
                    <details className="source-attrs">
                      <summary className="source-attrs__summary">Правила атрибутов</summary>
                      <div className="source-attrs__body">
                        <label className="ui-switch ui-switch--compact source-card-switch">
                          <input
                            type="checkbox"
                            checked={sourceAttrVisibility[source.key]?.description ?? true}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setSourceAttrVisibility((prev) => ({
                                ...prev,
                                [source.key]: {
                                  description: checked,
                                  images: prev[source.key]?.images ?? true,
                                },
                              }));
                              void (async () => {
                                const result = await updateSourceAttributeVisibility(source.key, { show_description: checked });
                                pushToast(result.message);
                              })();
                            }}
                          />
                          <span className="ui-switch-track">
                            <span className="ui-switch-thumb" />
                          </span>
                          <span className="ui-switch-text">Показывать описание</span>
                        </label>
                        <label className="ui-switch ui-switch--compact source-card-switch">
                          <input
                            type="checkbox"
                            checked={sourceAttrVisibility[source.key]?.images ?? true}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setSourceAttrVisibility((prev) => ({
                                ...prev,
                                [source.key]: {
                                  description: prev[source.key]?.description ?? true,
                                  images: checked,
                                },
                              }));
                              void (async () => {
                                const result = await updateSourceAttributeVisibility(source.key, { show_images: checked });
                                pushToast(result.message);
                              })();
                            }}
                          />
                          <span className="ui-switch-track">
                            <span className="ui-switch-thumb" />
                          </span>
                          <span className="ui-switch-text">Показывать фотографии</span>
                        </label>
                      </div>
                    </details>
                    {isPersonal ? null : (
                      <div className="source-currency-priority" tabIndex={0} onBlur={() => setCurrencyOpenBySource((prev) => ({ ...prev, [source.key]: false }))}>
                        <label className="source-currency-priority__label">Приоритет валют</label>
                        <div className="source-currency-priority__method-row">
                          <select
                            className="source-currency-priority__method-select"
                            value={source.currency_method || "priority_list"}
                            onChange={(event) => {
                              const method = event.target.value as "priority_list" | "locked_param_currency" | "locked_no_currency";
                              const locked = String(source.locked_currency || sourceCurrencyPriority[source.key]?.[0] || "USD").toUpperCase();
                              const current = sourceCurrencyPriority[source.key] || [];
                              void (async () => {
                                const result = await updateSourceCurrencyPriority(source.key, current.length > 0 ? current : [locked], {
                                  currencyMethod: method,
                                  lockedCurrency: locked,
                                });
                                pushToast(result.message);
                              })();
                            }}
                          >
                            <option value="priority_list">Приоритетный список</option>
                            <option value="locked_param_currency">Фикс. через currency=</option>
                            <option value="locked_no_currency">Фикс. без currency</option>
                          </select>
                          {(source.currency_method || "priority_list") === "priority_list" ? null : (
                            <select
                              className="source-currency-priority__method-select"
                              value={String(source.locked_currency || sourceCurrencyPriority[source.key]?.[0] || "USD").toUpperCase()}
                              onChange={(event) => {
                                const locked = String(event.target.value || "USD").toUpperCase();
                                const method = (source.currency_method || "locked_param_currency") as
                                  | "priority_list"
                                  | "locked_param_currency"
                                  | "locked_no_currency";
                                const current = sourceCurrencyPriority[source.key] || [];
                                void (async () => {
                                  const result = await updateSourceCurrencyPriority(source.key, current.length > 0 ? current : [locked], {
                                    currencyMethod: method,
                                    lockedCurrency: locked,
                                  });
                                  pushToast(result.message);
                                })();
                              }}
                            >
                              {currencyOptions.map((item) => (
                                <option key={`${source.key}-locked-${item}`} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="source-currency-priority__field">
                          <div className="source-currency-priority__chips">
                            {(sourceCurrencyPriority[source.key] || []).map((currency) => (
                              <button
                                key={`${source.key}-${currency}`}
                                type="button"
                                className="source-currency-chip"
                                title="Клик: удалить"
                                draggable={Boolean(source.currency_priority_editable ?? ((source.currency_method || "priority_list") === "priority_list"))}
                                disabled={!Boolean(source.currency_priority_editable ?? ((source.currency_method || "priority_list") === "priority_list"))}
                                onDragStart={() => {
                                  if (!Boolean(source.currency_priority_editable ?? ((source.currency_method || "priority_list") === "priority_list"))) return;
                                  setDragCurrencyBySource((prev) => ({ ...prev, [source.key]: currency }));
                                }}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => {
                                  if (!Boolean(source.currency_priority_editable ?? ((source.currency_method || "priority_list") === "priority_list"))) return;
                                  event.preventDefault();
                                  const dragging = dragCurrencyBySource[source.key];
                                  if (!dragging || dragging === currency) {
                                    return;
                                  }
                                  setSourceCurrencyPriority((prev) => {
                                    const list = [...(prev[source.key] || [])];
                                    const from = list.indexOf(dragging);
                                    const to = list.indexOf(currency);
                                    if (from < 0 || to < 0 || from === to) {
                                      return prev;
                                    }
                                    const [moved] = list.splice(from, 1);
                                    list.splice(to, 0, moved);
                                    void (async () => {
                                      const result = await updateSourceCurrencyPriority(source.key, list);
                                      pushToast(result.message);
                                    })();
                                    return { ...prev, [source.key]: list };
                                  });
                                  setDragCurrencyBySource((prev) => ({ ...prev, [source.key]: null }));
                                }}
                                onDragEnd={() => {
                                  setDragCurrencyBySource((prev) => ({ ...prev, [source.key]: null }));
                                }}
                                onClick={() => {
                                  if (!Boolean(source.currency_priority_editable ?? ((source.currency_method || "priority_list") === "priority_list"))) return;
                                  setSourceCurrencyPriority((prev) => {
                                    const next = (prev[source.key] || []).filter((item) => item !== currency);
                                    void (async () => {
                                      const result = await updateSourceCurrencyPriority(source.key, next);
                                      pushToast(result.message);
                                    })();
                                    return { ...prev, [source.key]: next };
                                  });
                                }}
                              >
                                <span>{currency}</span>
                                <IconClose className="icon-svg icon-svg--sm" />
                              </button>
                            ))}
                          </div>
                          <div className="source-currency-priority__input-wrap">
                            <input
                              className="source-currency-priority__input"
                              value={currencyInputBySource[source.key] || ""}
                              placeholder="Добавить валюту"
                              disabled={!Boolean(source.currency_priority_editable ?? ((source.currency_method || "priority_list") === "priority_list"))}
                              onFocus={() => setCurrencyOpenBySource((prev) => ({ ...prev, [source.key]: true }))}
                              onChange={(event) => {
                                if (!Boolean(source.currency_priority_editable ?? ((source.currency_method || "priority_list") === "priority_list"))) return;
                                setCurrencyInputBySource((prev) => ({ ...prev, [source.key]: event.target.value.toUpperCase() }));
                                setCurrencyOpenBySource((prev) => ({ ...prev, [source.key]: true }));
                              }}
                              onKeyDown={(event) => {
                                if (!Boolean(source.currency_priority_editable ?? ((source.currency_method || "priority_list") === "priority_list"))) return;
                                if (event.key !== "Enter") {
                                  return;
                                }
                                event.preventDefault();
                                const value = String(currencyInputBySource[source.key] || "").trim().toUpperCase();
                                if (!currencyOptions.includes(value as (typeof currencyOptions)[number])) {
                                  return;
                                }
                                setSourceCurrencyPriority((prev) => {
                                  const list = prev[source.key] || [];
                                  if (list.includes(value)) {
                                    return prev;
                                  }
                                  const next = [...list, value];
                                  void (async () => {
                                    const result = await updateSourceCurrencyPriority(source.key, next);
                                    pushToast(result.message);
                                  })();
                                  return { ...prev, [source.key]: next };
                                });
                                setCurrencyInputBySource((prev) => ({ ...prev, [source.key]: "" }));
                              }}
                            />
                          </div>
                          {currencyOpenBySource[source.key] ? (
                            <div className="source-currency-priority__menu">
                              {currencyOptions
                                .filter((item) => !(sourceCurrencyPriority[source.key] || []).includes(item))
                                .filter((item) => item.includes(String(currencyInputBySource[source.key] || "").trim().toUpperCase()))
                                .map((item) => (
                                  <button
                                    key={`${source.key}-opt-${item}`}
                                    type="button"
                                    className="source-currency-priority__option"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => {
                                      setSourceCurrencyPriority((prev) => {
                                        const next = [...(prev[source.key] || []), item];
                                        void (async () => {
                                          const result = await updateSourceCurrencyPriority(source.key, next);
                                          pushToast(result.message);
                                        })();
                                        return { ...prev, [source.key]: next };
                                      });
                                      setCurrencyInputBySource((prev) => ({ ...prev, [source.key]: "" }));
                                    }}
                                  >
                                    {item}
                                  </button>
                                ))}
                            </div>
                          ) : null}
                        </div>
                        {Boolean(source.currency_priority_editable ?? ((source.currency_method || "priority_list") === "priority_list")) ? null : (
                          <div className="source-currency-priority__lock-hint">
                            Для этого источника метод валюты зафиксирован.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {sourceProductsOpen ? (
        <div className="modal-backdrop" onClick={() => setSourceProductsOpen(false)}>
          <div className="modal source-products-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>{sourceProductsTitle ? `Добавленные товары: ${sourceProductsTitle}` : "Добавленные товары"}</h3>
              <button type="button" className="icon-btn" onClick={() => setSourceProductsOpen(false)} aria-label="Закрыть">
                <IconClose className="icon-svg" />
              </button>
            </div>
            {sourceProductsLoading ? (
              <AdminSourcesSkeleton rows={2} />
            ) : sourceProductsError ? (
              <p className="login-error-alert">{sourceProductsError}</p>
            ) : sourceProducts.length === 0 ? (
              <p className="muted">Пока нет товаров.</p>
            ) : (
              <div className="source-products-grid">
                {sourceProducts.map((item) => (
                  <article key={item.id} className="source-products-card">
                    <button type="button" className="source-products-thumb-link" onClick={() => { void openManualEdit(item.id); }} disabled={manualEditLoading}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="source-products-thumb" />
                      ) : (
                        <span className="thumb-mini photo-placeholder source-products-thumb source-products-thumb--empty">Нет фото</span>
                      )}
                    </button>
                    <div className="source-products-body">
                      <button type="button" className="source-products-title source-products-title--button" onClick={() => { void openManualEdit(item.id); }} disabled={manualEditLoading}>
                        {item.title}
                      </button>
                      <span className="source-products-status">{item.status || "—"}</span>
                      <div className="source-products-prices">
                        <span>{item.sourcePrice}</span>
                        <strong>{item.finalPrice}</strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <AdminManualProductEditModal
        open={manualEditOpen}
        saving={manualEditSaving}
        productTitle={manualEditProductTitle}
        draft={manualEditDraft}
        knownBrandOptions={manualEditKnownBrands}
        favoriteCategoryOptions={manualEditFavoriteCategoryOptions}
        favoriteCategoryIds={manualEditFavoriteCategoryIds}
        showBindSync={manualEditShowBindSync}
        onClose={() => setManualEditOpen(false)}
        onSave={() => { void onSaveManualEdit(); }}
        onDelete={() => { void onDeleteManualProduct(); }}
        onSetFavoriteCategoryIds={setManualEditFavoriteCategoryIds}
        onSetField={setManualEditField}
        onAddImage={(file) => {
          if (manualEditDraft.bindSync) return;
          const local = URL.createObjectURL(file);
          setManualEditDraft((prev) => ({ ...prev, images: [...prev.images, { id: `local-${Date.now()}`, url: local }] }));
        }}
        onRemoveImage={(imageId) => {
          if (manualEditDraft.bindSync) return;
          setManualEditDraft((prev) => ({ ...prev, images: prev.images.filter((x) => x.id !== imageId) }));
        }}
        onZoomImage={onZoomImage}
      />
    </div>
  );
}
