import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLiveData } from "../shared/live-data-context";
import { toImageGatewayUrl } from "../shared/live-data-context";
import { toSlug } from "../shared/utils";

export function ProductPage() {
  const { id } = useParams();
  const { categories, products } = useLiveData();

  const product = products.find((item) => item.id === Number(id));
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  if (!product) {
    return <p>Product not found.</p>;
  }

  const category = categories.find((item) => item.slug === toSlug(product.product_type || "Other"));
  const images = useMemo(() => {
    const byIds = (product.image_ids || []).map((id) => toImageGatewayUrl(id)).filter((item): item is string => Boolean(item));
    if (byIds.length > 0) {
      return byIds;
    }
    return (product.image_urls || []).filter(Boolean);
  }, [product.image_ids, product.image_urls]);

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
            <img className="detail-image" src={activeImage} alt={`${product.title} ${activeImageIndex + 1}`} />
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
        <h1>{product.title}</h1>
        <p className="muted">Handle: {product.handle}</p>
        <p className="muted">Brand: {product.vendor || "-"}</p>
        <p className="muted">Status: {product.status}</p>
        <p className="muted">Images: {product.image_count}</p>
        <p className="muted">Category: {category?.name ?? "Unknown"}</p>
        <p className="price">
          {product.price} {product.currency}
        </p>
        <p className="muted">Updated: {new Date(product.updated_at).toLocaleString()}</p>
        <a className="btn-link" href={product.url} target="_blank" rel="noreferrer">
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
