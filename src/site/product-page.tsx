import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLiveData } from "../shared/live-data-context";
import { toImageGatewayUrl } from "../shared/live-data-context";
import { toSlug } from "../shared/utils";

export function ProductPage() {
  const { id } = useParams();
  const { categories, products, getProductById } = useLiveData();

  const productId = Number(id);
  const product = products.find((item) => item.id === productId);
  const [resolvedProduct, setResolvedProduct] = useState<typeof product | null>(product || null);
  const [loadingProduct, setLoadingProduct] = useState<boolean>(false);
  const [errorProduct, setErrorProduct] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!Number.isFinite(productId) || productId <= 0) {
        setResolvedProduct(null);
        setErrorProduct("Invalid product ID");
        return;
      }

      if (product) {
        setResolvedProduct(product);
        setErrorProduct(null);
        return;
      }

      setLoadingProduct(true);
      setErrorProduct(null);
      const fetched = await getProductById(productId);
      if (!cancelled) {
        setResolvedProduct(fetched);
        if (!fetched) {
          setErrorProduct(`Product #${productId} not found`);
        }
        setLoadingProduct(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [productId, product, getProductById]);

  // Keep hook order stable across renders to avoid runtime hook errors on refresh.
  const images = useMemo(() => {
    if (!resolvedProduct) {
      return [] as string[];
    }
    const byIds = (resolvedProduct.image_ids || [])
      .map((imageId) => toImageGatewayUrl(imageId))
      .filter((item): item is string => Boolean(item));
    if (byIds.length > 0) {
      return byIds;
    }
    return (resolvedProduct.image_urls || []).filter(Boolean);
  }, [resolvedProduct]);

  if (loadingProduct) {
    return <div className="section detail" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
      <p>Loading product...</p>
    </div>;
  }

  if (errorProduct || !resolvedProduct) {
    return <div className="section detail">
      <p style={{ color: "red" }}>{errorProduct || "Product not found"}</p>
    </div>;
  }

  const flatCategories = (items: typeof categories): typeof categories => {
    const list: typeof categories = [];
    for (const item of items) {
      list.push(item);
      list.push(...flatCategories(item.children));
    }
    return list;
  };

  const resolvedCategorySlug = ((resolvedProduct.internal_category_slugs || [])[0] || "").trim()
    || (resolvedProduct.internal_category_slug || "").trim()
    || toSlug(resolvedProduct.product_type || "Прочее");
  const category = flatCategories(categories).find((item) => item.slug === resolvedCategorySlug);

  const showPrev = () => {
    if (images.length === 0) {
      return;
    }
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const showNext = () => {
    if (images.length === 0) {
      return;
    }
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const activeImage = images[activeImageIndex] || null;

  return (
    <article className="section detail">
      <div>
        {activeImage ? (
          <div className="product-slider">
            <img className="detail-image" src={activeImage} alt={`${resolvedProduct.title} ${activeImageIndex + 1}`} />
            {images.length > 1 ? (
              <>
                <button type="button" className="slider-arrow slider-arrow--left" onClick={showPrev}>
                  ‹
                </button>
                <button type="button" className="slider-arrow slider-arrow--right" onClick={showNext}>
                  ›
                </button>
              </>
            ) : null}
          </div>
        ) : (
          <div className="detail-image detail-image--placeholder">No image</div>
        )}

        {images.length > 1 ? (
          <div className="slider-thumbs">
            {images.map((imageUrl, idx) => (
              <button
                key={`${imageUrl}-${idx}`}
                type="button"
                className={idx === activeImageIndex ? "slider-thumb slider-thumb--active" : "slider-thumb"}
                onClick={() => setActiveImageIndex(idx)}
              >
                <img src={imageUrl} alt={`thumb-${idx + 1}`} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div>
        <h1>{resolvedProduct.title}</h1>
        <p className="muted">Handle: {resolvedProduct.handle}</p>
        <p className="muted">Brand: {resolvedProduct.vendor || "-"}</p>
        <p className="muted">Status: {resolvedProduct.status}</p>
        <p className="muted">Images: {resolvedProduct.image_count}</p>
        <p className="muted">Category: {category?.name ?? "Unknown"}</p>
        <p className="price">
          {resolvedProduct.price} {resolvedProduct.currency}
        </p>
        <p className="muted">Updated: {new Date(resolvedProduct.updated_at).toLocaleString()}</p>
        
        {resolvedProduct.variants && resolvedProduct.variants.length > 0 && (
          <div className="variants-section">
            <h3>Available Options:</h3>
            <div className="variants-grid">
              {resolvedProduct.variants.map((variant, idx) => {
                const variantLabel = [variant.option1, variant.option2, variant.option3]
                  .filter(Boolean)
                  .join(" / ") || variant.title;
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`variant-btn ${!variant.available ? "variant-btn--disabled" : ""} ${
                        selectedVariantIndex === idx ? "variant-btn--selected" : ""
                    }`}
                      onClick={() => variant.available && setSelectedVariantIndex(idx)}
                    disabled={!variant.available}
                    title={!variant.available ? "Out of stock" : ""}
                  >
                    {variantLabel}
                  </button>
                );
              })}
            </div>
              {selectedVariantIndex !== null && resolvedProduct.variants[selectedVariantIndex] && (
              <p className="muted">
                  Selected: {resolvedProduct.variants[selectedVariantIndex].title}
                  {resolvedProduct.variants[selectedVariantIndex].inventory_quantity > 0 &&
                    ` (${resolvedProduct.variants[selectedVariantIndex].inventory_quantity} in stock)`}
              </p>
            )}
          </div>
        )}
        
        <a className="btn-link" href={resolvedProduct.url} target="_blank" rel="noreferrer">
          Open source page
        </a>
        {category ? (
          <Link className="btn-link" to={`/category/${category.slug}`}>
            More from this category
          </Link>
        ) : null}
      </div>
    </article>
  );
}
