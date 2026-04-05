import { useEffect, useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useLiveData } from "../shared/live-data-context";
import { getProductPrimaryImageUrl } from "../shared/live-data-context";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { toSlug } from "../shared/utils";

export function CategoryPage() {
  const { slug } = useParams();
  const { categories, products, productsHasMore, loadMoreProducts, loadingMoreProducts, loading } = useLiveData();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const availableProducts = useMemo(() => products.filter((product) => product.status === "available"), [products]);

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
  const selectedCategorySlugs = useMemo(() => {
    if (!category) {
      return new Set<string>();
    }
    const set = new Set<string>();
    const walk = (node: typeof category) => {
      set.add(node.slug);
      for (const child of node.children) {
        walk(child);
      }
    };
    walk(category);
    return set;
  }, [category]);

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

  const filtered = category
    ? availableProducts.filter((product) => {
      const productSlug = (product.internal_category_slug || "").trim() || toSlug(product.product_type || "Прочее");
      return selectedCategorySlugs.has(productSlug);
    })
    : [];

  const renderColumnChildren = (items: typeof categories) => {
    return items.map((node) => (
      <div key={node.slug} className="category-column-item">
        <Link to={`/category/${node.slug}`} className={node.slug === slug ? "tag tag--active" : "tag"}>
          {node.name} ({node.count || 0})
        </Link>
        {node.children.length > 0 ? <div className="category-column-children">{renderColumnChildren(node.children)}</div> : null}
      </div>
    ));
  };

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
              {node.name} ({node.count || 0})
            </Link>
            {node.children.length > 0 ? <div className="category-column-children">{renderColumnChildren(node.children)}</div> : null}
          </div>
        ))}
      </div>

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
