import { useEffect, useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useLiveData } from "../shared/live-data-context";
import { getProductPrimaryImageUrl } from "../shared/live-data-context";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { CategoryMegaMenu } from "./category-mega-menu";
import { filterProductsForCategory, findCategoryBySlug, sortStorefrontRoots } from "./category-logic";

export function CategoryPage() {
  const { slug } = useParams();
  const { categories, products, productsHasMore, loadMoreProducts, loadingMoreProducts, loading } = useLiveData();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const availableProducts = useMemo(() => products.filter((product) => product.status === "available"), [products]);
  const roots = useMemo(() => sortStorefrontRoots(categories), [categories]);
  const category = useMemo(() => findCategoryBySlug(roots, slug), [roots, slug]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !category) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        if (window.scrollY < 120) {
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
  }, [productsHasMore, loadingMoreProducts, loadMoreProducts, category]);

  const filtered = useMemo(() => filterProductsForCategory(availableProducts, category), [availableProducts, category]);

  if (loading && availableProducts.length === 0) {
    return (
      <section className="section">
        <div className="center-loader">
          <p>Загружаем товары...</p>
        </div>
      </section>
    );
  }

  if (!category) {
    return <p>Категория не найдена.</p>;
  }

  return (
    <section className="section">
      <h1>{category.name}</h1>
      <p className="muted">Товаров в категории: {filtered.length}</p>
      <CategoryMegaMenu categories={roots} activeCategorySlug={slug} />

      <div className="product-grid">
        {filtered.map((product) => (
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
