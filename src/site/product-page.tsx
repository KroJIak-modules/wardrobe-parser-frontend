import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { SkeletonBlock } from "../shared/skeleton";
import { ToastStack } from "../shared/toast-stack";
import { useToasts } from "../shared/use-toasts";
import { LatexBrand } from "../shared/latex-brand";
import { getProductPrimaryImageUrl, useLiveData } from "../shared/live-data-context";
import { getSourceNameById, getStatusClass, getStatusLabel } from "./catalog-helpers";

type VariantInfo = {
  title: string;
  available: boolean;
  inventory_quantity: number;
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("ru-RU");
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

export function ProductPage() {
  const { id } = useParams();
  const { products, sources, getProductById } = useLiveData();

  const productId = Number(id);
  const inlineProduct = Number.isFinite(productId) ? products.find((item) => item.id === productId) || null : null;

  const [product, setProduct] = useState<typeof inlineProduct>(inlineProduct);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toasts, pushToast, closeToast } = useToasts();
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);

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
        return;
      }

      setLoading(true);
      setError(null);
      const fetched = await getProductById(productId);
      if (cancelled) {
        return;
      }
      setProduct(fetched);
      setLoading(false);
      if (!fetched) {
        setError(`Товар #${productId} не найден`);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [productId, inlineProduct, getProductById]);

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

  const categoryNames = useMemo(() => {
    if (!product) {
      return [] as string[];
    }
    const names = (product.internal_category_names || []).filter(Boolean);
    if (names.length > 0) {
      return names;
    }
    if (product.internal_category_name) {
      return [product.internal_category_name];
    }
    return [];
  }, [product]);

  const statusClass = getStatusClass(product?.status || "unknown");

  if (loading) {
    return (
      <section className="section">
        <div className="card admin-skeleton-stack">
          <SkeletonBlock className="admin-skeleton-row" />
          <SkeletonBlock className="admin-skeleton-row" />
          <SkeletonBlock className="admin-skeleton-row" />
        </div>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="section">
        <div className="catalog-empty card">
          <p>Товар не найден</p>
          <Link className="btn-link" to="/">
            Вернуться к каталогу
          </Link>
        </div>
        <ToastStack toasts={toasts} onClose={closeToast} />
      </section>
    );
  }

  const activeImage = images[activeImageIndex] || null;
  const sourceName = sourceNameById.get(product.source_id) || `Источник #${product.source_id}`;
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

  return (
    <article className="section product-view">
      <div className="product-view-back">
        <Link className="btn-link" to="/">
          ← Назад к каталогу
        </Link>
      </div>

      <div className="product-view-grid">
        <section className="card product-gallery-card">
          {activeImage ? (
            <img className="detail-image" src={activeImage} alt={product.title} />
          ) : (
            <ImageWithFallback
              src={null}
              alt={product.title}
              className="detail-image"
              placeholderClassName="detail-image detail-image--placeholder"
              placeholderText="No image"
            />
          )}

          {images.length > 1 ? (
            <div className="slider-thumbs">
              {images.map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-${index}`}
                  type="button"
                  className={index === activeImageIndex ? "slider-thumb slider-thumb--active" : "slider-thumb"}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img src={imageUrl} alt={`${product.title}-${index + 1}`} />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="card product-main-card">
          <div className="product-main-head">
            <h1>{product.title}</h1>
            <span className={statusClass}>{getStatusLabel(product.status)}</span>
          </div>

          <div className="product-main-price">{product.price ?? "-"} {product.currency}</div>

          <div className="product-main-meta">
            <p><strong>Источник:</strong> {sourceName}</p>
            <p><strong>Бренд:</strong> <LatexBrand value={product.vendor} fallback="-" /></p>
            <p><strong>Handle:</strong> {product.handle || "-"}</p>
            <p><strong>Категории:</strong> {categoryNames.length > 0 ? categoryNames.join(", ") : "-"}</p>
            <p><strong>Обновлено:</strong> {formatDateTime(product.updated_at)}</p>
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

              {selectedVariantIndex !== null && product.variants[selectedVariantIndex] ? (
                <p className="muted">
                  Выбран вариант: {buildVariantLabel(product.variants[selectedVariantIndex] as {
                    title?: string;
                    option1?: string | null;
                    option2?: string | null;
                    option3?: string | null;
                  })}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="product-main-actions">
            <a className="btn-link" href={product.url} target="_blank" rel="noreferrer">
              Открыть товар у источника
            </a>
          </div>
        </section>
      </div>
      <ToastStack toasts={toasts} onClose={closeToast} />
    </article>
  );
}
