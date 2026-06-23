import { useEffect, useState } from "react";
import { AdminSourcesSkeleton } from "../shared/skeleton";
import { IconClose } from "../shared/mono-icons";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { normalizeServiceProduct } from "../shared/live-product-normalizer";
import { deriveProductWriteStateFromVariants, getProductStateClass, getProductStateLabel } from "../shared/product-state";
import { optimizeImageUrl } from "../shared/product-image";
import { getAdminMeCached } from "../shared/admin-auth";
import { API_BASE, authFetch } from "./auth-fetch";
import { AdminManualProductEditModal, type ManualProductEditDraft, type ManualEditVariant } from "./admin-manual-product-edit-modal";

type SourceItem = {
  key: string;
  source_id?: number | null;
  mode?: "auto" | "manual" | "personal";
  name: string;
  base_url: string;
  products_count: number;
  manual_products_count?: number;
  bound_sync_products_count?: number;
  last_sync_duration_sec?: number | null;
  last_sync_at?: string | null;
  last_sync_status?: string | null;
  enabled: boolean;
  sync_enabled: boolean;
  dedup_enabled: boolean;
  hide_auto_added_products?: boolean;
  description_mode?: "hidden" | "text" | "html";
  show_images?: boolean;
};

type Props = {
  sources: SourceItem[];
  loading: boolean;
  toggleSourceEnabled: (key: string, enabled: boolean) => Promise<{ ok: boolean; message: string }>;
  toggleSourceSyncEnabled: (key: string, enabled: boolean) => Promise<{ ok: boolean; message: string }>;
  toggleSourceDedupEnabled: (key: string, enabled: boolean) => Promise<{ ok: boolean; message: string }>;
  toggleSourceAutoHideProducts: (key: string, enabled: boolean) => Promise<{ ok: boolean; message: string }>;
  updateSourceAttributeVisibility: (key: string, payload: { description_mode?: "hidden" | "text" | "html"; show_images?: boolean }) => Promise<{ ok: boolean; message: string }>;
  autoSyncPeriodMinutes: number;
  autoSyncNextRunAt: string | null;
  autoSyncLastStatus: string | null;
  autoSyncLastError: string | null;
  updateAdminUiSettings: (payload: { auto_sync_period_minutes?: number }) => Promise<{ ok: boolean; message: string }>;
  latestJob: {
    job_id?: string;
    status?: string;
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
  statusLabel: string;
  statusClass: string;
  imageUrl: string | null;
  sourcePrice: string;
  finalPrice: string;
};

function flattenTaxonomyFilters(
  nodes: Array<{ slug?: string | null; title?: string | null; children?: Array<unknown> }> | undefined,
  items: Array<{ slug: string; name: string }> = [],
): Array<{ slug: string; name: string }> {
  for (const rawNode of nodes || []) {
    const node = rawNode as { slug?: string | null; title?: string | null; children?: Array<unknown> };
    const slug = String(node.slug || "").trim();
    const title = String(node.title || "").trim();
    if (slug && title) {
      items.push({ slug, name: title });
    }
    flattenTaxonomyFilters(node.children as Array<{ slug?: string | null; title?: string | null; children?: Array<unknown> }> | undefined, items);
  }
  return items;
}

function normalizeSourceMode(raw: SourceItem["mode"]): "auto" | "manual" | "personal" {
  return raw === "manual" || raw === "personal" ? raw : "auto";
}

function getSourceModeLabel(mode: "auto" | "manual" | "personal"): string {
  if (mode === "manual") return "Ручной";
  if (mode === "personal") return "Личный";
  return "Авто";
}

export function AdminSourcesTab({
  sources,
  loading,
  toggleSourceEnabled,
  toggleSourceSyncEnabled,
  toggleSourceDedupEnabled,
  toggleSourceAutoHideProducts,
  updateSourceAttributeVisibility,
  autoSyncPeriodMinutes,
  autoSyncNextRunAt,
  autoSyncLastStatus,
  autoSyncLastError,
  updateAdminUiSettings,
  latestJob,
  runSyncForSource,
  cancelSync,
  pushToast,
  onZoomImage,
}: Props) {
  const [sourceAttrVisibility, setSourceAttrVisibility] = useState<Record<string, { descriptionMode: "hidden" | "text" | "html"; images: boolean }>>({});
  const [autoSyncDraft, setAutoSyncDraft] = useState<string>(String(Math.max(60, Number(autoSyncPeriodMinutes || 60))));
  const [autoSyncValidationError, setAutoSyncValidationError] = useState<string>("");
  const [autoSyncNowMs, setAutoSyncNowMs] = useState<number>(() => Date.now());
  const [openSourceAttrsKey, setOpenSourceAttrsKey] = useState<string | null>(null);

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
  const [manualEditFavoriteCategoryOptions, setManualEditFavoriteCategoryOptions] = useState<Array<{ slug: string; name: string }>>([]);
  const [manualEditFavoriteCategorySlugs, setManualEditFavoriteCategorySlugs] = useState<string[]>([]);
  const [manualEditKnownDesigners, setManualEditKnownDesigners] = useState<string[]>([]);
  const [manualEditDraft, setManualEditDraft] = useState<ManualProductEditDraft>({
    title: "",
    description: "",
    descriptionHtml: "",
    weightGrams: "",
    gender: "unisex",
    availabilityMode: "in_stock",
    designerName: "",
    bindSync: false,
    favorite: false,
    manualPriceRub: "",
    manualCompareAtPriceRub: "",
    images: [],
    variants: [{ id: "v-1", title: "Default", price: "", currency: "USD", available: true }],
  });
  const [manualEditSyncBaseline, setManualEditSyncBaseline] = useState<{
    images: ManualProductEditDraft["images"];
    variants: ManualProductEditDraft["variants"];
  } | null>(null);
  const [canEditSources, setCanEditSources] = useState<boolean>(false);
  const [canEditAutoSyncPeriod, setCanEditAutoSyncPeriod] = useState<boolean>(false);

  useEffect(() => {
    void (async () => {
      try {
        const me = await getAdminMeCached();
        if (!me) {
          setCanEditSources(false);
          return;
        }
        if (me?.is_superuser) {
          setCanEditSources(true);
          setCanEditAutoSyncPeriod(true);
          return;
        }
        const perms = Array.isArray(me?.permissions) ? me.permissions : [];
        setCanEditSources(perms.includes("control.sources.edit"));
        setCanEditAutoSyncPeriod(perms.includes("control.settings.edit"));
      } catch {
        setCanEditSources(false);
        setCanEditAutoSyncPeriod(false);
      }
    })();
  }, []);

  useEffect(() => {
    setAutoSyncDraft(String(Math.max(60, Number(autoSyncPeriodMinutes || 60))));
  }, [autoSyncPeriodMinutes]);

  useEffect(() => {
    const timer = window.setInterval(() => setAutoSyncNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const nextRunAt = autoSyncNextRunAt ? new Date(autoSyncNextRunAt) : null;
  const nextRunMs = nextRunAt && !Number.isNaN(nextRunAt.getTime()) ? nextRunAt.getTime() : null;
  const secondsToNextRun = nextRunMs === null ? null : Math.max(0, Math.floor((nextRunMs - autoSyncNowMs) / 1000));
  const formatCountdown = (totalSeconds: number | null): string => {
    if (totalSeconds === null) return "—";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}ч ${minutes}м ${seconds}с`;
    if (minutes > 0) return `${minutes}м ${seconds}с`;
    return `${seconds}с`;
  };
  const autoSyncStatusLabelMap: Record<string, string> = {
    scheduled: "Запланировано",
    started: "Запущено",
    busy: "Ожидание: идет другая синхронизация",
    error: "Ошибка",
  };
  const normalizedAutoSyncStatus = (() => {
    const raw = String(autoSyncLastStatus || "").trim().toLowerCase();
    return raw === "rescheduled" ? "scheduled" : raw;
  })();
  const autoSyncStatusLabel = autoSyncStatusLabelMap[normalizedAutoSyncStatus] || "—";
  const orderedSources = [...sources].sort((left, right) => {
    const leftMode = normalizeSourceMode(left.mode);
    const rightMode = normalizeSourceMode(right.mode);
    const rankByMode: Record<"personal" | "manual" | "auto", number> = {
      personal: 0,
      manual: 1,
      auto: 2,
    };
    const rankDiff = rankByMode[leftMode] - rankByMode[rightMode];
    if (rankDiff !== 0) return rankDiff;
    return String(left.name || "").localeCompare(String(right.name || ""), "ru");
  });

  useEffect(() => {
    setSourceAttrVisibility((prev) => {
      const next = { ...prev };
      for (const source of sources) {
        if (!next[source.key]) {
          next[source.key] = {
            descriptionMode: source.description_mode === "hidden" || source.description_mode === "html" ? source.description_mode : "text",
            images: source.show_images ?? true,
          };
        }
      }
      return next;
    });
  }, [sources]);

  const isAnySyncRunning = Boolean(latestJob && ["queued", "running"].includes(String(latestJob.status || "")));

  const openManualEdit = async (productId: number) => {
    setManualEditLoading(true);
    try {
      const [productRes, taxonomyRes] = await Promise.all([
        authFetch(`${API_BASE}/admin/products/${productId}`),
        authFetch(`${API_BASE}/taxonomy/state`),
      ]);
      if (!productRes.ok) {
        throw new Error(`Ошибка загрузки товара: ${productRes.status}`);
      }
      const product = normalizeServiceProduct(await productRes.json() as never);
      const taxonomyPayload = taxonomyRes.ok ? await taxonomyRes.json() as {
        filters?: Array<{ slug?: string | null; title?: string | null; children?: Array<unknown> }>;
      } : null;
      const categoryOptions = flattenTaxonomyFilters(taxonomyPayload?.filters);

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

      const syncListing = Array.isArray(product.listings)
        ? product.listings.find((listing) => String(listing.ingest_mode || "").trim().toLowerCase() === "sync") || null
        : null;
      const isBoundSync = Boolean(syncListing);
      setManualEditProductId(Number(product.id));
      setManualEditProductTitle(String(product.title || ""));
      setManualEditSourceId(
        isBoundSync && syncListing?.source_id !== null && syncListing?.source_id !== undefined
          ? Number(syncListing.source_id || 0)
          : null
      );
      setManualEditSourceUrl(isBoundSync ? String(syncListing?.url || "") : null);
      setManualEditShowBindSync(isBoundSync);
      setManualEditFavoriteCategoryOptions(categoryOptions.map((x) => ({ slug: x.slug, name: x.name })));
      const filterSlugs = Array.isArray(product.filter_slugs) ? product.filter_slugs : [];
      const assignedSlugs = categoryOptions.filter((item) => filterSlugs.includes(item.slug)).map((item) => item.slug);
      setManualEditFavoriteCategorySlugs(assignedSlugs);
      setManualEditKnownDesigners((prev) => {
        const set = new Set(prev);
        const candidate = String(product.display_designer_name || product.designer_name || product.source_designer_name || "").trim();
        if (candidate) set.add(candidate);
        return Array.from(set.values()).sort((a, b) => a.localeCompare(b, "ru"));
      });
      setManualEditDraft({
        title: String(product.title || ""),
        description: String(product.description || ""),
        descriptionHtml: String(product.description_html || ""),
        weightGrams: product.weight_grams === null || product.weight_grams === undefined ? "" : String(product.weight_grams),
        gender:
          String(product.gender || "").trim().toLowerCase() === "female"
            ? "female"
            : String(product.gender || "").trim().toLowerCase() === "male"
              ? "male"
              : "unisex",
        availabilityMode: String(product.availability_mode || "").trim().toLowerCase() === "by_order" ? "by_order" : "in_stock",
        designerName: String(product.display_designer_name || product.designer_name || product.source_designer_name || ""),
        bindSync: isBoundSync,
        favorite: assignedSlugs.length > 0,
        manualPriceRub:
          product.price_override?.manual_price_rub === null || product.price_override?.manual_price_rub === undefined
            ? ""
            : String(product.price_override.manual_price_rub),
        manualCompareAtPriceRub:
          product.price_override?.manual_compare_at_price_rub === null || product.price_override?.manual_compare_at_price_rub === undefined
            ? ""
            : String(product.price_override.manual_compare_at_price_rub),
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
      const manualPriceRaw = Number(String(manualEditDraft.manualPriceRub || "").replace(",", "."));
      const manualCompareAtPriceRaw = Number(String(manualEditDraft.manualCompareAtPriceRub || "").replace(",", "."));
      const manualPrice = Number.isFinite(manualPriceRaw) && manualPriceRaw > 0 ? manualPriceRaw : null;
      const manualCompareAtPrice = Number.isFinite(manualCompareAtPriceRaw) && manualCompareAtPriceRaw > 0 ? manualCompareAtPriceRaw : null;
      if (manualPrice === null && String(manualEditDraft.manualCompareAtPriceRub || "").trim()) {
        pushToast("Для скидки сначала укажи ручную цену");
        return;
      }
      const currentBoundUrl = String(manualEditSourceUrl || "").trim();
      const nextBoundUrl = (
        manualEditShowBindSync
        && manualEditDraft.bindSync
        && manualEditSourceId
        && manualEditSourceUrl
      ) ? String(manualEditSourceUrl || "").trim() : "";
      const payload = {
        title,
        description: String(manualEditDraft.description || "").trim() || null,
        description_html: String(manualEditDraft.descriptionHtml || "").trim() || null,
        designer_name: String(manualEditDraft.designerName || "").trim() || null,
        source_category_name: null,
        gender: manualEditDraft.gender,
        variants: validVariants.map((x) => ({ title: x.title, price: x.price, currency: x.currency, available: x.available })),
        manual_image_asset_ids: manualImageAssetIds,
        manual_weight_grams: weight,
        price_override: manualPrice === null ? null : {
          manual_price_rub: manualPrice,
          manual_compare_at_price_rub: manualCompareAtPrice,
        },
        ...deriveProductWriteStateFromVariants(validVariants as ManualEditVariant[], manualEditDraft.availabilityMode),
        filter_slugs: manualEditFavoriteCategorySlugs,
      };
      const updateRes = await authFetch(`${API_BASE}/products/manual/${manualEditProductId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!updateRes.ok) {
        throw new Error(`Ошибка сохранения: ${updateRes.status}`);
      }
      if (currentBoundUrl && currentBoundUrl !== nextBoundUrl) {
        const productRes = await authFetch(`${API_BASE}/admin/products/${manualEditProductId}`);
        if (!productRes.ok) {
          throw new Error(`Не удалось прочитать листинги товара: ${productRes.status}`);
        }
        const productPayload = await productRes.json() as {
          listings?: Array<{ id: number; ingest_mode?: string | null; source_id?: number | null; url?: string | null }>;
        };
        for (const listing of productPayload.listings || []) {
          const isSync = String(listing.ingest_mode || "").trim().toLowerCase() === "sync";
          const matchesSource = Number(listing.source_id || 0) === Number(manualEditSourceId || 0);
          const matchesUrl = String(listing.url || "").trim() === currentBoundUrl;
          if (!isSync || !matchesSource || !matchesUrl) {
            continue;
          }
          const unbindRes = await authFetch(`${API_BASE}/products/${manualEditProductId}/listings/${Number(listing.id)}`, {
            method: "DELETE",
          });
          if (!unbindRes.ok) {
            throw new Error(`Ошибка отвязки синхронизации: ${unbindRes.status}`);
          }
        }
      }
      if (nextBoundUrl && nextBoundUrl !== currentBoundUrl) {
        const bindRes = await authFetch(`${API_BASE}/products/${manualEditProductId}/bind-source-by-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: nextBoundUrl, set_as_primary: false }),
        });
        if (!bindRes.ok) {
          throw new Error(`Ошибка привязки синхронизации: ${bindRes.status}`);
        }
      }
      pushToast("Товар обновлен");
      const nextState = deriveProductWriteStateFromVariants(validVariants as ManualEditVariant[]);
      setManualEditOpen(false);
      setSourceProducts((prev) => prev.map((item) => (
        item.id === manualEditProductId
          ? {
              ...item,
              title,
              statusLabel: getProductStateLabel(nextState),
              statusClass: getProductStateClass(nextState),
              imageUrl: manualEditDraft.images[0]?.url || null,
            }
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
          <div className="admin-sync-period-presets" role="group" aria-label="Быстрый выбор периода">
            {[60, 120, 180, 360, 720].map((value) => {
              const selected = Number(autoSyncDraft) === value;
              return (
                <button
                  key={`preset-${value}`}
                  type="button"
                  className={`btn ${selected ? "btn-primary" : "btn-outline"} btn-compact`}
                  onClick={() => setAutoSyncDraft(String(value))}
                >
                  {value} мин
                </button>
              );
            })}
          </div>
          <div className="admin-settings-inline-row">
            <input
              type="number"
              step={1}
              className="input"
              value={autoSyncDraft}
              disabled={!canEditAutoSyncPeriod}
              onChange={(event) => {
                setAutoSyncDraft(event.target.value);
                if (autoSyncValidationError) {
                  setAutoSyncValidationError("");
                }
              }}
            />
            <button
              type="button"
              className="btn btn-outline"
              disabled={!canEditAutoSyncPeriod}
              onClick={() => {
                void (async () => {
                  if (!canEditAutoSyncPeriod) {
                    pushToast("Недостаточно прав для изменения периода автосинхронизации");
                    return;
                  }
                  const rawValue = String(autoSyncDraft || "").trim();
                  const raw = Math.trunc(Number(rawValue));
                  if (!rawValue || !Number.isFinite(raw) || raw < 60) {
                    setAutoSyncValidationError("Минимум 60 минут");
                    return;
                  }
                  const next = raw;
                  setAutoSyncValidationError("");
                  setAutoSyncDraft(String(next));
                  const result = await updateAdminUiSettings({ auto_sync_period_minutes: next });
                  pushToast(result.message);
                })();
              }}
            >
              Сохранить
            </button>
            {autoSyncValidationError ? <span className="admin-sync-period-error">{autoSyncValidationError}</span> : null}
          </div>
        </label>
        <div className="admin-sync-next-run">
          <div className="admin-sync-next-run__item">
            <span className="muted">Следующая синхронизация через</span>
            <strong>{formatCountdown(secondsToNextRun)}</strong>
          </div>
          <div className="admin-sync-next-run__item">
            <span className="muted">Статус</span>
            <strong>{autoSyncStatusLabel}</strong>
          </div>
          {autoSyncLastError ? (
            <div className="admin-sync-next-run__item admin-sync-next-run__item--error">
              <span className="muted">Последняя ошибка</span>
              <strong>{autoSyncLastError}</strong>
            </div>
          ) : null}
        </div>
      </div>
      <h2>Источники ({sources.length})</h2>
      {loading ? (
        <AdminSourcesSkeleton rows={5} />
      ) : (
        <div className="sources-grid">
          {orderedSources.map((source) => {
            const sourceMode = normalizeSourceMode(source.mode);
            const isPersonal = sourceMode === "personal";
            const href = /^https?:\/\//i.test(source.base_url) ? source.base_url : `https://${source.base_url}`;
            const label = source.base_url.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
            const thisSourceDisabled = isAnySyncRunning;
            return (
              <article
                key={source.key}
                className={`list-row source-card${isPersonal ? " source-card--personal" : ""}${openSourceAttrsKey === source.key ? " source-card--attrs-open" : ""}`}
              >
                <div className="source-card-head">
                  <div className="source-card-badges" aria-label="Метки источника">
                    <span className={`source-badge ${sourceMode === "auto" ? "source-badge--ready" : sourceMode === "manual" ? "source-badge--manual" : "source-badge--personal"}`}>
                      {getSourceModeLabel(sourceMode)}
                    </span>
                    <span className={`source-badge ${source.enabled ? "source-badge--ok" : "source-badge--danger"}`}>
                      {source.enabled ? "Включен" : "Выключен"}
                    </span>
                  </div>
                  <strong className="source-card-title">{source.name}</strong>
                  {!isPersonal ? (
                    <a className="source-card-link" href={href} target="_blank" rel="noreferrer">
                      {label}
                    </a>
                  ) : null}
                </div>
                <div className="source-card-foot">
                  <div className="source-card-meta">
                    <span className="source-pill">Товары: {source.products_count}</span>
                    {sourceMode === "auto" ? (
                      <>
                        <span className="source-pill">Ручных: {Number(source.manual_products_count || 0)}</span>
                        <span className="source-pill">Прогон: {source.last_sync_duration_sec ?? 0}с</span>
                      </>
                    ) : sourceMode === "manual" ? (
                      <span className="source-pill">Прогон: {source.last_sync_duration_sec ?? 0}с</span>
                    ) : null}
                  </div>
                  <div className="source-card-actions">
                    {!isPersonal ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={thisSourceDisabled || !canEditSources}
                        onClick={() => {
                          void (async () => {
                            const result = await runSyncForSource(source.key);
                            pushToast(result.message);
                          })();
                        }}
                      >
                        Синхронизовать
                      </button>
                    ) : null}
                  </div>
                  <div className="source-card-switches">
                    <label className="ui-switch ui-switch--compact source-card-switch">
                      <input
                        type="checkbox"
                        checked={source.enabled}
                        disabled={!canEditSources}
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
                    {!isPersonal ? (
                      <label className="ui-switch ui-switch--compact source-card-switch">
                        <input
                          type="checkbox"
                          checked={source.sync_enabled}
                          disabled={!canEditSources}
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
                        <span className="ui-switch-text">Участие в синхронизации</span>
                      </label>
                    ) : null}
                    <label className="ui-switch ui-switch--compact source-card-switch">
                      <input
                        type="checkbox"
                        checked={source.dedup_enabled}
                        disabled={!canEditSources}
                        onChange={(event) => {
                          void (async () => {
                            const result = await toggleSourceDedupEnabled(source.key, event.target.checked);
                            pushToast(result.message);
                          })();
                        }}
                      />
                      <span className="ui-switch-track">
                        <span className="ui-switch-thumb" />
                      </span>
                      <span className="ui-switch-text">Участие в дедупликации</span>
                    </label>
                    <label className="ui-switch ui-switch--compact source-card-switch">
                      <input
                        type="checkbox"
                        checked={!Boolean(source.hide_auto_added_products)}
                        disabled={!canEditSources}
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
                    <details
                      className="source-attrs"
                      onToggle={(event) => {
                        setOpenSourceAttrsKey(event.currentTarget.open ? source.key : null);
                      }}
                    >
                      <summary className="source-attrs__summary">Правила атрибутов</summary>
                      <div className="source-attrs__body">
                        <label className="ui-switch ui-switch--compact source-card-switch">
                          <input
                            type="checkbox"
                            checked={sourceAttrVisibility[source.key]?.images ?? true}
                            disabled={!canEditSources}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              void (async () => {
                                const result = await updateSourceAttributeVisibility(source.key, { show_images: checked });
                                if (result.ok) {
                                  setSourceAttrVisibility((prev) => ({
                                    ...prev,
                                    [source.key]: {
                                      descriptionMode: prev[source.key]?.descriptionMode ?? "text",
                                      images: checked,
                                    },
                                  }));
                                }
                                pushToast(result.message);
                              })();
                            }}
                          />
                          <span className="ui-switch-track">
                            <span className="ui-switch-thumb" />
                          </span>
                          <span className="ui-switch-text">Показывать фотографии</span>
                        </label>
                        <label className="ui-switch ui-switch--compact source-card-switch">
                          <input
                            type="checkbox"
                            checked={(sourceAttrVisibility[source.key]?.descriptionMode ?? "text") !== "hidden"}
                            disabled={!canEditSources}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              void (async () => {
                                const prevMode = sourceAttrVisibility[source.key]?.descriptionMode ?? "text";
                                const nextMode = checked ? (prevMode === "html" ? "html" : "text") : "hidden";
                                const result = await updateSourceAttributeVisibility(source.key, { description_mode: nextMode });
                                if (result.ok) {
                                  setSourceAttrVisibility((prev) => ({
                                    ...prev,
                                    [source.key]: {
                                      descriptionMode: nextMode,
                                      images: prev[source.key]?.images ?? true,
                                    },
                                  }));
                                }
                                pushToast(result.message);
                              })();
                            }}
                          />
                          <span className="ui-switch-track">
                            <span className="ui-switch-thumb" />
                          </span>
                          <span className="ui-switch-text">Показывать описание</span>
                        </label>
                        {!isPersonal ? (
                          <label className="ui-switch ui-switch--compact source-card-switch">
                            <input
                              type="checkbox"
                              checked={(sourceAttrVisibility[source.key]?.descriptionMode ?? "text") === "html"}
                              disabled={!canEditSources || (sourceAttrVisibility[source.key]?.descriptionMode ?? "text") === "hidden"}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                void (async () => {
                                  const nextMode = checked ? "html" : "text";
                                  const result = await updateSourceAttributeVisibility(source.key, { description_mode: nextMode });
                                  if (result.ok) {
                                    setSourceAttrVisibility((prev) => ({
                                      ...prev,
                                      [source.key]: {
                                        descriptionMode: nextMode,
                                        images: prev[source.key]?.images ?? true,
                                      },
                                    }));
                                  }
                                  pushToast(result.message);
                                })();
                              }}
                            />
                            <span className="ui-switch-track">
                              <span className="ui-switch-thumb" />
                            </span>
                            <span className="ui-switch-text">Отображать сырое описание (HTML)</span>
                          </label>
                        ) : null}
                      </div>
                    </details>
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
                        <ImageWithFallback
                          src={optimizeImageUrl(item.imageUrl, { width: 220, height: 220, quality: 55 })}
                          alt={item.title}
                          className="source-products-thumb"
                          placeholderClassName="thumb-mini photo-placeholder source-products-thumb source-products-thumb--empty"
                          placeholderText="Нет фото"
                        />
                      ) : (
                        <span className="thumb-mini photo-placeholder source-products-thumb source-products-thumb--empty">Нет фото</span>
                      )}
                    </button>
                    <div className="source-products-body">
                      <button type="button" className="source-products-title source-products-title--button" onClick={() => { void openManualEdit(item.id); }} disabled={manualEditLoading}>
                        {item.title}
                      </button>
                      <span className={`source-products-status ${item.statusClass}`}>{item.statusLabel || "—"}</span>
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
        knownDesignerOptions={manualEditKnownDesigners}
        favoriteCategoryOptions={manualEditFavoriteCategoryOptions}
        favoriteCategorySlugs={manualEditFavoriteCategorySlugs}
        showBindSync={manualEditShowBindSync}
        onClose={() => setManualEditOpen(false)}
        onSave={() => { void onSaveManualEdit(); }}
        onDelete={() => { void onDeleteManualProduct(); }}
        onSetFavoriteCategorySlugs={setManualEditFavoriteCategorySlugs}
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
