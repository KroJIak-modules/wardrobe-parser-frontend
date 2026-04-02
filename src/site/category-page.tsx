import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useLiveData } from "../shared/live-data-context";
import { toImageGatewayUrl } from "../shared/live-data-context";
import { toSlug } from "../shared/utils";

export function CategoryPage() {
  const { slug } = useParams();
  const { categories, products, productsHasMore, loadMoreProducts, loadingMoreProducts } = useLiveData();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const flatten = (items: typeof categories): typeof categories => {
    const list: typeof categories = [];
    for (const item of items) {
      list.push(item);
      list.push(...flatten(item.children));
    }
    return list;
  };

  const flatCategories = flatten(categories);
  const category = flatCategories.find((item) => item.slug === slug);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !category) {
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
  }, [productsHasMore, loadingMoreProducts, loadMoreProducts, category]);

  const filtered = category
    ? products.filter((product) => toSlug(product.product_type || "Прочее") === category.slug)
    : [];

  const renderColumnChildren = (items: typeof categories) => {
    return items.map((node) => (
      <div key={node.slug} className="category-column-item">
        <Link to={`/category/${node.slug}`} className={node.slug === slug ? "tag tag--active" : "tag"}>
          {node.name} ({node.count})
        </Link>
        {node.children.length > 0 ? <div className="category-column-children">{renderColumnChildren(node.children)}</div> : null}
      </div>
    ));
  };

  if (!category) {
    return <p>Category not found.</p>;
  }

  return (
    <section className="section">
      <h1>{category.name}</h1>
      <p className="muted">Товаров в категории: {filtered.length}</p>
      <div className="category-columns">
        {categories.map((node) => (
          <div key={node.slug} className="category-column">
            <Link to={`/category/${node.slug}`} className={node.slug === slug ? "tag tag--active category-column-root" : "tag category-column-root"}>
              {node.name} ({node.count})
            </Link>
            {node.children.length > 0 ? <div className="category-column-children">{renderColumnChildren(node.children)}</div> : null}
          </div>
        ))}
      </div>

      <div className="product-grid">
        {filtered.map((product) => (
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
