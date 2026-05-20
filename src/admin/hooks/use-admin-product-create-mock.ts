import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProductStarredCategoryOption, ProductUrlPreview, ServiceProduct, Source } from "../../shared/live-data-types";

export type ProductCreateStatus = "available" | "out_of_stock" | "hidden";

export type ProductCreateImage = {
  id: string;
  url: string;
  isManual: boolean;
};
export type ProductCreateVariant = {
  id: string;
  title: string;
  price: string;
  currency: "USD" | "EUR" | "GBP" | "JPY";
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
  favorite: boolean;
  bindSync: boolean;
  brand: string;
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
  previewProductByUrl: (url: string) => Promise<{ ok: boolean; message: string; preview: ProductUrlPreview | null }>;
  createManualProduct: (payload: {
    title: string;
    description?: string | null;
    vendor?: string | null;
    currency: string;
    product_type: string | null;
    variants: Array<{ title: string; price: number | null; available: boolean }>;
    manual_image_asset_ids: number[];
    weight_grams?: number | null;
    status?: ProductCreateStatus;
    bind_sync?: boolean;
    bind_source_id?: number | null;
    bind_source_product_url?: string | null;
  }) => Promise<{ ok: boolean; message: string; id: number | null }>;
  updateManualProduct: (productId: number, payload: {
    title: string;
    description?: string | null;
    vendor?: string | null;
    currency: string;
    product_type: string | null;
    variants: Array<{ title: string; price: number | null; available: boolean }>;
    manual_image_asset_ids: number[];
    weight_grams?: number | null;
    status?: ProductCreateStatus;
    bind_sync?: boolean;
    bind_source_id?: number | null;
    bind_source_product_url?: string | null;
  }) => Promise<{ ok: boolean; message: string; id: number | null }>;
  uploadProductImage: (file: File) => Promise<{ ok: boolean; message: string; imageAssetId: number | null }>;
  uploadProductImageByUrl: (url: string) => Promise<{ ok: boolean; message: string; imageAssetId: number | null }>;
  setProductStatus: (productId: number, status: ProductCreateStatus) => Promise<{ ok: boolean; message: string }>;
  getProductById: (id: number, opts?: { forceFetch?: boolean }) => Promise<ServiceProduct | null>;
  getProductStarredCategories: (productId: number) => Promise<{ ok: boolean; message: string; assignedCategoryIds: number[]; availableCategories: ProductStarredCategoryOption[] }>;
  setProductStarredCategories: (productId: number, categoryIds: number[]) => Promise<{ ok: boolean; message: string; assignedCategoryIds: number[] }>;
  getStarredCategoryOptions: () => Promise<{ ok: boolean; items: Array<{ id: number; name: string; slug: string }> }>;
};

const INITIAL_DRAFT: ProductCreateDraft = {
  sourceUrl: "",
  title: "",
  description: "",
  weightGrams: "",
  favorite: false,
  bindSync: false,
  brand: "",
  images: [],
  variants: [{ id: `v-${Date.now()}`, title: "Default", price: "", currency: "USD", available: true }],
};

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

function deriveSellerMode(source: Source): "Авто" | "Ручной" {
  return source.is_auto_ingest === false ? "Ручной" : "Авто";
}

function makeMockImages(seed: string, amount = 4): ProductCreateImage[] {
  return Array.from({ length: amount }).map((_, idx) => ({
    id: `mock-${seed}-${idx + 1}`,
    url: `https://picsum.photos/seed/${encodeURIComponent(`${seed}-${idx + 1}`)}/640/800`,
    isManual: false,
  }));
}

function productToDraft(product: ServiceProduct): Omit<ProductCreateDraft, "sourceUrl"> {
  const rawCurrency = String(product.currency || "").toUpperCase();
  const currency: ProductCreateVariant["currency"] =
    rawCurrency === "EUR" || rawCurrency === "GBP" || rawCurrency === "JPY" ? rawCurrency : "USD";
  const mappedVariants: ProductCreateVariant[] = Array.isArray(product.variants) && product.variants.length > 0
    ? product.variants.map((variant, idx) => {
        const vCurrencyRaw = String((variant as { currency?: unknown }).currency || rawCurrency || "USD").toUpperCase();
        const vCurrency: ProductCreateVariant["currency"] =
          vCurrencyRaw === "EUR" || vCurrencyRaw === "GBP" || vCurrencyRaw === "JPY" ? vCurrencyRaw : "USD";
        return {
          id: `pv-${product.id}-${idx + 1}`,
          title: String(variant.title || "").trim() || `Вариант ${idx + 1}`,
          price: variant.price === null || variant.price === undefined ? "" : String(variant.price),
          currency: vCurrency,
          available: Boolean(variant.available),
        };
      })
    : [
        {
          id: `pv-${product.id}`,
          title: "Default",
          price: product.price === null || product.price === undefined ? "" : String(product.price),
          currency,
          available: String(product.status || "") !== "out_of_stock",
        },
      ];
  return {
    title: String(product.title || "").trim(),
    description: String(product.description || "").trim(),
    weightGrams:
      product.weight_grams === null || product.weight_grams === undefined
        ? ""
        : String(product.weight_grams),
    favorite: Boolean(product.is_favorite),
    brand: String(product.vendor_display || product.vendor_mapped || product.vendor || "").trim(),
    status:
      String(product.status || "").trim() === "out_of_stock"
        ? "out_of_stock"
        : String(product.status || "").trim() === "hidden"
          ? "hidden"
          : "available",
    images: (product.image_urls || []).map((url, idx) => ({
      id: `db-${product.id}-${idx + 1}`,
      url: String(url),
      isManual: false,
    })),
    variants: mappedVariants,
  };
}

export function useAdminProductCreateMock({
  sources,
  products,
  onToast,
  previewProductByUrl,
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
  const [draft, setDraft] = useState<ProductCreateDraft>(INITIAL_DRAFT);
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
  const [statusBeforeHide, setStatusBeforeHide] = useState<Record<number, ProductCreateStatus>>({});
  const [favoriteCategoryOptions, setFavoriteCategoryOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [favoriteCategoryIds, setFavoriteCategoryIds] = useState<number[]>([]);
  const [boundFromSourceLookup, setBoundFromSourceLookup] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const lookupTimerRef = useRef<number | null>(null);

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

  const knownBrandOptions = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      const value = String(product.vendor_display || product.vendor_mapped || product.vendor || "").trim();
      if (value) set.add(value);
    }
    return Array.from(set.values()).sort((left, right) => left.localeCompare(right, "ru"));
  }, [products]);

  const canRunLookup = Boolean(draft.sourceUrl.trim()) && !sourceDomainError;
  const sourceLookupKey = useMemo(() => normalizeUrlLoose(draft.sourceUrl), [draft.sourceUrl]);
  const hasFoundProduct = lookup.state === "found" && Boolean(lookup.product);

  useEffect(() => {
    if (lookupTimerRef.current !== null) {
      window.clearTimeout(lookupTimerRef.current);
      lookupTimerRef.current = null;
    }
    if (!canRunLookup) {
      setLookup({ state: draft.sourceUrl.trim() ? "idle" : "idle", product: null, error: null });
      setBoundFromSourceLookup(false);
      return;
    }
    if (lookup.state === "found" && lookup.product && normalizeUrlLoose(lookup.product.url) === sourceLookupKey) {
      return;
    }

    setLookup({ state: "loading", product: null, error: null });
    lookupTimerRef.current = window.setTimeout(() => {
      void (async () => {
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
          setLookup({ state: "found", product: localFound, error: null });
          return;
        }
        const remote = await previewProductByUrl(sourceLookupKey);
        if (!remote.ok || !remote.preview) {
          setLookup({ state: "not_found", product: null, error: null });
          return;
        }
        const p = remote.preview;
        const synthetic: ServiceProduct = {
          id: Number(p.id || 0),
          source_id: Number(p.source_id || 0),
          handle: String(p.handle || ""),
          title: String(p.title || ""),
          description: String(p.description || ""),
          source_name: String(p.source_name || ""),
          weight_grams: p.weight_grams ?? null,
          vendor: p.vendor ?? null,
          url: String(p.product_url || sourceLookupKey),
          product_type: p.product_type ?? null,
          price: p.price ?? null,
          currency: String(p.currency || "USD"),
          status: String(p.status || "available"),
          image_count: Array.isArray(p.image_urls) ? p.image_urls.length : 0,
          image_urls: Array.isArray(p.image_urls) ? p.image_urls.map((x) => String(x)) : [],
          variants: Array.isArray(p.variants) ? p.variants : [],
          created_at: "",
          updated_at: "",
        };
        setLookup({ state: "found", product: synthetic, error: null });
      })();
    }, 720);

    return () => {
      if (lookupTimerRef.current !== null) {
        window.clearTimeout(lookupTimerRef.current);
        lookupTimerRef.current = null;
      }
    };
  }, [sourceLookupKey, canRunLookup, products, previewProductByUrl, draft.sourceUrl, lookup.state, lookup.product]);

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

  const hydrateFromSourceUrl = useCallback(async () => {
    if (!canRunLookup || isHydrating) return;
    setIsHydrating(true);
    try {
      const result = await previewProductByUrl(sourceLookupKey);
      if (!result.ok || !result.preview) {
        onToast(`Не удалось выгрузить товар: ${result.message}`, "error");
        return;
      }
      const preview = result.preview;
      const previewVariants: ProductCreateVariant[] =
        Array.isArray(preview.variants) && preview.variants.length > 0
          ? preview.variants.map((variant, idx) => {
              const raw = String((variant as { currency?: unknown }).currency || preview.currency || "USD").toUpperCase();
              const currency: ProductCreateVariant["currency"] =
                raw === "EUR" || raw === "GBP" || raw === "JPY" ? raw : "USD";
              return {
                id: `v-${Date.now()}-${idx + 1}`,
                title: String(variant.title || "").trim() || `Вариант ${idx + 1}`,
                price: variant.price === null || variant.price === undefined ? "" : String(variant.price),
                currency,
                available: Boolean(variant.available),
              };
            })
          : [
              {
                id: `v-${Date.now()}`,
                title: String(preview.title || "").trim() || "Default",
                price: preview.price === null || preview.price === undefined ? "" : String(preview.price),
                currency: (["USD", "EUR", "GBP", "JPY"].includes(String(preview.currency || "").toUpperCase())
                  ? String(preview.currency || "").toUpperCase()
                  : "USD") as ProductCreateVariant["currency"],
                available: true,
              },
            ];
      setDraft((prev) => ({
        ...prev,
        title: String(preview.title || "").trim() || prev.title || slugToTitle(sourceLookupKey),
        description: String(preview.description || "").trim() || prev.description,
        brand: String(preview.vendor || "").trim() || prev.brand,
        weightGrams: preview.weight_grams === null || preview.weight_grams === undefined ? prev.weightGrams : String(preview.weight_grams),
        variants: previewVariants,
        images: (preview.image_urls || []).map((url, idx) => ({
          id: `preview-${Date.now()}-${idx + 1}`,
          url: String(url),
          isManual: false,
        })),
      }));
      setSyncBaseline({
        images: (preview.image_urls || []).map((url, idx) => ({
          id: `preview-baseline-${Date.now()}-${idx + 1}`,
          url: String(url),
          isManual: false,
        })),
        variants: previewVariants.map((item) => ({ ...item })),
      });
      setBoundFromSourceLookup(true);
      onToast("Данные товара выгружены из ссылки", "success");
    } finally {
      setIsHydrating(false);
    }
  }, [canRunLookup, isHydrating, previewProductByUrl, sourceLookupKey, onToast]);

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

  const hideExistingProductMock = useCallback(async () => {
    if (!lookup.product) return;
    const currentStatus = String(lookup.product.status || "").trim().toLowerCase();
    const productId = lookup.product.id;
    const fallbackRestore: ProductCreateStatus =
      currentStatus === "out_of_stock" ? "out_of_stock" : "available";
    const restoreStatus = statusBeforeHide[productId] || fallbackRestore;
    const nextStatus: ProductCreateStatus = currentStatus === "hidden" ? restoreStatus : "hidden";
    const result = await setProductStatus(lookup.product.id, nextStatus);
    if (!result.ok) {
      onToast(`Не удалось изменить статус: ${result.message}`, "error");
      return;
    }
    setHiddenProductIds((prev) => {
      const next = new Set(prev);
      if (nextStatus === "hidden") next.add(lookup.product!.id);
      else next.delete(lookup.product!.id);
      return next;
    });
    setStatusBeforeHide((prev) => {
      if (nextStatus === "hidden") {
        const remembered: ProductCreateStatus =
          currentStatus === "out_of_stock" ? "out_of_stock" : "available";
        return { ...prev, [productId]: remembered };
      }
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    onToast(nextStatus === "hidden" ? "Товар скрыт" : "Товар открыт", "success");
  }, [lookup.product, statusBeforeHide, setProductStatus, onToast]);

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

  const onCreateMock = useCallback(() => {
    void (async () => {
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
      // Ensure ALL images become backend-stored assets (manual or hydrated/external).
      for (const image of draft.images) {
        const m = /^manual-(\d+)-/.exec(String(image.id || ""));
        if (m && Number(m[1]) > 0) {
          if (!manualImageAssetIds.includes(Number(m[1]))) manualImageAssetIds.push(Number(m[1]));
          continue;
        }
        const src = String(image.url || "").trim();
        if (!src) continue;
        const uploaded = await uploadProductImageByUrl(src);
        if (uploaded.ok && uploaded.imageAssetId && !manualImageAssetIds.includes(uploaded.imageAssetId)) {
          manualImageAssetIds.push(uploaded.imageAssetId);
        }
      }
      const normalizedVariants = draft.variants
        .map((variant) => {
          const normalizedTitle = String(variant.title || "").trim();
          const rawPrice = Number(String(variant.price || "").replace(",", "."));
          const normalizedPrice = Number.isFinite(rawPrice) ? rawPrice : null;
          return {
            title: normalizedTitle,
            price: normalizedPrice,
            available: Boolean(variant.available),
            currency: variant.currency,
          };
        })
        .filter((variant) => variant.title.length > 0 && variant.price !== null);
      if (normalizedVariants.length === 0) {
        onToast("Добавь хотя бы один вариант с названием и ценой", "error");
        setIsCreating(false);
        return;
      }

      const payload = {
        title,
        description: String(draft.description || "").trim() || null,
        vendor: String(draft.brand || "").trim() || null,
        currency: normalizedVariants[0].currency,
        product_type: null,
        variants: normalizedVariants.map((variant) => ({
          title: variant.title,
          price: variant.price,
          available: variant.available,
        })),
        manual_image_asset_ids: manualImageAssetIds,
        weight_grams: weight,
        status: normalizedVariants.some((variant) => Boolean(variant.available)) ? "available" : "out_of_stock",
        bind_sync: Boolean(draft.bindSync && boundFromSourceLookup && lookup.product?.source_id && lookup.product?.url),
        bind_source_id: lookup.product?.source_id ?? null,
        bind_source_product_url: lookup.product?.url ?? null,
      };
      const opRes = mode === "edit" && editingProductId
        ? await updateManualProduct(editingProductId, payload)
        : await createManualProduct(payload);
      if (!opRes.ok || !opRes.id) {
        onToast(`Не удалось ${mode === "edit" ? "обновить" : "создать"} товар: ${opRes.message}`, "error");
        setIsCreating(false);
        return;
      }
      if (favoriteCategoryIds.length > 0) {
        await _setProductStarredCategories(opRes.id, favoriteCategoryIds);
      }
      onToast(mode === "edit" ? "Товар обновлен" : "Товар создан", "success");
      setIsOpen(false);
      setIsCreating(false);
    })().catch(() => {
      setIsCreating(false);
    })();
  }, [draft, manualImageAssetIdsById, createManualProduct, updateManualProduct, favoriteCategoryIds, _setProductStarredCategories, onToast, boundFromSourceLookup, lookup.product, uploadProductImageByUrl, isCreating, mode, editingProductId]);

  const openCreate = useCallback(() => {
    setMode("create");
    setEditingProductId(null);
    setEditingProductBoundSync(false);
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
    const isBoundSync = !String(product.url || "").startsWith("manual://");
    setEditingProductBoundSync(isBoundSync);
    setDraft((prev) => ({
      ...prev,
      sourceUrl: isBoundSync ? String(product.url || "") : "",
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
    setFavoriteCategoryIds(Array.isArray(product.starred_category_ids) ? product.starred_category_ids.map((x) => Number(x)).filter((x) => Number.isFinite(x)) : []);
    setIsOpen(true);
  }, [getProductById, onToast]);

  useEffect(() => {
    if (!isOpen) return;
    void (async () => {
      const res = await getStarredCategoryOptions();
      if (res.ok) {
        setFavoriteCategoryOptions(res.items.map((item) => ({ id: Number(item.id), name: String(item.name) })));
      }
    })();
  }, [isOpen, getStarredCategoryOptions]);

  const resetOnReload = useCallback(() => {
    setDraft(INITIAL_DRAFT);
    setLookup({ state: "idle", product: null, error: null });
    setHiddenProductIds(new Set());
    setStatusBeforeHide({});
    setFavoriteCategoryIds([]);
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
    knownBrandOptions,
    favoriteCategoryOptions,
    favoriteCategoryIds,
    setFavoriteCategoryIds,
    boundFromSourceLookup,
    hydrateFromSourceUrl,
    hydrateFromExistingProduct,
    hideExistingProductMock,
    addManualImage,
    removeImage,
    onCancel,
    onCreateMock,
    openCreate,
    openEditByProductId,
    resetOnReload,
  };
}
