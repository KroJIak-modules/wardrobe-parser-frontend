import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { fetchAdminDesignerMappings } from "./admin-designers-api";
import { buildPricingExampleView } from "./admin-pricing-view-model";
import { formatDisplayMoney, renderLegendSymbol } from "./admin-formatters";
import { toExternalHttpUrl } from "../shared/external-links";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { LatexBrand } from "../shared/latex-brand";
import { IconChevronLeft, IconChevronRight, IconExternalLink, IconEye, IconEyeOff, IconPlus } from "../shared/mono-icons";
import { getProductPrimaryImageUrl } from "../shared/product-image";
import { getProductSourceLabel } from "../shared/product-source-label";
import { ProductPageSkeleton } from "../shared/skeleton";
import { useLiveData } from "../shared/live-data-context";
import { ToastStack } from "../shared/toast-stack";
import { EmptyState } from "../shared/empty-state";
import { buildProductPriceDisplay, getProductPriceSummary, withPriceRangePrefix } from "../shared/product-pricing";
import { useToasts } from "../shared/use-toasts";
import { useShowcaseEditPermission } from "../shared/use-showcase-edit-permission";
import { getAdminProductsReturnHref } from "./admin-products-return-state";
import { FloatingPopover } from "./floating-popover";
import {
  buildHiddenProductWriteState,
  canSwitchAvailabilityToInStock,
  getAvailabilityModeLockedReason,
} from "../shared/product-state";
import type { ServiceProduct } from "../shared/live-data-types";
import { deriveStatusAfterUnhide } from "./showcase-catalog-helpers";
import { Eye, EyeOff, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import "./admin-action-popover.css";
import "./showcase-product-page.css";

type VariantInfo = {
  title: string;
  available: boolean;
  inventory_quantity: number;
  price?: string | number | null;
  compare_at_price?: string | number | null;
  currency?: string | null;
  final_price?: number | null;
  final_currency?: string | null;
  final_compare_at_price?: number | null;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
};

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatMoney(value: number | null | undefined, currency: string | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }
  const amount = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${amount} ${currency || ""}`.trim();
}

function buildVariantLabel(variant: VariantInfo): string {
  const options = [variant.option1, variant.option2, variant.option3].filter(Boolean).map((item) => String(item));
  if (options.length > 0) {
    return options.join(" / ");
  }
  return variant.title || "Вариант";
}

function unavailableReasonRu(reason: string | null | undefined): string | null {
  const normalized = String(reason || "").trim().toLowerCase();
  if (!normalized) {
    return "Причина недоступности не указана";
  }
  if (normalized === "missing_weight") {
    return "Не указан вес товара";
  }
  if (normalized === "missing_images") {
    return "У товара нет ни одной фотографии";
  }
  if (normalized === "missing_source_price") {
    return "У товара не указана цена";
  }
  if (normalized === "missing_final_price") {
    return "Не удалось рассчитать итоговую цену";
  }
  if (normalized === "missing_currency") {
    return "Не указана валюта товара";
  }
  if (normalized === "unsupported_currency") {
    return "У товара указана неподдерживаемая валюта";
  }
  if (normalized === "invalid_fx_settings") {
    return "Не настроен курс валют для расчета цены";
  }
  if (normalized === "source_removed") {
    return "Товар больше не найден в источнике";
  }
  if (normalized === "missing_variants") {
    return "У товара нет доступных вариантов";
  }
  if (normalized === "product_not_found") {
    return "Товар не найден";
  }
  if (normalized === "dedup_combined_source") {
    return "Товар отключен после объединения дубликатов";
  }
  if (normalized === "dedup_hidden_by_keep") {
    return "Товар отключен решением оставить другой дубль";
  }
  return `Техническая причина: ${normalized}`;
}

function toThumbUrl(url: string): string {
  return url;
}

type ImageEditState = {
  description_visible_effective?: boolean;
  description_visible_override?: boolean | null;
  hidden_source_image_urls: string[];
  manual_image_urls: string[];
  manual_image_order: string[];
  source_image_urls: string[];
};

type VariantDraft = {
  id: string;
  title: string;
  price: string;
  compareAtPrice: string;
  currency: string;
  available: boolean;
};

function buildVariantDrafts(product: ServiceProduct | null): VariantDraft[] {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const fallbackCurrency = String(product?.price_summary?.source_currency || "RUB").trim().toUpperCase() || "RUB";
  const draftVariants = variants.map((variant, index) => {
    const rawCurrency = String((variant as { currency?: unknown }).currency || fallbackCurrency).trim().toUpperCase();
    return {
      id: `variant-${index}-${String((variant as { source_ref_id?: unknown }).source_ref_id || (variant as { title?: unknown }).title || index)}`,
      title: String(variant.title || "").trim() || `Вариант ${index + 1}`,
      price: variant.price === null || variant.price === undefined ? "" : String(variant.price),
      compareAtPrice: variant.compare_at_price === null || variant.compare_at_price === undefined ? "" : String(variant.compare_at_price),
      currency: rawCurrency || fallbackCurrency,
      available: Boolean(variant.available),
    };
  });
  if (draftVariants.length > 0) {
    return draftVariants;
  }
  return [{
    id: "variant-0",
    title: "",
    price: "",
    compareAtPrice: "",
    currency: fallbackCurrency,
    available: true,
  }];
}

function deriveDescriptionVisibleDraft(product: ServiceProduct | null): boolean {
  if (!product) {
    return true;
  }
  if (typeof product.presentation?.description_visibility === "boolean") {
    return product.presentation.description_visibility;
  }
  return String(product.description_mode || "text").trim().toLowerCase() !== "hidden";
}

export function ShowcaseProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    getProductById,
    setProductStatus,
    pricingSettings,
    ensurePricingLoaded,
    updateProductOverrides,
    updateManualProductVariants,
    uploadProductImage,
    deleteProduct,
  } = useLiveData();
  const navigationState = location.state as {
    openEditMode?: boolean;
    adminReturnHref?: string;
    fromControlPanel?: boolean;
  } | null;
  const openEditModeFromState = Boolean(navigationState?.openEditMode);
  // Control panel origin: explicit state, legacy ?from=admin, or stored products return href.
  const fromControlPanel =
    Boolean(navigationState?.fromControlPanel) ||
    searchParams.get("from") === "admin" ||
    Boolean(navigationState?.adminReturnHref);
  const adminBackHref =
    String(navigationState?.adminReturnHref || getAdminProductsReturnHref() || "/control/products").trim() ||
    "/control/products";
  const canEdit = useShowcaseEditPermission();

  const productId = Number(id);
  const [product, setProduct] = useState<Awaited<ReturnType<typeof getProductById>>>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toasts, pushToast, closeToast } = useToasts();
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
  const [statusPending, setStatusPending] = useState<boolean>(false);
  const [deletePending, setDeletePending] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [legendExpanded, setLegendExpanded] = useState<boolean>(false);
  const [detailsEditMode, setDetailsEditMode] = useState<boolean>(() => fromControlPanel && openEditModeFromState);
  const [titleDraft, setTitleDraft] = useState<string>("");
  const [descriptionTextDraft, setDescriptionTextDraft] = useState<string>("");
  const [descriptionHtmlDraft, setDescriptionHtmlDraft] = useState<string>("");
  const [descriptionVisibleDraft, setDescriptionVisibleDraft] = useState<boolean>(true);
  const [brandDraft, setBrandDraft] = useState<string>("");
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [brandComboboxOpen, setBrandComboboxOpen] = useState<boolean>(false);
  const [genderDraft, setGenderDraft] = useState<"male" | "female" | "unisex">("unisex");
  const [availabilityModeDraft, setAvailabilityModeDraft] = useState<"in_stock" | "by_order">("in_stock");
  const [manualWeightDraft, setManualWeightDraft] = useState<string>("");
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([]);
  const [manualGalleryListingId, setManualGalleryListingId] = useState<number | null>(null);
  const [detailsSaving, setDetailsSaving] = useState<boolean>(false);
  const [draggingToken, setDraggingToken] = useState<string | null>(null);
  const imageUploadInputRef = useRef<HTMLInputElement | null>(null);
  const deleteAnchorRef = useRef<HTMLButtonElement | null>(null);
  const coreSaveTimerRef = useRef<number | null>(null);
  const coreSaveChainRef = useRef<Promise<void>>(Promise.resolve());
  const brandSaveChainRef = useRef<Promise<void>>(Promise.resolve());
  const lastSavedCoreRef = useRef<string>("");
  const inFlightCoreSnapshotRef = useRef<string | null>(null);
  const lastSavedBrandRef = useRef<string>("");
  const detailsEditSessionRef = useRef<number>(0);
  const brandCloseTimerRef = useRef<number | null>(null);
  const brandSaveTimerRef = useRef<number | null>(null);
  const brandOptionsLoadedRef = useRef<boolean>(false);
  const autoOpenedEditLocationKeyRef = useRef<string | null>(null);

  const reloadFullProduct = async () => {
    if (!Number.isFinite(productId) || productId <= 0) {
      return null;
    }
    const refreshed = await getProductById(productId, { forceFetch: true });
    if (refreshed) {
      setProduct(refreshed);
      setError(null);
      return refreshed;
    }
    setProduct(null);
    setError(`Товар #${productId} не найден`);
    return null;
  };

  useEffect(() => {
    let aborted = false;
    const run = async () => {
      if (!Number.isFinite(productId) || productId <= 0) {
        setProduct(null);
        setError("Некорректный ID товара");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const fetched = await getProductById(productId, { forceFetch: true });
      if (aborted) {
        return;
      }
      if (fetched) {
        setProduct(fetched);
        setError(null);
      } else {
        setProduct(null);
        setError(`Товар #${productId} не найден`);
      }
      setLoading(false);
    };
    void run();
    return () => {
      aborted = true;
    };
  }, [productId, getProductById]);

  useEffect(() => {
    void ensurePricingLoaded();
  }, [ensurePricingLoaded]);

  useEffect(() => {
    if (!fromControlPanel || !openEditModeFromState) {
      return;
    }
    if (autoOpenedEditLocationKeyRef.current === location.key) {
      return;
    }
    autoOpenedEditLocationKeyRef.current = location.key;
    setDetailsEditMode(true);
  }, [fromControlPanel, location.key, openEditModeFromState]);

  useEffect(() => {
    if (error) {
      pushToast(error);
    }
  }, [error, pushToast]);

  useEffect(() => {
    setTitleDraft(String(product?.title || ""));
    setBrandDraft(String(product?.brand_name || product?.presentation?.brand_override_name || product?.source_designer_name || "").trim());
    setDescriptionTextDraft(String(product?.description_text || product?.description || ""));
    setDescriptionHtmlDraft(String(product?.description_html || ""));
    setDescriptionVisibleDraft(deriveDescriptionVisibleDraft(product));
    setGenderDraft(
      String(product?.gender || "").trim().toLowerCase() === "female"
        ? "female"
        : String(product?.gender || "").trim().toLowerCase() === "male"
          ? "male"
          : "unisex"
    );
    setAvailabilityModeDraft(String(product?.availability_mode || "").trim().toLowerCase() === "by_order" ? "by_order" : "in_stock");
    setManualWeightDraft(
      product?.manual_weight_grams === null || product?.manual_weight_grams === undefined
        ? ""
        : String(product.manual_weight_grams)
    );
    setManualGalleryListingId(
      product?.primary_listing_id
      ?? product?.listings?.[0]?.id
      ?? null
    );
  }, [
    product?.id,
    product?.title,
    product?.brand_name,
    product?.presentation?.brand_override_name,
    product?.source_designer_name,
    product?.description,
    product?.description_text,
    product?.description_html,
    product?.gender,
    product?.availability_mode,
    product?.manual_weight_grams,
    product?.primary_listing_id,
    product?.listings,
    product?.presentation?.description_visibility,
    product?.description_mode,
  ]);

  useEffect(() => {
    setVariantDrafts(buildVariantDrafts(product));
  }, [product?.id]);

  useEffect(() => {
    setDetailsEditMode(fromControlPanel && openEditModeFromState);
  }, [fromControlPanel, openEditModeFromState, product?.id]);

  useEffect(() => {
    if (!detailsEditMode) {
      setBrandComboboxOpen(false);
      return;
    }
    if (brandOptionsLoadedRef.current || brandOptions.length > 0) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const payload = await fetchAdminDesignerMappings();
        if (cancelled) {
          return;
        }
        const options = new Set<string>();
        for (const row of payload.rows || []) {
          const sourceBrand = String(row.source_brand || "").trim();
          const designerName = String(row.designer_name || "").trim();
          if (sourceBrand) {
            options.add(sourceBrand);
          }
          if (designerName) {
            options.add(designerName);
          }
        }
        for (const designer of payload.designers || []) {
          const name = String(designer.name || "").trim();
          if (name) {
            options.add(name);
          }
        }
        const nextOptions = Array.from(options.values()).sort((left, right) => left.localeCompare(right, "ru", { numeric: true, sensitivity: "variant" }));
        setBrandOptions(nextOptions);
        brandOptionsLoadedRef.current = true;
      } catch {
        brandOptionsLoadedRef.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detailsEditMode]);

  useEffect(() => {
    detailsEditSessionRef.current += 1;
  }, [detailsEditMode]);

  useEffect(() => {
    lastSavedCoreRef.current = JSON.stringify({
      title: String(product?.presentation?.title_override || product?.title || ""),
      descriptionText: String(product?.presentation?.description_text || product?.description_text || product?.description || ""),
      descriptionHtml: String(product?.presentation?.description_html || product?.description_html || ""),
      descriptionVisible: deriveDescriptionVisibleDraft(product),
      gender: String(product?.gender || "unisex"),
      availabilityMode: String(product?.availability_mode || "in_stock"),
      manualWeightGrams: product?.manual_weight_grams ?? null,
    });
    lastSavedBrandRef.current = JSON.stringify({
      brandOverrideName: String(product?.presentation?.brand_override_name || "").trim() || null,
    });
  }, [
    product?.id,
    product?.title,
    product?.presentation?.title_override,
    product?.presentation?.brand_override_name,
    product?.description_text,
    product?.description,
    product?.presentation?.description_text,
    product?.description_html,
    product?.presentation?.description_html,
    product?.presentation?.description_visibility,
    product?.description_mode,
    product?.gender,
    product?.availability_mode,
    product?.manual_weight_grams,
  ]);

  useEffect(() => {
    return () => {
      if (coreSaveTimerRef.current !== null) {
        window.clearTimeout(coreSaveTimerRef.current);
      }
      if (brandCloseTimerRef.current !== null) {
        window.clearTimeout(brandCloseTimerRef.current);
      }
      if (brandSaveTimerRef.current !== null) {
        window.clearTimeout(brandSaveTimerRef.current);
      }
    };
  }, []);

  const selectedVariantListingId = useMemo(() => {
    const listingId = selectedVariantIndex !== null
      && Array.isArray(product?.variants)
      && product.variants[selectedVariantIndex]
      ? (product.variants[selectedVariantIndex] as { listing_id?: number | null }).listing_id
      : null;
    return listingId === null || listingId === undefined ? null : Number(listingId);
  }, [product?.variants, selectedVariantIndex]);

  const activeGalleryListing = useMemo(() => {
    const listings = Array.isArray(product?.listings) ? product.listings : [];
    const targetListingId = manualGalleryListingId ?? selectedVariantListingId ?? product?.primary_listing_id ?? listings[0]?.id ?? null;
    return listings.find((listing) => Number(listing.id) === Number(targetListingId)) || listings[0] || null;
  }, [manualGalleryListingId, product?.listings, product?.primary_listing_id, selectedVariantListingId]);

  const imageEdit = useMemo<ImageEditState>(() => {
    const fallbackSourceUrls = Array.isArray(activeGalleryListing?.image_urls)
      ? activeGalleryListing.image_urls.map((x) => String(x || "").trim()).filter(Boolean)
      : Array.isArray(product?.image_urls)
        ? product.image_urls.map((x) => String(x || "").trim()).filter(Boolean)
        : [];
    const raw = activeGalleryListing?.gallery || product?.gallery;
    const rawSourceUrls = Array.isArray(raw?.source_image_urls) ? raw.source_image_urls.map((x) => String(x || "").trim()).filter(Boolean) : [];
    const hasExplicitGalleryState = Boolean(raw);
    return {
      description_visible_effective: typeof product?.description_public_visible === "boolean" ? product.description_public_visible : undefined,
      description_visible_override: typeof product?.presentation?.description_visibility === "boolean" ? product.presentation.description_visibility : null,
      hidden_source_image_urls: Array.isArray(raw?.hidden_source_image_urls) ? raw.hidden_source_image_urls.map((x) => String(x || "").trim()).filter(Boolean) : [],
      manual_image_urls: Array.isArray(raw?.manual_image_urls) ? raw.manual_image_urls.map((x) => String(x || "").trim()).filter(Boolean) : [],
      manual_image_order: Array.isArray(raw?.manual_image_order) ? raw.manual_image_order.map((x) => String(x)) : [],
      source_image_urls: rawSourceUrls.length > 0 ? rawSourceUrls : (hasExplicitGalleryState ? [] : fallbackSourceUrls),
    };
  }, [
    activeGalleryListing?.gallery,
    activeGalleryListing?.image_urls,
    product?.gallery,
    product?.presentation?.description_visibility,
    product?.description_public_visible,
    product?.image_urls,
  ]);

  const images = useMemo(() => {
    if (!product) {
      return [] as string[];
    }
    const direct = (product.image_urls || []).map((url) => String(url || "").trim()).filter(Boolean);
    if (direct.length > 0) {
      return direct;
    }
    const fallback = getProductPrimaryImageUrl(product);
    return fallback ? [fallback] : [];
  }, [product]);

  useEffect(() => {
    const editableLength = imageEdit.source_image_urls.length + imageEdit.manual_image_urls.length;
    const imagesLength = canEdit ? editableLength : images.length;
    if (activeImageIndex > Math.max(0, imagesLength - 1)) {
      setActiveImageIndex(0);
    }
  }, [canEdit, imageEdit.source_image_urls.length, imageEdit.manual_image_urls.length, images.length, activeImageIndex]);

  const sourceName = product
    ? getProductSourceLabel({
        sourceName: activeGalleryListing?.source_name || product.source_name,
        sourceMode: product.source_mode,
        emptyLabel: "—",
      })
    : null;
  const priceSummary = product ? getProductPriceSummary(product) : null;
  const selectedVariant = (
    selectedVariantIndex !== null
      && Array.isArray(product?.variants)
      && product.variants[selectedVariantIndex]
  ) ? (product.variants[selectedVariantIndex] as VariantInfo) : null;
  const priceDisplay = buildProductPriceDisplay(priceSummary, selectedVariant);
  const variantPriceDisplays = useMemo(() => {
    if (!Array.isArray(product?.variants)) {
      return [] as Array<ReturnType<typeof buildProductPriceDisplay>>;
    }
    return product.variants.map((variant) => buildProductPriceDisplay(priceSummary, variant));
  }, [product?.variants, priceSummary]);
  const pricingExample = useMemo(() => {
    if (!pricingSettings || !product || !sourceName) {
      return null;
    }
    return buildPricingExampleView(
      {
        product_id: product.id,
        title: product.title,
        url: product.url,
        source_name: sourceName,
        image_url: images[0] || null,
        price_summary: {
          source_display_price: priceDisplay.sourcePrice,
          source_currency: priceDisplay.sourceCurrency,
          source_compare_at_price: priceDisplay.sourceCompareAtPrice,
          source_has_range: priceDisplay.sourceHasRange,
          final_display_price: priceDisplay.finalPrice,
          final_currency: priceDisplay.finalCurrency,
          final_compare_at_price: priceDisplay.finalCompareAtPrice,
          final_has_range: priceDisplay.finalHasRange,
          pricing_manual_required: priceDisplay.pricingManualRequired,
          pricing_reason: priceDisplay.pricingReason,
        },
        components: (
          (selectedVariant as { pricing_components?: Record<string, unknown> | null } | null)?.pricing_components
          || product.pricing_components
          || {}
        ) as Record<string, unknown>,
      },
      pricingSettings
    );
  }, [pricingSettings, product, sourceName, images, priceDisplay.sourcePrice, priceDisplay.sourceCurrency, priceDisplay.finalPrice, selectedVariant]);
  const shouldShowPricingSection = Boolean(
    pricingSettings
    && pricingExample
    && String(product?.orderability_status || "").trim().toLowerCase() !== "unavailable"
  );

  if (loading) {
    return <ProductPageSkeleton />;
  }
  if (error || !product) {
    return (
      <section className="section">
        <div className="catalog-empty card">
          <EmptyState
            title="Товар не найден"
            action={
              fromControlPanel ? (
                <Link className="btn-link" to={adminBackHref}>
                  Вернуться в панель управления
                </Link>
              ) : (
                <Link className="btn-link" to="/">
                  Вернуться на витрину
                </Link>
              )
            }
          />
        </div>
        <ToastStack toasts={toasts} onClose={closeToast} />
      </section>
    );
  }

  const description = String(product.description || "").trim();
  const descriptionText = String(product.description_text || product.description || "").trim();
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 1;
  const originalPrice = withPriceRangePrefix(
    formatMoney(priceDisplay.sourcePrice, priceDisplay.sourceCurrency),
    priceDisplay.sourceHasRange,
  );
  const finalPrice = withPriceRangePrefix(
    formatMoney(priceDisplay.finalPrice, priceDisplay.finalCurrency),
    priceDisplay.finalHasRange,
  );
  const formulaMetricMoney = (value: number, currency: string, hasRange: boolean) => {
    const formatted = formatDisplayMoney(value, currency);
    return hasRange ? `От ${formatted}` : formatted;
  };
  const compareAtPrice = priceDisplay.finalCompareAtPrice !== null
    && priceDisplay.finalPrice !== null
    && priceDisplay.finalCompareAtPrice > priceDisplay.finalPrice
    ? formatMoney(priceDisplay.finalCompareAtPrice, priceDisplay.finalCurrency)
    : null;
  const sourceDesignerName = String(product.source_designer_name || product.display_designer_name || "").trim();
  const displayDesignerName = String(product.display_designer_name || product.designer_name || product.source_designer_name || "").trim();
  const externalProductUrl = toExternalHttpUrl(product.url);
  const genderLabel =
    genderDraft === "female"
      ? "Женский"
      : genderDraft === "male"
        ? "Мужской"
        : "Унисекс";
  const hidden = String(product.visibility_status || "").trim().toLowerCase() === "hidden";
  const visibilityLabel = hidden ? "Скрыт" : "Показан";
  const visibilityClass = hidden ? "status-pill status-pill--muted" : "status-pill status-pill--visible";
  const saleModeLabel = availabilityModeDraft === "by_order" ? "Под заказ" : "В наличии";
  const saleModeClass = availabilityModeDraft === "by_order" ? "status-pill status-pill--warn" : "status-pill status-pill--ok";
  const orderabilityStatus = String(product.orderability_status || "").trim().toLowerCase();
  const canSwitchAvailabilityToInStockNow = canSwitchAvailabilityToInStock(orderabilityStatus);
  const availabilityModeLockedReason = getAvailabilityModeLockedReason(orderabilityStatus);
  const availabilityLabel =
    orderabilityStatus === "unavailable"
      ? "Недоступен"
      : orderabilityStatus === "sold_out"
        ? "Распродан"
        : "Доступен";
  const availabilityClass =
    orderabilityStatus === "unavailable"
      ? "status-pill status-pill--bad"
      : orderabilityStatus === "sold_out"
        ? "status-pill status-pill--warn"
        : "status-pill status-pill--ok";
  const availabilityNote =
    orderabilityStatus === "unavailable"
      ? unavailableReasonRu(product.status_reason)
      : orderabilityStatus === "sold_out"
        ? "Сейчас нет доступных вариантов"
        : "Есть доступные варианты, товар можно оформить";
  const sourceCategoryName = String(activeGalleryListing?.source_category_name || product.source_category_name || "").trim() || "—";
  const filterName = String(product.filter_name || "").trim() || "—";
  const customCatalogNames = Array.isArray(product.custom_catalog_names)
    ? product.custom_catalog_names.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const activeListingName = String(activeGalleryListing?.source_name || sourceName || "").trim() || "—";
  const variantCount = Array.isArray(product.variants) ? product.variants.length : 0;
  const sourceWeightGrams = activeGalleryListing?.source_weight_grams ?? null;
  const autoWeightGrams = product.auto_weight_grams ?? null;
  const descriptionVisibleEffective = (
    typeof imageEdit.description_visible_effective === "boolean"
      ? imageEdit.description_visible_effective
      : product.description !== null
  );
  const descriptionVisibilityLocked = imageEdit.description_visible_override !== undefined && imageEdit.description_visible_override !== null;
  const sourceImageUrls = imageEdit.source_image_urls;
  const hiddenSourceUrlSet = new Set<string>(imageEdit.hidden_source_image_urls);
  const manualImageUrls = imageEdit.manual_image_urls;
  const sourceTokens = sourceImageUrls.map((imageUrl) => `s:${imageUrl}`);
  const manualTokens = manualImageUrls.map((imageUrl) => `m:${imageUrl}`);
  const imageEditorTokens = (() => {
    const valid = new Set<string>([...sourceTokens, ...manualTokens]);
    const ordered = imageEdit.manual_image_order.filter((token) => valid.has(token));
    const missing = [...valid].filter((token) => !ordered.includes(token));
    return [...ordered, ...missing];
  })();
  const imageEditorItems = imageEditorTokens.map((token) => {
    const [kind, ...rest] = token.split(":");
    const imageUrlRaw = rest.join(":");
    const isSource = kind === "s";
    const isManual = kind === "m";
    if (!imageUrlRaw || (!isSource && !isManual)) {
      return null;
    }
    const hidden = isSource && hiddenSourceUrlSet.has(imageUrlRaw);
    const sourceUrl = imageUrlRaw;
    const manualUrl = imageUrlRaw;
    const imageUrl = isSource ? sourceUrl : manualUrl;
    if (!imageUrl) {
      return null;
    }
    return {
      token,
      imageId: 0,
      isSource,
      isManual,
      hidden,
      imageUrl,
      thumbUrl: imageUrl,
    };
  }).filter(Boolean) as Array<{
    token: string;
    imageId: number;
    isSource: boolean;
    isManual: boolean;
    hidden: boolean;
    imageUrl: string;
    thumbUrl: string;
  }>;
  const galleryImages = canEdit ? imageEditorItems.map((item) => item.imageUrl) : imageEdit.source_image_urls.length > 0 || imageEdit.manual_image_urls.length > 0
    ? imageEditorItems.map((item) => item.imageUrl)
    : images;
  const activeImage = galleryImages[activeImageIndex] || null;
  const persistImagePatch = async (next: { hidden_source_image_urls: string[]; manual_image_urls: string[]; manual_image_order: string[] }) => {
    setDetailsSaving(true);
    const result = await updateProductOverrides(product.id, {
      gallery_listing_id: activeGalleryListing?.id ?? null,
      images: next,
    });
    pushToast(result.message);
    if (result.ok) {
      if (result.product) {
        setProduct(result.product);
      } else {
        await reloadFullProduct();
      }
    }
    setDetailsSaving(false);
  };

  const toggleSourceImageVisibility = async (imageUrl: string) => {
    const next = new Set(hiddenSourceUrlSet);
    if (next.has(imageUrl)) {
      next.delete(imageUrl);
    } else {
      next.add(imageUrl);
    }
    await persistImagePatch({
      hidden_source_image_urls: Array.from(next),
      manual_image_urls: manualImageUrls,
      manual_image_order: imageEdit.manual_image_order,
    });
  };

  const removeManualImage = async (imageUrl: string) => {
    await persistImagePatch({
      hidden_source_image_urls: imageEdit.hidden_source_image_urls,
      manual_image_urls: manualImageUrls.filter((url) => url !== imageUrl),
      manual_image_order: imageEdit.manual_image_order.filter((token) => token !== `m:${imageUrl}`),
    });
  };

  const reorderTokens = async (fromToken: string, toToken: string) => {
    if (fromToken === toToken) {
      return;
    }
    const current = [...imageEditorTokens];
    const fromIndex = current.indexOf(fromToken);
    const toIndex = current.indexOf(toToken);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    await persistImagePatch({
      hidden_source_image_urls: imageEdit.hidden_source_image_urls,
      manual_image_urls: manualImageUrls,
      manual_image_order: current,
    });
  };

  const onAddManualImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setDetailsSaving(true);
    const upload = await uploadProductImage(file);
    if (!upload.ok || !upload.imageAssetId) {
      pushToast(upload.message);
      setDetailsSaving(false);
      return;
    }
    const uploadedUrl = `/api/v1/products/images/${upload.imageAssetId}`;
    const nextManual = [...manualImageUrls, uploadedUrl];
    const nextOrder = [...imageEditorTokens, `m:${uploadedUrl}`];
    const result = await updateProductOverrides(product.id, {
      gallery_listing_id: activeGalleryListing?.id ?? null,
      images: {
        hidden_source_image_urls: imageEdit.hidden_source_image_urls,
        manual_image_urls: nextManual,
        manual_image_order: nextOrder,
      },
    });
    pushToast(result.message);
    if (result.ok) {
      if (result.product) {
        setProduct(result.product);
      } else {
        await reloadFullProduct();
      }
    }
    setDetailsSaving(false);
  };

  const parsePositiveNumber = (raw: string): number | null => {
    const normalized = raw.trim().replace(",", ".");
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const rawBrandName = String(product?.source_designer_name || "").trim();
  const brandOverrideName = String(product?.presentation?.brand_override_name || "").trim();
  const normalizedBrandDraft = String(brandDraft || "").trim();
  const visibleBrandSuggestions = (() => {
    const normalized = normalizedBrandDraft.toLowerCase();
    const base = brandOptions.filter((item) => {
      const value = String(item || "").trim();
      if (!value) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return value.toLowerCase().includes(normalized);
    });
    const ordered = normalizedBrandDraft && !base.some((item) => item === normalizedBrandDraft)
      ? [normalizedBrandDraft, ...base]
      : base;
    return Array.from(new Set(ordered)).slice(0, 8);
  })();

  const saveCoreDetails = async (session: number) => {
    if (session !== detailsEditSessionRef.current || !detailsEditMode) {
      return;
    }
    const nextTitle = titleDraft.trim();
    if (!nextTitle) {
      pushToast("Название не может быть пустым");
      return;
    }
    const nextManualWeight = parsePositiveNumber(manualWeightDraft);
    const nextPayload = {
      title: nextTitle,
      description_text: descriptionTextDraft,
      description_html: descriptionHtmlDraft,
      description_visible: descriptionVisibleDraft,
      gender: genderDraft,
      availability_mode: availabilityModeDraft,
      manual_weight_grams: nextManualWeight === null ? null : Math.round(nextManualWeight),
    };
    const nextSnapshot = JSON.stringify({
      title: nextPayload.title,
      descriptionText: nextPayload.description_text,
      descriptionHtml: nextPayload.description_html,
      descriptionVisible: nextPayload.description_visible,
      gender: nextPayload.gender,
      availabilityMode: nextPayload.availability_mode,
      manualWeightGrams: nextPayload.manual_weight_grams,
    });
    if (nextSnapshot === lastSavedCoreRef.current || nextSnapshot === inFlightCoreSnapshotRef.current) {
      return;
    }
    inFlightCoreSnapshotRef.current = nextSnapshot;
    setDetailsSaving(true);
    const result = await updateProductOverrides(product.id, nextPayload);
    pushToast(result.message);
    if (result.ok && result.product) {
      setProduct(result.product);
      lastSavedCoreRef.current = nextSnapshot;
    }
    inFlightCoreSnapshotRef.current = null;
    setDetailsSaving(false);
  };

  const saveBrandDetails = async (session: number, overrideBrand?: string | null) => {
    if (session !== detailsEditSessionRef.current || !detailsEditMode) {
      return;
    }
    const nextValue = String((overrideBrand ?? brandDraft) || "").trim();
    const nextBrandOverride = nextValue && nextValue !== rawBrandName ? nextValue : null;
    const nextSnapshot = JSON.stringify({
      brandOverrideName: nextBrandOverride,
    });
    if (nextSnapshot === lastSavedBrandRef.current) {
      return;
    }
    setDetailsSaving(true);
    const result = await updateProductOverrides(product.id, {
      brand_override_name: nextBrandOverride,
    });
    pushToast(result.message);
    if (result.ok && result.product) {
      setProduct(result.product);
      lastSavedBrandRef.current = nextSnapshot;
      if (nextBrandOverride) {
        setBrandOptions((prev) => {
          if (prev.includes(nextBrandOverride)) {
            return prev;
          }
          return [...prev, nextBrandOverride].sort((left, right) => left.localeCompare(right, "ru", { numeric: true, sensitivity: "variant" }));
        });
      }
    }
    setDetailsSaving(false);
  };

  const queueCoreSave = () => {
    if (!detailsEditMode) {
      return;
    }
    const session = detailsEditSessionRef.current;
    if (coreSaveTimerRef.current !== null) {
      window.clearTimeout(coreSaveTimerRef.current);
    }
    coreSaveTimerRef.current = window.setTimeout(() => {
      coreSaveTimerRef.current = null;
      if (session !== detailsEditSessionRef.current || !detailsEditMode) {
        return;
      }
      coreSaveChainRef.current = coreSaveChainRef.current.then(() => saveCoreDetails(session));
    }, 300);
  };

  const flushCoreSave = () => {
    if (!detailsEditMode) {
      return;
    }
    const session = detailsEditSessionRef.current;
    if (coreSaveTimerRef.current !== null) {
      window.clearTimeout(coreSaveTimerRef.current);
      coreSaveTimerRef.current = null;
    }
    coreSaveChainRef.current = coreSaveChainRef.current.then(() => saveCoreDetails(session));
  };

  const canEditVariants = detailsEditMode
    && String(product?.source_mode || "").trim().toLowerCase() === "personal"
    && !Boolean(product?.has_sync_listing);

  const variantDraftValidationError = (() => {
    if (!canEditVariants) {
      return null;
    }
    if (variantDrafts.length === 0) {
      return "Добавь хотя бы один вариант.";
    }
    for (const variant of variantDrafts) {
      if (!String(variant.title || "").trim()) {
        return "У всех вариантов должно быть название.";
      }
      const price = Number(String(variant.price || "").replace(",", "."));
      if (!Number.isFinite(price) || price <= 0) {
        return "У всех вариантов должна быть цена больше нуля.";
      }
      const compareAtPrice = toFiniteNumber(variant.compareAtPrice);
      if (compareAtPrice !== null && compareAtPrice <= price) {
        return "Старая цена варианта должна быть больше текущей.";
      }
      if (!String(variant.currency || "").trim()) {
        return "Укажи валюту у каждого варианта.";
      }
    }
    return null;
  })();

  const normalizeVariantPayload = (draft: VariantDraft) => ({
    title: String(draft.title || "").trim(),
    price: Number(String(draft.price || "").replace(",", ".")),
    compare_at_price: toFiniteNumber(draft.compareAtPrice),
    currency: String(draft.currency || "").trim().toUpperCase() || "RUB",
    available: Boolean(draft.available),
  });

  const saveVariantDrafts = async () => {
    if (!canEditVariants) {
      return;
    }
    if (variantDraftValidationError) {
      pushToast(variantDraftValidationError);
      return;
    }
    setDetailsSaving(true);
    const result = await updateManualProductVariants(
      product.id,
      variantDrafts.map((variant) => normalizeVariantPayload(variant))
    );
    pushToast(result.message);
    if (result.ok) {
      const refreshed = result.product || await reloadFullProduct();
      if (refreshed) {
        setProduct(refreshed);
        setVariantDrafts(buildVariantDrafts(refreshed));
      }
    }
    setDetailsSaving(false);
  };

  const resetVariantDrafts = () => {
    setVariantDrafts(buildVariantDrafts(product));
  };

  const updateVariantDraft = (variantId: string, patch: Partial<VariantDraft>) => {
    setVariantDrafts((prev) => prev.map((variant) => (variant.id === variantId ? { ...variant, ...patch } : variant)));
  };

  const addVariantDraft = () => {
    setVariantDrafts((prev) => [
      ...prev,
      {
        id: `variant-${Date.now()}-${prev.length}`,
        title: "",
        price: "",
        compareAtPrice: "",
        currency: String(product?.price_summary?.source_currency || "RUB").trim().toUpperCase() || "RUB",
        available: true,
      },
    ]);
  };

  const removeVariantDraft = (variantId: string) => {
    setVariantDrafts((prev) => (prev.length <= 1 ? prev : prev.filter((variant) => variant.id !== variantId)));
  };

  const resetFieldToDefault = async (field: "title" | "brand_override_name" | "description" | "gender" | "manual_weight_grams" | "description_visibility" | "images") => {
    setDetailsSaving(true);
    const resetFields = field === "description"
      ? (["description_text", "description_html", "description_visibility"] as const)
      : field === "images"
        ? (["images"] as const)
        : field === "brand_override_name"
          ? (["brand_override_name"] as const)
        : field === "description_visibility"
          ? (["description_visibility"] as const)
          : field === "manual_weight_grams"
            ? (["manual_weight_grams"] as const)
            : field === "gender"
              ? (["gender"] as const)
              : (["title_override"] as const);
    const result = await updateProductOverrides(product.id, {
      reset_to_default: [...resetFields],
    });
    pushToast(result.message);
    if (result.ok && result.product) {
      setProduct(result.product);
    }
    setDetailsSaving(false);
  };

  const resetDetailsDrafts = () => {
    setTitleDraft(String(product.title || ""));
    setBrandDraft(String(product.brand_name || product.presentation?.brand_override_name || product.source_designer_name || "").trim());
    setDescriptionTextDraft(String(product.description_text || product.description || ""));
    setDescriptionHtmlDraft(String(product.description_html || ""));
    setDescriptionVisibleDraft(deriveDescriptionVisibleDraft(product));
    setGenderDraft(
      String(product.gender || "").trim().toLowerCase() === "female"
        ? "female"
        : String(product.gender || "").trim().toLowerCase() === "male"
          ? "male"
          : "unisex"
    );
    setAvailabilityModeDraft(String(product.availability_mode || "").trim().toLowerCase() === "by_order" ? "by_order" : "in_stock");
    setManualWeightDraft(
      product.manual_weight_grams === null || product.manual_weight_grams === undefined
        ? ""
        : String(product.manual_weight_grams)
    );
    setVariantDrafts(buildVariantDrafts(product));
  };

  const closeDetailsEditor = () => {
    detailsEditSessionRef.current += 1;
    if (coreSaveTimerRef.current !== null) {
      window.clearTimeout(coreSaveTimerRef.current);
      coreSaveTimerRef.current = null;
    }
    if (brandSaveTimerRef.current !== null) {
      window.clearTimeout(brandSaveTimerRef.current);
      brandSaveTimerRef.current = null;
    }
    if (brandCloseTimerRef.current !== null) {
      window.clearTimeout(brandCloseTimerRef.current);
      brandCloseTimerRef.current = null;
    }
    resetDetailsDrafts();
    setDetailsEditMode(false);
  };

  const toggleAvailabilityMode = async () => {
    if (statusPending) {
      return;
    }
    const nextAvailabilityMode = availabilityModeDraft === "by_order" ? "in_stock" : "by_order";
    if (nextAvailabilityMode === "in_stock" && !canSwitchAvailabilityToInStockNow) {
      pushToast(availabilityModeLockedReason || "Нельзя переключить режим наличия");
      return;
    }
    setStatusPending(true);
    const result = await updateProductOverrides(product.id, {
      availability_mode: nextAvailabilityMode,
    });
    pushToast(result.message);
    if (result.ok) {
      setAvailabilityModeDraft(nextAvailabilityMode);
      if (result.product) {
        setProduct(result.product);
      } else {
        await reloadFullProduct();
      }
    }
    setStatusPending(false);
  };

  const onResetManualWeight = async () => {
    await resetFieldToDefault("manual_weight_grams");
  };

  const toggleHidden = async () => {
    if (statusPending) {
      return;
    }
    setStatusPending(true);
    const nextState = hidden
      ? deriveStatusAfterUnhide(product.variants, product)
      : buildHiddenProductWriteState(product);
    const result = await setProductStatus(product.id, nextState);
    pushToast(result.message);
    if (result.ok) {
      await reloadFullProduct();
    }
    setStatusPending(false);
  };

  const hasTitleOverride = Boolean(String(product.presentation?.title_override || "").trim());
  const hasDescriptionOverride = Boolean(
    String(product.presentation?.description_text || "").trim()
      || String(product.presentation?.description_html || "").trim()
      || descriptionVisibilityLocked
  );
  const hasManualWeightOverride = product.manual_weight_grams !== null && product.manual_weight_grams !== undefined;
  const passportCard = (
    <section className="card svp-card svp-card--specs svp-editor-passport">
      <div className="svp-card-head">
        <div>
          <h3>Паспорт товара</h3>
        </div>
      </div>
      <dl className="svp-specs">
        <div>
          <dt>Исходный дизайнер</dt>
          <dd><LatexBrand value={sourceDesignerName} fallback="—" /></dd>
        </div>
        <div>
          <dt>Итоговый дизайнер</dt>
          <dd><LatexBrand value={displayDesignerName} fallback="—" /></dd>
        </div>
        <div>
          <dt>Источник</dt>
          <dd>{activeListingName}</dd>
        </div>
        <div>
          <dt className={product.gender_is_manual ? "svp-specs-dt svp-specs-dt--manual" : "svp-specs-dt"}>
            <span>Гендер</span>
            {product.gender_is_manual ? <Pencil className="icon-svg svp-specs-dt-icon" aria-hidden="true" /> : null}
          </dt>
          <dd>{genderLabel}</dd>
        </div>
        <div>
          <dt>Source категория</dt>
          <dd>{sourceCategoryName}</dd>
        </div>
        <div>
          <dt>Фильтр</dt>
          <dd>{filterName}</dd>
        </div>
        <div>
          <dt>Кастомные каталоги</dt>
          <dd>
            {customCatalogNames.length > 0 ? (
              <div className="svp-chip-cluster svp-specs-inline">
                {customCatalogNames.map((name) => (
                  <span key={name} className="svp-chip">{name}</span>
                ))}
              </div>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt>Вес из источника</dt>
          <dd>{sourceWeightGrams ? `${sourceWeightGrams} г` : "—"}</dd>
        </div>
        <div>
          <dt>Автоматический вес</dt>
          <dd>{autoWeightGrams ? `${autoWeightGrams} г` : "—"}</dd>
        </div>
        <div>
          <dt>Ручной вес</dt>
          <dd>{product.manual_weight_grams ? `${product.manual_weight_grams} г` : "—"}</dd>
        </div>
      </dl>
    </section>
  );

  const goPrevImage = () => {
    if (galleryImages.length > 1) {
      setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    }
  };

  const queueBrandSave = () => {
    if (!detailsEditMode) {
      return;
    }
    const session = detailsEditSessionRef.current;
    if (brandSaveTimerRef.current !== null) {
      window.clearTimeout(brandSaveTimerRef.current);
    }
    brandSaveTimerRef.current = window.setTimeout(() => {
      brandSaveTimerRef.current = null;
      if (session !== detailsEditSessionRef.current || !detailsEditMode) {
        return;
      }
      brandSaveChainRef.current = brandSaveChainRef.current.then(() => saveBrandDetails(session));
    }, 250);
  };

  const flushBrandSave = (overrideBrand?: string | null) => {
    if (!detailsEditMode) {
      return;
    }
    const session = detailsEditSessionRef.current;
    if (brandSaveTimerRef.current !== null) {
      window.clearTimeout(brandSaveTimerRef.current);
      brandSaveTimerRef.current = null;
    }
    brandSaveChainRef.current = brandSaveChainRef.current.then(() => saveBrandDetails(session, overrideBrand));
  };
  const goNextImage = () => {
    if (galleryImages.length > 1) {
      setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
    }
  };

  const handleDeleteProduct = async () => {
    if (!Number.isFinite(productId) || productId <= 0 || deletePending) {
      return;
    }
    setDeletePending(true);
    try {
      const result = await deleteProduct(productId);
      if (!result.ok) {
        pushToast(result.message || "Не удалось удалить товар", "error");
        return;
      }
      pushToast(result.message || "Товар удален");
      if (window.history.length > 1) {
        navigate(-1);
        return;
      }
      navigate(fromControlPanel ? adminBackHref : "/catalog", { replace: true });
    } finally {
      setDeletePending(false);
      setDeleteConfirmOpen(false);
    }
  };

  const onImageTileDrop = (event: DragEvent<HTMLDivElement>, token: string) => {
    event.preventDefault();
    if (!draggingToken) {
      return;
    }
    void reorderTokens(draggingToken, token);
    setDraggingToken(null);
  };

  return (
    <article className="section product-view svp-page">
      <div className="product-view-back">
        {fromControlPanel ? (
          <Link className="btn-link" to={adminBackHref}>
            ← Назад в панель управления
          </Link>
        ) : (
          <Link className="btn-link" to="/catalog">
            ← Назад на витрину
          </Link>
        )}
      </div>

      <div className="svp-layout">
        <section className="card product-gallery-card svp-gallery-card">
          <div className="product-slider">
            {activeImage ? (
              <ImageWithFallback src={activeImage} alt={product.title} className="detail-image" placeholderClassName="detail-image detail-image--placeholder" placeholderText="Нет фото" loading="eager" />
            ) : (
              <ImageWithFallback src={null} alt={product.title} className="detail-image" placeholderClassName="detail-image detail-image--placeholder" placeholderText="Нет фото" />
            )}
            {galleryImages.length > 1 ? (
              <>
                <button type="button" className="slider-arrow slider-arrow--left" onClick={goPrevImage} aria-label="Предыдущее фото"><IconChevronLeft className="icon-svg" /></button>
                <button type="button" className="slider-arrow slider-arrow--right" onClick={goNextImage} aria-label="Следующее фото"><IconChevronRight className="icon-svg" /></button>
              </>
            ) : null}
          </div>

          {(canEdit || images.length > 1) ? (
            <div className="slider-thumbs">
              {canEdit ? (
                <>
                  {imageEditorItems.map((item, index) => (
                    <div
                      key={item.token}
                      className={`slider-thumb slider-thumb--editable ${index === activeImageIndex ? "slider-thumb--active" : ""} ${item.hidden ? "slider-thumb--hidden" : ""}`}
                      draggable
                      onDragStart={() => setDraggingToken(item.token)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => onImageTileDrop(event, item.token)}
                      onDragEnd={() => setDraggingToken(null)}
                    >
                      <button type="button" className="slider-thumb-button" onClick={() => setActiveImageIndex(index)}>
                        <ImageWithFallback src={item.thumbUrl} alt={`${product.title}-${index + 1}`} className="slider-thumb-image" placeholderClassName="slider-thumb-placeholder" placeholderText="Фото" />
                      </button>
                      <div className="svp-thumb-action-wrap">
                        {item.isSource ? (
                          <button
                            type="button"
                            className="svp-thumb-action"
                            onClick={(event) => {
                              event.stopPropagation();
                              void toggleSourceImageVisibility(item.imageUrl);
                            }}
                            title={item.hidden ? "Показать фото" : "Скрыть фото"}
                            aria-label={item.hidden ? "Показать фото" : "Скрыть фото"}
                          >
                            {item.hidden ? <EyeOff className="icon-svg" /> : <Eye className="icon-svg" />}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="svp-thumb-action svp-thumb-action--danger"
                            onClick={(event) => {
                              event.stopPropagation();
                              void removeManualImage(item.imageUrl);
                            }}
                            title="Удалить фото"
                            aria-label="Удалить фото"
                          >
                            <Trash2 className="icon-svg" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="button" className="slider-thumb product-image-add-tile" onClick={() => imageUploadInputRef.current?.click()}>
                    <IconPlus className="icon-svg" />
                  </button>
                </>
              ) : (
                images.map((imageUrl, index) => (
                  <button key={`${imageUrl}-${index}`} type="button" className={index === activeImageIndex ? "slider-thumb slider-thumb--active" : "slider-thumb"} onClick={() => setActiveImageIndex(index)}>
                    <ImageWithFallback src={toThumbUrl(imageUrl)} alt={`${product.title}-${index + 1}`} className="slider-thumb-image" placeholderClassName="slider-thumb-placeholder" placeholderText="Фото" />
                  </button>
                ))
              )}
            </div>
          ) : null}

          <div className="svp-gallery-meta">
            <div className="svp-gallery-meta-head">
              <div>
                <h3>Галерея</h3>
              </div>
              {canEdit ? (
                <button type="button" className="btn-link" onMouseDown={(event) => event.preventDefault()} onClick={() => void resetFieldToDefault("images")} disabled={detailsSaving}>
                  Сбросить фото
                </button>
              ) : null}
            </div>
          </div>
          <input ref={imageUploadInputRef} type="file" accept="image/*" className="input-hidden" onChange={(event) => void onAddManualImage(event)} />
        </section>

        <div className="svp-content">
          <section className="card svp-hero-card">
            <div className="svp-hero-top">
              <div className="svp-hero-copy">
                <h1 className="svp-title">{product.title}</h1>
                {displayDesignerName ? <p className="svp-subtitle">{displayDesignerName}</p> : null}
              </div>
              <div className="svp-hero-actions">
                {canEdit && !detailsEditMode ? (
                  <button
                    type="button"
                    className="svp-edit-toggle svp-icon-action"
                    onClick={() => setDetailsEditMode(true)}
                    title="Редактировать данные"
                    aria-label="Редактировать данные"
                  >
                    <Pencil className="icon-svg" />
                  </button>
                ) : canEdit ? (
                  <button
                    type="button"
                    className="svp-edit-toggle svp-icon-action"
                    onClick={closeDetailsEditor}
                    title="Отменить редактирование"
                    aria-label="Отменить редактирование"
                  >
                    <X className="icon-svg" />
                  </button>
                ) : null}
                {externalProductUrl ? (
                  <a
                    className="btn-link product-action-btn svp-icon-action svp-icon-action--secondary"
                    href={externalProductUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={`Открыть ${sourceName || "источник"}`}
                    aria-label={`Открыть ${sourceName || "источник"}`}
                  >
                    <IconExternalLink className="icon-svg" />
                  </a>
                ) : null}
                {fromControlPanel && canEdit ? (
                  <>
                    <button
                      ref={deleteAnchorRef}
                      type="button"
                      className="svp-edit-toggle svp-icon-action svp-icon-action--danger"
                      onClick={() => setDeleteConfirmOpen((current) => !current)}
                      title="Удалить товар"
                      aria-label="Удалить товар"
                      disabled={deletePending}
                    >
                      <Trash2 className="icon-svg" />
                    </button>
                    <FloatingPopover
                      anchorRef={deleteAnchorRef}
                      open={deleteConfirmOpen}
                      className="admin-action-popover"
                      onClose={() => {
                        if (!deletePending) {
                          setDeleteConfirmOpen(false);
                        }
                      }}
                    >
                      <p className="admin-action-popover__title">Удалить товар?</p>
                      <p className="admin-action-popover__text">
                        {product.title ? `Вы точно хотите удалить «${product.title}»?` : "Вы точно хотите удалить этот товар?"}
                      </p>
                      <div className="admin-action-popover__actions">
                        <button
                          type="button"
                          className="admin-action-popover__button admin-action-popover__button--danger"
                          onClick={() => void handleDeleteProduct()}
                          disabled={deletePending}
                        >
                          {deletePending ? "Удаляем..." : "Да, удалить"}
                        </button>
                        <button
                          type="button"
                          className="admin-action-popover__button"
                          onClick={() => setDeleteConfirmOpen(false)}
                          disabled={deletePending}
                        >
                          Отмена
                        </button>
                      </div>
                    </FloatingPopover>
                  </>
                ) : null}
              </div>
            </div>

            <div className="svp-summary-grid">
              <div className="svp-summary-card svp-summary-card--featured">
                <span className="svp-summary-label">Итоговая цена</span>
                <div className="svp-summary-price-row">
                  <strong>{finalPrice}</strong>
                  {compareAtPrice ? <del className="svp-price-old">{compareAtPrice}</del> : null}
                </div>
                <div className="svp-summary-inline">
                  <span>{`Оригинал: ${originalPrice}`}</span>
                </div>
              </div>
              <div className="svp-summary-card">
                <span className="svp-summary-label">Видимость</span>
                <button
                  type="button"
                  className={`svp-state-pill ${visibilityClass} svp-state-pill--button`}
                  onClick={() => void toggleHidden()}
                  disabled={statusPending}
                  aria-pressed={hidden}
                  title={hidden ? "Показать товар" : "Скрыть товар"}
                >
                  {hidden ? <IconEyeOff className="icon-svg" /> : <IconEye className="icon-svg" />}
                  <span>{visibilityLabel}</span>
                </button>
                <span className="svp-summary-note">{hidden ? "Товар скрыт с витрины" : "Товар показывается на витрине"}</span>
              </div>
              <div className="svp-summary-card">
                <span className="svp-summary-label">Наличие</span>
                <button
                  type="button"
                  className={`svp-state-pill ${saleModeClass} svp-state-pill--button`}
                  onClick={() => void toggleAvailabilityMode()}
                  disabled={statusPending || (availabilityModeDraft === "by_order" && !canSwitchAvailabilityToInStockNow)}
                  aria-pressed={availabilityModeDraft === "by_order"}
                  title={
                    availabilityModeDraft === "by_order"
                      ? (availabilityModeLockedReason || "Переключить на В наличии")
                      : "Переключить на Под заказ"
                  }
                >
                  <span>{saleModeLabel}</span>
                </button>
                <span className="svp-summary-note">
                  {availabilityModeDraft === "by_order"
                    ? (availabilityModeLockedReason || "Товар оформляется под заказ")
                    : "Товар доступен из наличия"}
                </span>
              </div>
              <div className="svp-summary-card">
                <span className="svp-summary-label">Статус</span>
                <div className={`svp-state-pill ${availabilityClass}`}>
                  <span>{availabilityLabel}</span>
                </div>
                {availabilityNote ? <span className="svp-summary-note">{availabilityNote}</span> : null}
              </div>
            </div>

            {!detailsEditMode && hasVariants ? (
              <section className="card svp-card svp-card--variants">
                <div className="svp-card-head">
                  <div>
                    <h3>Варианты</h3>
                    <p className="muted">Выбор варианта переключает активную цену и соответствующий набор фото.</p>
                  </div>
                </div>
                <div className="variants-grid">
                  {product.variants.map((variant, index) => {
                    const info = variant as VariantInfo;
                    const label = buildVariantLabel(info);
                    const available = Boolean(info.available);
                    const variantPriceDisplay = variantPriceDisplays[index] ?? buildProductPriceDisplay(priceSummary, variant);
                    const variantFinalPrice = formatMoney(
                      variantPriceDisplay.finalPrice,
                      variantPriceDisplay.finalCurrency,
                    );
                    const variantCompareAtPrice = variantPriceDisplay.finalCompareAtPrice !== null
                      && variantPriceDisplay.finalPrice !== null
                      && variantPriceDisplay.finalCompareAtPrice > variantPriceDisplay.finalPrice
                      ? formatMoney(variantPriceDisplay.finalCompareAtPrice, variantPriceDisplay.finalCurrency)
                      : null;
                    return (
                      <button
                        key={`${product.id}-variant-${index}`}
                        type="button"
                        className={`variant-btn ${!available ? "variant-btn--disabled" : ""} ${selectedVariantIndex === index ? "variant-btn--selected" : ""}`}
                        onClick={() => {
                          if (!available) {
                            return;
                          }
                          setSelectedVariantIndex(index);
                          const listingId = (info as { listing_id?: number | null }).listing_id;
                          setManualGalleryListingId(listingId === null || listingId === undefined ? null : Number(listingId));
                        }}
                        disabled={!available}
                      >
                        <span className="variant-btn__title">{label}</span>
                        <span className="variant-btn__pricing">
                          {variantCompareAtPrice ? <span className="variant-btn__compare">{variantCompareAtPrice}</span> : null}
                          <span className="variant-btn__price">{variantFinalPrice}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedVariant ? (
                  <p className="svp-variant-note">
                    {`Сейчас выбран вариант из источника: ${String((selectedVariant as { source_name?: string | null }).source_name || activeGalleryListing?.source_name || sourceName || "—")}`}
                  </p>
                ) : null}
              </section>
            ) : null}

          </section>

          {detailsEditMode ? (
            <section className="card svp-editor-card">
              <div className="svp-editor-top">
                <div className="svp-editor-fields">
                <div className="svp-editor-grid">
                  <label className="svp-field svp-field--full">
                    <span className="svp-field-head">
                      <span>Название для витрины</span>
                      <button type="button" className="svp-reset-button" onMouseDown={(event) => event.preventDefault()} onClick={() => void resetFieldToDefault("title")} disabled={detailsSaving || !hasTitleOverride} title="Сбросить название" aria-label="Сбросить название">
                        <RotateCcw className="icon-svg" />
                      </button>
                    </span>
                    <input value={titleDraft} onChange={(event) => { setTitleDraft(event.target.value); queueCoreSave(); }} onBlur={flushCoreSave} placeholder="Название товара" />
                  </label>
                  <div className="svp-field svp-field--full">
                    <span className="svp-field-head">
                      <span>Бренд</span>
                      <button
                        type="button"
                        className="svp-reset-button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => void resetFieldToDefault("brand_override_name")}
                        disabled={detailsSaving || !brandOverrideName}
                        title="Сбросить бренд"
                        aria-label="Сбросить бренд"
                      >
                        <RotateCcw className="icon-svg" />
                      </button>
                    </span>
                    <div
                      className={`svp-brand-combobox ${brandComboboxOpen ? "svp-brand-combobox--open" : ""}`}
                      onBlur={() => {
                        if (brandCloseTimerRef.current !== null) {
                          window.clearTimeout(brandCloseTimerRef.current);
                        }
                        brandCloseTimerRef.current = window.setTimeout(() => {
                          brandCloseTimerRef.current = null;
                          setBrandComboboxOpen(false);
                        }, 180);
                        queueBrandSave();
                      }}
                    >
                      <input
                        value={brandDraft}
                        placeholder={rawBrandName || "Бренд товара"}
                        onFocus={() => setBrandComboboxOpen(true)}
                        onChange={(event) => {
                          setBrandDraft(event.target.value);
                          setBrandComboboxOpen(true);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            setBrandComboboxOpen(false);
                            flushBrandSave(brandDraft);
                          }
                          if (event.key === "Escape") {
                            setBrandComboboxOpen(false);
                          }
                        }}
                        disabled={detailsSaving}
                      />
                      {brandComboboxOpen ? (
                        <div className="svp-brand-combobox__list" role="listbox" aria-label="Подсказки бренда">
                          {visibleBrandSuggestions.length > 0 ? (
                            visibleBrandSuggestions.map((item) => (
                              <button
                                key={item}
                                type="button"
                                className="svp-brand-combobox__item"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  setBrandDraft(item);
                                  setBrandComboboxOpen(false);
                                  flushBrandSave(item);
                                }}
                              >
                                {item}
                              </button>
                            ))
                          ) : (
                            <div className="svp-brand-combobox__empty">Нет вариантов</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <label className="svp-field">
                    <span className="svp-field-head">
                      <span>Гендер</span>
                      <button type="button" className="svp-reset-button" onMouseDown={(event) => event.preventDefault()} onClick={() => void resetFieldToDefault("gender")} disabled={detailsSaving || !product.gender_is_manual} title="Сбросить гендер" aria-label="Сбросить гендер">
                        <RotateCcw className="icon-svg" />
                        </button>
                      </span>
                      <select value={genderDraft} onChange={(event) => { setGenderDraft(event.target.value as "male" | "female" | "unisex"); queueCoreSave(); }} onBlur={flushCoreSave}>
                        <option value="male">Мужской</option>
                        <option value="female">Женский</option>
                        <option value="unisex">Унисекс</option>
                      </select>
                    </label>
                    <label className="svp-field">
                      <span className="svp-field-head">
                        <span>Ручной вес, г</span>
                        <button type="button" className="svp-reset-button" onMouseDown={(event) => event.preventDefault()} onClick={() => void onResetManualWeight()} disabled={detailsSaving || !hasManualWeightOverride} title="Сбросить ручной вес" aria-label="Сбросить ручной вес">
                          <RotateCcw className="icon-svg" />
                        </button>
                      </span>
                      <input value={manualWeightDraft} onChange={(event) => { setManualWeightDraft(event.target.value); queueCoreSave(); }} onBlur={flushCoreSave} inputMode="numeric" />
                    </label>
                  </div>
                </div>
                {passportCard}
              </div>

              <section className="svp-editor-description">
                <div className="svp-card-head">
                  <div>
                    <h3>Описание для витрины</h3>
                  </div>
                  <div className="svp-editor-panel-actions">
                    <button type="button" className="svp-reset-button" onMouseDown={(event) => event.preventDefault()} onClick={() => void resetFieldToDefault("description")} disabled={detailsSaving || !hasDescriptionOverride} title="Сбросить описание" aria-label="Сбросить описание">
                      <RotateCcw className="icon-svg" />
                    </button>
                    <label className="ui-switch ui-switch--compact svp-visibility-switch">
                      <input
                        type="checkbox"
                        checked={!descriptionVisibleDraft}
                        onChange={(event) => { setDescriptionVisibleDraft(!Boolean(event.target.checked)); queueCoreSave(); }}
                        onBlur={flushCoreSave}
                      />
                      <span className="ui-switch-track"><span className="ui-switch-thumb" /></span>
                      <span className="ui-switch-text">Скрыть</span>
                    </label>
                  </div>
                </div>
                <textarea
                  value={descriptionTextDraft}
                  onChange={(event) => { setDescriptionTextDraft(event.target.value); queueCoreSave(); }}
                  onBlur={flushCoreSave}
                  rows={8}
                  disabled={!descriptionVisibleDraft}
                  placeholder="Текстовое описание"
                />
              </section>
              {canEditVariants ? (
                <section className="svp-editor-variants">
                  <div className="svp-card-head">
                    <div>
                      <h3>Варианты</h3>
                      <p className="muted">Редактируется только у личного товара без привязки синхронизации.</p>
                    </div>
                    <div className="svp-editor-panel-actions">
                      <button type="button" className="svp-reset-button" onMouseDown={(event) => event.preventDefault()} onClick={resetVariantDrafts} disabled={detailsSaving} title="Сбросить варианты" aria-label="Сбросить варианты">
                        <RotateCcw className="icon-svg" />
                      </button>
                      <button type="button" className="svp-variants-save" onClick={() => void saveVariantDrafts()} disabled={detailsSaving || Boolean(variantDraftValidationError)}>
                        Сохранить варианты
                      </button>
                    </div>
                  </div>
                  <div className="svp-variants-list">
                    {variantDrafts.map((variant, index) => (
                      <div key={variant.id} className="svp-variant-row">
                        <div className="svp-variant-row__index">{index + 1}</div>
                        <label className="svp-field svp-field--variant-name">
                          <span>Название</span>
                          <input
                            value={variant.title}
                            onChange={(event) => updateVariantDraft(variant.id, { title: event.target.value })}
                            placeholder="Название варианта"
                            disabled={detailsSaving}
                          />
                        </label>
                        <label className="svp-field">
                          <span>Цена</span>
                          <input
                            value={variant.price}
                            onChange={(event) => updateVariantDraft(variant.id, { price: event.target.value })}
                            inputMode="decimal"
                            placeholder="0"
                            disabled={detailsSaving}
                          />
                        </label>
                        <label className="svp-field">
                          <span>Старая цена</span>
                          <input
                            value={variant.compareAtPrice}
                            onChange={(event) => updateVariantDraft(variant.id, { compareAtPrice: event.target.value })}
                            inputMode="decimal"
                            placeholder="0"
                            disabled={detailsSaving}
                          />
                        </label>
                        <label className="svp-field svp-field--variant-currency">
                          <span>Валюта</span>
                          <select
                            value={variant.currency}
                            onChange={(event) => updateVariantDraft(variant.id, { currency: event.target.value })}
                            disabled={detailsSaving}
                          >
                            <option value="RUB">RUB</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="JPY">JPY</option>
                          </select>
                        </label>
                        <label className="ui-switch ui-switch--compact svp-variant-switch">
                          <input
                            type="checkbox"
                            checked={variant.available}
                            onChange={(event) => updateVariantDraft(variant.id, { available: Boolean(event.target.checked) })}
                            disabled={detailsSaving}
                          />
                          <span className="ui-switch-track"><span className="ui-switch-thumb" /></span>
                          <span className="ui-switch-text">{variant.available ? "Доступен" : "Недоступен"}</span>
                        </label>
                        <button
                          type="button"
                          className="svp-variant-remove"
                          onClick={() => removeVariantDraft(variant.id)}
                          disabled={detailsSaving || variantDrafts.length <= 1}
                          title="Удалить вариант"
                          aria-label="Удалить вариант"
                        >
                          <Trash2 className="icon-svg" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="svp-variant-actions">
                    <button type="button" className="svp-variants-add" onClick={addVariantDraft} disabled={detailsSaving}>
                      Добавить вариант
                    </button>
                  </div>
                  {variantDraftValidationError ? <p className="svp-validation-error">{variantDraftValidationError}</p> : null}
                </section>
              ) : null}
            </section>
          ) : null}

          {!detailsEditMode ? (
          <div className="svp-info-grid">
            <section className="card svp-card svp-card--description">
              <div className="svp-card-head">
                <div>
                  <h3>Описание</h3>
                </div>
                {!descriptionVisibleEffective ? <span className="svp-chip svp-chip--muted">Скрыто</span> : null}
              </div>
              {!descriptionVisibleEffective ? (
                <p className="svp-empty-note">Описание сейчас скрыто{descriptionVisibilityLocked ? " для этого товара" : " глобальным правилом"}.</p>
              ) : (
                <p className="product-description-text svp-description-content">{description || "Описание отсутствует"}</p>
              )}
            </section>

            {passportCard}
          </div>
          ) : null}

          {shouldShowPricingSection ? (
            <section className="card svp-card svp-card--pricing">
              <div className="svp-card-head">
                <div>
                  <h3>Цена и расчет</h3>
                </div>
              </div>
              <div className="pricing-formula-box svp-formula-box">
                <div className="svp-formula-head">
                  <h3>Формула финальной цены</h3>
                </div>
                <div className="pricing-formula-text pricing-formula-latex pricing-example-formula" dangerouslySetInnerHTML={{ __html: pricingExample.formulaHtml }} />
                <div className="pricing-example-summary product-formula-summary svp-formula-metrics">
                  <div className="pricing-example-metric"><div className="pricing-example-metric-key" dangerouslySetInnerHTML={{ __html: pricingExample.summarySpLatex }} /><div className="pricing-example-metric-value">{formulaMetricMoney(pricingExample.sourcePrice, pricingExample.sourceCurrency, pricingExample.sourceHasRange)}</div></div>
                  <div className="pricing-example-metric"><div className="pricing-example-metric-key" dangerouslySetInnerHTML={{ __html: pricingExample.summaryRubLatex }} /><div className="pricing-example-metric-value">{formulaMetricMoney(pricingExample.sourcePriceRub, "RUB", pricingExample.sourceHasRange)}</div></div>
                  <div className="pricing-example-metric"><div className="pricing-example-metric-key" dangerouslySetInnerHTML={{ __html: pricingExample.summaryFpLatex }} /><div className="pricing-example-metric-value">{formulaMetricMoney(pricingExample.finalPrice, "RUB", pricingExample.finalHasRange)}</div></div>
                </div>
                <div className="product-formula-legend-panel">
                  <button type="button" className={`product-formula-legend-toggle ${legendExpanded ? "is-open" : ""}`} onClick={() => setLegendExpanded((prev) => !prev)} aria-expanded={legendExpanded}>
                    <span>Обозначения переменных</span>
                    <IconChevronRight className="icon-svg product-formula-legend-toggle-icon" />
                  </button>
                  <div className={`product-formula-legend-collapse ${legendExpanded ? "is-open" : ""}`} aria-hidden={!legendExpanded}>
                    <div className="pricing-formula-legend pricing-legend-grid">
                      {pricingSettings.formula_legend.map((item) => (
                        <div key={item.key} className="pricing-legend-item">
                          <p className={pricingExample.legendDim?.[item.key] ? "pricing-legend-key pricing-legend-key--dim" : "pricing-legend-key"} dangerouslySetInnerHTML={{ __html: renderLegendSymbol(item.key) }} />
                          <p className="muted">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>
      <ToastStack toasts={toasts} onClose={closeToast} />
    </article>
  );
}
