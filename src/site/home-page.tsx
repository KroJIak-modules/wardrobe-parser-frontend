import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef } from "react";
import { useLiveData } from "../shared/live-data-context";
import { toImageGatewayUrl } from "../shared/live-data-context";

export function HomePage() {
  const { categories, products, error, productsHasMore, loadMoreProducts, loadingMoreProducts } = useLiveData();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && productsHasMore && !loadingMoreProducts) {
          void loadMoreProducts();
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [productsHasMore, loadingMoreProducts, loadMoreProducts]);

  const totalCategoryCount = useMemo(() => {
    const walk = (items: typeof categories): number => items.reduce((acc, item) => acc + 1 + walk(item.children), 0);
    return walk(categories);
  }, [categories]);

  const renderCategoryButtons = (items: typeof categories, depth = 0) => {
    return items.map((category) => (
      <div key={category.slug} className="category-tree-node" style={{ marginLeft: `${depth * 14}px` }}>
        <Link to={`/category/${category.slug}`} className="tag">
          {category.name} ({category.count})
        </Link>
        {category.children.length > 0 ? <div className="category-tree-children">{renderCategoryButtons(category.children, depth + 1)}</div> : null}
      </div>
    ));
  };

  return (
    <section className="section">
      <h1>Products</h1>
      <p className="muted">Real parser products from service API. Категорий: {totalCategoryCount}</p>

      {error ? <p className="muted">Error: {error}</p> : null}

      <div className="category-tree-list">{renderCategoryButtons(categories)}</div>

      <div className="product-grid">
        {products.map((product) => (
          <article key={product.id} className="card">
            {toImageGatewayUrl(product.image_ids?.[0]) ? (
              <img className="thumb" src={toImageGatewayUrl(product.image_ids?.[0]) || undefined} alt={product.title} loading="lazy" />
            ) : (
              <div className="thumb thumb--placeholder">No image</div>
            )}
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
