import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { IconChevronLeft, IconChevronRight, IconExternalLink, IconEye, IconEyeOff } from "../shared/mono-icons";
import { ProductPageSkeleton } from "../shared/skeleton";
import { ToastStack } from "../shared/toast-stack";
import { useToasts } from "../shared/use-toasts";
import { LatexBrand } from "../shared/latex-brand";
import { getProductPrimaryImageUrl, useLiveData } from "../shared/live-data-context";
import { buildPricingExampleView } from "../admin/admin-pricing-view-model";
import { formatDisplayMoney, renderLegendSymbol } from "../admin/admin-formatters";
import { deriveStatusAfterUnhide, getSourceNameById, getStatusClass, getStatusLabel, normalizeProductStatus } from "./catalog-helpers";

type VariantInfo = {
  title: string;
  available: boolean;
  inventory_quantity: number;
  price?: string | number | null;
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

function buildVariantLabel(variant: {
  title?: string;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
}): string {
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

export function ProductPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { products, sources, getProductById, setProductStatus, pricingSettings, ensurePricingLoaded } = useLiveData();
  const fromAdmin = searchParams.get("from") === "admin";

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
  const description = String(product?.description || "").trim();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!Number.isFinite(productId) || productId <= 0) {
        setProduct(null);
        setError("Некорректный ID товара");
        return;
      }

      if (inlineProduct) {
        setProduct(inlineProduct);
        setError(null);
      }

      setLoading(!inlineProduct);
      setError(null);
      const fetched = await getProductById(productId, { forceFetch: true });
      if (cancelled) {
        return;
      }
      if (fetched) {
        setProduct(fetched);
      }
      setLoading(false);
      if (!fetched && !inlineProduct) {
        setError(`Товар #${productId} не найден`);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [productId, inlineProduct, getProductById]);

  useEffect(() => {
    void ensurePricingLoaded();
  }, [ensurePricingLoaded]);

  useEffect(() => {
    if (!error) {
      return;
    }
    pushToast(error);
  }, [error, pushToast]);

  const images = useMemo(() => {
    if (!product) {
      return [] as string[];
    }
    const fromIds = (product.image_ids || []).map((imageId) => (imageId ? `/api/v1/images/${imageId}` : null)).filter(Boolean) as string[];
    if (fromIds.length > 0) {
      return fromIds;
    }
    const fallback = getProductPrimaryImageUrl(product);
    return fallback ? [fallback] : [];
  }, [product]);

  useEffect(() => {
    if (activeImageIndex <= Math.max(0, images.length - 1)) {
      return;
    }
    setActiveImageIndex(0);
  }, [images.length, activeImageIndex]);

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

  const statusClass = getStatusClass(product?.status || "unknown");

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

  const activeImage = images[activeImageIndex] || null;
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 1;
  const selectedVariant = (
    selectedVariantIndex !== null
      && Array.isArray(product.variants)
      && product.variants[selectedVariantIndex]
  ) ? (product.variants[selectedVariantIndex] as VariantInfo) : null;
  const selectedVariantPrice = toFiniteNumber(selectedVariant?.price);

  const sourcePriceBase = toFiniteNumber(product.source_price ?? product.price);
  const finalPriceBase = toFiniteNumber(product.final_price ?? product.price);
  const sourceToFinalRate = (
    sourcePriceBase !== null
    && finalPriceBase !== null
    && sourcePriceBase > 0
  ) ? (finalPriceBase / sourcePriceBase) : null;

  const effectiveSourcePrice = selectedVariantPrice ?? sourcePriceBase;
  const effectiveFinalPrice = (() => {
    if (selectedVariantPrice === null) {
      return finalPriceBase;
    }
    if (sourceToFinalRate !== null) {
      return Number((selectedVariantPrice * sourceToFinalRate).toFixed(2));
    }
    return selectedVariantPrice;
  })();
  const originalPrice = formatMoney(effectiveSourcePrice, product.source_currency ?? product.currency);
  const finalPrice = formatMoney(effectiveFinalPrice, product.final_currency ?? product.currency);
  const normalizedStatus = normalizeProductStatus(product.status);
  const categoryNames = (() => {
    const names = (product.internal_category_names || []).filter(Boolean);
    if (names.length > 0) {
      return names;
    }
    if (product.internal_category_name) {
      return [product.internal_category_name];
    }
    return [];
  })();
  const normalizedVendor = String(product.vendor || "").trim().toLowerCase();
  const categoryChips = categoryNames.filter((name) => String(name).trim().toLowerCase() !== normalizedVendor);
  const hasBrand = Boolean(String(product.vendor || "").trim());

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
    if (images.length <= 1) {
      return;
    }
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goNextImage = () => {
    if (images.length <= 1) {
      return;
    }
    setActiveImageIndex((prev) => (prev + 1) % images.length);
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
              <ImageWithFallback
                src={activeImage}
                alt={product.title}
                className="detail-image"
                placeholderClassName="detail-image detail-image--placeholder"
                placeholderText="Нет фото"
                loading="eager"
              />
            ) : (
              <ImageWithFallback
                src={null}
                alt={product.title}
                className="detail-image"
                placeholderClassName="detail-image detail-image--placeholder"
                placeholderText="Нет фото"
              />
            )}
            {images.length > 1 ? (
              <>
                <button type="button" className="slider-arrow slider-arrow--left" onClick={goPrevImage} aria-label="Предыдущее фото">
                  <IconChevronLeft className="icon-svg" />
                </button>
                <button type="button" className="slider-arrow slider-arrow--right" onClick={goNextImage} aria-label="Следующее фото">
                  <IconChevronRight className="icon-svg" />
                </button>
              </>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="slider-thumbs">
              {images.map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-${index}`}
                  type="button"
                  className={index === activeImageIndex ? "slider-thumb slider-thumb--active" : "slider-thumb"}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <ImageWithFallback
                    src={toThumbUrl(imageUrl)}
                    alt={`${product.title}-${index + 1}`}
                    className="slider-thumb-image"
                    placeholderClassName="slider-thumb-placeholder"
                    placeholderText="Фото"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="card product-main-card">
          <div className="product-main-head">
            <h1>{product.title}</h1>
          </div>
            <div className="product-main-status">
              <span className={statusClass}>{getStatusLabel(product.status)}</span>
            </div>

            {description ? (
              <div className="product-main-description">
                <h3>Описание</h3>
                <p>{description}</p>
              </div>
            ) : null}

            <div className="product-main-meta">
            {hasBrand ? (
              <div className="product-meta-line">
                <span className="product-meta-label">Бренд:</span>
                <span className="product-meta-chip product-meta-chip--muted">
                  <LatexBrand value={product.vendor} fallback="" />
                </span>
              </div>
            ) : null}
            {categoryChips.length > 0 ? (
              <div className="product-meta-line">
                <span className="product-meta-label">Находится в категориях:</span>
                <div className="product-meta-categories">
                  {categoryChips.map((name) => (
                    <span key={name} className="product-meta-chip">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {hasVariants ? (
            <div className="variants-section">
              <h3>Варианты</h3>
              <div className="variants-grid">
                {product.variants.map((variant, index) => {
                  const info = variant as VariantInfo & {
                    option1?: string | null;
                    option2?: string | null;
                    option3?: string | null;
                  };
                  const label = buildVariantLabel(info);
                  const available = Boolean(info.available);
                  return (
                    <button
                      key={`${product.id}-variant-${index}`}
                      type="button"
                      className={`variant-btn ${!available ? "variant-btn--disabled" : ""} ${selectedVariantIndex === index ? "variant-btn--selected" : ""}`}
                      onClick={() => {
                        if (available) {
                          setSelectedVariantIndex(index);
                        }
                      }}
                      disabled={!available}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {selectedVariant ? (
                <p className="muted">
                  Выбран вариант: {buildVariantLabel(selectedVariant as {
                    title?: string;
                    option1?: string | null;
                    option2?: string | null;
                    option3?: string | null;
                  })}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="product-pricing-card">
            <div className="product-pricing-item">
              <span className="muted">Итоговая цена</span>
              <strong>{finalPrice}</strong>
            </div>
            <div className="product-pricing-item">
              <span className="muted">Оригинальная цена</span>
              <strong>{originalPrice}</strong>
            </div>
          </div>

          {pricingSettings && pricingExample ? (
            <div className="pricing-formula-box">
              <h3>Формула финальной цены</h3>
              <div className="pricing-formula-text pricing-formula-latex pricing-example-formula" dangerouslySetInnerHTML={{ __html: pricingExample.formulaHtml }} />
              <div className="pricing-example-summary product-formula-summary">
                <div className="pricing-example-metric">
                  <div className="pricing-example-metric-key" dangerouslySetInnerHTML={{ __html: pricingExample.summarySpLatex }} />
                  <div className="pricing-example-metric-value">{formatDisplayMoney(pricingExample.sourcePrice, pricingExample.sourceCurrency)}</div>
                </div>
                <div className="pricing-example-metric">
                  <div className="pricing-example-metric-key" dangerouslySetInnerHTML={{ __html: pricingExample.summaryRubLatex }} />
                  <div className="pricing-example-metric-value">{formatDisplayMoney(pricingExample.sourcePriceRub, "RUB")}</div>
                </div>
                <div className="pricing-example-metric">
                  <div className="pricing-example-metric-key" dangerouslySetInnerHTML={{ __html: pricingExample.summaryFpLatex }} />
                  <div className="pricing-example-metric-value">{formatDisplayMoney(pricingExample.finalPrice, "RUB")}</div>
                </div>
                <div className="pricing-example-metric">
                  <div className="pricing-example-metric-key">Моржа</div>
                  <div className="pricing-example-metric-value">{formatDisplayMoney(pricingExample.marginRub, "RUB")}</div>
                </div>
              </div>
              <div className="product-formula-legend-panel">
                <button
                  type="button"
                  className={`product-formula-legend-toggle ${legendExpanded ? "is-open" : ""}`}
                  onClick={() => setLegendExpanded((prev) => !prev)}
                  aria-expanded={legendExpanded}
                >
                  <span>Обозначения переменных</span>
                  <IconChevronRight className="icon-svg product-formula-legend-toggle-icon" />
                </button>
                <div className={`product-formula-legend-collapse ${legendExpanded ? "is-open" : ""}`} aria-hidden={!legendExpanded}>
                  <div className="pricing-formula-legend pricing-legend-grid">
                    {pricingSettings.formula_legend.map((item) => (
                      <div key={item.key} className="pricing-legend-item">
                        <p
                          className={pricingExample.legendDim?.[item.key] ? "pricing-legend-key pricing-legend-key--dim" : "pricing-legend-key"}
                          dangerouslySetInnerHTML={{ __html: renderLegendSymbol(item.key) }}
                        />
                        <p className="muted">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="product-main-actions">
            <a className="btn-link product-action-btn" href={product.url} target="_blank" rel="noreferrer" title={`Открыть ${sourceName}`}>
              <IconExternalLink className="icon-svg" />
              Открыть источник
            </a>
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
