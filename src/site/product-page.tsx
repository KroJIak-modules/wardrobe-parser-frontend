import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { buildPricingExampleView } from "../admin/admin-pricing-view-model";
import { formatDisplayMoney, renderLegendSymbol } from "../admin/admin-formatters";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { LatexBrand } from "../shared/latex-brand";
import { IconChevronLeft, IconChevronRight, IconExternalLink, IconEye, IconEyeOff, IconPencil, IconPlus, IconTrash } from "../shared/mono-icons";
import { ProductPageSkeleton } from "../shared/skeleton";
import { getProductPrimaryImageUrl, useLiveData } from "../shared/live-data-context";
import { ToastStack } from "../shared/toast-stack";
import { useToasts } from "../shared/use-toasts";
import { deriveStatusAfterUnhide, getSourceNameById, getStatusClass, getStatusLabel, normalizeProductStatus } from "./catalog-helpers";

type VariantInfo = {
  title: string;
  available: boolean;
  inventory_quantity: number;
  price?: string | number | null;
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

function toThumbUrl(url: string): string {
  if (!url.startsWith("/api/v1/images/")) {
    return url;
  }
  const delimiter = url.includes("?") ? "&" : "?";
  return `${url}${delimiter}w=140&h=140&q=50`;
}

type ImageEditState = {
  title_sync_locked: boolean;
  description_sync_locked: boolean;
  images_sync_locked: boolean;
  hidden_source_image_ids: number[];
  manual_image_ids: number[];
  manual_image_order: string[];
  source_image_ids: number[];
};

export function ProductPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const {
    products,
    sources,
    getProductById,
    setProductStatus,
    pricingSettings,
    ensurePricingLoaded,
    updateProductOverrides,
    uploadShowcaseImage,
  } = useLiveData();
  const fromAdmin = searchParams.get("from") === "admin";
  const canEdit = (() => {
    if (fromAdmin) {
      return true;
    }
    try {
      return Boolean(window.localStorage.getItem("admin_access_token"));
    } catch {
      return false;
    }
  })();

  const productId = Number(id);
  const inlineProduct = Number.isFinite(productId) ? products.find((item) => item.id === productId) || null : null;
  const [product, setProduct] = useState<typeof inlineProduct>(inlineProduct);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toasts, pushToast, closeToast } = useToasts();
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
  const [statusPending, setStatusPending] = useState<boolean>(false);
  const [legendExpanded, setLegendExpanded] = useState<boolean>(false);
  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [titleDraft, setTitleDraft] = useState<string>("");
  const [editingDescription, setEditingDescription] = useState<boolean>(false);
  const [descriptionDraft, setDescriptionDraft] = useState<string>("");
  const [editPending, setEditPending] = useState<boolean>(false);
  const [draggingToken, setDraggingToken] = useState<string | null>(null);
  const imageUploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inlineProduct) {
      setProduct(inlineProduct);
      setError(null);
    }
  }, [inlineProduct]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!Number.isFinite(productId) || productId <= 0) {
        setProduct(null);
        setError("Некорректный ID товара");
        return;
      }
      setLoading(!inlineProduct);
      setError(null);
      const fetched = await getProductById(productId, { forceFetch: !inlineProduct });
      if (cancelled) {
        return;
      }
      if (fetched) {
        setProduct(fetched);
        setError(null);
      } else if (!inlineProduct) {
        setError(`Товар #${productId} не найден`);
      }
      setLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [productId, getProductById]);

  useEffect(() => {
    void ensurePricingLoaded();
  }, [ensurePricingLoaded]);

  useEffect(() => {
    if (error) {
      pushToast(error);
    }
  }, [error, pushToast]);

  useEffect(() => {
    setTitleDraft(String(product?.title || ""));
    setDescriptionDraft(String(product?.description || ""));
  }, [product?.id, product?.title, product?.description]);

  const imageEdit = useMemo<ImageEditState>(() => {
    const fallbackSource = (product?.image_ids || []).map((value) => Number(value)).filter((value) => Number.isFinite(value));
    const raw = product?.product_edit || {};
    return {
      title_sync_locked: Boolean(raw.title_sync_locked),
      description_sync_locked: Boolean(raw.description_sync_locked),
      images_sync_locked: Boolean(raw.images_sync_locked),
      hidden_source_image_ids: Array.isArray(raw.hidden_source_image_ids) ? raw.hidden_source_image_ids.map((x) => Number(x)).filter(Number.isFinite) : [],
      manual_image_ids: Array.isArray(raw.manual_image_ids) ? raw.manual_image_ids.map((x) => Number(x)).filter(Number.isFinite) : [],
      manual_image_order: Array.isArray(raw.manual_image_order) ? raw.manual_image_order.map((x) => String(x)) : [],
      source_image_ids: Array.isArray(raw.source_image_ids) && raw.source_image_ids.length > 0
        ? raw.source_image_ids.map((x) => Number(x)).filter(Number.isFinite)
        : fallbackSource,
    };
  }, [product?.product_edit, product?.image_ids]);

  const images = useMemo(() => {
    if (!product) {
      return [] as string[];
    }
    const ids = (product.image_ids || []).map((imageId) => (imageId ? `/api/v1/images/${imageId}` : null)).filter(Boolean) as string[];
    if (ids.length > 0) {
      return ids;
    }
    const fallback = getProductPrimaryImageUrl(product);
    return fallback ? [fallback] : [];
  }, [product]);

  useEffect(() => {
    const editableLength = imageEdit.source_image_ids.length + imageEdit.manual_image_ids.length;
    const imagesLength = canEdit ? editableLength : images.length;
    if (activeImageIndex > Math.max(0, imagesLength - 1)) {
      setActiveImageIndex(0);
    }
  }, [canEdit, imageEdit.source_image_ids.length, imageEdit.manual_image_ids.length, images.length, activeImageIndex]);

  const sourceNameById = useMemo(() => getSourceNameById(sources), [sources]);
  const sourceName = product ? (sourceNameById.get(product.source_id) || `Источник #${product.source_id}`) : null;
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
        source_price: product.source_price ?? product.price ?? null,
        source_currency: product.source_currency ?? product.currency ?? null,
        final_price: product.final_price ?? product.price ?? null,
        components: (product.pricing_components || {}) as Record<string, unknown>,
      },
      pricingSettings
    );
  }, [pricingSettings, product, sourceName, images]);

  if (loading) {
    return <ProductPageSkeleton />;
  }
  if (error || !product) {
    return (
      <section className="section">
        <div className="catalog-empty card">
          <p>Товар не найден</p>
          <Link className="btn-link" to={fromAdmin ? "/control/products" : "/"}>
            {fromAdmin ? "Вернуться в панель управления" : "Вернуться к каталогу"}
          </Link>
        </div>
        <ToastStack toasts={toasts} onClose={closeToast} />
      </section>
    );
  }

  const description = String(product.description || "").trim();
  const statusClass = getStatusClass(product.status || "unknown");
  const normalizedStatus = normalizeProductStatus(product.status);
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 1;
  const selectedVariant = (
    selectedVariantIndex !== null
      && Array.isArray(product.variants)
      && product.variants[selectedVariantIndex]
  ) ? (product.variants[selectedVariantIndex] as VariantInfo) : null;
  const selectedVariantPrice = toFiniteNumber(selectedVariant?.price);
  const sourcePriceBase = toFiniteNumber(product.source_price ?? product.price);
  const finalPriceBase = toFiniteNumber(product.final_price ?? product.price);
  const sourceToFinalRate = sourcePriceBase !== null && finalPriceBase !== null && sourcePriceBase > 0 ? (finalPriceBase / sourcePriceBase) : null;
  const effectiveSourcePrice = selectedVariantPrice ?? sourcePriceBase;
  const effectiveFinalPrice = selectedVariantPrice === null
    ? finalPriceBase
    : sourceToFinalRate !== null
      ? Number((selectedVariantPrice * sourceToFinalRate).toFixed(2))
      : selectedVariantPrice;
  const originalPrice = formatMoney(effectiveSourcePrice, product.source_currency ?? product.currency);
  const finalPrice = formatMoney(effectiveFinalPrice, product.final_currency ?? product.currency);
  const categoryNames = (product.internal_category_names || []).filter(Boolean).length > 0
    ? (product.internal_category_names || []).filter(Boolean)
    : product.internal_category_name ? [product.internal_category_name] : [];
  const vendorOriginal = String(product.vendor_original || product.vendor || "").trim();
  const vendorMapped = String(product.vendor_mapped || product.vendor_display || product.vendor || "").trim();
  const normalizedVendor = vendorMapped.toLowerCase();
  const categoryChips = categoryNames.filter((name) => String(name).trim().toLowerCase() !== normalizedVendor);
  const hasBrand = Boolean(vendorOriginal || vendorMapped);
  const sourceImageIds = imageEdit.source_image_ids;
  const hiddenSourceIdSet = new Set<number>(imageEdit.hidden_source_image_ids);
  const manualImageIds = imageEdit.manual_image_ids;
  const sourceTokens = sourceImageIds.map((imageId) => `s:${imageId}`);
  const manualTokens = manualImageIds.map((imageId) => `m:${imageId}`);
  const imageEditorTokens = (() => {
    const valid = new Set<string>([...sourceTokens, ...manualTokens]);
    const ordered = imageEdit.manual_image_order.filter((token) => valid.has(token));
    const missing = [...valid].filter((token) => !ordered.includes(token));
    return [...ordered, ...missing];
  })();
  const imageEditorItems = imageEditorTokens.map((token) => {
    const [kind, rawId] = token.split(":");
    const imageId = Number(rawId);
    const isSource = kind === "s";
    const isManual = kind === "m";
    if (!Number.isFinite(imageId) || (!isSource && !isManual)) {
      return null;
    }
    const hidden = isSource && hiddenSourceIdSet.has(imageId);
    return {
      token,
      imageId,
      isSource,
      isManual,
      hidden,
      imageUrl: `/api/v1/images/${imageId}`,
      thumbUrl: `/api/v1/images/${imageId}?w=120&h=120&q=55`,
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
  const galleryImages = canEdit ? imageEditorItems.map((item) => item.imageUrl) : images;
  const activeImage = galleryImages[activeImageIndex] || null;

  const persistImagePatch = async (next: { hidden_source_image_ids: number[]; manual_image_ids: number[]; manual_image_order: string[] }) => {
    setEditPending(true);
    const result = await updateProductOverrides(product.id, { images: next });
    pushToast(result.message);
    if (result.ok && result.product) {
      setProduct(result.product);
    }
    setEditPending(false);
  };

  const toggleSourceImageVisibility = async (imageId: number) => {
    const next = new Set(hiddenSourceIdSet);
    if (next.has(imageId)) {
      next.delete(imageId);
    } else {
      next.add(imageId);
    }
    await persistImagePatch({
      hidden_source_image_ids: Array.from(next),
      manual_image_ids: manualImageIds,
      manual_image_order: imageEdit.manual_image_order,
    });
  };

  const removeManualImage = async (imageId: number) => {
    await persistImagePatch({
      hidden_source_image_ids: imageEdit.hidden_source_image_ids,
      manual_image_ids: manualImageIds.filter((id) => id !== imageId),
      manual_image_order: imageEdit.manual_image_order.filter((token) => token !== `m:${imageId}`),
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
      hidden_source_image_ids: imageEdit.hidden_source_image_ids,
      manual_image_ids: manualImageIds,
      manual_image_order: current,
    });
  };

  const onAddManualImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setEditPending(true);
    const upload = await uploadShowcaseImage(file);
    if (!upload.ok || !upload.imageAssetId) {
      pushToast(upload.message);
      setEditPending(false);
      return;
    }
    const nextManual = [...manualImageIds, upload.imageAssetId];
    const nextOrder = [...imageEditorTokens, `m:${upload.imageAssetId}`];
    const result = await updateProductOverrides(product.id, {
      images: {
        hidden_source_image_ids: imageEdit.hidden_source_image_ids,
        manual_image_ids: nextManual,
        manual_image_order: nextOrder,
      },
    });
    pushToast(result.message);
    if (result.ok && result.product) {
      setProduct(result.product);
    }
    setEditPending(false);
  };

  const onResetFieldToDefault = async (field: "title" | "description" | "images") => {
    setEditPending(true);
    const result = await updateProductOverrides(product.id, { reset_to_default: [field] });
    pushToast(result.message);
    if (result.ok && result.product) {
      setProduct(result.product);
    }
    setEditPending(false);
  };

  const onSaveTitle = async () => {
    const next = titleDraft.trim();
    if (!next) {
      pushToast("Название не может быть пустым");
      return;
    }
    setEditPending(true);
    const result = await updateProductOverrides(product.id, { title: next });
    pushToast(result.message);
    if (result.ok && result.product) {
      setProduct(result.product);
      setEditingTitle(false);
    }
    setEditPending(false);
  };

  const onSaveDescription = async () => {
    setEditPending(true);
    const result = await updateProductOverrides(product.id, { description: descriptionDraft });
    pushToast(result.message);
    if (result.ok && result.product) {
      setProduct(result.product);
      setEditingDescription(false);
    }
    setEditPending(false);
  };

  const toggleHidden = async () => {
    if (statusPending) {
      return;
    }
    setStatusPending(true);
    const nextStatus = normalizedStatus === "hidden" ? deriveStatusAfterUnhide(product.variants) : "hidden";
    const result = await setProductStatus(product.id, nextStatus);
    if (result.ok) {
      setProduct((prev) => (prev ? { ...prev, status: nextStatus } : prev));
    }
    pushToast(result.message);
    setStatusPending(false);
  };

  const goPrevImage = () => {
    if (galleryImages.length > 1) {
      setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    }
  };
  const goNextImage = () => {
    if (galleryImages.length > 1) {
      setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
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
    <article className="section product-view">
      <div className="product-view-back">
        <Link className="btn-link" to={fromAdmin ? "/control/products" : "/"}>
          {fromAdmin ? "← Назад в панель управления" : "← Назад к каталогу"}
        </Link>
      </div>

      <div className="product-view-grid">
        <section className="card product-gallery-card">
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
                      {item.isSource ? (
                        <button type="button" className="product-image-edit-action" onClick={() => void toggleSourceImageVisibility(item.imageId)} title={item.hidden ? "Показать фото" : "Скрыть фото"}>
                          {item.hidden ? <IconEyeOff className="icon-svg" /> : <IconEye className="icon-svg" />}
                        </button>
                      ) : (
                        <button type="button" className="product-image-edit-action product-image-edit-action--danger" onClick={() => void removeManualImage(item.imageId)} title="Удалить фото">
                          <IconTrash className="icon-svg" />
                        </button>
                      )}
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
          {canEdit ? (
            <div className="product-images-editor-tools">
              <button type="button" className="btn-link" onClick={() => void onResetFieldToDefault("images")} disabled={editPending}>Сбросить фото до дефолта</button>
            </div>
          ) : null}
          <input ref={imageUploadInputRef} type="file" accept="image/*" className="input-hidden" onChange={(event) => void onAddManualImage(event)} />
        </section>

        <section className="card product-main-card">
          <div className="product-main-head">
            {editingTitle ? (
              <div className="product-inline-edit product-inline-edit--title">
                <input value={titleDraft} onChange={(event) => setTitleDraft(event.target.value)} className="product-inline-input" placeholder="Название товара" disabled={editPending} />
                <div className="product-inline-actions">
                  <button type="button" className="btn-link" onClick={() => void onSaveTitle()} disabled={editPending}>Сохранить</button>
                  <button type="button" className="btn-link" onClick={() => { setEditingTitle(false); setTitleDraft(product.title); }} disabled={editPending}>Отмена</button>
                  <button type="button" className="btn-link" onClick={() => void onResetFieldToDefault("title")} disabled={editPending}>Сброс</button>
                </div>
              </div>
            ) : (
              <h1 onDoubleClick={() => canEdit && setEditingTitle(true)}>
                {product.title}
                {canEdit ? (
                  <button type="button" className="product-edit-icon-btn" onClick={() => setEditingTitle(true)} title="Редактировать название">
                    <IconPencil className="icon-svg" />
                  </button>
                ) : null}
              </h1>
            )}
          </div>
          <div className="product-main-status">
            <span className={statusClass}>{getStatusLabel(product.status)}</span>
          </div>

          <div className="product-main-description">
            <h3>
              Описание
              {canEdit ? (
                <button type="button" className="product-edit-icon-btn" onClick={() => setEditingDescription(true)} title="Редактировать описание">
                  <IconPencil className="icon-svg" />
                </button>
              ) : null}
            </h3>
            {editingDescription ? (
              <div className="product-inline-edit">
                <textarea value={descriptionDraft} onChange={(event) => setDescriptionDraft(event.target.value)} className="product-inline-textarea" rows={5} disabled={editPending} />
                <div className="product-inline-actions">
                  <button type="button" className="btn-link" onClick={() => void onSaveDescription()} disabled={editPending}>Сохранить</button>
                  <button type="button" className="btn-link" onClick={() => { setEditingDescription(false); setDescriptionDraft(description); }} disabled={editPending}>Отмена</button>
                  <button type="button" className="btn-link" onClick={() => void onResetFieldToDefault("description")} disabled={editPending}>Сброс</button>
                </div>
              </div>
            ) : (
              <p className="product-description-text" onDoubleClick={() => canEdit && setEditingDescription(true)}>{description || "Описание отсутствует"}</p>
            )}
          </div>

          <div className="product-main-meta">
            {hasBrand ? (
              <div className="product-meta-line">
                <span className="product-meta-label">Бренд:</span>
                <div className="product-meta-brand-stack">
                  <span className="product-meta-chip product-meta-chip--muted">
                    Исходный: <LatexBrand value={vendorOriginal} fallback="-" />
                  </span>
                  <span className="product-meta-chip">
                    Итоговый: <LatexBrand value={vendorMapped} fallback="-" />
                  </span>
                </div>
              </div>
            ) : null}
            {categoryChips.length > 0 ? (
              <div className="product-meta-line">
                <span className="product-meta-label">Находится в категориях:</span>
                <div className="product-meta-categories">
                  {categoryChips.map((name) => <span key={name} className="product-meta-chip">{name}</span>)}
                </div>
              </div>
            ) : null}
          </div>

          {hasVariants ? (
            <div className="variants-section">
              <h3>Варианты</h3>
              <div className="variants-grid">
                {product.variants.map((variant, index) => {
                  const info = variant as VariantInfo;
                  const label = buildVariantLabel(info);
                  const available = Boolean(info.available);
                  return (
                    <button key={`${product.id}-variant-${index}`} type="button" className={`variant-btn ${!available ? "variant-btn--disabled" : ""} ${selectedVariantIndex === index ? "variant-btn--selected" : ""}`} onClick={() => available && setSelectedVariantIndex(index)} disabled={!available}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="product-pricing-card">
            <div className="product-pricing-item"><span className="muted">Итоговая цена</span><strong>{finalPrice}</strong></div>
            <div className="product-pricing-item"><span className="muted">Оригинальная цена</span><strong>{originalPrice}</strong></div>
          </div>

          {pricingSettings && pricingExample ? (
            <div className="pricing-formula-box">
              <h3>Формула финальной цены</h3>
              <div className="pricing-formula-text pricing-formula-latex pricing-example-formula" dangerouslySetInnerHTML={{ __html: pricingExample.formulaHtml }} />
              <div className="pricing-example-summary product-formula-summary">
                <div className="pricing-example-metric"><div className="pricing-example-metric-key" dangerouslySetInnerHTML={{ __html: pricingExample.summarySpLatex }} /><div className="pricing-example-metric-value">{formatDisplayMoney(pricingExample.sourcePrice, pricingExample.sourceCurrency)}</div></div>
                <div className="pricing-example-metric"><div className="pricing-example-metric-key" dangerouslySetInnerHTML={{ __html: pricingExample.summaryRubLatex }} /><div className="pricing-example-metric-value">{formatDisplayMoney(pricingExample.sourcePriceRub, "RUB")}</div></div>
                <div className="pricing-example-metric"><div className="pricing-example-metric-key" dangerouslySetInnerHTML={{ __html: pricingExample.summaryFpLatex }} /><div className="pricing-example-metric-value">{formatDisplayMoney(pricingExample.finalPrice, "RUB")}</div></div>
                <div className="pricing-example-metric"><div className="pricing-example-metric-key">Моржа</div><div className="pricing-example-metric-value">{formatDisplayMoney(pricingExample.marginRub, "RUB")}</div></div>
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
          ) : null}

          <div className="product-main-actions">
            <a className="btn-link product-action-btn" href={product.url} target="_blank" rel="noreferrer" title={`Открыть ${sourceName || "источник"}`}><IconExternalLink className="icon-svg" />Открыть источник</a>
            <button type="button" className="btn-link product-action-btn" onClick={() => void toggleHidden()} disabled={statusPending}>
              {normalizedStatus === "hidden" ? <IconEyeOff className="icon-svg" /> : <IconEye className="icon-svg" />}
              {normalizedStatus === "hidden" ? "Показать товар" : "Скрыть товар"}
            </button>
          </div>
        </section>
      </div>
      <ToastStack toasts={toasts} onClose={closeToast} />
    </article>
  );
}
