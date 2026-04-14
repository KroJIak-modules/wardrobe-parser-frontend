import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef } from "react";
import { useLiveData } from "../shared/live-data-context";
import { getProductPrimaryImageUrl } from "../shared/live-data-context";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { CategoryMegaMenu } from "./category-mega-menu";
import { findRootForCategory, filterProductsForCategory, sortStorefrontRoots } from "./category-logic";

export function HomePage() {
  const { categories, products, error, productsHasMore, loadMoreProducts, loadingMoreProducts, loading } = useLiveData();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const availableProducts = useMemo(() => products.filter((product) => product.status === "available"), [products]);
  const roots = useMemo(() => sortStorefrontRoots(categories), [categories]);
  const defaultRoot = useMemo(() => findRootForCategory(roots, null), [roots]);
  const visibleProducts = useMemo(
    () => (defaultRoot ? filterProductsForCategory(availableProducts, defaultRoot) : availableProducts),
    [availableProducts, defaultRoot]
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        if (productsHasMore && !loadingMoreProducts) {
          void loadMoreProducts();
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [productsHasMore, loadingMoreProducts, loadMoreProducts]);

  if (loading && availableProducts.length === 0) {
    return (
      <section className="section">
        <div className="center-loader">
          <p>Загружаем товары...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <h1>Витрина</h1>

      {error ? <p className="muted">Error: {error}</p> : null}

      <CategoryMegaMenu categories={roots} />

      <div className="product-grid">
        {visibleProducts.map((product) => (
          <article key={product.id} className="card">
            <ImageWithFallback
              src={getProductPrimaryImageUrl(product)}
              alt={product.title}
              className="thumb"
              placeholderClassName="thumb thumb--placeholder"
              placeholderText={product.image_count > 0 ? "Image" : "No image"}
              loadingText={product.image_count > 0 ? "Загружаем..." : "No image"}
              fallbackText="No image"
            />
            <h3>{product.title}</h3>
            <p className="muted">
              {product.price} {product.currency}
            </p>
            <Link to={`/product/${product.id}`} className="btn-link">
              Open
            </Link>
          </article>
        ))}
      </div>
      <div ref={sentinelRef} style={{ height: "1px" }} />
    </section>
  );
}
