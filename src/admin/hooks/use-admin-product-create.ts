import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAdminDesignerMappings, readAdminDesignerMappingsState } from "../admin-designers-api";
import {
  buildHiddenProductWriteState,
  buildVisibleProductWriteState,
  deriveProductWriteStateFromVariants,
  resolveProductWriteState,
} from "../../shared/product-state";
import { buildProductPriceSummaryFromVariants, getProductPriceSummary } from "../../shared/product-pricing";
import type { ProductStarredCategoryOption, ProductUrlPreview, ProductWriteState, ServiceProduct, Source } from "../../shared/live-data-types";
import {
  isManualVariantAmountTooLarge,
  MAX_MANUAL_VARIANT_AMOUNT_LABEL,
  normalizeManualVariantCurrency,
  resolveManualVariantPricingMode,
} from "../manual-variant-pricing";

export type ProductCreateImage = {
  id: string;
  url: string;
  isManual: boolean;
};
export type ProductCreateVariant = {
  id: string;
  title: string;
  price: string;
  compareAtPrice: string;
  currency: "RUB" | "USD" | "EUR" | "GBP" | "JPY";
  available: boolean;
};

export type ProductCreateLookupState = "idle" | "loading" | "not_found" | "found";

export type ProductCreateLookupResult = {
  state: ProductCreateLookupState;
  product: ServiceProduct | null;
  error: string | null;
};

export type ProductCreateDraft = {
  sourceUrl: string;
  title: string;
  description: string;
  weightGrams: string;
  gender: "male" | "female" | "unisex";
  availabilityMode: "in_stock" | "by_order";
  favorite: boolean;
  bindSync: boolean;
  designerName: string;
  images: ProductCreateImage[];
  variants: ProductCreateVariant[];
};

export type ProductCreateMode = "create" | "edit";

type AllowedSourceDomain = {
  host: string;
  sourceName: string;
  sourceKey: string;
  modeLabel: "Авто" | "Ручной";
};

type Params = {
  sources: Source[];
  products: ServiceProduct[];
  onToast: (message: string, type?: "success" | "error") => void;
  onProductCreated?: (productId: number) => Promise<void> | void;
  probeProductByUrl: (url: string) => Promise<{ ok: boolean; message: string; preview: ProductUrlPreview | null }>;
  createManualProduct: (payload: {
    title: string;
    description?: string | null;
    designer_name?: string | null;
    source_category_name: string | null;
    gender?: "male" | "female" | "unisex" | null;
    variants: Array<{ title: string; price: number | null; compare_at_price?: number | null; currency: string; pricing_mode?: string | null; available: boolean }>;
    manual_image_asset_ids: number[];
    manual_weight_grams?: number | null;
    state?: {
      visibility_status: "visible" | "hidden";
      availability_mode?: "in_stock" | "by_order";
      orderability_status?: "orderable" | "sold_out" | "unavailable";
    };
    bind_sync?: boolean;
    bind_url?: string | null;
  }) => Promise<{ ok: boolean; message: string; id: number | null }>;
  updateManualProduct: (productId: number, payload: {
    title: string;
    description?: string | null;
    designer_name?: string | null;
    source_category_name: string | null;
    gender?: "male" | "female" | "unisex" | null;
    variants: Array<{ title: string; price: number | null; compare_at_price?: number | null; currency: string; pricing_mode?: string | null; available: boolean }>;
    manual_image_asset_ids: number[];
    manual_weight_grams?: number | null;
    state?: {
      visibility_status: "visible" | "hidden";
      availability_mode?: "in_stock" | "by_order";
      orderability_status?: "orderable" | "sold_out" | "unavailable";
    };
    bind_sync?: boolean;
    bind_url?: string | null;
  }) => Promise<{ ok: boolean; message: string; id: number | null }>;
  uploadProductImage: (file: File) => Promise<{ ok: boolean; message: string; imageAssetId: number | null }>;
  uploadProductImageByUrl: (url: string) => Promise<{ ok: boolean; message: string; imageAssetId: number | null }>;
  setProductStatus: (productId: number, state: {
    visibility_status: "visible" | "hidden";
    availability_mode?: "in_stock" | "by_order";
    orderability_status?: "orderable" | "sold_out" | "unavailable";
  }) => Promise<{ ok: boolean; message: string }>;
  getProductById: (id: number, opts?: { forceFetch?: boolean }) => Promise<ServiceProduct | null>;
  getProductStarredCategories: (productId: number) => Promise<{ ok: boolean; message: string; assignedCatalogSlugs: string[]; availableCategories: ProductStarredCategoryOption[] }>;
  setProductStarredCategories: (productId: number, catalogSlugs: string[]) => Promise<{ ok: boolean; message: string; assignedCatalogSlugs: string[] }>;
  getStarredCategoryOptions: () => Promise<{ ok: boolean; items: Array<{ slug: string; name: string }> }>;
};

function buildInitialDraft(): ProductCreateDraft {
  return {
    sourceUrl: "",
    title: "",
    description: "",
    weightGrams: "",
    gender: "unisex",
    availabilityMode: "in_stock",
    favorite: false,
    bindSync: false,
    designerName: "",
    images: [],
    variants: [{ id: `v-${Date.now()}`, title: "Default", price: "", compareAtPrice: "", currency: "RUB", available: true }],
  };
}

function toHost(rawUrl: string): string | null {
  const clean = String(rawUrl || "").trim();
  if (!clean) return null;
  try {
    const asIs = new URL(clean);
    return asIs.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    try {
      const prefixed = new URL(`https://${clean}`);
      return prefixed.hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      return null;
    }
  }
}

function normalizeUrlLoose(rawUrl: string): string {
  const clean = String(rawUrl || "").trim();
  if (!clean) return "";
  try {
    const asIs = new URL(clean);
    asIs.hash = "";
    const parts = asIs.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && /^[a-z]{2}(?:-[a-z]{2})?$/i.test(parts[0]) && parts[1].toLowerCase() === "products") {
      asIs.pathname = `/${parts.slice(1).join("/")}`;
    }
    return asIs.toString().replace(/\/+$/, "");
  } catch {
    try {
      const prefixed = new URL(`https://${clean}`);
      prefixed.hash = "";
      const parts = prefixed.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && /^[a-z]{2}(?:-[a-z]{2})?$/i.test(parts[0]) && parts[1].toLowerCase() === "products") {
        prefixed.pathname = `/${parts.slice(1).join("/")}`;
      }
      return prefixed.toString().replace(/\/+$/, "");
    } catch {
      return clean;
    }
  }
}

function normalizeImageUrl(rawUrl: string): string {
  const clean = String(rawUrl || "").trim();
  if (!clean) return "";
  if (clean.startsWith("//")) return `https:${clean}`;
  return clean;
}

function parseOptionalDecimal(rawValue: unknown): number | null {
  const normalized = String(rawValue ?? "").trim().replace(",", ".");
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeVariantCompareAtPrice(rawCompareAtPrice: unknown, rawPrice: unknown): string {
  const priceNumber = parseOptionalDecimal(rawPrice);
  const compareNumber = parseOptionalDecimal(rawCompareAtPrice);
  if (compareNumber === null) {
    return "";
  }
  if (priceNumber === null) {
    return String(rawCompareAtPrice ?? "").trim();
  }
  return compareNumber > priceNumber ? String(rawCompareAtPrice ?? "").trim() : "";
}

function slugToTitle(rawUrl: string): string {
  const normalized = normalizeUrlLoose(rawUrl);
  try {
    const parsed = new URL(normalized);
    const lastPath = parsed.pathname.split("/").filter(Boolean).pop() || "new-item";
    return lastPath
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  } catch {
    return "Новый товар";
  }
}

function normalizeDesignerOption(value: string | null | undefined): string {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function deriveSellerMode(source: Source): "Авто" | "Ручной" {
  return String(source.mode || "auto") === "auto" ? "Авто" : "Ручной";
}

function productCurrencyFromVariants(product: ServiceProduct): ProductCreateVariant["currency"] {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  for (const variant of variants) {
    const raw = String((variant as { currency?: unknown }).currency || "").toUpperCase();
    return normalizeManualVariantCurrency(raw, "USD");
  }
  return "RUB";
}

function productToDraft(product: ServiceProduct): Omit<ProductCreateDraft, "sourceUrl"> {
  const currency = productCurrencyFromVariants(product);
  const resolvedState = resolveProductWriteState(product);
  const mappedVariants: ProductCreateVariant[] = Array.isArray(product.variants) && product.variants.length > 0
    ? product.variants.map((variant, idx) => {
        const vCurrencyRaw = String((variant as { currency?: unknown }).currency || currency || "USD").toUpperCase();
        return {
          id: `pv-${product.id}-${idx + 1}`,
          title: String(variant.title || "").trim() || `Вариант ${idx + 1}`,
          price: variant.price === null || variant.price === undefined ? "" : String(variant.price),
          compareAtPrice: sanitizeVariantCompareAtPrice(variant.compare_at_price, variant.price),
          currency: normalizeManualVariantCurrency(vCurrencyRaw, currency),
          available: Boolean(variant.available),
        };
      })
    : [
        {
          id: `pv-${product.id}`,
          title: "Default",
          price: "",
          compareAtPrice: "",
          currency,
          available: resolvedState.orderability_status === "orderable",
        },
      ];
  return {
    title: String(product.title || "").trim(),
    description: String(product.description || "").trim(),
    weightGrams:
      product.weight_grams === null || product.weight_grams === undefined
        ? ""
        : String(product.weight_grams),
    gender:
      String(product.gender || "").trim().toLowerCase() === "female"
        ? "female"
        : String(product.gender || "").trim().toLowerCase() === "male"
          ? "male"
          : "unisex",
    availabilityMode: String(product.availability_mode || "").trim().toLowerCase() === "by_order" ? "by_order" : "in_stock",
    favorite: Boolean(product.is_favorite),
    designerName: String(product.display_designer_name || product.designer_name || product.source_designer_name || "").trim(),
    images: (product.image_urls || []).map((url, idx) => ({
      id: `db-${product.id}-${idx + 1}`,
      url: String(url),
      isManual: false,
    })),
    variants: mappedVariants,
  };
}

function previewToSyntheticProduct(preview: ProductUrlPreview, fallbackUrl: string): ServiceProduct {
  return {
    id: Number(preview.id || 0),
    source_id: Number(preview.source_id || 0),
    handle: String(preview.handle || ""),
    title: String(preview.title || ""),
    description: String(preview.description_text || ""),
    description_text: String(preview.description_text || "") || null,
    description_html: String(preview.description_html || "") || null,
    source_name: String(preview.source_name || ""),
    weight_grams: preview.source_weight_grams ?? null,
    visibility_status: preview.visibility_status ?? "visible",
    availability_mode: preview.availability_mode ?? "in_stock",
    orderability_status: preview.orderability_status ?? "orderable",
    gender: preview.gender ?? null,
    designer_name: preview.designer_name ?? null,
    source_designer_name: preview.designer_name ?? null,
    display_designer_name: preview.designer_name ?? null,
    url: String(preview.product_url || fallbackUrl),
    source_category_name: preview.source_category_name ?? null,
    price_summary: preview.price_summary ?? buildProductPriceSummaryFromVariants(Array.isArray(preview.variants) ? preview.variants : []),
    image_count: Array.isArray(preview.image_urls) ? preview.image_urls.length : 0,
    image_urls: Array.isArray(preview.image_urls) ? preview.image_urls.map((item) => String(item)) : [],
    variants: Array.isArray(preview.variants) ? preview.variants : [],
    created_at: "",
    updated_at: "",
  };
}

export function useAdminProductCreate({
  sources,
  products,
  onToast,
  onProductCreated,
  probeProductByUrl,
  createManualProduct,
  updateManualProduct,
  uploadProductImage,
  uploadProductImageByUrl,
  setProductStatus,
  getProductById,
  getProductStarredCategories: _getProductStarredCategories,
  setProductStarredCategories: _setProductStarredCategories,
  getStarredCategoryOptions,
}: Params) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [mode, setMode] = useState<ProductCreateMode>("create");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingProductBoundSync, setEditingProductBoundSync] = useState<boolean>(false);
  const [draft, setDraft] = useState<ProductCreateDraft>(() => buildInitialDraft());
  const [lookup, setLookup] = useState<ProductCreateLookupResult>({
    state: "idle",
    product: null,
    error: null,
  });
  const [isHydrating, setIsHydrating] = useState<boolean>(false);
  const [manualImageAssetIdsById, setManualImageAssetIdsById] = useState<Record<string, number>>({});
  const [syncBaseline, setSyncBaseline] = useState<{
    images: ProductCreateImage[];
    variants: ProductCreateVariant[];
  } | null>(null);
  const [hiddenProductIds, setHiddenProductIds] = useState<Set<number>>(new Set());
  const [statusBeforeHide, setStatusBeforeHide] = useState<Record<number, ProductWriteState>>({});
  const [favoriteCategoryOptions, setFavoriteCategoryOptions] = useState<Array<{ slug: string; name: string }>>([]);
  const [favoriteCategorySlugs, setFavoriteCategorySlugs] = useState<string[]>([]);
  const [boundFromSourceLookup, setBoundFromSourceLookup] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [sourceDesignerOptions, setSourceDesignerOptions] = useState<string[]>(() => {
    const state = readAdminDesignerMappingsState();
    const normalized = state.rows
      .map((row) => normalizeDesignerOption(row.source_brand))
      .filter(Boolean);
    return Array.from(new Set(normalized)).sort((left, right) => left.localeCompare(right, "ru"));
  });
  const lookupTimerRef = useRef<number | null>(null);
  const lastLookupKeyRef = useRef<string>("");
  const remotePreviewInFlightRef = useRef<{
    key: string;
    promise: Promise<{ ok: boolean; message: string; preview: ProductUrlPreview | null }>;
  } | null>(null);

  const loadRemotePreview = useCallback((url: string) => {
    const normalizedUrl = normalizeUrlLoose(url);
    const active = remotePreviewInFlightRef.current;
    if (active && active.key === normalizedUrl) {
      return active.promise;
    }
    const promise = probeProductByUrl(normalizedUrl).finally(() => {
      if (remotePreviewInFlightRef.current?.key === normalizedUrl) {
        remotePreviewInFlightRef.current = null;
      }
    });
    remotePreviewInFlightRef.current = {
      key: normalizedUrl,
      promise,
    };
    return promise;
  }, [probeProductByUrl]);

  const allowedDomains = useMemo<AllowedSourceDomain[]>(() => {
    const map = new Map<string, AllowedSourceDomain>();
    for (const source of sources) {
      const host = toHost(source.base_url);
      if (!host || map.has(host)) continue;
      map.set(host, {
        host,
        sourceName: String(source.name || source.key || host),
        sourceKey: String(source.key || host),
        modeLabel: deriveSellerMode(source),
      });
    }
    return Array.from(map.values()).sort((left, right) => left.sourceName.localeCompare(right.sourceName, "ru"));
  }, [sources]);

  const sourceDomainError = useMemo(() => {
    const raw = draft.sourceUrl.trim();
    if (!raw) return null;
    const host = toHost(raw);
    if (!host) return "Некорректная ссылка. Вставь полный URL товара.";
    if (allowedDomains.length === 0) {
      // Sources list has not loaded yet: avoid false-negative domain blocking.
      return null;
    }
    const allowed = allowedDomains.some((domain) => host === domain.host || host.endsWith(`.${domain.host}`));
    if (!allowed) return "Данный домен не входит в список разрешенных источников.";
    return null;
  }, [draft.sourceUrl, allowedDomains]);

  const matchedSourceDomain = useMemo(() => {
    const host = toHost(draft.sourceUrl);
    if (!host) return null;
    return (
      allowedDomains.find((domain) => host === domain.host || host.endsWith(`.${domain.host}`)) || null
    );
  }, [draft.sourceUrl, allowedDomains]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const payload = await fetchAdminDesignerMappings();
        if (cancelled) {
          return;
        }
        const normalized = payload.rows
          .map((row) => normalizeDesignerOption(row.source_brand))
          .filter(Boolean);
        setSourceDesignerOptions(Array.from(new Set(normalized)).sort((left, right) => left.localeCompare(right, "ru")));
      } catch {
        return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const productDesignerOptions = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      const value = normalizeDesignerOption(product.source_designer_name || product.designer_name || product.display_designer_name || "");
      if (value) set.add(value);
    }
    return Array.from(set.values()).sort((left, right) => left.localeCompare(right, "ru"));
  }, [products]);

  const knownDesignerOptions = useMemo(() => {
    const merged = [...sourceDesignerOptions, ...productDesignerOptions];
    return Array.from(new Set(merged)).sort((left, right) => left.localeCompare(right, "ru"));
  }, [sourceDesignerOptions, productDesignerOptions]);

  const canRunLookup = Boolean(draft.sourceUrl.trim()) && !sourceDomainError;
  const sourceLookupKey = useMemo(() => normalizeUrlLoose(draft.sourceUrl), [draft.sourceUrl]);
  const hasFoundProduct = lookup.state === "found" && Boolean(lookup.product);
  const hasExistingLookupProduct = hasFoundProduct && Number(lookup.product?.id || 0) > 0;

  useEffect(() => {
    if (lookupTimerRef.current !== null) {
      window.clearTimeout(lookupTimerRef.current);
      lookupTimerRef.current = null;
    }
    if (!canRunLookup) {
      setLookup({ state: draft.sourceUrl.trim() ? "idle" : "idle", product: null, error: null });
      setBoundFromSourceLookup(false);
      lastLookupKeyRef.current = "";
      return;
    }
    if (
      lastLookupKeyRef.current === sourceLookupKey
      && (lookup.state === "not_found" || lookup.state === "found")
    ) {
      return;
    }
    if (lookup.state === "found" && lookup.product && normalizeUrlLoose(lookup.product.url) === sourceLookupKey) {
      lastLookupKeyRef.current = sourceLookupKey;
      return;
    }

    setLookup({ state: "loading", product: null, error: null });
    lookupTimerRef.current = window.setTimeout(() => {
      (async () => {
        const normalizedInput = sourceLookupKey;
        const localFound =
          products.find((item) => normalizeUrlLoose(item.url) === normalizedInput) ||
          products.find((item) => {
            const itemHost = toHost(item.url);
            const inputHost = toHost(sourceLookupKey);
            if (!itemHost || !inputHost || itemHost !== inputHost) return false;
            const handle = String(item.handle || "").trim();
            return handle.length > 0 && normalizedInput.includes(handle);
          }) ||
          null;
        if (localFound) {
          lastLookupKeyRef.current = sourceLookupKey;
          setLookup({ state: "found", product: localFound, error: null });
          return;
        }
        const remote = await loadRemotePreview(sourceLookupKey);
        if (!remote.ok || !remote.preview) {
          lastLookupKeyRef.current = sourceLookupKey;
          setLookup({ state: "not_found", product: null, error: null });
          return;
        }
        const synthetic = previewToSyntheticProduct(remote.preview, sourceLookupKey);
        lastLookupKeyRef.current = sourceLookupKey;
        setLookup({ state: "found", product: synthetic, error: null });
      })();
    }, 720);

    return () => {
      if (lookupTimerRef.current !== null) {
        window.clearTimeout(lookupTimerRef.current);
        lookupTimerRef.current = null;
      }
    };
  }, [sourceLookupKey, canRunLookup, products, loadRemotePreview, draft.sourceUrl, lookup.state, lookup.product]);

  const setDraftField = useCallback(<K extends keyof ProductCreateDraft>(key: K, value: ProductCreateDraft[K]) => {
    setDraft((prev) => {
      if (key === "bindSync") {
        const nextBind = Boolean(value);
        if (nextBind && syncBaseline) {
          return {
            ...prev,
            bindSync: nextBind,
            images: syncBaseline.images.map((item) => ({ ...item })),
            variants: syncBaseline.variants.map((item) => ({ ...item })),
          };
        }
      }
      return { ...prev, [key]: value };
    });
  }, [syncBaseline]);

  useEffect(() => {
    if (!hasExistingLookupProduct) return;
    setDraft((prev) => (prev.bindSync ? { ...prev, bindSync: false } : prev));
  }, [hasExistingLookupProduct]);

  const hydrateFromSourceUrl = useCallback(async () => {
    if (!canRunLookup || isHydrating) return;
    setIsHydrating(true);
    try {
      const result = await loadRemotePreview(sourceLookupKey);
      if (!result.ok || !result.preview) {
        onToast(`Не удалось выгрузить товар: ${result.message}`, "error");
        return;
      }
      const preview = result.preview;
      const synthetic = previewToSyntheticProduct(preview, sourceLookupKey);
      const previewVariants: ProductCreateVariant[] =
        Array.isArray(preview.variants) && preview.variants.length > 0
          ? preview.variants.map((variant, idx) => {
              const raw = String((variant as { currency?: unknown }).currency || preview.price_summary?.source_currency || "USD").toUpperCase();
              const currency = normalizeManualVariantCurrency(raw, "USD");
              return {
                id: `v-${Date.now()}-${idx + 1}`,
                title: String(variant.title || "").trim() || `Вариант ${idx + 1}`,
                price: variant.price === null || variant.price === undefined ? "" : String(variant.price),
                compareAtPrice: sanitizeVariantCompareAtPrice(variant.compare_at_price, variant.price),
                currency,
                available: Boolean(variant.available),
              };
            })
          : [
              {
                id: `v-${Date.now()}`,
                title: String(preview.title || "").trim() || "Default",
                price: "",
                compareAtPrice: "",
                currency: normalizeManualVariantCurrency(preview.price_summary?.source_currency, "USD"),
                available: true,
              },
            ];
      setDraft((prev) => ({
        ...prev,
        title: String(preview.title || "").trim() || prev.title || slugToTitle(sourceLookupKey),
        description: String(preview.description_text || "").trim() || prev.description,
        designerName: String(preview.designer_name || "").trim() || prev.designerName,
        weightGrams: preview.source_weight_grams === null || preview.source_weight_grams === undefined ? prev.weightGrams : String(preview.source_weight_grams),
        gender:
          preview.gender === "female"
            ? "female"
            : preview.gender === "male"
              ? "male"
              : prev.gender,
        availabilityMode: preview.availability_mode === "by_order" ? "by_order" : prev.availabilityMode,
        variants: previewVariants,
        images: (preview.image_urls || []).map((url, idx) => ({
          id: `preview-${Date.now()}-${idx + 1}`,
          url: normalizeImageUrl(String(url)),
          isManual: false,
        })),
      }));
      setSyncBaseline({
        images: (preview.image_urls || []).map((url, idx) => ({
          id: `preview-baseline-${Date.now()}-${idx + 1}`,
          url: normalizeImageUrl(String(url)),
          isManual: false,
        })),
        variants: previewVariants.map((item) => ({ ...item })),
      });
      lastLookupKeyRef.current = sourceLookupKey;
      setLookup({ state: "found", product: synthetic, error: null });
      setBoundFromSourceLookup(true);
      const previewSummary = preview.price_summary ?? getProductPriceSummary({ price_summary: null, variants: preview.variants || [] });
      const basePrice = Number(previewSummary?.source_display_price);
      const buyerTotal = Number(preview.buyer_total_price);
      if (Number.isFinite(basePrice) && Number.isFinite(buyerTotal) && buyerTotal > basePrice) {
        const fee = buyerTotal - basePrice;
        onToast(`Данные товара выгружены из ссылки. Надбавка покупателя: +${fee.toFixed(2)}`, "success");
      } else {
        onToast("Данные товара выгружены из ссылки", "success");
      }
    } finally {
      setIsHydrating(false);
    }
  }, [canRunLookup, isHydrating, loadRemotePreview, sourceLookupKey, onToast]);

  const hydrateFromExistingProduct = useCallback(async () => {
    if (!hasFoundProduct || !lookup.product || isHydrating) return;
    setIsHydrating(true);
    try {
      await new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), 620);
      });
      const next = productToDraft(lookup.product);
      setDraft((prev) => ({
        ...prev,
        ...next,
      }));
      setSyncBaseline({
        images: (next.images || []).map((item) => ({ ...item })),
        variants: (next.variants || []).map((item) => ({ ...item })),
      });
      onToast("Данные товара выгружены из базы", "success");
    } finally {
      setIsHydrating(false);
    }
  }, [hasFoundProduct, lookup.product, isHydrating, onToast]);

  const hideExistingProduct = useCallback(async () => {
    if (!lookup.product) return;
    const currentState = resolveProductWriteState(lookup.product);
    const productId = lookup.product.id;
    const isCurrentlyHidden = hiddenProductIds.has(productId) || currentState.visibility_status === "hidden";
    const restoreState = statusBeforeHide[productId] || buildVisibleProductWriteState(lookup.product, lookup.product.variants);
    const nextState = isCurrentlyHidden ? restoreState : buildHiddenProductWriteState(lookup.product);
    const result = await setProductStatus(lookup.product.id, nextState);
    if (!result.ok) {
      onToast(`Не удалось изменить статус: ${result.message}`, "error");
      return;
    }
    setHiddenProductIds((prev) => {
      const next = new Set(prev);
      if (nextState.visibility_status === "hidden") next.add(lookup.product!.id);
      else next.delete(lookup.product!.id);
      return next;
    });
    setStatusBeforeHide((prev) => {
      if (nextState.visibility_status === "hidden") {
        return {
          ...prev,
          [productId]: buildVisibleProductWriteState(lookup.product, lookup.product?.variants),
        };
      }
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    onToast(nextState.visibility_status === "hidden" ? "Товар скрыт" : "Товар открыт", "success");
  }, [lookup.product, hiddenProductIds, statusBeforeHide, setProductStatus, onToast]);

  const addManualImage = useCallback(async (file: File) => {
    if (draft.bindSync) {
      return;
    }
    const upload = await uploadProductImage(file);
    if (!upload.ok || !upload.imageAssetId) {
      onToast(`Не удалось загрузить фото: ${upload.message}`, "error");
      return;
    }
    const imageId = `manual-${upload.imageAssetId}-${Date.now()}`;
    const objectUrl = URL.createObjectURL(file);
    setManualImageAssetIdsById((prev) => ({ ...prev, [imageId]: upload.imageAssetId as number }));
    setDraft((prev) => ({
      ...prev,
      images: [...prev.images, { id: imageId, url: objectUrl, isManual: true }],
    }));
  }, [uploadProductImage, onToast, draft.bindSync]);

  const removeImage = useCallback((imageId: string) => {
    if (draft.bindSync) {
      return;
    }
    setDraft((prev) => ({
      ...prev,
      images: prev.images.filter((image) => image.id !== imageId),
    }));
  }, [draft.bindSync]);

  const onCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const onCreateDraft = useCallback(() => {
    (async () => {
      if (isCreating) return;
      setIsCreating(true);
      const title = String(draft.title || "").trim();
      if (!title) {
        onToast("Название товара обязательно", "error");
        setIsCreating(false);
        return;
      }
      const weightRaw = Number(String(draft.weightGrams || "").replace(",", "."));
      const weight = Number.isFinite(weightRaw) && weightRaw > 0 ? weightRaw : null;
      const manualImageAssetIds = draft.images
        .map((image) => {
          const mapped = manualImageAssetIdsById[image.id];
          if (Number.isFinite(Number(mapped)) && Number(mapped) > 0) {
            return Number(mapped);
          }
          // Fallback for persisted draft ids: manual-<assetId>-<ts>
          const m = /^manual-(\d+)-/.exec(String(image.id || ""));
          if (m && Number.isFinite(Number(m[1])) && Number(m[1]) > 0) {
            return Number(m[1]);
          }
          return null;
        })
        .filter((value): value is number => Number.isFinite(Number(value)) && Number(value) > 0);
      const shouldPersistSourceImagesAsManualAssets = !draft.bindSync;
      const failedImageUploads: string[] = [];
      for (const image of draft.images) {
        const m = /^manual-(\d+)-/.exec(String(image.id || ""));
        if (m && Number(m[1]) > 0) {
          if (!manualImageAssetIds.includes(Number(m[1]))) manualImageAssetIds.push(Number(m[1]));
          continue;
        }
        if (!shouldPersistSourceImagesAsManualAssets) {
          continue;
        }
        const src = normalizeImageUrl(String(image.url || "").trim());
        if (!src) continue;
        const uploaded = await uploadProductImageByUrl(src);
        if (uploaded.ok && uploaded.imageAssetId && !manualImageAssetIds.includes(uploaded.imageAssetId)) {
          manualImageAssetIds.push(uploaded.imageAssetId);
        } else if (!uploaded.ok) {
          failedImageUploads.push(src);
        }
      }
      if (failedImageUploads.length > 0) {
        onToast(`Не удалось загрузить ${failedImageUploads.length} фото. Проверь ссылки изображений и попробуй снова.`, "error");
        setIsCreating(false);
        return;
      }
      const normalizedVariants = draft.variants
        .map((variant) => {
          const normalizedTitle = String(variant.title || "").trim();
          const normalizedPrice = parseOptionalDecimal(variant.price);
          const rawCompareAtPrice = parseOptionalDecimal(variant.compareAtPrice);
          const normalizedCurrency = normalizeManualVariantCurrency(variant.currency, "RUB");
          const normalizedCompareAtPrice = normalizedPrice !== null && rawCompareAtPrice !== null
            ? rawCompareAtPrice
            : null;
          return {
            title: normalizedTitle,
            price: normalizedPrice,
            compare_at_price: normalizedCompareAtPrice,
            available: Boolean(variant.available),
            currency: normalizedCurrency,
            pricing_mode: resolveManualVariantPricingMode(normalizedCurrency),
          };
        })
        .filter((variant) => variant.title.length > 0 && variant.price !== null);
      if (normalizedVariants.length === 0) {
        onToast("Добавь хотя бы один вариант с названием и ценой", "error");
        setIsCreating(false);
        return;
      }
      if (normalizedVariants.some((variant) => isManualVariantAmountTooLarge(variant.price))) {
        onToast(`Цена варианта слишком большая. Максимум: ${MAX_MANUAL_VARIANT_AMOUNT_LABEL}`, "error");
        setIsCreating(false);
        return;
      }
      if (normalizedVariants.some((variant) => isManualVariantAmountTooLarge(variant.compare_at_price ?? null))) {
        onToast(`Старая цена варианта слишком большая. Максимум: ${MAX_MANUAL_VARIANT_AMOUNT_LABEL}`, "error");
        setIsCreating(false);
        return;
      }
      if (normalizedVariants.some((variant) => variant.compare_at_price !== null && variant.compare_at_price !== undefined && variant.compare_at_price <= Number(variant.price))) {
        onToast("Старая цена варианта должна быть больше текущей", "error");
        setIsCreating(false);
        return;
      }

      const payload = {
        title,
        description: String(draft.description || "").trim() || null,
        designer_name: String(draft.designerName || "").trim() || null,
        source_category_name: null,
        gender: draft.gender,
        variants: normalizedVariants.map((variant) => ({
          title: variant.title,
          price: variant.price,
          compare_at_price: variant.compare_at_price,
          currency: variant.currency,
          pricing_mode: variant.pricing_mode,
          available: variant.available,
        })),
        manual_image_asset_ids: manualImageAssetIds,
        manual_weight_grams: weight,
        state: deriveProductWriteStateFromVariants(normalizedVariants, draft.availabilityMode),
        bind_sync: Boolean(
          draft.bindSync
          && boundFromSourceLookup
          && !hasExistingLookupProduct
          && sourceLookupKey
        ),
        bind_url: sourceLookupKey || null,
      };
      const opRes = mode === "edit" && editingProductId
        ? await updateManualProduct(editingProductId, payload)
        : await createManualProduct(payload);
      if (!opRes.ok || !opRes.id) {
        onToast(`Не удалось ${mode === "edit" ? "обновить" : "создать"} товар: ${opRes.message}`, "error");
        setIsCreating(false);
        return;
      }
      await _setProductStarredCategories(opRes.id, favoriteCategorySlugs);
      if (mode === "create" && onProductCreated) {
        await onProductCreated(opRes.id);
      }
      onToast(mode === "edit" ? "Товар обновлен" : "Товар создан", "success");
      setIsOpen(false);
      setIsCreating(false);
    })().catch((error) => {
      console.error("Manual product create flow failed", error);
      onToast(`Не удалось ${mode === "edit" ? "обновить" : "создать"} товар из-за внутренней ошибки интерфейса`, "error");
      setIsCreating(false);
    });
  }, [draft, manualImageAssetIdsById, createManualProduct, updateManualProduct, favoriteCategorySlugs, _setProductStarredCategories, onToast, onProductCreated, boundFromSourceLookup, sourceLookupKey, uploadProductImageByUrl, isCreating, mode, editingProductId, hasExistingLookupProduct]);

  const openCreate = useCallback(() => {
    if (lookupTimerRef.current !== null) {
      window.clearTimeout(lookupTimerRef.current);
      lookupTimerRef.current = null;
    }
    lastLookupKeyRef.current = "";
    remotePreviewInFlightRef.current = null;
    setMode("create");
    setEditingProductId(null);
    setEditingProductBoundSync(false);
    setDraft(buildInitialDraft());
    setLookup({ state: "idle", product: null, error: null });
    setHiddenProductIds(new Set());
    setStatusBeforeHide({});
    setFavoriteCategorySlugs([]);
    setBoundFromSourceLookup(false);
    setManualImageAssetIdsById({});
    setSyncBaseline(null);
    setIsHydrating(false);
    setIsCreating(false);
    setIsOpen(true);
  }, []);

  const openEditByProductId = useCallback(async (productId: number) => {
    const product = await getProductById(productId, { forceFetch: true });
    if (!product) {
      onToast("Не удалось загрузить товар для редактирования", "error");
      return;
    }
    const next = productToDraft(product);
    setMode("edit");
    setEditingProductId(productId);
    const isBoundSync = Array.isArray(product.listings)
      ? product.listings.some((listing) => String(listing.ingest_mode || "").trim().toLowerCase() === "sync")
      : false;
    const syncListingUrl = Array.isArray(product.listings)
      ? (
          product.listings.find((listing) => String(listing.ingest_mode || "").trim().toLowerCase() === "sync")?.url
          || ""
        )
      : "";
    setEditingProductBoundSync(isBoundSync);
    setDraft((prev) => ({
      ...prev,
      sourceUrl: isBoundSync ? String(syncListingUrl || "").trim() : "",
      ...next,
      bindSync: isBoundSync ? true : false,
    }));
    setSyncBaseline({
      images: (next.images || []).map((item) => ({ ...item })),
      variants: (next.variants || []).map((item) => ({ ...item })),
    });
    setLookup({ state: "idle", product: null, error: null });
    setHiddenProductIds(new Set());
    setStatusBeforeHide({});
    setBoundFromSourceLookup(isBoundSync);
    setFavoriteCategorySlugs(
      Array.isArray(product.custom_catalog_slugs)
        ? product.custom_catalog_slugs.map((x) => String(x || "").trim()).filter(Boolean)
        : [],
    );
    setIsOpen(true);
  }, [getProductById, onToast]);

  useEffect(() => {
    if (!isOpen) return;
    void (async () => {
      const res = await getStarredCategoryOptions();
      if (res.ok) {
        setFavoriteCategoryOptions(res.items.map((item) => ({ slug: String(item.slug), name: String(item.name) })));
      }
    })();
  }, [isOpen, getStarredCategoryOptions]);

  const resetOnReload = useCallback(() => {
    setDraft(buildInitialDraft());
    setLookup({ state: "idle", product: null, error: null });
    setHiddenProductIds(new Set());
    setStatusBeforeHide({});
    setFavoriteCategorySlugs([]);
    setBoundFromSourceLookup(false);
    setManualImageAssetIdsById({});
    setSyncBaseline(null);
    setIsHydrating(false);
    setIsOpen(false);
    setMode("create");
    setEditingProductId(null);
    setEditingProductBoundSync(false);
  }, []);

  return {
    isOpen,
    setIsOpen,
    mode,
    editingProductBoundSync,
    draft,
    setDraftField,
    lookup,
    sourceDomainError,
    matchedSourceDomain,
    canRunLookup,
    hasFoundProduct,
    isHydrating,
    isCreating,
    hiddenProductIds,
    knownDesignerOptions,
    favoriteCategoryOptions,
    favoriteCategorySlugs,
    setFavoriteCategorySlugs,
    boundFromSourceLookup,
    hydrateFromSourceUrl,
    hydrateFromExistingProduct,
    hideExistingProduct,
    addManualImage,
    removeImage,
    onCancel,
    onCreateDraft,
    openCreate,
    openEditByProductId,
    resetOnReload,
  };
}
