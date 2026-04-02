import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
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

  const renderColumnChildren = (items: typeof categories) => {
    return items.map((category) => (
      <div key={category.slug} className="category-column-item">
        <Link to={`/category/${category.slug}`} className="tag">
          {category.name} ({category.count})
        </Link>
        {category.children.length > 0 ? <div className="category-column-children">{renderColumnChildren(category.children)}</div> : null}
      </div>
    ));
  };

  return (
    <section className="section">
      <h1>Products</h1>

      {error ? <p className="muted">Error: {error}</p> : null}

      <div className="category-columns">
        {categories.map((category) => (
          <div key={category.slug} className="category-column">
            <Link to={`/category/${category.slug}`} className="tag category-column-root">
              {category.name} ({category.count})
            </Link>
            {category.children.length > 0 ? <div className="category-column-children">{renderColumnChildren(category.children)}</div> : null}
          </div>
        ))}
      </div>

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
