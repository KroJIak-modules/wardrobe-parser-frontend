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
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!Number.isFinite(productId) || productId <= 0) {
        setResolvedProduct(null);
        return;
      }

      if (product) {
        setResolvedProduct(product);
        return;
      }

      setLoadingProduct(true);
      const fetched = await getProductById(productId);
      if (!cancelled) {
        setResolvedProduct(fetched);
        setLoadingProduct(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [productId, product, getProductById]);

  if (loadingProduct) {
    return null;
  }

  if (!resolvedProduct) {
    return <p>Product not found.</p>;
  }

  const flatCategories = (items: typeof categories): typeof categories => {
    const list: typeof categories = [];
    for (const item of items) {
      list.push(item);
      list.push(...flatCategories(item.children));
    }
    return list;
  };

  const category = flatCategories(categories).find((item) => item.slug === toSlug(resolvedProduct.product_type || "Прочее"));
  const images = useMemo(() => {
    const byIds = (resolvedProduct.image_ids || []).map((id) => toImageGatewayUrl(id)).filter((item): item is string => Boolean(item));
    if (byIds.length > 0) {
      return byIds;
    }
    return (resolvedProduct.image_urls || []).filter(Boolean);
  }, [resolvedProduct.image_ids, resolvedProduct.image_urls]);

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
